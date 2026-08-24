"""
LoginHistory helper class for tracking login events.
Works with MongoDB documents.
"""
from datetime import datetime

class LoginHistory:
    """Helper class for Login History document operations."""

    @staticmethod
    def create_doc(user_id, voter_id, role, status='SUCCESS', ip_address=None, user_agent=None):
        """Create a new login history document dict ready for insert."""
        return {
            'user_id': user_id,
            'voter_id': voter_id,
            'role': role,
            'status': status,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'login_time': datetime.utcnow()
        }

    @staticmethod
    def to_dict(doc):
        """Serialize a login history MongoDB document to API response dict."""
        if not doc:
            return None
        return {
            'id': str(doc['_id']),
            'user_id': str(doc.get('user_id')) if doc.get('user_id') else None,
            'voter_id': doc.get('voter_id'),
            'role': doc.get('role'),
            'status': doc.get('status'),
            'ip_address': doc.get('ip_address'),
            'user_agent': doc.get('user_agent'),
            'login_time': doc['login_time'].isoformat() if doc.get('login_time') else None,
        }
