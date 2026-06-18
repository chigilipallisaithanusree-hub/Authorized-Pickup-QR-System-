from flask import Blueprint, jsonify
from models import Notification
from firebase_config import require_firebase_auth

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@require_firebase_auth
def get_notifications(current_user):
    if current_user.role.lower() == 'admin':
        notifications = Notification.query.order_by(Notification.created_at.desc()).all()
    else:
        notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
        
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200
