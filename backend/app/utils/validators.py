"""
Input validation utilities.
"""
import re
from datetime import datetime


def validate_email(email):
    """Validate email format."""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_voter_id(voter_id):
    """Validate voter ID format (alphanumeric, 3-20 chars)."""
    if not voter_id:
        return False
    pattern = r'^[A-Za-z0-9]{3,20}$'
    return bool(re.match(pattern, voter_id))


def validate_password(password):
    """Validate password strength (min 6 chars)."""
    if not password or len(password) < 6:
        return False
    return True


def validate_dates(start_str, end_str):
    """Validate that start datetime is before end datetime."""
    try:
        start = datetime.fromisoformat(start_str)
        end = datetime.fromisoformat(end_str)
        return start < end
    except (ValueError, TypeError):
        return False


def validate_required_fields(data, required_fields):
    """Check that all required fields are present and non-empty."""
    missing = []
    for field in required_fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and data[field].strip() == ''):
            missing.append(field)
    return missing


ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    """Check if file extension is allowed."""
    if not filename:
        return False
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS
