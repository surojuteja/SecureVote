"""
Custom decorators for role-based access.
"""
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..extensions import get_db
from ..models.user import User
from ..utils.security import error_response


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        db = get_db()
        user_doc = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_doc or user_doc.get('role') != 'ADMIN':
            return error_response('Admin access required.', 403)
        if not user_doc.get('is_active'):
            return error_response('Account is deactivated.', 403)
        return fn(*args, **kwargs)
    return wrapper


def voter_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        db = get_db()
        user_doc = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_doc or user_doc.get('role') != 'VOTER':
            return error_response('Voter access required.', 403)
        if not user_doc.get('is_active'):
            return error_response('Account is deactivated.', 403)
        return fn(*args, **kwargs)
    return wrapper


def login_required_any(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        db = get_db()
        user_doc = db.users.find_one({'_id': ObjectId(user_id)})
        if not user_doc:
            return error_response('Authentication required.', 401)
        if not user_doc.get('is_active'):
            return error_response('Account is deactivated.', 403)
        return fn(*args, **kwargs)
    return wrapper
