from flask import Blueprint, request, jsonify
from models import db, User
from firebase_config import require_firebase_auth, require_role
import logging

logger = logging.getLogger(__name__)

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@require_firebase_auth
@require_role(['Admin'])
def get_users(current_user):
    search_query = request.args.get('search', '').strip()
    role_filter = request.args.get('role', '').strip()
    
    query = User.query
    
    if role_filter:
        query = query.filter_by(role=role_filter.strip().lower())
        
    if search_query:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f"%{search_query}%"),
                User.email.ilike(f"%{search_query}%")
            )
        )
        
    users = query.order_by(User.full_name.asc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@require_firebase_auth
@require_role(['Admin'])
def get_user_by_id(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.', 'code': 'ERR_USER_NOT_FOUND'}), 404
    return jsonify({'user': user.to_dict()}), 200

@users_bp.route('', methods=['POST'])
@require_firebase_auth
@require_role(['Admin'])
def create_user(current_user):
    data = request.get_json()
    if not data or not data.get('email') or not data.get('role') or not data.get('fullName'):
        return jsonify({'error': 'Name, email, and role are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    role = data.get('role').strip().lower()
    full_name = data.get('fullName').strip()
    
    if role not in ['admin', 'teacher', 'parent']:
        return jsonify({'error': 'Invalid role specified.', 'code': 'ERR_INVALID_ROLE'}), 400
        
    # Check unique constraint
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'A user with this email already exists.', 'code': 'ERR_EMAIL_TAKEN'}), 400
        
    # Pre-authorized users are created with a pending UID and is_active = False until they self-register
    firebase_uid = f"pending_{email}"
    
    user = User(
        email=email,
        firebase_uid=firebase_uid,
        role=role,
        full_name=full_name,
        is_active=False
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully', 'userId': user.id}), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@require_firebase_auth
@require_role(['Admin'])
def update_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.', 'code': 'ERR_USER_NOT_FOUND'}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body.', 'code': 'ERR_INVALID_BODY'}), 400
        
    if 'email' in data:
        email = data['email'].strip().lower()
        if email != user.email:
            # Check unique constraint
            if User.query.filter_by(email=email).first():
                return jsonify({'error': 'A user with this email already exists.', 'code': 'ERR_EMAIL_TAKEN'}), 400
            
            # Try to update email in Firebase
            if user.firebase_uid and not user.firebase_uid.startswith('mock_uid_'):
                try:
                    from firebase_admin import auth as firebase_auth
                    firebase_auth.update_user(user.firebase_uid, email=email)
                except Exception as e:
                    logger.warning(f"Could not update email in Firebase: {e}")
            user.email = email
            
    if 'fullName' in data:
        user.full_name = data['fullName'].strip()
        
    if 'role' in data:
        role = data['role'].strip().lower()
        if role not in ['admin', 'teacher', 'parent']:
            return jsonify({'error': 'Invalid role specified.', 'code': 'ERR_INVALID_ROLE'}), 400
        user.role = role
        
    if 'isActive' in data:
        user.is_active = bool(data['isActive'])
        # Try to disable/enable user in Firebase
        if user.firebase_uid and not user.firebase_uid.startswith('mock_uid_'):
            try:
                from firebase_admin import auth as firebase_auth
                firebase_auth.update_user(user.firebase_uid, disabled=not user.is_active)
            except Exception as e:
                logger.warning(f"Could not update disabled status in Firebase: {e}")
        
    db.session.commit()
    return jsonify({'message': 'User profile updated successfully'}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@require_firebase_auth
@require_role(['Admin'])
def delete_user(current_user, user_id):
    if current_user.id == user_id:
        return jsonify({'error': 'You cannot delete your own account.', 'code': 'ERR_SELF_DELETE'}), 400
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found.', 'code': 'ERR_USER_NOT_FOUND'}), 404
        
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User record deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Cannot delete user. This user has associated children or gate logs. Deactivate the account instead by updating its status.',
            'code': 'ERR_INTEGRITY_VIOLATION'
        }), 400
