import pytest
import os
import tempfile
from datetime import datetime, timedelta
import bcrypt
import jwt

# Set SQLite testing environment before importing app
os.environ['USE_SQLITE'] = 'True'
os.environ['SECRET_KEY'] = 'test-secret-key-that-is-at-least-32-bytes-long'
os.environ['AES_KEY'] = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='

from app import create_app
from config import Config
from models import db, User, Student, Guardian, QrToken, PickupLog
from services.rule_engine import RuleEngine

@pytest.fixture
def app():
    # Setup temporary db file
    db_fd, db_path = tempfile.mkstemp()
    
    class TestConfig(Config):
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{db_path}"
        TESTING = True
        SECRET_KEY = 'test-secret-key-that-is-at-least-32-bytes-long'
        AES_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        
    app = create_app(TestConfig)
    
    with app.app_context():
        db.create_all()
        # Seed test users
        admin = User(email="admin@test.com", firebase_uid="uid_admin_test", role="admin", full_name="Admin User")
        teacher = User(email="teacher@test.com", firebase_uid="uid_teacher_test", role="teacher", full_name="Teacher User")
        parent = User(email="parent@test.com", firebase_uid="uid_parent_test", role="parent", full_name="Parent User")
        db.session.add_all([admin, teacher, parent])
        db.session.commit()
        
    yield app
    
    # Cleanup db
    os.close(db_fd)
    try:
        os.unlink(db_path)
    except PermissionError:
        pass

@pytest.fixture
def client(app):
    return app.test_client()

def test_login(client):
    """Test successful user login and role checking"""
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'Password123!',
        'role': 'admin'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert 'token' in data
    assert data['user']['role'] == 'admin'

def test_unauthorized_login(client):
    """Test login with incorrect password fails"""
    res = client.post('/api/auth/login', json={
        'email': 'admin@test.com',
        'password': 'WrongPassword',
        'role': 'admin'
    })
    assert res.status_code == 401
    assert 'error' in res.get_json()

def test_rule_engine_approved(app):
    """Test Rule Engine returns APPROVED for valid parameters"""
    aes_key = app.config['AES_KEY']
    expires_at_iso = (datetime.utcnow() + timedelta(hours=2)).isoformat() + "Z"
    
    with app.app_context():
        # Setup student & guardian mapping
        parent = User.query.filter_by(role='parent').first()
        student = Student(first_name="Leo", last_name="Watson", grade_class="K-A", parent_user_id=parent.id)
        guardian = Guardian(full_name="John Watson", relationship="Uncle", phone_number="+1555", email="j@w.com")
        db.session.add_all([student, guardian])
        db.session.commit()
        
        student.guardians.append(guardian)
        db.session.commit()
        
        # Encrypt token
        token_string = RuleEngine.encrypt_payload(student.id, guardian.id, expires_at_iso, aes_key)
        
        # Generate token record
        token_rec = QrToken(
            token_hash=token_string,
            student_id=student.id,
            guardian_id=guardian.id,
            expires_at=datetime.utcnow() + timedelta(hours=2),
            status='Active'
        )
        db.session.add(token_rec)
        db.session.commit()
        
        # Evaluate
        status, reason, payload = RuleEngine.evaluate_pickup(token_string, aes_key, '127.0.0.1')
        assert status == 'APPROVED'
        assert reason is None
        assert payload['student_id'] == student.id

def test_rule_engine_expired(app):
    """Test Rule Engine rejects expired dynamic token"""
    aes_key = app.config['AES_KEY']
    # Expiry 10 minutes ago
    expires_at_iso = (datetime.utcnow() - timedelta(minutes=10)).isoformat() + "Z"
    
    with app.app_context():
        parent = User.query.filter_by(role='parent').first()
        student = Student(first_name="Leo", last_name="Watson", grade_class="K-A", parent_user_id=parent.id)
        guardian = Guardian(full_name="John Watson", relationship="Uncle", phone_number="+1555", email="j@w.com")
        db.session.add_all([student, guardian])
        db.session.commit()
        
        token_string = RuleEngine.encrypt_payload(student.id, guardian.id, expires_at_iso, aes_key)
        
        # Evaluate
        status, reason, payload = RuleEngine.evaluate_pickup(token_string, aes_key, '127.0.0.1')
        assert status == 'REJECTED'
        assert reason == 'Token Expired'

def get_auth_headers(app, role, user_id):
    token_expiry = datetime.utcnow() + timedelta(hours=8)
    token_payload = {
        'sub': str(user_id),
        'role': role,
        'iat': datetime.utcnow(),
        'exp': token_expiry
    }
    token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')
    return {'Authorization': f'Bearer {token}'}

def test_user_management_crud(app, client):
    """Test User Management CRUD operations (Select, Insert, Update, Delete)"""
    with app.app_context():
        admin = User.query.filter_by(role='admin').first()
        admin_headers = get_auth_headers(app, 'admin', admin.id)
        
        # 1. READ / SELECT
        res = client.get('/api/users', headers=admin_headers)
        assert res.status_code == 200
        assert len(res.get_json()['users']) >= 3 # admin, teacher, parent
        
        # 2. CREATE / INSERT
        res = client.post('/api/users', json={
            'email': 'new_user@test.com',
            'fullName': 'New Test User',
            'role': 'teacher',
            'password': 'Password123!'
        }, headers=admin_headers)
        assert res.status_code == 201
        user_id = res.get_json()['userId']
        
        # Verify created
        created_user = User.query.get(user_id)
        assert created_user.email == 'new_user@test.com'
        assert created_user.full_name == 'New Test User'
        
        # 3. UPDATE / UPDATE
        res = client.put(f'/api/users/{user_id}', json={
            'fullName': 'Updated Name',
            'isActive': False
        }, headers=admin_headers)
        assert res.status_code == 200
        assert created_user.full_name == 'Updated Name'
        assert created_user.is_active is False
        
        # 4. DELETE / DELETE
        res = client.delete(f'/api/users/{user_id}', headers=admin_headers)
        assert res.status_code == 200
        assert User.query.get(user_id) is None

def test_guardian_edit(app, client):
    """Test Guardian update profile API (UPDATE)"""
    with app.app_context():
        parent = User.query.filter_by(role='parent').first()
        parent_headers = get_auth_headers(app, 'parent', parent.id)
        
        # Create guardian and student first
        student = Student(first_name="Leo", last_name="Watson", grade_class="K-A", parent_user_id=parent.id)
        guardian = Guardian(full_name="Old Guardian Name", relationship="Uncle", phone_number="+1555", email="g@w.com")
        db.session.add_all([student, guardian])
        db.session.commit()
        student.guardians.append(guardian)
        db.session.commit()
        
        # Update guardian details
        res = client.put(f'/api/guardians/{guardian.id}', json={
            'fullName': 'New Guardian Name',
            'relationship': 'Stepfather',
            'phoneNumber': '+19999',
            'email': 'new@w.com'
        }, headers=parent_headers)
        assert res.status_code == 200
        
        # Verify updated
        updated_guardian = Guardian.query.get(guardian.id)
        assert updated_guardian.full_name == 'New Guardian Name'
        assert updated_guardian.relationship == 'Stepfather'
