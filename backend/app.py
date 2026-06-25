from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db
import logging
import firebase_config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configure CORS - Whitelist Vercel/localhost origins
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Initialize Database
    db.init_app(app)
    
    # Setup Loggers
    logging.basicConfig(level=logging.INFO)
    app.logger.setLevel(logging.INFO)
    
    # Register blueprints (routes)
    from routes.auth import auth_bp
    from routes.students import students_bp
    from routes.guardians import guardians_bp
    from routes.qr import qr_bp
    from routes.pickups import pickups_bp
    from routes.dashboard import dashboard_bp
    from routes.reports import reports_bp
    from routes.notifications import notifications_bp
    from routes.users import users_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(guardians_bp, url_prefix='/api/guardians')
    app.register_blueprint(qr_bp, url_prefix='/api/qr')
    app.register_blueprint(pickups_bp, url_prefix='/api/pickups')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Global exception handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Resource not found.', 'code': 'ERR_NOT_FOUND'}), 404
        
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f"Server Error: {error}")
        return jsonify({'error': 'An internal server error occurred.', 'code': 'ERR_SERVER_ERROR'}), 500

    # Initialize tables on start (useful for development sqlite/mysql)
    with app.app_context():
        import os
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if not uri.startswith('sqlite'):
            try:
                import pymysql
                db_user = os.environ.get('DB_USER', 'root')
                db_pass = os.environ.get('DB_PASSWORD', '')
                db_host = os.environ.get('DB_HOST', 'localhost')
                db_port = int(os.environ.get('DB_PORT', '3306'))
                db_name = os.environ.get('DB_NAME', 'authorized_pickup')
                
                app.logger.info(f"Connecting to MySQL at {db_host}:{db_port} to verify database exists...")
                conn = pymysql.connect(host=db_host, user=db_user, password=db_pass, port=db_port)
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
                conn.close()
                app.logger.info(f"Verified/Created MySQL database: {db_name}")
            except Exception as db_err:
                app.logger.warning(f"Could not automatically check/create MySQL database: {db_err}")
                
        db.create_all()
        from models import User, Student, Guardian, QrToken, PickupLog, Notification
        try:
            if not User.query.first():
                admin = User(email='saithanusreechigilipalli@gmail.com', firebase_uid='uid_admin_sarah', role='admin', full_name='Sai Thanusree Chigilipalli')
                admin2 = User(email='viceprincipal@school.edu', firebase_uid='uid_admin_wilson', role='admin', full_name='Vice Principal James Wilson')
                admin3 = User(email='chigilipallisaithanusree@gmail.com', firebase_uid='uid_admin_sarah2', role='admin', full_name='Sai Thanusree Chigilipalli')
                teacher = User(email='davis@school.edu', firebase_uid='uid_teacher_davis', role='teacher', full_name='Mr. Robert Davis')
                teacher2 = User(email='clark@school.edu', firebase_uid='uid_teacher_clark', role='teacher', full_name='Mrs. Helen Clark')
                teacher3 = User(email='jones@school.edu', firebase_uid='uid_teacher_jones', role='teacher', full_name='Miss Emily Jones')
                parent = User(email='parent@family.com', firebase_uid='uid_parent_watson', role='parent', full_name='Mrs. Emily Watson')
                parent2 = User(email='john.doe@family.com', firebase_uid='uid_parent_doe', role='parent', full_name='Mr. John Doe')
                parent3 = User(email='jane.smith@family.com', firebase_uid='uid_parent_smith', role='parent', full_name='Mrs. Jane Smith')
                parent4 = User(email='robert.johnson@family.com', firebase_uid='uid_parent_johnson', role='parent', full_name='Mr. Robert Johnson')
                db.session.add_all([admin, admin2, admin3, teacher, teacher2, teacher3, parent, parent2, parent3, parent4])
                db.session.commit()
                
                # Seed students
                student1 = Student(first_name='Leo', last_name='Watson', grade_class='Kindergarten-A', parent_user_id=parent.id)
                student2 = Student(first_name='Mia', last_name='Watson', grade_class='Grade 2-B', parent_user_id=parent.id)
                student3 = Student(first_name='Lucas', last_name='Doe', grade_class='Grade 1-A', parent_user_id=parent2.id)
                student4 = Student(first_name='Sophia', last_name='Smith', grade_class='Kindergarten-B', parent_user_id=parent3.id)
                student5 = Student(first_name='Oliver', last_name='Johnson', grade_class='Grade 3-C', parent_user_id=parent4.id)
                
                # Seed guardians
                guardian = Guardian(full_name='John Watson', relationship='Uncle', phone_number='+1-555-0199', email='john.watson@gmail.com')
                guardian2 = Guardian(full_name='Sarah Doe', relationship='Aunt', phone_number='+1-555-0211', email='sarah.doe@gmail.com')
                guardian3 = Guardian(full_name='David Miller', relationship='Grandfather', phone_number='+1-555-0322', email='david.miller@gmail.com')
                guardian4 = Guardian(full_name='Emma Davis', relationship='Nanny', phone_number='+1-555-0433', email='emma.davis@gmail.com')
                
                db.session.add_all([student1, student2, student3, student4, student5, guardian, guardian2, guardian3, guardian4])
                db.session.commit()
                
                # Associate student-guardians
                student1.guardians.append(guardian)
                student2.guardians.append(guardian)
                student3.guardians.append(guardian2)
                student4.guardians.append(guardian3)
                student5.guardians.append(guardian4)
                db.session.commit()

                # Seed QR tokens
                from datetime import datetime, timedelta
                now = datetime.utcnow()
                
                t1 = QrToken(
                    token_hash='active-token-hash-1',
                    student_id=student1.id,
                    guardian_id=guardian.id,
                    expires_at=now + timedelta(hours=2),
                    status='Active',
                    created_at=now
                )
                t2 = QrToken(
                    token_hash='expired-token-hash-2',
                    student_id=student2.id,
                    guardian_id=guardian.id,
                    expires_at=now - timedelta(hours=1),
                    status='Expired',
                    created_at=now - timedelta(hours=3)
                )
                t3 = QrToken(
                    token_hash='used-token-hash-3',
                    student_id=student1.id,
                    guardian_id=guardian.id,
                    expires_at=now - timedelta(days=1) + timedelta(hours=2),
                    status='Used',
                    created_at=now - timedelta(days=1),
                    used_at=now - timedelta(days=1) + timedelta(minutes=45)
                )
                t4 = QrToken(
                    token_hash='active-token-hash-4',
                    student_id=student3.id,
                    guardian_id=guardian2.id,
                    expires_at=now + timedelta(hours=4),
                    status='Active',
                    created_at=now
                )
                t5 = QrToken(
                    token_hash='expired-token-hash-5',
                    student_id=student4.id,
                    guardian_id=guardian3.id,
                    expires_at=now - timedelta(hours=2),
                    status='Expired',
                    created_at=now - timedelta(hours=5)
                )
                db.session.add_all([t1, t2, t3, t4, t5])
                db.session.commit()
                
                # Seed pickup logs spread over the last 7 days using various students, guardians, and teachers
                logs = [
                    # Today's logs
                    PickupLog(student_id=student1.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(minutes=30), ip_address='192.168.1.101'),
                    PickupLog(student_id=student3.id, guardian_id=guardian2.id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(hours=1), ip_address='192.168.1.110'),
                    PickupLog(student_id=student1.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='REJECTED', rejection_reason='Token Expired', created_at=now - timedelta(hours=2), ip_address='192.168.1.102'),
                    PickupLog(student_id=student5.id, guardian_id=guardian4.id, teacher_user_id=teacher3.id, status='APPROVED', created_at=now - timedelta(hours=4), ip_address='192.168.1.115'),
                    
                    # Yesterday's logs
                    PickupLog(student_id=student1.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(days=1, hours=2), ip_address='192.168.1.103'),
                    PickupLog(student_id=student2.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(days=1, hours=3), ip_address='192.168.1.103'),
                    
                    # 2 days ago
                    PickupLog(student_id=student3.id, guardian_id=guardian2.id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=2, hours=1), ip_address='192.168.1.104'),
                    PickupLog(student_id=student4.id, guardian_id=guardian3.id, teacher_user_id=teacher.id, status='REJECTED', rejection_reason='Unauthorized Guardian', created_at=now - timedelta(days=2, hours=4), ip_address='192.168.1.105'),
                    
                    # 3 days ago
                    PickupLog(student_id=student1.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(days=3, hours=2), ip_address='192.168.1.106'),
                    PickupLog(student_id=student5.id, guardian_id=guardian4.id, teacher_user_id=teacher3.id, status='APPROVED', created_at=now - timedelta(days=3, hours=5), ip_address='192.168.1.106'),
                    
                    # 4 days ago
                    PickupLog(student_id=student1.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(days=4, hours=3), ip_address='192.168.1.107'),
                    
                    # 5 days ago
                    PickupLog(student_id=student2.id, guardian_id=guardian.id, teacher_user_id=teacher.id, status='REJECTED', rejection_reason='QR Already Used', created_at=now - timedelta(days=5, hours=2), ip_address='192.168.1.108'),
                    
                    # 6 days ago
                    PickupLog(student_id=student3.id, guardian_id=guardian2.id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=6, hours=1), ip_address='192.168.1.109'),
                    PickupLog(student_id=student4.id, guardian_id=guardian3.id, teacher_user_id=teacher.id, status='APPROVED', created_at=now - timedelta(days=6, hours=4), ip_address='192.168.1.109'),
                ]
                db.session.add_all(logs)
                db.session.commit()
                
                # Seed system notifications
                notifications = [
                    Notification(
                        user_id=parent.id,
                        type='QR_GENERATED',
                        recipient_email=parent.email,
                        subject='Pickup QR Code Generated for Leo',
                        body_content='<p>A secure QR code has been generated for child Leo Watson with John Watson as the authorized guardian.</p>',
                        status='SENT',
                        created_at=now - timedelta(hours=1),
                        sent_at=now - timedelta(hours=1)
                    ),
                    Notification(
                        user_id=parent.id,
                        type='PICKUP_APPROVED',
                        recipient_email=parent.email,
                        subject='Child Dismissal Approved: Leo Watson',
                        body_content='<p>Your child Leo Watson was safely dismissed from Kindergarten-A to guardian John Watson.</p>',
                        status='SENT',
                        created_at=now - timedelta(minutes=30),
                        sent_at=now - timedelta(minutes=29)
                    ),
                    Notification(
                        user_id=admin.id,
                        type='SECURITY_ALERT',
                        recipient_email=admin.email,
                        subject='Gate Alert: High Priority Verification Failure',
                        body_content='<p>Warning: 3 consecutive failed attempts at dismissal gate for student Leo Watson.</p>',
                        status='SENT',
                        created_at=now - timedelta(hours=2),
                        sent_at=now - timedelta(hours=2)
                    ),
                    Notification(
                        user_id=parent2.id,
                        type='QR_GENERATED',
                        recipient_email=parent2.email,
                        subject='Pickup QR Code Generated for Lucas',
                        body_content='<p>A secure QR code has been generated for child Lucas Doe with Sarah Doe as the authorized guardian.</p>',
                        status='SENT',
                        created_at=now - timedelta(hours=3),
                        sent_at=now - timedelta(hours=3)
                    ),
                    Notification(
                        user_id=admin.id,
                        type='SECURITY_ALERT',
                        recipient_email=admin.email,
                        subject='Gate Alert: Expired Token Scanned',
                        body_content='<p>Warning: An expired pickup QR token was scanned for student Sophia Smith at gate 1.</p>',
                        status='SENT',
                        created_at=now - timedelta(days=2, hours=4),
                        sent_at=now - timedelta(days=2, hours=4)
                    ),
                    Notification(
                        user_id=parent2.id,
                        type='QR_GENERATED',
                        recipient_email=parent2.email,
                        subject='Pickup QR Code Generation Failed',
                        body_content='<p>Error: QR code generation request failed due to validation limits.</p>',
                        status='FAILED',
                        created_at=now - timedelta(days=3)
                    )
                ]
                db.session.add_all(notifications)
                db.session.commit()
                db.session.add_all(logs)
                db.session.commit()
        except Exception as e:
            app.logger.warning(f"Auto-seeding skipped: {e}")
        
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
