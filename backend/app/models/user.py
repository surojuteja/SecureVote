"""
User helper class for authentication and role management.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User:
    """Helper class for User document operations."""

    @staticmethod
    def create_doc(username, email, role='VOTER', is_active=True, password=None):
        """Create a new user document dict ready for insert."""
        doc = {
            'username': username,
            'email': email,
            'password_hash': generate_password_hash(password) if password else '',
            'role': role,
            'is_active': is_active,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }
        return doc

    @staticmethod
    def set_password(password):
        """Hash a password."""
        return generate_password_hash(password)

    @staticmethod
    def check_password(stored_hash, password):
        """Verify a password against the stored hash."""
        return check_password_hash(stored_hash, password)

    @staticmethod
    def to_dict(doc):
        """Serialize a user MongoDB document to API response dict."""
        if not doc:
            return None
        return {
            'id': str(doc['_id']),
            'username': doc.get('username'),
            'email': doc.get('email'),
            'role': doc.get('role'),
            'is_active': doc.get('is_active', True),
            'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None,
            'updated_at': doc['updated_at'].isoformat() if doc.get('updated_at') else None,
        }
