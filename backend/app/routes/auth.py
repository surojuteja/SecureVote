"""
Authentication routes — login, face verification, logout, current user.
"""
import logging
import base64
import io
import uuid
from bson import ObjectId
from flask import Blueprint, request, current_app
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from ..extensions import get_db
from ..models.user import User
from ..models.voter import Voter
from ..models.login_history import LoginHistory
from ..services.face_service import FaceService
from ..utils.security import success_response, error_response

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Voter registration."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    full_name = data.get('full_name', '').strip()
    password = data.get('password', '')
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()
    date_of_birth = data.get('date_of_birth', '').strip()
    face_image_b64 = data.get('face_image')

    if not username or not email or not full_name or not password:
        return error_response('All fields are required.')
    if not face_image_b64:
        return error_response('Face image is required.')

    db = get_db()
    if db.users.find_one({'$or': [{'username': username}, {'email': email}]}):
        return error_response('Username or email already exists.', 400)

    voter_id = f"VOT-{uuid.uuid4().hex[:6].upper()}"

    try:
        face_service = FaceService(current_app.config)
        face_path, face_embedding_bytes = face_service.enroll_face(face_image_b64, voter_id)
    except Exception as e:
        logger.error(f'Face registration error: {str(e)}')
        return error_response(f'Face registration failed: {str(e)}', 400)

    user_doc = User.create_doc(username, email, role='VOTER', is_active=False, password=password)
    user_id = db.users.insert_one(user_doc).inserted_id

    voter_doc = Voter.create_doc(
        user_id=user_id,
        voter_id=voter_id,
        full_name=full_name,
        date_of_birth=date_of_birth or None,
        phone=phone or None,
        address=address or None,
        is_verified=True,
        is_eligible=False
    )
    voter_doc['face_embedding'] = face_embedding_bytes
    voter_doc['face_image_path'] = face_path
    
    db.voters.insert_one(voter_doc)

    return success_response('Registration successful. Please wait for admin approval.')


@auth_bp.route('/login', methods=['POST'])
def login():
    """Voter login — voter_id + face image (base64)."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    voter_id_input = data.get('voter_id', '').strip()
    face_image_b64 = data.get('face_image')

    if not voter_id_input:
        return error_response('Voter ID is required.')
    if not face_image_b64:
        return error_response('Face image is required for authentication.')

    db = get_db()
    voter = db.voters.find_one({'voter_id': voter_id_input})
    if not voter:
        logger.warning(f'Login attempt with unknown voter_id: {voter_id_input}')
        return error_response('Invalid Voter ID.', 401)

    user_id = voter['user_id']
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    user = db.users.find_one({'_id': user_id})
    if not user or not user.get('is_active'):
        return error_response('Account is inactive.', 401)

    if user.get('role') != 'VOTER':
        return error_response('Please use admin login.', 401)

    if not voter.get('is_verified') or not voter.get('face_embedding'):
        return error_response('Face not registered. Contact administrator.', 401)

    if not voter.get('is_eligible'):
        return error_response('You are not eligible to vote. Contact administrator.', 401)

    try:
        face_service = FaceService(current_app.config)
        is_match, confidence = face_service.verify_face(face_image_b64, voter.get('face_embedding'))

        if not is_match:
            logger.warning(f'Face verification failed for voter {voter_id_input}, confidence: {confidence}')
            db.login_history.insert_one(LoginHistory.create_doc(
                user_id=user_id, voter_id=voter_id_input, role='VOTER', status='FAILED',
                ip_address=request.remote_addr, user_agent=request.user_agent.string
            ))
            return error_response(
                f'Face verification failed. Please try again with better lighting.',
                401
            )

        logger.info(f'Voter {voter_id_input} authenticated successfully (confidence: {confidence:.2f})')
    except Exception as e:
        logger.error(f'Face verification error for voter {voter_id_input}: {str(e)}')
        return error_response('Face verification error. Please try again.', 500)

    access_token = create_access_token(identity=str(user['_id']))

    db.login_history.insert_one(LoginHistory.create_doc(
        user_id=user_id, voter_id=voter_id_input, role='VOTER', status='SUCCESS',
        ip_address=request.remote_addr, user_agent=request.user_agent.string
    ))

    return success_response('Login successful.', {
        'access_token': access_token,
        'user': User.to_dict(user),
        'voter': Voter.to_dict(voter)
    })


@auth_bp.route('/admin-login', methods=['POST'])
def admin_login():
    """Admin login — username + password + optional face verification."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    username = data.get('username', '').strip()
    password = data.get('password', '')
    face_image_b64 = data.get('face_image')

    if not username:
        return error_response('Username is required.')
    if not password:
        return error_response('Password is required.')

    db = get_db()
    user = db.users.find_one({'username': username})
    if not user:
        logger.warning(f'Admin login attempt with unknown username: {username}')
        return error_response('Invalid credentials.', 401)

    if user.get('role') != 'ADMIN':
        return error_response('Invalid credentials.', 401)

    if not user.get('is_active'):
        return error_response('Account is deactivated.', 401)

    if not User.check_password(user.get('password_hash'), password):
        logger.warning(f'Admin login failed (wrong password) for: {username}')
        db.login_history.insert_one(LoginHistory.create_doc(
            user_id=user['_id'], voter_id=None, role='ADMIN', status='FAILED',
            ip_address=request.remote_addr, user_agent=request.user_agent.string
        ))
        return error_response('Invalid credentials.', 401)

    if face_image_b64:
        voter_profile = db.voters.find_one({'user_id': user['_id']})
        if voter_profile and voter_profile.get('face_embedding'):
            try:
                face_service = FaceService(current_app.config)
                is_match, confidence = face_service.verify_face(face_image_b64, voter_profile.get('face_embedding'))
                if not is_match:
                    logger.warning(f'Admin face verification failed for {username}')
                    return error_response('Face verification failed.', 401)
            except Exception as e:
                logger.error(f'Admin face verification error: {str(e)}')
                return error_response('Face verification error.', 500)

    logger.info(f'Admin {username} authenticated successfully')

    access_token = create_access_token(identity=str(user['_id']))

    db.login_history.insert_one(LoginHistory.create_doc(
        user_id=user['_id'], voter_id=None, role='ADMIN', status='SUCCESS',
        ip_address=request.remote_addr, user_agent=request.user_agent.string
    ))

    return success_response('Login successful.', {
        'access_token': access_token,
        'user': User.to_dict(user)
    })


@auth_bp.route('/face-verify', methods=['POST'])
def face_verify():
    """Standalone face verification endpoint."""
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    voter_id_input = data.get('voter_id', '').strip()
    face_image_b64 = data.get('face_image')

    if not voter_id_input or not face_image_b64:
        return error_response('Voter ID and face image are required.')

    db = get_db()
    voter = db.voters.find_one({'voter_id': voter_id_input})
    if not voter or not voter.get('face_embedding'):
        return error_response('Voter not found or face not registered.', 404)

    try:
        face_service = FaceService(current_app.config)
        is_match, confidence = face_service.verify_face(face_image_b64, voter.get('face_embedding'))

        return success_response('Face verification complete.', {
            'is_match': is_match,
            'confidence': round(confidence, 2)
        })
    except Exception as e:
        logger.error(f'Face verification error: {str(e)}')
        return error_response('Face verification error.', 500)


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user info."""
    user_id = get_jwt_identity()
    db = get_db()
    user = db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return error_response('User not found.', 404)

    data = User.to_dict(user)
    if user.get('role') == 'VOTER':
        voter = db.voters.find_one({'user_id': user['_id']})
        if voter:
            data['voter'] = Voter.to_dict(voter)

    return success_response('User retrieved.', data)


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout (client should discard the token)."""
    return success_response('Logged out successfully.')
