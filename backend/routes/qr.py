from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import qrcode
import io
import base64
from models import db, Student, Guardian, QrToken
from firebase_config import require_firebase_auth, require_role
from services.rule_engine import RuleEngine
from services.notifier import Notifier

qr_bp = Blueprint('qr', __name__)

@qr_bp.route('/generate', methods=['POST'])
@require_firebase_auth
@require_role(['Parent', 'Admin'])
def generate_qr(current_user):
    data = request.get_json()
    if not data or not data.get('studentId') or not data.get('guardianId'):
        return jsonify({'error': 'Student and Guardian are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    student_id = data.get('studentId')
    guardian_id = data.get('guardianId')
    expiry_hours = int(data.get('expiryHours', 2))
    
    # Expiration window bounds (between 1 and 24 hours)
    if expiry_hours < 1 or expiry_hours > 24:
        expiry_hours = 2
        
    # Validate associations
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    guardian = Guardian.query.get(guardian_id)
    
    if not student or not guardian:
        return jsonify({'error': 'Student or Guardian not found.', 'code': 'ERR_NOT_FOUND'}), 404
        
    # Access checks for parents
    if current_user.role.lower() == 'parent' and student.parent_user_id != current_user.id:
        return jsonify({'error': 'Access denied to this student profile.', 'code': 'ERR_ACCESS_DENIED'}), 403
        
    # Verify boundary association
    if guardian not in student.guardians:
        return jsonify({'error': 'This guardian is not authorized for this child.', 'code': 'ERR_UNAUTHORIZED_GUARDIAN'}), 400
        
    # Create expiration timestamp
    expires_at = datetime.utcnow() + timedelta(hours=expiry_hours)
    expires_at_iso = expires_at.isoformat() + "Z"
    
    # Generate cryptographic token string using RuleEngine AES-256-GCM
    aes_key = current_app.config['AES_KEY']
    try:
        token_string = RuleEngine.encrypt_payload(
            student_id=student.id,
            guardian_id=guardian.id,
            expires_at_iso=expires_at_iso,
            aes_key_b64=aes_key
        )
    except ValueError as e:
        return jsonify({'error': str(e), 'code': 'ERR_CRYPTO_FAIL'}), 500
        
    # Save token in database
    token_record = QrToken(
        token_hash=token_string,
        student_id=student.id,
        guardian_id=guardian.id,
        expires_at=expires_at,
        status='Active'
    )
    db.session.add(token_record)
    db.session.commit()
    
    # Generate QR Base64 PNG Image
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(token_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    qr_image_data_uri = f"data:image/png;base64,{qr_base64}"
    
    # Queue email notification to parent
    parent_user = student.parent
    email_body = f"""
    <h3>QR Generated successfully</h3>
    <p>A new secure pickup QR code has been generated for your child: <b>{student.first_name} {student.last_name}</b>.</p>
    <p>Authorized Pickup Person: <b>{guardian.full_name} ({guardian.relationship})</b></p>
    <p>Expires: {expires_at.strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
    """
    Notifier.queue_notification(
        user_id=parent_user.id,
        type_='QR_GENERATED',
        recipient_email=parent_user.email,
        subject=f"Pickup QR Code Generated for {student.first_name}",
        body_content=email_body
    )
    
    return jsonify({
        'tokenId': token_record.id,
        'qrImageBase64': qr_image_data_uri,
        'expiresAt': expires_at.isoformat() + "Z"
    }), 200
