"""
Voter self-service routes.
"""
import logging
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from ..extensions import get_db
from ..models.voter import Voter
from ..models.user import User
from ..utils.decorators import voter_required
from ..utils.security import success_response, error_response

logger = logging.getLogger(__name__)
voter_bp = Blueprint('voter', __name__)


@voter_bp.route('/voter/profile', methods=['GET'])
@voter_required
def get_profile():
    user_id = get_jwt_identity()
    db = get_db()
    voter = db.voters.find_one({'user_id': ObjectId(user_id)})
    if not voter:
        return error_response('Voter profile not found.', 404)

    user = db.users.find_one({'_id': ObjectId(user_id)})
    return success_response('Profile retrieved.', {
        'voter': Voter.to_dict(voter),
        'user': User.to_dict(user) if user else None,
    })


@voter_bp.route('/voter/profile', methods=['PUT'])
@voter_required
def update_profile():
    user_id = get_jwt_identity()
    db = get_db()
    voter = db.voters.find_one({'user_id': ObjectId(user_id)})
    if not voter:
        return error_response('Voter profile not found.', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    update_fields = {}
    if 'phone' in data:
        update_fields['phone'] = data['phone'].strip() or None
    if 'address' in data:
        update_fields['address'] = data['address'].strip() or None
    if 'date_of_birth' in data:
        update_fields['date_of_birth'] = data['date_of_birth'].strip() or None
    if 'full_name' in data:
        update_fields['full_name'] = data['full_name'].strip() or None

    try:
        if update_fields:
            db.voters.update_one({'_id': voter['_id']}, {'$set': update_fields})
            voter = db.voters.find_one({'_id': voter['_id']})
            
        return success_response('Profile updated.', {'voter': Voter.to_dict(voter)})
    except Exception as e:
        logger.error(f'Error updating voter profile: {e}')
        return error_response('Failed to update profile.', 500)


@voter_bp.route('/voter/elections', methods=['GET'])
@voter_required
def voter_list_elections():
    """List all elections for voters including UPCOMING (for candidate registration)."""
    from ..models.election import Election
    db = get_db()
    status_filter = request.args.get('status', '').strip().upper()
    elections = list(db.elections.find().sort('start_datetime', -1))

    result = []
    for e in elections:
        computed = Election.computed_status(e)
        if computed == 'CANCELLED':
            continue
        if status_filter and computed != status_filter:
            continue
        result.append(Election.to_dict(e))

    return success_response('Elections retrieved.', {'elections': result})


@voter_bp.route('/voter/elections/<string:election_id>', methods=['GET'])
@voter_required
def voter_get_election(election_id):
    """Get a single election with candidates for voter view."""
    from ..models.election import Election
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)

    election = db.elections.find_one({'_id': obj_id})
    if not election:
        return error_response('Election not found.', 404)

    return success_response('Election retrieved.', {
        'election': Election.to_dict(election, include_candidates=True)
    })


@voter_bp.route('/voter/voting-status/<string:election_id>', methods=['GET'])
@voter_required
def voting_status(election_id):
    """Check if the current voter has voted in a given election."""
    db = get_db()
    user_id = get_jwt_identity()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)

    voter_doc = db.voters.find_one({'user_id': ObjectId(user_id)})
    if not voter_doc:
        return error_response('Voter profile not found.', 404)

    has_voted = db.votes.count_documents({
        'voter_id': voter_doc['_id'],
        'election_id': obj_id
    }) > 0

    return success_response('Voting status retrieved.', {
        'has_voted': has_voted,
        'election_id': election_id
    })
