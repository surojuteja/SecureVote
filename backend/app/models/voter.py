"""
Voter helper class for voter profiles and face authentication data.
Works with MongoDB documents (plain dictionaries).
"""
from datetime import datetime


class Voter:
    """Helper class for Voter document operations."""

    @staticmethod
    def create_doc(user_id, voter_id, full_name, date_of_birth=None,
                   phone=None, address=None, is_verified=False, is_eligible=True):
        """Create a new voter document dict ready for insert."""
        return {
            'user_id': user_id,
            'voter_id': voter_id,
            'full_name': full_name,
            'date_of_birth': date_of_birth,
            'phone': phone,
            'address': address,
            'face_image_path': None,
            'face_embedding': None,
            'is_verified': is_verified,
            'is_eligible': is_eligible,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
        }

    @staticmethod
    def to_dict(doc, include_sensitive=False):
        """Serialize a voter MongoDB document to API response dict.
        Never expose face_embedding in normal API responses.
        """
        if not doc:
            return None
        data = {
            'id': str(doc['_id']),
            'user_id': str(doc['user_id']),
            'voter_id': doc.get('voter_id'),
            'full_name': doc.get('full_name'),
            'date_of_birth': doc['date_of_birth'] if doc.get('date_of_birth') else None,
            'phone': doc.get('phone'),
            'address': doc.get('address'),
            'is_verified': doc.get('is_verified', False),
            'is_eligible': doc.get('is_eligible', True),
            'has_face_registered': doc.get('face_image_path') is not None,
            'created_at': doc['created_at'].isoformat() if doc.get('created_at') else None,
            'updated_at': doc['updated_at'].isoformat() if doc.get('updated_at') else None,
        }
        if include_sensitive:
            data['face_image_path'] = doc.get('face_image_path')
        return data
