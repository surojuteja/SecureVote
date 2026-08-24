"""
Voting routes.
"""
import logging
from bson import ObjectId
from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from ..extensions import get_db
from ..models.election import Election
from ..models.candidate import Candidate
from ..models.voter import Voter
from ..services.voting_service import VotingService
from ..services.face_service import FaceService
from ..utils.decorators import voter_required
from ..utils.security import success_response, error_response

logger = logging.getLogger(__name__)
vote_bp = Blueprint('vote', __name__)


@vote_bp.route('/vote', methods=['POST'])
@voter_required
def cast_vote():
    db = get_db()
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    election_id = data.get('election_id')
    candidate_id = data.get('candidate_id')
    face_image_b64 = data.get('face_image')

    if not election_id or not candidate_id:
        return error_response('Election ID and Candidate ID are required.')
    if not face_image_b64:
        return error_response('Face verification is required to vote.')

    user_id = get_jwt_identity()
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response('Invalid user ID.', 400)

    voter_doc = db.voters.find_one({'user_id': user_obj_id})
    if not voter_doc:
        return error_response('Voter profile not found.', 404)

    if not voter_doc.get('is_eligible'):
        return error_response('You are not eligible to vote.')

    if not voter_doc.get('face_embedding'):
        return error_response('Face not registered. Contact administrator.')

    try:
        face_service = FaceService(current_app.config)
        is_match, confidence = face_service.verify_face(face_image_b64, voter_doc.get('face_embedding'))
        if not is_match:
            logger.warning(f"Vote face verification failed for voter {voter_doc.get('voter_id')}")
            return error_response('Face verification failed. Please try again.', 401)
    except Exception as e:
        logger.error(f'Face verification error during vote: {str(e)}')
        return error_response('Face verification error.', 500)

    result = VotingService.cast_vote(voter_doc['_id'], election_id, candidate_id)
    if result['success']:
        return success_response(result['message'], result.get('data'))
    else:
        return error_response(result['message'], result.get('status_code', 400))


@vote_bp.route('/vote/history', methods=['GET'])
@voter_required
def vote_history():
    db = get_db()
    user_id = get_jwt_identity()
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        return error_response('Invalid user ID.', 400)

    voter_doc = db.voters.find_one({'user_id': user_obj_id})
    if not voter_doc:
        return error_response('Voter profile not found.', 404)

    votes = list(db.votes.find({'voter_id': voter_doc['_id']}).sort('voted_at', -1))

    history = []
    for v in votes:
        election = db.elections.find_one({'_id': v.get('election_id')})
        candidate = db.candidates.find_one({'_id': v.get('candidate_id')})
        
        history.append({
            'election_id': str(v.get('election_id')),
            'election_title': election.get('title') if election else 'Unknown',
            'candidate_name': candidate.get('name') if candidate else 'Unknown',
            'voted_at': v.get('voted_at').isoformat() if v.get('voted_at') else None,
        })

    return success_response('Vote history retrieved.', {'history': history})


@vote_bp.route('/elections/<string:election_id>/results', methods=['GET'])
def election_results(election_id):
    db = get_db()
    from ..services.election_service import ElectionService
    
    try:
        elec_obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)
        
    election = db.elections.find_one({'_id': elec_obj_id})
    if not election:
        return error_response('Election not found.', 404)

    if Election.computed_status(election) not in ['COMPLETED', 'ACTIVE']:
        return error_response('Results not available yet.', 400)

    results = ElectionService.calculate_results(election)
    return success_response('Results retrieved.', results)
