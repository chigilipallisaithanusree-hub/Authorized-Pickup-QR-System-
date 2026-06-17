from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Association Table for student-guardian many-to-many relationship
student_guardians = db.Table('student_guardians',
    db.Column('student_id', db.Integer, db.ForeignKey('students.id', ondelete='CASCADE'), primary_key=True),
    db.Column('guardian_id', db.Integer, db.ForeignKey('guardians.id', ondelete='CASCADE'), primary_key=True),
    db.Column('associated_at', db.DateTime, default=datetime.utcnow)
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    firebase_uid = db.Column(db.String(255), nullable=False, unique=True)
    email = db.Column(db.String(191), nullable=False, unique=True)
    role = db.Column(db.Enum('parent', 'teacher', 'admin'), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    students = db.relationship('Student', backref='parent', lazy=True)
    pickup_logs = db.relationship('PickupLog', backref='teacher', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'firebaseUid': self.firebase_uid,
            'email': self.email,
            'role': self.role,
            'fullName': self.full_name,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'isActive': self.is_active
        }

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    grade_class = db.Column(db.String(30), nullable=False)
    parent_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Many-to-many relationship with Guardians
    guardians = db.relationship('Guardian', secondary=student_guardians, back_populates='students')
    qr_tokens = db.relationship('QrToken', backref='student', lazy=True)
    pickup_logs = db.relationship('PickupLog', backref='student', lazy=True)
    
    def to_dict(self, include_guardians=True):
        data = {
            'id': self.id,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'fullName': f"{self.first_name} {self.last_name}",
            'gradeClass': self.grade_class,
            'parentId': self.parent_user_id,
            'parentEmail': self.parent.email if self.parent else None,
            'isDeleted': self.is_deleted,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
        if include_guardians:
            data['guardians'] = [g.to_dict(include_students=False) for g in self.guardians]
        return data

class Guardian(db.Model):
    __tablename__ = 'guardians'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    full_name = db.Column(db.String(100), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(191), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    students = db.relationship('Student', secondary=student_guardians, back_populates='guardians')
    qr_tokens = db.relationship('QrToken', backref='guardian', lazy=True)
    pickup_logs = db.relationship('PickupLog', backref='guardian', lazy=True)
    
    def to_dict(self, include_students=True):
        data = {
            'id': self.id,
            'fullName': self.full_name,
            'relationship': self.relationship,
            'phoneNumber': self.phone_number,
            'email': self.email,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
        if include_students:
            data['students'] = [s.to_dict(include_guardians=False) for s in self.students]
        return data

class QrToken(db.Model):
    __tablename__ = 'qr_tokens'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    token_hash = db.Column(db.String(255), nullable=False, unique=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='RESTRICT'), nullable=False)
    guardian_id = db.Column(db.Integer, db.ForeignKey('guardians.id', ondelete='RESTRICT'), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Enum('Active', 'Used', 'Expired'), default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    used_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tokenHash': self.token_hash,
            'studentId': self.student_id,
            'guardianId': self.guardian_id,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'usedAt': self.used_at.isoformat() if self.used_at else None
        }

class PickupLog(db.Model):
    __tablename__ = 'pickup_logs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id', ondelete='RESTRICT'), nullable=False)
    guardian_id = db.Column(db.Integer, db.ForeignKey('guardians.id', ondelete='RESTRICT'), nullable=False)
    teacher_user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False)
    status = db.Column(db.Enum('APPROVED', 'REJECTED'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    rejection_reason = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(45), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'studentId': self.student_id,
            'studentName': f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown",
            'guardianId': self.guardian_id,
            'guardianName': self.guardian.full_name if self.guardian else "Unknown",
            'teacherId': self.teacher_user_id,
            'teacherName': self.teacher.full_name if self.teacher else "Unknown",
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'rejectionReason': self.rejection_reason,
            'ipAddress': self.ip_address
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    recipient_email = db.Column(db.String(191), nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    body_content = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('PENDING', 'SENT', 'FAILED'), default='PENDING')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sent_at = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'type': self.type,
            'recipientEmail': self.recipient_email,
            'subject': self.subject,
            'bodyContent': self.body_content,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'sentAt': self.sent_at.isoformat() if self.sent_at else None
        }
