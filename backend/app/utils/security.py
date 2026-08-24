"""
Security utilities — response helpers and common security functions.
"""
from flask import jsonify


def success_response(message, data=None, status_code=200):
    """Return a standardized success JSON response."""
    return jsonify({
        'success': True,
        'message': message,
        'data': data
    }), status_code


def error_response(message, status_code=400, data=None):
    """Return a standardized error JSON response."""
    return jsonify({
        'success': False,
        'message': message,
        'data': data
    }), status_code
