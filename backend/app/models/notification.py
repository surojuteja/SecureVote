"""
Notification helper class for in-app notifications.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime


class Notification:
    """Helper class for Notification document operations."""

    @staticmethod
    def create_doc(user_id, title, message, notif_type, is_read=False):
        """Create a new notification document dict ready for insert."""
        return {
            'user_id': user_id,
            'title': title,
            'message': message,
            'type': notif_type,
            'is_read': is_read,
            'created_at': datetime.utcnow(),
        }

    @staticmethod
    def to_dict(doc):
        """Serialize a notification MongoDB document to API response dict."""
        if not doc:
            return None
        return {
            'id': str(doc['_id']),
            'user_id': str(doc['user_id']),
            'title': doc.get('title'),
            'message': doc.get('message'),
            'type': doc.get('type'),
            'is_read': doc.get('is_read', False),
            'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None,
        }
