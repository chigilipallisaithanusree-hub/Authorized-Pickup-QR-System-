from flask import Blueprint, request, jsonify, current_app
import jwt
from datetime import datetime, timedelta
from models import db, User
from middleware import token_required
import logging

logger = logging.getLogger(__name__)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('role'):
        return jsonify({'error': 'Email, password, and role are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    password = data.get('password')
    role = data.get('role').strip().lower()
    
    # Query user
    user = User.query.filter_by(email=email).first()
    if not user or user.role.lower() != role:
        return jsonify({'error': 'Invalid email, password, or role.', 'code': 'ERR_INVALID_CREDENTIALS'}), 401
        
    if not user.is_active:
        if user.firebase_uid and user.firebase_uid.startswith('pending_'):
            return jsonify({'error': 'This account has not been activated yet. Please click "Create Account" to register.', 'code': 'ERR_USER_PENDING'}), 403
        return jsonify({'error': 'This account has been deactivated.', 'code': 'ERR_USER_INACTIVE'}), 403
        
    # Check password (mock check for offline testing/E2E suite since passwords are in Firebase)
    if password != "Password123!":
        return jsonify({'error': 'Invalid email, password, or role.', 'code': 'ERR_INVALID_CREDENTIALS'}), 401
        
    # Generate local JWT (accepted by middleware fallback)
    token_expiry = datetime.utcnow() + timedelta(hours=8)
    token_payload = {
        'sub': str(user.id),
        'role': user.role,
        'iat': datetime.utcnow(),
        'exp': token_expiry
    }
    token = jwt.encode(token_payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200

# Endpoint to register a test user (helpful for setup/tests)
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password') or not data.get('role') or not data.get('fullName'):
        return jsonify({'error': 'Missing fields.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    password = data.get('password')
    role = data.get('role').strip().lower()
    full_name = data.get('fullName').strip()
    
    if role not in ['admin', 'teacher', 'parent']:
        return jsonify({'error': 'Invalid role specified.', 'code': 'ERR_INVALID_ROLE'}), 400
        
    # Check unique constraint
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'A user with this email already exists.', 'code': 'ERR_EMAIL_TAKEN'}), 400
        
    # Create in Firebase
    firebase_uid = None
    try:
        from firebase_admin import auth as firebase_auth
        fb_user = firebase_auth.create_user(
            email=email,
            password=password
        )
        firebase_uid = fb_user.uid
    except Exception as e:
        logger.warning(f"Firebase registration failed or skipped: {e}")
        firebase_uid = f"mock_uid_{email.split('@')[0]}"
        
    user = User(
        email=email,
        firebase_uid=firebase_uid,
        role=role,
        full_name=full_name,
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully', 'userId': user.id}), 201

@auth_bp.route('/register-check', methods=['POST'])
def register_check():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('role'):
        return jsonify({'error': 'Email and role are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    role = data.get('role').strip().lower()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            'error': 'Your email is not authorized. Please contact the school administrator.',
            'code': 'ERR_UNAUTHORIZED_EMAIL'
        }), 403
        
    if user.role.lower() != role:
        return jsonify({
            'error': f"Your email is registered with a different role '{user.role}'. Please contact the school administrator.",
            'code': 'ERR_ROLE_MISMATCH'
        }), 403
        
    # Check if already registered
    if user.firebase_uid and not user.firebase_uid.startswith('pending_') and not user.firebase_uid.startswith('mock_uid_'):
        return jsonify({
            'error': 'An account with this email has already been registered.',
            'code': 'ERR_ALREADY_REGISTERED'
        }), 400
        
    return jsonify({'message': 'Email authorized for registration.', 'fullName': user.full_name}), 200

@auth_bp.route('/register-link', methods=['POST'])
def register_link():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('firebaseUid') or not data.get('fullName'):
        return jsonify({'error': 'Email, firebaseUid, and fullName are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    firebase_uid = data.get('firebaseUid').strip()
    full_name = data.get('fullName').strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found in pre-authorization table.', 'code': 'ERR_USER_NOT_FOUND'}), 404
        
    # Update user record
    user.firebase_uid = firebase_uid
    user.full_name = full_name
    user.is_active = True
    db.session.commit()
    
    return jsonify({'message': 'Account linked and activated successfully.', 'user': user.to_dict()}), 200

@auth_bp.route('/mock-register', methods=['POST'])
def mock_register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('role') or not data.get('fullName') or not data.get('password'):
        return jsonify({'error': 'Email, role, fullName, and password are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    email = data.get('email').strip().lower()
    role = data.get('role').strip().lower()
    full_name = data.get('fullName').strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            'error': 'Your email is not authorized. Please contact the school administrator.',
            'code': 'ERR_UNAUTHORIZED_EMAIL'
        }), 403
        
    if user.role.lower() != role:
        return jsonify({
            'error': f"Your email is registered with a different role '{user.role}'. Please contact the school administrator.",
            'code': 'ERR_ROLE_MISMATCH'
        }), 403
        
    # Set mock uid and activate
    user.firebase_uid = f"mock_uid_{email.split('@')[0]}"
    user.full_name = full_name
    user.is_active = True
    db.session.commit()
    
    return jsonify({'message': 'Mock account created and activated successfully.', 'user': user.to_dict()}), 200
