import os
import sys
from datetime import datetime, timedelta
import bcrypt

# Ensure we import backend modules correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, User, Student, Guardian, QrToken, PickupLog, Notification

def seed_database():
    app = create_app()
    with app.app_context():
        # Clear existing data to ensure exact seed counts
        print("Clearing existing database tables...")
        db.session.query(Notification).delete()
        db.session.query(PickupLog).delete()
        db.session.query(QrToken).delete()
        # Clear student-guardian mappings
        for student in Student.query.all():
            student.guardians = []
        db.session.commit()
        db.session.query(Student).delete()
        db.session.query(Guardian).delete()
        db.session.query(User).delete()
        db.session.commit()

        print("Seeding new mock records...")
        
        # 1. Seed Users (2 Admins, 2 Teachers, 3 Parents)
        # Admin (2)
        admin = User(email='saithanusreechigilipalli@gmail.com', firebase_uid='uid_admin_sarah', role='admin', full_name='Sai Thanusree Chigilipalli')
        admin2 = User(email='chigilipallisaithanusree@gmail.com', firebase_uid='uid_admin_sarah2', role='admin', full_name='Sai Thanusree Chigilipalli')
        
        # Teachers (2)
        teacher1 = User(email='davis@school.edu', firebase_uid='uid_teacher_davis', role='teacher', full_name='Mr. Robert Davis')
        teacher2 = User(email='clark@school.edu', firebase_uid='uid_teacher_clark', role='teacher', full_name='Mrs. Helen Clark')
        
        # Parents (3)
        parent1 = User(email='parent@family.com', firebase_uid='uid_parent_watson', role='parent', full_name='Mrs. Emily Watson')
        parent2 = User(email='john.doe@family.com', firebase_uid='uid_parent_doe', role='parent', full_name='Mr. John Doe')
        parent3 = User(email='jane.smith@family.com', firebase_uid='uid_parent_smith', role='parent', full_name='Mrs. Jane Smith')
        
        db.session.add_all([admin, admin2, teacher1, teacher2, parent1, parent2, parent3])
        db.session.commit()
        print(f"Seeded Users: {User.query.count()}")

        # 2. Seed Students (10)
        students = [
            # parent1 students (4)
            Student(first_name='Leo', last_name='Watson', grade_class='Kindergarten-A', parent_user_id=parent1.id),
            Student(first_name='Mia', last_name='Watson', grade_class='Grade 2-B', parent_user_id=parent1.id),
            Student(first_name='Toby', last_name='Watson', grade_class='Grade 1-A', parent_user_id=parent1.id),
            Student(first_name='Lily', last_name='Watson', grade_class='Kindergarten-A', parent_user_id=parent1.id),
            
            # parent2 students (3)
            Student(first_name='Lucas', last_name='Doe', grade_class='Grade 1-A', parent_user_id=parent2.id),
            Student(first_name='Grace', last_name='Doe', grade_class='Grade 3-B', parent_user_id=parent2.id),
            Student(first_name='Ethan', last_name='Doe', grade_class='Grade 2-A', parent_user_id=parent2.id),
            
            # parent3 students (3)
            Student(first_name='Sophia', last_name='Smith', grade_class='Kindergarten-B', parent_user_id=parent3.id),
            Student(first_name='Oliver', last_name='Smith', grade_class='Grade 3-C', parent_user_id=parent3.id),
            Student(first_name='Emma', last_name='Smith', grade_class='Grade 4-B', parent_user_id=parent3.id)
        ]
        db.session.add_all(students)
        db.session.commit()
        print(f"Seeded Students: {Student.query.count()}")

        # 3. Seed Guardians (10)
        guardians = [
            Guardian(full_name='John Watson', relationship='Uncle', phone_number='+1-555-0101', email='john.watson@gmail.com'),
            Guardian(full_name='Ruth Watson', relationship='Grandmother', phone_number='+1-555-0102', email='ruth.watson@gmail.com'),
            Guardian(full_name='Sarah Doe', relationship='Aunt', phone_number='+1-555-0201', email='sarah.doe@gmail.com'),
            Guardian(full_name='Arthur Doe', relationship='Grandfather', phone_number='+1-555-0202', email='arthur.doe@gmail.com'),
            Guardian(full_name='David Miller', relationship='Grandfather', phone_number='+1-555-0301', email='david.miller@gmail.com'),
            Guardian(full_name='Emma Davis', relationship='Nanny', phone_number='+1-555-0302', email='emma.davis@gmail.com'),
            Guardian(full_name='Frank Smith', relationship='Uncle', phone_number='+1-555-0401', email='frank.smith@gmail.com'),
            Guardian(full_name='Alice Smith', relationship='Aunt', phone_number='+1-555-0402', email='alice.smith@gmail.com'),
            Guardian(full_name='Thomas Johnson', relationship='Stepfather', phone_number='+1-555-0501', email='thomas.johnson@gmail.com'),
            Guardian(full_name='Megan Watson', relationship='Cousin', phone_number='+1-555-0103', email='megan.watson@gmail.com')
        ]
        db.session.add_all(guardians)
        db.session.commit()
        print(f"Seeded Guardians: {Guardian.query.count()}")

        # Associate students and guardians
        students[0].guardians.extend([guardians[0], guardians[1]]) # Leo Watson
        students[1].guardians.extend([guardians[0], guardians[9]]) # Mia Watson
        students[2].guardians.append(guardians[1]) # Toby Watson
        students[3].guardians.append(guardians[1]) # Lily Watson
        students[4].guardians.extend([guardians[2], guardians[3]]) # Lucas Doe
        students[5].guardians.append(guardians[3]) # Grace Doe
        students[6].guardians.append(guardians[3]) # Ethan Doe
        students[7].guardians.extend([guardians[4], guardians[5]]) # Sophia Smith
        students[8].guardians.extend([guardians[5], guardians[6]]) # Oliver Smith
        students[9].guardians.extend([guardians[7], guardians[8]]) # Emma Smith
        db.session.commit()
        print("Mapped Student-Guardian relationships.")

        # 4. Seed QR Tokens (10)
        now = datetime.utcnow()
        qr_tokens = [
            QrToken(token_hash='token-hash-active-1', student_id=students[0].id, guardian_id=guardians[0].id, expires_at=now + timedelta(hours=2), status='Active'),
            QrToken(token_hash='token-hash-active-2', student_id=students[4].id, guardian_id=guardians[2].id, expires_at=now + timedelta(hours=4), status='Active'),
            QrToken(token_hash='token-hash-active-3', student_id=students[7].id, guardian_id=guardians[4].id, expires_at=now + timedelta(hours=3), status='Active'),
            QrToken(token_hash='token-hash-expired-1', student_id=students[1].id, guardian_id=guardians[0].id, expires_at=now - timedelta(hours=1), status='Expired', created_at=now - timedelta(hours=3)),
            QrToken(token_hash='token-hash-expired-2', student_id=students[5].id, guardian_id=guardians[3].id, expires_at=now - timedelta(hours=2), status='Expired', created_at=now - timedelta(hours=4)),
            QrToken(token_hash='token-hash-used-1', student_id=students[0].id, guardian_id=guardians[1].id, expires_at=now - timedelta(days=1, hours=2), status='Used', created_at=now - timedelta(days=1, hours=4), used_at=now - timedelta(days=1, hours=3)),
            QrToken(token_hash='token-hash-used-2', student_id=students[4].id, guardian_id=guardians[3].id, expires_at=now - timedelta(days=2, hours=1), status='Used', created_at=now - timedelta(days=2, hours=3), used_at=now - timedelta(days=2, hours=2)),
            QrToken(token_hash='token-hash-used-3', student_id=students[7].id, guardian_id=guardians[5].id, expires_at=now - timedelta(days=3, hours=5), status='Used', created_at=now - timedelta(days=3, hours=7), used_at=now - timedelta(days=3, hours=6)),
            QrToken(token_hash='token-hash-used-4', student_id=students[8].id, guardian_id=guardians[6].id, expires_at=now - timedelta(days=4, hours=2), status='Used', created_at=now - timedelta(days=4, hours=4), used_at=now - timedelta(days=4, hours=3)),
            QrToken(token_hash='token-hash-used-5', student_id=students[9].id, guardian_id=guardians[8].id, expires_at=now - timedelta(days=5, hours=3), status='Used', created_at=now - timedelta(days=5, hours=5), used_at=now - timedelta(days=5, hours=4)),
        ]
        db.session.add_all(qr_tokens)
        db.session.commit()
        print(f"Seeded QR Tokens: {QrToken.query.count()}")

        # 5. Seed Pickup Logs (20)
        logs = [
            # Today (5 approved, 1 rejected)
            PickupLog(student_id=students[0].id, guardian_id=guardians[0].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(minutes=10), ip_address='192.168.1.10'),
            PickupLog(student_id=students[1].id, guardian_id=guardians[0].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(minutes=45), ip_address='192.168.1.10'),
            PickupLog(student_id=students[4].id, guardian_id=guardians[2].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(hours=1), ip_address='192.168.1.11'),
            PickupLog(student_id=students[7].id, guardian_id=guardians[4].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(hours=2), ip_address='192.168.1.11'),
            PickupLog(student_id=students[8].id, guardian_id=guardians[5].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(hours=3), ip_address='192.168.1.10'),
            PickupLog(student_id=students[2].id, guardian_id=guardians[1].id, teacher_user_id=teacher1.id, status='REJECTED', rejection_reason='Token Expired', created_at=now - timedelta(hours=4), ip_address='192.168.1.10'),
            
            # Yesterday (4 approved)
            PickupLog(student_id=students[0].id, guardian_id=guardians[1].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=1, hours=1), ip_address='192.168.1.10'),
            PickupLog(student_id=students[3].id, guardian_id=guardians[1].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=1, hours=2), ip_address='192.168.1.12'),
            PickupLog(student_id=students[5].id, guardian_id=guardians[3].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=1, hours=3), ip_address='192.168.1.12'),
            PickupLog(student_id=students[9].id, guardian_id=guardians[7].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=1, hours=4), ip_address='192.168.1.10'),
            
            # 2 days ago (3 approved, 1 rejected)
            PickupLog(student_id=students[4].id, guardian_id=guardians[3].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=2, hours=2), ip_address='192.168.1.11'),
            PickupLog(student_id=students[6].id, guardian_id=guardians[3].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=2, hours=3), ip_address='192.168.1.11'),
            PickupLog(student_id=students[7].id, guardian_id=guardians[5].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=2, hours=4), ip_address='192.168.1.10'),
            PickupLog(student_id=students[0].id, guardian_id=guardians[0].id, teacher_user_id=teacher1.id, status='REJECTED', rejection_reason='Unauthorized Guardian', created_at=now - timedelta(days=2, hours=5), ip_address='192.168.1.14'),
            
            # 3 days ago (2 approved)
            PickupLog(student_id=students[8].id, guardian_id=guardians[6].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=3, hours=3), ip_address='192.168.1.10'),
            PickupLog(student_id=students[9].id, guardian_id=guardians[8].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=3, hours=4), ip_address='192.168.1.15'),
            
            # 4 days ago (2 approved, 1 rejected)
            PickupLog(student_id=students[1].id, guardian_id=guardians[9].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=4, hours=2), ip_address='192.168.1.10'),
            PickupLog(student_id=students[2].id, guardian_id=guardians[1].id, teacher_user_id=teacher2.id, status='APPROVED', created_at=now - timedelta(days=4, hours=3), ip_address='192.168.1.16'),
            PickupLog(student_id=students[3].id, guardian_id=guardians[0].id, teacher_user_id=teacher1.id, status='REJECTED', rejection_reason='QR Already Used', created_at=now - timedelta(days=4, hours=4), ip_address='192.168.1.10'),
            
            # 5 days ago (1 approved)
            PickupLog(student_id=students[4].id, guardian_id=guardians[2].id, teacher_user_id=teacher1.id, status='APPROVED', created_at=now - timedelta(days=5, hours=5), ip_address='192.168.1.10'),
        ]
        db.session.add_all(logs)
        db.session.commit()
        print(f"Seeded Pickup Logs: {PickupLog.query.count()}")
        print("Database successfully seeded with complete demo dataset!")

if __name__ == '__main__':
    seed_database()
