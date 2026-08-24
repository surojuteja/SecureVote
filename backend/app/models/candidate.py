"""
Candidate helper class for election candidates.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime
from ..extensions import get_db


class Candidate:
    """Helper class for Candidate document operations."""

    @staticmethod
    def create_doc(election_id, name, party=None, description=None, image_path=None):
        """Create a new candidate document dict ready for insert."""
        return {
            'election_id': election_id,
            'name': name,
            'party': party,
            'description': description,
            'image_path': image_path,
            'created_at': datetime.utcnow(),
        }

    @staticmethod
    def to_dict(doc):
        """Serialize a candidate MongoDB document to API response dict."""
        if not doc:
            return None
        db = get_db()
        vote_count = db.votes.count_documents({'candidate_id': doc['_id']})

        return {
            'id': str(doc['_id']),
            'election_id': str(doc['election_id']),
            'name': doc.get('name'),
            'party': doc.get('party'),
            'description': doc.get('description'),
            'image_path': doc.get('image_path'),
            'vote_count': vote_count,
            'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None,
        }
