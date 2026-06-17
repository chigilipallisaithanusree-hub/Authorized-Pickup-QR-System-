from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from models import db, Student, Guardian, QrToken, PickupLog, User
from middleware import token_required, role_required
from services.rule_engine import RuleEngine
from services.notifier import Notifier

pickups_bp = Blueprint('pickups', __name__)

@pickups_bp.route('/verify', methods=['POST'])
@token_required
@role_required(['Teacher'])
def verify_pickup(current_user):
    data = request.get_json()
    if not data or not data.get('token'):
        return jsonify({'error': 'Token is required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    token_string = data.get('token')
    client_ip = request.remote_addr or '127.0.0.1'
    aes_key = current_app.config['AES_KEY']
    
    # Run evaluation checks in the rule engine
    status, reason, payload = RuleEngine.evaluate_pickup(
        token_string=token_string,
        aes_key_b64=aes_key,
        client_ip=client_ip
    )
    
    # Log failed scans in database immediately to prevent brute-force
    if status == 'REJECTED':
        student_id = payload.get('student_id') if payload else None
        guardian_id = payload.get('guardian_id') if payload else None
        
        # Build log record
        log = PickupLog(
            student_id=student_id if student_id else 1, # fallback default to prevent null constraint in schema
            guardian_id=guardian_id if guardian_id else 1,
            teacher_user_id=current_user.id,
            status='REJECTED',
            rejection_reason=reason,
            ip_address=client_ip
        )
        db.session.add(log)
        db.session.commit()
        
        # Check for multiple failed attempts (Rule 5: 3 failed attempts within 5 minutes)
        five_minutes_ago = datetime.utcnow() - timedelta(minutes=5)
        failed_count = PickupLog.query.filter(
            PickupLog.status == 'REJECTED',
            PickupLog.ip_address == client_ip,
            PickupLog.created_at >= five_minutes_ago
        ).count()
        
        if failed_count >= 3:
            # Trigger High Priority Alert to admin
            admin_users = User.query.filter_by(role='Admin').all()
            for admin in admin_users:
                email_body = f"""
                <h3>SECURITY ALERT: Multiple Failed Pickup Scans</h3>
                <p>The system detected {failed_count} rejected scan attempts within 5 minutes from IP: <b>{client_ip}</b>.</p>
                <p>Last Reason: <b>{reason}</b></p>
                <p>Scanner Teacher: <b>{current_user.full_name} ({current_user.email})</b></p>
                """
                Notifier.queue_notification(
                    user_id=admin.id,
                    type_='SECURITY_ALERT',
                    recipient_email=admin.email,
                    subject="HIGH PRIORITY: Multiple failed QR scans detected",
                    body_content=email_body
                )
        
        return jsonify({
            'status': 'REJECTED',
            'rejectionReason': reason,
            'code': 'ERR_VERIFICATION_FAILED'
        }), 200
        
    # If approved, load details for confirmation
    student_id = payload.get('student_id')
    guardian_id = payload.get('guardian_id')
    
    student = Student.query.get(student_id)
    guardian = Guardian.query.get(guardian_id)
    
    return jsonify({
        'status': 'APPROVED',
        'student': {
            'id': student.id,
            'fullName': f"{student.first_name} {student.last_name}",
            'gradeClass': student.grade_class
        },
        'guardian': {
            'id': guardian.id,
            'fullName': guardian.full_name,
            'relationship': guardian.relationship,
            'phoneNumber': guardian.phone_number
        }
    }), 200

@pickups_bp.route('/confirm', methods=['POST'])
@token_required
@role_required(['Teacher'])
def confirm_pickup(current_user):
    data = request.get_json()
    if not data or not data.get('studentId') or not data.get('guardianId') or not data.get('status') or not data.get('token'):
        return jsonify({'error': 'Missing confirm payload.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    student_id = data.get('studentId')
    guardian_id = data.get('guardianId')
    status = data.get('status')
    token_string = data.get('token')
    rejection_reason = data.get('rejectionReason')
    client_ip = request.remote_addr or '127.0.0.1'
    
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    guardian = Guardian.query.get(guardian_id)
    
    if not student or not guardian:
        return jsonify({'error': 'Student or Guardian not found.', 'code': 'ERR_NOT_FOUND'}), 404
        
    # Update token status to 'Used'
    token_record = QrToken.query.filter_by(token_hash=token_string).first()
    if token_record:
        token_record.status = 'Used'
        token_record.used_at = datetime.utcnow()
        
    # Write to pickup logs
    log = PickupLog(
        student_id=student.id,
        guardian_id=guardian.id,
        teacher_user_id=current_user.id,
        status=status,
        rejection_reason=rejection_reason,
        ip_address=client_ip
    )
    db.session.add(log)
    db.session.commit()
    
    if status == 'APPROVED':
        # Send confirmation email to parent
        parent = student.parent
        email_body = f"""
        <h3>Child Picked Up Successfully</h3>
        <p>Your child <b>{student.first_name} {student.last_name}</b> was picked up successfully.</p>
        <p>Authorized Person: <b>{guardian.full_name} ({guardian.relationship})</b></p>
        <p>Released by: <b>{current_user.full_name}</b></p>
        <p>Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
        """
        Notifier.queue_notification(
            user_id=parent.id,
            type_='PICKUP_SUCCESS',
            recipient_email=parent.email,
            subject=f"Dismissal Confirmation for {student.first_name}",
            body_content=email_body
        )
        
    return jsonify({
        'message': 'Pickup transaction committed successfully',
        'logId': log.id
    }), 201

# Fetch logs verified by the logged-in teacher
@pickups_bp.route('/logs', methods=['GET'])
@token_required
@role_required(['Teacher', 'Admin'])
def get_pickup_logs(current_user):
    if current_user.role.lower() == 'teacher':
        logs = PickupLog.query.filter_by(teacher_user_id=current_user.id).order_by(PickupLog.created_at.desc()).all()
    else:
        logs = PickupLog.query.order_by(PickupLog.created_at.desc()).all()
        
    return jsonify({'logs': [log.to_dict() for log in logs]}), 200
