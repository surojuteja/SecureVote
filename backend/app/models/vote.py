"""
Vote helper class with unique constraint to prevent duplicate voting.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime


class Vote:
    """Helper class for Vote document operations."""

    @staticmethod
    def create_doc(election_id, voter_id, candidate_id):
        """Create a new vote document dict ready for insert.
        The compound unique index on (election_id, voter_id) in MongoDB
        prevents a voter from voting twice in the same election.
        """
        return {
            'election_id': election_id,
            'voter_id': voter_id,
            'candidate_id': candidate_id,
            'voted_at': datetime.utcnow(),
        }

    @staticmethod
    def to_dict(doc):
        """Serialize a vote MongoDB document to API response dict."""
        if not doc:
            return None
        return {
            'id': str(doc['_id']),
            'election_id': str(doc['election_id']),
            'voter_id': str(doc['voter_id']),
            'candidate_id': str(doc['candidate_id']),
            'voted_at': doc['voted_at'].isoformat() if doc.get('voted_at') else None,
        }
