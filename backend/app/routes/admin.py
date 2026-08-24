"""
Admin routes — dashboard stats, voter management, face enrollment.
"""
import logging
import math
from datetime import datetime
from bson import ObjectId
from bson.binary import Binary
from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from ..extensions import get_db
from ..models.user import User
from ..models.voter import Voter
from ..models.election import Election
from ..models.vote import Vote
from ..models.notification import Notification
from ..models.login_history import LoginHistory
from ..services.face_service import FaceService
from ..services.notification_service import NotificationService
from ..utils.decorators import admin_required
from ..utils.security import success_response, error_response
from ..utils.validators import validate_email, validate_voter_id, validate_password, validate_required_fields

logger = logging.getLogger(__name__)
admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    db = get_db()
    total_voters = db.voters.count_documents({})
    eligible_voters = db.voters.count_documents({'is_eligible': True})
    verified_voters = db.voters.count_documents({'is_verified': True})

    all_elections = list(db.elections.find())
    active_elections = sum(1 for e in all_elections if Election.computed_status(e) == 'ACTIVE')
    upcoming_elections = sum(1 for e in all_elections if Election.computed_status(e) == 'UPCOMING')
    completed_elections = sum(1 for e in all_elections if Election.computed_status(e) == 'COMPLETED')

    total_votes = db.votes.count_documents({})

    recent_votes = list(db.votes.find().sort('voted_at', -1).limit(10))
    recent_activity = []
    for v in recent_votes:
        voter = db.voters.find_one({'_id': ObjectId(v['voter_id'])}) if 'voter_id' in v else None
        election = db.elections.find_one({'_id': ObjectId(v['election_id'])}) if 'election_id' in v else None
        recent_activity.append({
            'voter_name': voter.get('full_name') if voter else 'Unknown',
            'election_title': election.get('title') if election else 'Unknown',
            'voted_at': v.get('voted_at').isoformat() if v.get('voted_at') else None,
        })

    return success_response('Dashboard data retrieved.', {
        'total_voters': total_voters,
        'eligible_voters': eligible_voters,
        'verified_voters': verified_voters,
        'active_elections': active_elections,
        'upcoming_elections': upcoming_elections,
        'completed_elections': completed_elections,
        'total_votes': total_votes,
        'recent_activity': recent_activity,
    })


@admin_bp.route('/voters', methods=['GET'])
@admin_required
def list_voters():
    search = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    db = get_db()
    query = {}

    if search:
        query['$or'] = [
            {'voter_id': {'$regex': search, '$options': 'i'}},
            {'full_name': {'$regex': search, '$options': 'i'}}
        ]

    if status_filter == 'eligible':
        query['is_eligible'] = True
    elif status_filter == 'ineligible':
        query['is_eligible'] = False
    elif status_filter == 'verified':
        query['is_verified'] = True
    elif status_filter == 'unverified':
        query['is_verified'] = False

    total = db.voters.count_documents(query)
    pages = math.ceil(total / per_page) if total > 0 else 1
    
    cursor = db.voters.find(query).sort('created_at', -1).skip((page - 1) * per_page).limit(per_page)
    voters = [Voter.to_dict(v) for v in cursor]

    return success_response('Voters retrieved.', {
        'voters': voters,
        'total': total,
        'page': page,
        'pages': pages,
        'per_page': per_page,
    })


@admin_bp.route('/voters', methods=['POST'])
@admin_required
def create_voter():
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    required = ['voter_id', 'full_name', 'email', 'username', 'password']
    missing = validate_required_fields(data, required)
    if missing:
        return error_response(f'Missing required fields: {", ".join(missing)}')

    voter_id_val = data['voter_id'].strip()
    email = data['email'].strip().lower()
    username = data['username'].strip()
    password = data['password']
    full_name = data['full_name'].strip()

    if not validate_voter_id(voter_id_val):
        return error_response('Invalid Voter ID format (alphanumeric, 3-20 chars).')
    if not validate_email(email):
        return error_response('Invalid email format.')
    if not validate_password(password):
        return error_response('Password must be at least 6 characters.')

    db = get_db()
    
    if db.users.find_one({'username': username}):
        return error_response('Username already exists.')
    if db.users.find_one({'email': email}):
        return error_response('Email already exists.')
    if db.voters.find_one({'voter_id': voter_id_val}):
        return error_response('Voter ID already exists.')

    try:
        user_doc = User.create_doc(
            username=username,
            email=email,
            role='VOTER',
            is_active=True,
            password=password
        )
        user_result = db.users.insert_one(user_doc)
        user_id = user_result.inserted_id
        user_doc['_id'] = user_result.inserted_id

        voter_doc = Voter.create_doc(
            user_id=user_id,
            voter_id=voter_id_val,
            full_name=full_name,
            date_of_birth=data.get('date_of_birth'),
            phone=data.get('phone', '').strip() or None,
            address=data.get('address', '').strip() or None,
            is_verified=False,
            is_eligible=data.get('is_eligible', True)
        )
        voter_result = db.voters.insert_one(voter_doc)
        voter_doc['_id'] = voter_result.inserted_id

        logger.info(f'Voter created: {voter_id_val} by admin {get_jwt_identity()}')

        return success_response('Voter created successfully.', {
            'user': User.to_dict(user_doc),
            'voter': Voter.to_dict(voter_doc)
        }, 201)

    except Exception as e:
        logger.error(f'Error creating voter: {str(e)}')
        return error_response('Failed to create voter.', 500)


@admin_bp.route('/voters/<string:voter_db_id>', methods=['GET'])
@admin_required
def get_voter(voter_db_id):
    db = get_db()
    voter = db.voters.find_one({'_id': ObjectId(voter_db_id)})
    if not voter:
        return error_response('Voter not found.', 404)

    user = db.users.find_one({'_id': ObjectId(voter['user_id'])})
    return success_response('Voter retrieved.', {
        'voter': Voter.to_dict(voter),
        'user': User.to_dict(user) if user else None,
    })


@admin_bp.route('/voters/<string:voter_db_id>', methods=['PUT'])
@admin_required
def update_voter(voter_db_id):
    db = get_db()
    voter = db.voters.find_one({'_id': ObjectId(voter_db_id)})
    if not voter:
        return error_response('Voter not found.', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    user = db.users.find_one({'_id': ObjectId(voter['user_id'])})
    
    voter_updates = {}
    if 'full_name' in data and data['full_name']:
        voter_updates['full_name'] = data['full_name'].strip()
    if 'phone' in data:
        voter_updates['phone'] = data['phone'].strip() or None
    if 'address' in data:
        voter_updates['address'] = data['address'].strip() or None
    if 'date_of_birth' in data:
        voter_updates['date_of_birth'] = data['date_of_birth']
    if 'is_eligible' in data:
        voter_updates['is_eligible'] = bool(data['is_eligible'])

    user_updates = {}
    if user:
        if 'email' in data and data['email']:
            new_email = data['email'].strip().lower()
            if not validate_email(new_email):
                return error_response('Invalid email format.')
            existing = db.users.find_one({'email': new_email, '_id': {'$ne': user['_id']}})
            if existing:
                return error_response('Email already exists.')
            user_updates['email'] = new_email
        if 'is_active' in data:
            user_updates['is_active'] = bool(data['is_active'])

    try:
        if voter_updates:
            voter_updates['updated_at'] = datetime.utcnow()
            db.voters.update_one({'_id': ObjectId(voter_db_id)}, {'$set': voter_updates})
            voter.update(voter_updates)
            
        if user_updates:
            user_updates['updated_at'] = datetime.utcnow()
            db.users.update_one({'_id': user['_id']}, {'$set': user_updates})
            user.update(user_updates)

        logger.info(f'Voter {voter.get("voter_id")} updated by admin {get_jwt_identity()}')
        return success_response('Voter updated successfully.', {
            'voter': Voter.to_dict(voter),
            'user': User.to_dict(user) if user else None,
        })
    except Exception as e:
        logger.error(f'Error updating voter: {str(e)}')
        return error_response('Failed to update voter.', 500)


@admin_bp.route('/voters/<string:voter_db_id>', methods=['DELETE'])
@admin_required
def delete_voter(voter_db_id):
    db = get_db()
    voter = db.voters.find_one({'_id': ObjectId(voter_db_id)})
    if not voter:
        return error_response('Voter not found.', 404)

    try:
        db.users.update_one({'_id': ObjectId(voter['user_id'])}, {'$set': {'is_active': False, 'updated_at': datetime.utcnow()}})
        db.voters.update_one({'_id': ObjectId(voter_db_id)}, {'$set': {'is_eligible': False, 'updated_at': datetime.utcnow()}})
        
        logger.info(f'Voter {voter.get("voter_id")} deactivated by admin {get_jwt_identity()}')
        return success_response('Voter deactivated successfully.')
    except Exception as e:
        return error_response('Failed to deactivate voter.', 500)


@admin_bp.route('/voters/<string:voter_db_id>/enroll-face', methods=['POST'])
@admin_required
def enroll_voter_face(voter_db_id):
    db = get_db()
    voter = db.voters.find_one({'_id': ObjectId(voter_db_id)})
    if not voter:
        return error_response('Voter not found.', 404)

    data = request.get_json()
    if not data or not data.get('face_image'):
        return error_response('Face image is required.')

    try:
        face_service = FaceService(current_app.config)
        filepath, embedding_bytes = face_service.enroll_face(
            data['face_image'], voter.get('voter_id')
        )

        updates = {
            'face_image_path': filepath,
            'face_embedding': Binary(embedding_bytes),
            'is_verified': True,
            'updated_at': datetime.utcnow()
        }
        db.voters.update_one({'_id': ObjectId(voter_db_id)}, {'$set': updates})
        voter.update(updates)
        
        logger.info(f'Face enrolled for voter {voter.get("voter_id")}')

        return success_response('Face registered successfully.', {
            'voter': Voter.to_dict(voter)
        })

    except ValueError as e:
        return error_response(str(e))
    except Exception as e:
        logger.error(f'Face enrollment error: {str(e)}')
        return error_response('Face enrollment failed.', 500)


@admin_bp.route('/voters/<string:voter_db_id>/approve', methods=['POST'])
@admin_required
def approve_voter(voter_db_id):
    db = get_db()
    voter = db.voters.find_one({'_id': ObjectId(voter_db_id)})
    if not voter:
        return error_response('Voter not found.', 404)

    user = db.users.find_one({'_id': ObjectId(voter['user_id'])})
    if not user:
        return error_response('User not found.', 404)

    try:
        # Set user is_active to True and voter is_eligible to True
        db.users.update_one(
            {'_id': ObjectId(voter['user_id'])},
            {'$set': {'is_active': True, 'updated_at': datetime.utcnow()}}
        )
        db.voters.update_one(
            {'_id': ObjectId(voter_db_id)},
            {'$set': {'is_eligible': True, 'updated_at': datetime.utcnow()}}
        )
        logger.info(f'Voter {voter.get("voter_id")} approved by admin {get_jwt_identity()}')
        
        from ..utils.email_service import send_voter_id_email
        send_voter_id_email(user.get('email'), voter.get('full_name'), voter.get('voter_id'))

        return success_response('Voter approved successfully.')
    except Exception as e:
        logger.error(f'Error approving voter: {str(e)}')
        return error_response('Failed to approve voter.', 500)


@admin_bp.route('/login-history', methods=['GET'])
@admin_required
def get_login_history():
    db = get_db()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    total = db.login_history.count_documents({})
    pages = math.ceil(total / per_page) if total > 0 else 1

    cursor = db.login_history.find().sort('login_time', -1).skip((page - 1) * per_page).limit(per_page)
    history = [LoginHistory.to_dict(doc) for doc in cursor]

    return success_response('Login history retrieved.', {
        'history': history,
        'total': total,
        'page': page,
        'pages': pages,
        'per_page': per_page
    })


@admin_bp.route('/results/<string:election_id>', methods=['GET'])
@admin_required
def admin_results(election_id):
    from ..services.election_service import ElectionService
    db = get_db()
    election = db.elections.find_one({'_id': ObjectId(election_id)})
    if not election:
        return error_response('Election not found.', 404)

    results = ElectionService.calculate_results(election)
    return success_response('Results retrieved.', results)
