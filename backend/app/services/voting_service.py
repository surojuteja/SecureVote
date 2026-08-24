"""
Voting business logic.
"""
import logging
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from ..extensions import get_db
from ..models.election import Election
from ..models.candidate import Candidate
from ..models.vote import Vote
from ..services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class VotingService:
    @staticmethod
    def cast_vote(voter_db_id, election_id, candidate_id):
        db = get_db()
        election_doc = db.elections.find_one({'_id': ObjectId(election_id)})
        if not election_doc:
            return {'success': False, 'message': 'Election not found.', 'status_code': 404}

        if Election.computed_status(election_doc) != 'ACTIVE':
            return {'success': False, 'message': 'This election is not currently active.', 'status_code': 400}

        candidate_doc = db.candidates.find_one({'_id': ObjectId(candidate_id)})
        if not candidate_doc or candidate_doc.get('election_id') != ObjectId(election_id):
            return {'success': False, 'message': 'Invalid candidate for this election.', 'status_code': 400}

        existing_vote = db.votes.find_one({
            'election_id': ObjectId(election_id),
            'voter_id': voter_db_id
        })
        if existing_vote:
            return {'success': False, 'message': 'You have already voted in this election.', 'status_code': 409}

        try:
            vote_doc = Vote.create_doc(
                election_id=ObjectId(election_id),
                voter_id=voter_db_id,
                candidate_id=ObjectId(candidate_id),
            )
            result = db.votes.insert_one(vote_doc)
            inserted_vote = db.votes.find_one({'_id': result.inserted_id})

            NotificationService.notify_vote_confirmation(
                voter_db_id, election_doc
            )

            logger.info(f'Vote cast: voter={voter_db_id}, election={election_id}, candidate={candidate_id}')

            return {
                'success': True,
                'message': 'Vote cast successfully!',
                'data': Vote.to_dict(inserted_vote)
            }
        except DuplicateKeyError:
            return {'success': False, 'message': 'You have already voted in this election.', 'status_code': 409}
        except Exception as e:
            logger.error(f'Error casting vote: {str(e)}')
            return {'success': False, 'message': 'Failed to cast vote.', 'status_code': 500}
