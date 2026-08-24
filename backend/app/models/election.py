"""
Election helper class for managing elections and their lifecycle.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime
from ..extensions import get_db


class Election:
    """Helper class for Election document operations."""

    @staticmethod
    def create_doc(title, start_datetime, end_datetime, created_by,
                   description=None, status='UPCOMING'):
        """Create a new election document dict ready for insert."""
        return {
            'title': title,
            'description': description,
            'start_datetime': start_datetime,
            'end_datetime': end_datetime,
            'status': status,
            'created_by': created_by,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

    @staticmethod
    def computed_status(doc):
        """Compute the real-time status based on current time."""
        if doc.get('status') == 'CANCELLED':
            return 'CANCELLED'
        now = datetime.utcnow()
        start = doc.get('start_datetime')
        end = doc.get('end_datetime')
        if now < start:
            return 'UPCOMING'
        elif start <= now <= end:
            return 'ACTIVE'
        else:
            return 'COMPLETED'

    @staticmethod
    def to_dict(doc, include_candidates=False):
        """Serialize an election MongoDB document to API response dict."""
        if not doc:
            return None
        db = get_db()
        election_id = doc['_id']

        total_votes = db.votes.count_documents({'election_id': election_id})
        total_candidates = db.candidates.count_documents({'election_id': election_id})

        data = {
            'id': str(election_id),
            'title': doc.get('title'),
            'description': doc.get('description'),
            'start_datetime': doc['start_datetime'].isoformat() if doc.get('start_datetime') else None,
            'end_datetime': doc['end_datetime'].isoformat() if doc.get('end_datetime') else None,
            'status': Election.computed_status(doc),
            'created_by': str(doc['created_by']) if doc.get('created_by') else None,
            'total_votes': total_votes,
            'total_candidates': total_candidates,
            'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None,
            'updated_at': doc['updated_at'].isoformat() if doc.get('updated_at') else None,
        }
        if include_candidates:
            from .candidate import Candidate
            candidates = list(db.candidates.find({'election_id': election_id}))
            data['candidates'] = [Candidate.to_dict(c) for c in candidates]
        return data
