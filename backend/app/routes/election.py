"""
Election and candidate routes.
"""
import logging
from datetime import datetime
from bson import ObjectId
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from ..extensions import get_db
from ..models.election import Election
from ..models.candidate import Candidate
from ..models.voter import Voter
from ..models.user import User
from ..services.notification_service import NotificationService
from ..utils.decorators import admin_required, login_required_any, voter_required
from ..utils.security import success_response, error_response
from ..utils.validators import validate_required_fields, validate_dates

logger = logging.getLogger(__name__)
election_bp = Blueprint('election', __name__)


@election_bp.route('/elections', methods=['GET'])
@login_required_any
def list_elections():
    db = get_db()
    status_filter = request.args.get('status', '').strip().upper()
    elections = list(db.elections.find().sort('start_datetime', -1))

    result = []
    for e in elections:
        computed = Election.computed_status(e)
        if status_filter and computed != status_filter:
            continue
        result.append(Election.to_dict(e))

    return success_response('Elections retrieved.', {'elections': result})


@election_bp.route('/elections', methods=['POST'])
@admin_required
def create_election():
    db = get_db()
    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    required = ['title', 'start_datetime', 'end_datetime']
    missing = validate_required_fields(data, required)
    if missing:
        return error_response(f'Missing required fields: {", ".join(missing)}')

    if not validate_dates(data['start_datetime'], data['end_datetime']):
        return error_response('End date/time must be after start date/time.')

    try:
        start_dt = datetime.fromisoformat(data['start_datetime'])
        end_dt = datetime.fromisoformat(data['end_datetime'])
    except (ValueError, TypeError):
        return error_response('Invalid date/time format. Use ISO format.')

    admin_id = get_jwt_identity()

    try:
        doc = {
            'title': data['title'].strip(),
            'description': data.get('description', '').strip() or None,
            'start_datetime': start_dt,
            'end_datetime': end_dt,
            'status': 'UPCOMING',
            'created_by': ObjectId(admin_id),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.elections.insert_one(doc)
        election_doc = db.elections.find_one({'_id': result.inserted_id})

        NotificationService.notify_election_created(election_doc)

        logger.info(f"Election created: {election_doc.get('title')} (id={election_doc['_id']})")

        # Send email to all approved voters in background
        from threading import Thread
        from flask import current_app
        from ..utils.email_service import send_election_created_email

        app = current_app._get_current_object()
        def send_creation_emails(app, title, start, end):
            with app.app_context():
                db_inner = get_db()
                voters = db_inner.voters.find({'status': 'APPROVED'})
                for v in voters:
                    if v.get('email'):
                        send_election_created_email(
                            v.get('email'),
                            v.get('full_name', 'Voter'),
                            title, start, end
                        )

        Thread(target=send_creation_emails, args=(
            app,
            election_doc.get('title'),
            start_dt.strftime('%B %d, %Y %I:%M %p'),
            end_dt.strftime('%B %d, %Y %I:%M %p')
        )).start()

        return success_response('Election created successfully.', {
            'election': Election.to_dict(election_doc)
        }, 201)

    except Exception as e:
        logger.error(f'Error creating election: {str(e)}')
        return error_response('Failed to create election.', 500)


@election_bp.route('/elections/<string:election_id>', methods=['GET'])
@login_required_any
def get_election(election_id):
    db = get_db()
    try:
        election = db.elections.find_one({'_id': ObjectId(election_id)})
    except Exception:
        return error_response('Invalid election ID.', 400)
        
    if not election:
        return error_response('Election not found.', 404)

    return success_response('Election retrieved.', {
        'election': Election.to_dict(election, include_candidates=True)
    })


@election_bp.route('/elections/<string:election_id>', methods=['PUT'])
@admin_required
def update_election(election_id):
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)
        
    election = db.elections.find_one({'_id': obj_id})
    if not election:
        return error_response('Election not found.', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    updates = {}
    
    if 'title' in data and data['title']:
        updates['title'] = data['title'].strip()
    if 'description' in data:
        updates['description'] = data['description'].strip() or None

    if 'start_datetime' in data and 'end_datetime' in data:
        if not validate_dates(data['start_datetime'], data['end_datetime']):
            return error_response('End date/time must be after start date/time.')
        try:
            updates['start_datetime'] = datetime.fromisoformat(data['start_datetime'])
            updates['end_datetime'] = datetime.fromisoformat(data['end_datetime'])
        except (ValueError, TypeError):
            return error_response('Invalid date/time format.')
    elif 'start_datetime' in data:
        try:
            new_start = datetime.fromisoformat(data['start_datetime'])
            if new_start >= election.get('end_datetime'):
                return error_response('Start date must be before end date.')
            updates['start_datetime'] = new_start
        except (ValueError, TypeError):
            return error_response('Invalid date/time format.')
    elif 'end_datetime' in data:
        try:
            new_end = datetime.fromisoformat(data['end_datetime'])
            if new_end <= election.get('start_datetime'):
                return error_response('End date must be after start date.')
            updates['end_datetime'] = new_end
        except (ValueError, TypeError):
            return error_response('Invalid date/time format.')

    trigger_start_notify = False
    trigger_complete_notify = False
    if 'status' in data and data['status'] in ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']:
        updates['status'] = data['status']
        if data['status'] == 'ACTIVE' and election.get('status') != 'ACTIVE':
            trigger_start_notify = True
        elif data['status'] == 'COMPLETED' and election.get('status') != 'COMPLETED':
            trigger_complete_notify = True

    if not updates:
        return success_response('No updates provided.', {
            'election': Election.to_dict(election, include_candidates=True)
        })

    updates['updated_at'] = datetime.utcnow()

    try:
        db.elections.update_one({'_id': obj_id}, {'$set': updates})
        updated_election = db.elections.find_one({'_id': obj_id})
        logger.info(f"Election {obj_id} updated by admin {get_jwt_identity()}")
        
        from ..services.election_service import ElectionService
        from flask import current_app
        app = current_app._get_current_object()

        if trigger_start_notify:
            ElectionService.trigger_polling_started(app, updated_election)
        elif trigger_complete_notify:
            ElectionService.trigger_election_completed_results(app, updated_election)
            
        return success_response('Election updated successfully.', {
            'election': Election.to_dict(updated_election, include_candidates=True)
        })
    except Exception as e:
        logger.error(f'Error updating election: {str(e)}')
        return error_response('Failed to update election.', 500)


@election_bp.route('/elections/<string:election_id>', methods=['DELETE'])
@admin_required
def delete_election(election_id):
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)
        
    election = db.elections.find_one({'_id': obj_id})
    if not election:
        return error_response('Election not found.', 404)

    if Election.computed_status(election) == 'ACTIVE':
        return error_response('Cannot delete an active election.', 400)

    try:
        db.candidates.delete_many({'election_id': obj_id})
        db.votes.delete_many({'election_id': obj_id})
        db.elections.delete_one({'_id': obj_id})
        
        logger.info(f"Election {election_id} deleted by admin {get_jwt_identity()}")
        return success_response('Election deleted successfully.')
    except Exception as e:
        logger.error(f'Error deleting election: {str(e)}')
        return error_response('Failed to delete election.', 500)


@election_bp.route('/elections/<string:election_id>/candidates', methods=['POST'])
@admin_required
def add_candidate(election_id):
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)
        
    election = db.elections.find_one({'_id': obj_id})
    if not election:
        return error_response('Election not found.', 404)

    data = request.get_json()
    if not data or not data.get('name'):
        return error_response('Candidate name is required.')

    try:
        doc = {
            'election_id': obj_id,
            'name': data['name'].strip(),
            'party': data.get('party', '').strip() or None,
            'description': data.get('description', '').strip() or None,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = db.candidates.insert_one(doc)
        candidate_doc = db.candidates.find_one({'_id': result.inserted_id})

        logger.info(f"Candidate {candidate_doc.get('name')} added to election {election_id}")
        return success_response('Candidate added successfully.', {
            'candidate': Candidate.to_dict(candidate_doc)
        }, 201)
    except Exception as e:
        logger.error(f'Error adding candidate: {str(e)}')
        return error_response('Failed to add candidate.', 500)


@election_bp.route('/elections/<string:election_id>/candidates/<string:candidate_id>', methods=['PUT'])
@admin_required
def update_candidate(election_id, candidate_id):
    db = get_db()
    try:
        elec_obj_id = ObjectId(election_id)
        cand_obj_id = ObjectId(candidate_id)
    except Exception:
        return error_response('Invalid ID format.', 400)
        
    candidate = db.candidates.find_one({'_id': cand_obj_id})
    if not candidate or candidate.get('election_id') != elec_obj_id:
        return error_response('Candidate not found.', 404)

    data = request.get_json()
    if not data:
        return error_response('Request body is required.')

    updates = {}
    if 'name' in data and data['name']:
        updates['name'] = data['name'].strip()
    if 'party' in data:
        updates['party'] = data['party'].strip() or None
    if 'description' in data:
        updates['description'] = data['description'].strip() or None

    if not updates:
        return success_response('No updates provided.', {'candidate': Candidate.to_dict(candidate)})

    updates['updated_at'] = datetime.utcnow()

    try:
        db.candidates.update_one({'_id': cand_obj_id}, {'$set': updates})
        updated_candidate = db.candidates.find_one({'_id': cand_obj_id})
        return success_response('Candidate updated.', {'candidate': Candidate.to_dict(updated_candidate)})
    except Exception as e:
        logger.error(f'Error updating candidate: {str(e)}')
        return error_response('Failed to update candidate.', 500)


@election_bp.route('/elections/<string:election_id>/candidates/<string:candidate_id>', methods=['DELETE'])
@admin_required
def delete_candidate(election_id, candidate_id):
    db = get_db()
    try:
        elec_obj_id = ObjectId(election_id)
        cand_obj_id = ObjectId(candidate_id)
    except Exception:
        return error_response('Invalid ID format.', 400)
        
    candidate = db.candidates.find_one({'_id': cand_obj_id})
    if not candidate or candidate.get('election_id') != elec_obj_id:
        return error_response('Candidate not found.', 404)

    try:
        db.candidates.delete_one({'_id': cand_obj_id})
        return success_response('Candidate deleted successfully.')
    except Exception as e:
        logger.error(f'Error deleting candidate: {str(e)}')
        return error_response('Failed to delete candidate.', 500)

# ============================================================
# CANDIDATE APPLICATIONS (voter self-registration)
# ============================================================

@election_bp.route('/elections/<string:election_id>/apply', methods=['POST'])
@voter_required
def apply_as_candidate(election_id):
    """Voter applies to be a candidate for an UPCOMING election."""
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)

    election = db.elections.find_one({'_id': obj_id})
    if not election:
        return error_response('Election not found.', 404)

    if Election.computed_status(election) != 'UPCOMING':
        return error_response('Applications are only accepted for upcoming elections.', 400)

    user_id = get_jwt_identity()
    voter_doc = db.voters.find_one({'user_id': ObjectId(user_id)})
    if not voter_doc:
        return error_response('Voter profile not found.', 404)

    # Check if already applied
    existing = db.candidate_applications.find_one({
        'election_id': obj_id,
        'voter_id': voter_doc['_id']
    })
    if existing:
        return error_response('You have already applied for this election.', 400)

    data = request.get_json() or {}

    application = {
        'election_id': obj_id,
        'voter_id': voter_doc['_id'],
        'user_id': ObjectId(user_id),
        'applicant_name': voter_doc.get('full_name', ''),
        'party': data.get('party', '').strip() or None,
        'description': data.get('description', '').strip() or None,
        'status': 'PENDING',
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }

    result = db.candidate_applications.insert_one(application)
    application['_id'] = result.inserted_id

    logger.info(f"Voter {voter_doc.get('voter_id')} applied as candidate for election {election_id}")

    return success_response('Application submitted successfully. Awaiting admin approval.', {
        'application': {
            'id': str(application['_id']),
            'election_id': str(application['election_id']),
            'applicant_name': application['applicant_name'],
            'party': application['party'],
            'description': application['description'],
            'status': application['status'],
            'created_at': application['created_at'].isoformat()
        }
    }, 201)


@election_bp.route('/elections/<string:election_id>/applications', methods=['GET'])
@login_required_any
def list_applications(election_id):
    """List candidate applications. Admin sees all; voter sees own."""
    db = get_db()
    try:
        obj_id = ObjectId(election_id)
    except Exception:
        return error_response('Invalid election ID.', 400)

    user_id = get_jwt_identity()
    user_doc = db.users.find_one({'_id': ObjectId(user_id)})
    if not user_doc:
        return error_response('Authentication required.', 401)

    if user_doc.get('role') == 'ADMIN':
        apps = list(db.candidate_applications.find({'election_id': obj_id}).sort('created_at', -1))
    else:
        voter_doc = db.voters.find_one({'user_id': ObjectId(user_id)})
        if not voter_doc:
            return success_response('No applications.', {'applications': []})
        apps = list(db.candidate_applications.find({
            'election_id': obj_id,
            'voter_id': voter_doc['_id']
        }))

    result = []
    for a in apps:
        result.append({
            'id': str(a['_id']),
            'election_id': str(a['election_id']),
            'voter_id': str(a.get('voter_id', '')),
            'applicant_name': a.get('applicant_name', ''),
            'party': a.get('party'),
            'description': a.get('description'),
            'status': a.get('status', 'PENDING'),
            'created_at': a['created_at'].isoformat() if a.get('created_at') else None,
        })

    return success_response('Applications retrieved.', {'applications': result})


@election_bp.route('/elections/<string:election_id>/applications/<string:app_id>', methods=['PUT'])
@admin_required
def review_application(election_id, app_id):
    """Admin approves or rejects a candidate application."""
    db = get_db()
    try:
        elec_obj_id = ObjectId(election_id)
        app_obj_id = ObjectId(app_id)
    except Exception:
        return error_response('Invalid ID format.', 400)

    application = db.candidate_applications.find_one({'_id': app_obj_id, 'election_id': elec_obj_id})
    if not application:
        return error_response('Application not found.', 404)

    if application.get('status') != 'PENDING':
        return error_response('Application has already been reviewed.', 400)

    data = request.get_json()
    if not data or data.get('status') not in ['APPROVED', 'REJECTED']:
        return error_response('Status must be APPROVED or REJECTED.', 400)

    new_status = data['status']

    db.candidate_applications.update_one(
        {'_id': app_obj_id},
        {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
    )

    # If approved, create the actual candidate entry
    if new_status == 'APPROVED':
        candidate_doc = {
            'election_id': elec_obj_id,
            'name': application.get('applicant_name', ''),
            'party': application.get('party'),
            'description': application.get('description'),
            'applied_by': application.get('voter_id'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        db.candidates.insert_one(candidate_doc)
        logger.info(f"Application {app_id} approved — candidate created for election {election_id}")
    else:
        logger.info(f"Application {app_id} rejected for election {election_id}")

    return success_response(f'Application {new_status.lower()}.', {'status': new_status})
