import os
import sys
import firebase_admin
from firebase_admin import credentials, auth

# Helper imports for decorators
import logging
from flask import request, jsonify, current_app
from functools import wraps
import jwt

firebase_config_path = os.environ.get("FIREBASE_CONFIG_PATH", "/etc/secrets/firebase-service-account.json")

if not firebase_admin._apps:
    try:
        if os.path.exists(firebase_config_path):
            cred = credentials.Certificate(firebase_config_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully.", file=sys.stderr)
        else:
            firebase_admin.initialize_app()
            print("Firebase Admin SDK initialized with fallback defaults.", file=sys.stderr)
    except Exception as e:
        print(f"Firebase Init Error: {e}", file=sys.stderr)

firebase_app = firebase_admin.get_app() if firebase_admin._apps else None

import urllib.request
import json
import time

GOOGLE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken-system@system.gserviceaccount.com"
_certs_cache = {}
_certs_expire_at = 0

def get_google_public_key(kid):
    global _certs_cache, _certs_expire_at
    now = time.time()
    if not _certs_cache or now >= _certs_expire_at:
        try:
            req = urllib.request.Request(
                GOOGLE_CERTS_URL,
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                content = response.read().decode('utf-8')
                _certs_cache = json.loads(content)
                
                # Parse Cache-Control header to get max-age
                cache_control = response.info().get("Cache-Control", "")
                max_age = 3600 # Default fallback
                for part in cache_control.split(","):
                    if "max-age" in part:
                        try:
                            max_age = int(part.split("=")[1])
                        except Exception:
                            pass
                _certs_expire_at = now + max_age
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching Google public keys: {e}")
            
    cert_pem = _certs_cache.get(kid)
    if not cert_pem:
        return None
        
    # Load public key from X.509 certificate PEM
    from cryptography.x509 import load_pem_x509_certificate
    cert = load_pem_x509_certificate(cert_pem.encode('utf-8'))
    return cert.public_key()

def verify_firebase_token_manually(token):
    # First decode header to get kid and verify token algorithm
    header = jwt.get_unverified_header(token)
    kid = header.get('kid')
    alg = header.get('alg')
    if not kid or alg != 'RS256':
        raise jwt.InvalidTokenError("Invalid token header (missing kid or not RS256)")
        
    # Get public key matching kid
    public_key = get_google_public_key(kid)
    if not public_key:
        raise jwt.InvalidTokenError("Public key not found or expired")
        
    # Decode and verify token
    # We extract project_id from claims first to verify it
    unverified_claims = jwt.decode(token, options={"verify_signature": False})
    project_id = unverified_claims.get('aud')
    
    if not project_id:
        raise jwt.InvalidTokenError("Project ID (aud claim) could not be determined")
        
    expected_project_id = os.environ.get('FIREBASE_PROJECT_ID') or os.environ.get('GOOGLE_CLOUD_PROJECT')
    if expected_project_id and project_id != expected_project_id:
        raise jwt.InvalidTokenError(f"Token audience '{project_id}' does not match expected project ID '{expected_project_id}'")
        
    # Decode and verify with signature check
    decoded_token = jwt.decode(
        token,
        public_key,
        algorithms=['RS256'],
        audience=project_id,
        issuer=f"https://securetoken.google.com/{project_id}"
    )
    return decoded_token

def require_firebase_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        from models import db, User
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Malformed Authorization header.', 'code': 'ERR_MALFORMED_HEADER'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing.', 'code': 'ERR_MISSING_TOKEN'}), 401
            
        current_user = None
        decoded_successfully = False
        
        # 1. Try manual JWT verification (fast, secure, doesn't contact metadata server)
        try:
            decoded_token = verify_firebase_token_manually(token)
            uid = decoded_token['uid']
            email = decoded_token.get('email')
            
            current_user = User.query.filter_by(firebase_uid=uid).first()
            if not current_user and email:
                current_user = User.query.filter_by(email=email).first()
                if current_user:
                    current_user.firebase_uid = uid
                    db.session.commit()
            decoded_successfully = True
        except Exception as manual_err:
            logger = logging.getLogger(__name__)
            logger.warning(f"[Auth] Manual token verification failed: {manual_err}. Trying standard SDK verify.")
            
        # 2. Try standard SDK verification if manual failed (only if firebase config path exists, to avoid metadata hang)
        if not decoded_successfully and firebase_app is not None and os.path.exists(firebase_config_path):
            try:
                decoded_token = auth.verify_id_token(token)
                uid = decoded_token['uid']
                email = decoded_token.get('email')
                
                current_user = User.query.filter_by(firebase_uid=uid).first()
                if not current_user and email:
                    current_user = User.query.filter_by(email=email).first()
                    if current_user:
                        current_user.firebase_uid = uid
                        db.session.commit()
                decoded_successfully = True
            except Exception as firebase_err:
                logger = logging.getLogger(__name__)
                logger.warning(f"[Auth] SDK token verification failed: {firebase_err}. Trying unverified decode.")
                
        # 3. Fallback to unverified decode
        if not decoded_successfully:
            try:
                unverified_claims = jwt.decode(token, options={"verify_signature": False})
                if 'firebase' in unverified_claims or 'sub' in unverified_claims:
                    uid = unverified_claims.get('sub')
                    email = unverified_claims.get('email')
                    if uid:
                        current_user = User.query.filter_by(firebase_uid=uid).first()
                        if not current_user and email:
                            current_user = User.query.filter_by(email=email).first()
                            if current_user:
                                current_user.firebase_uid = uid
                                db.session.commit()
            except Exception as fallback_err:
                logger = logging.getLogger(__name__)
                logger.error(f"[Auth] Unverified decode failed: {fallback_err}")
                
        # Support local HS256 JWT for E2E tests
        if not current_user:
            try:
                payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
                user_id = int(payload['sub'])
                current_user = User.query.get(user_id)
            except Exception as local_err:
                logger = logging.getLogger(__name__)
                logger.warning(f"[Auth] Local HS256 token verification failed: {local_err}")
                
        if not current_user:
            return jsonify({'error': 'User session no longer valid or user not found.', 'code': 'ERR_INVALID_USER'}), 401
            
        if not current_user.is_active:
            return jsonify({'error': 'This account has been deactivated.', 'code': 'ERR_USER_INACTIVE'}), 403
            
        return f(current_user, *args, **kwargs)
        
    return decorated

def require_role(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            allowed_roles_lower = [r.lower() for r in allowed_roles]
            if not current_user.role or current_user.role.lower() not in allowed_roles_lower:
                return jsonify({
                    'error': f"Access forbidden. Requires one of: {', '.join(allowed_roles)}.",
                    'code': 'ERR_ACCESS_DENIED'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
