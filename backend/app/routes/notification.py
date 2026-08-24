"""
Notification routes.
"""
import logging
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from ..extensions import get_db
from ..models.notification import Notification
from ..utils.decorators import login_required_any
from ..utils.security import success_response, error_response

logger = logging.getLogger(__name__)
notification_bp = Blueprint('notification', __name__)


@notification_bp.route('/notifications', methods=['GET'])
@login_required_any
def list_notifications():
    user_id = get_jwt_identity()
    db = get_db()
    unread_only = request.args.get('unread', '').lower() == 'true'

    query = {'user_id': ObjectId(user_id)}
    if unread_only:
        query['is_read'] = False

    notifications = list(db.notifications.find(query).sort('created_at', -1).limit(50))

    return success_response('Notifications retrieved.', {
        'notifications': [Notification.to_dict(n) for n in notifications],
        'unread_count': db.notifications.count_documents({'user_id': ObjectId(user_id), 'is_read': False}),
    })


@notification_bp.route('/notifications/<string:notif_id>/read', methods=['PUT'])
@login_required_any
def mark_read(notif_id):
    user_id = get_jwt_identity()
    db = get_db()
    notif = db.notifications.find_one({'_id': ObjectId(notif_id)})
    if not notif or notif.get('user_id') != ObjectId(user_id):
        return error_response('Notification not found.', 404)

    db.notifications.update_one({'_id': ObjectId(notif_id)}, {'$set': {'is_read': True}})

    return success_response('Notification marked as read.')


@notification_bp.route('/notifications/read-all', methods=['PUT'])
@login_required_any
def mark_all_read():
    user_id = get_jwt_identity()
    db = get_db()
    db.notifications.update_many({'user_id': ObjectId(user_id), 'is_read': False}, {'$set': {'is_read': True}})

    return success_response('All notifications marked as read.')
