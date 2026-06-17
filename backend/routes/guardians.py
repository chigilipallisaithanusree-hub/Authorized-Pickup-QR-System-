from flask import Blueprint, request, jsonify
from models import db, Guardian, Student, student_guardians
from middleware import token_required, role_required

guardians_bp = Blueprint('guardians', __name__)

@guardians_bp.route('', methods=['GET'])
@token_required
def get_guardians(current_user):
    search_query = request.args.get('search', '').strip()
    
    if current_user.role.lower() == 'parent':
        # Get guardians associated with the parent's active children
        students = Student.query.filter_by(parent_user_id=current_user.id, is_deleted=False).all()
        student_ids = [s.id for s in students]
        guardians = Guardian.query.join(Guardian.students).filter(
            Student.id.in_(student_ids)
        )
    else:
        # Admin or Teacher can see all guardians
        guardians = Guardian.query
        
    if search_query:
        guardians = guardians.filter(
            db.or_(
                Guardian.full_name.ilike(f"%{search_query}%"),
                Guardian.phone_number.ilike(f"%{search_query}%"),
                Guardian.email.ilike(f"%{search_query}%")
            )
        )
        
    guardian_list = guardians.order_by(Guardian.full_name.asc()).all()
    # Remove duplicate results from join query
    unique_guardians = list({g.id: g for g in guardian_list}.values())
    
    return jsonify({'guardians': [g.to_dict() for g in unique_guardians]}), 200

@guardians_bp.route('', methods=['POST'])
@token_required
@role_required(['Parent', 'Admin'])
def add_guardian(current_user):
    data = request.get_json()
    if not data or not data.get('studentId') or not data.get('fullName') or not data.get('relationship') or not data.get('phoneNumber') or not data.get('email'):
        return jsonify({'error': 'Missing required fields.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    student_id = data.get('studentId')
    full_name = data.get('fullName').strip()
    relationship = data.get('relationship').strip()
    phone_number = data.get('phoneNumber').strip()
    email = data.get('email').strip().lower()
    
    # Verify student exists and parent is authorized
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    if not student:
        return jsonify({'error': 'Student not found.', 'code': 'ERR_STUDENT_NOT_FOUND'}), 404
        
    if current_user.role.lower() == 'parent' and student.parent_user_id != current_user.id:
        return jsonify({'error': 'Access denied to this student profile.', 'code': 'ERR_UNAUTHORIZED_STUDENT'}), 403
        
    # Check if a guardian with same email/phone already exists to prevent duplication
    guardian = Guardian.query.filter(
        db.or_(
            Guardian.email == email,
            Guardian.phone_number == phone_number
        )
    ).first()
    
    if not guardian:
        guardian = Guardian(
            full_name=full_name,
            relationship=relationship,
            phone_number=phone_number,
            email=email
        )
        db.session.add(guardian)
        db.session.commit()
        
    # Associate guardian to student if not already mapped
    if guardian not in student.guardians:
        student.guardians.append(guardian)
        db.session.commit()
        
    return jsonify({'message': 'Guardian added and mapped successfully', 'guardianId': guardian.id}), 201

@guardians_bp.route('/<int:guardian_id>', methods=['PUT'])
@token_required
@role_required(['Parent', 'Admin'])
def update_guardian(current_user, guardian_id):
    guardian = Guardian.query.get(guardian_id)
    if not guardian:
        return jsonify({'error': 'Guardian not found.', 'code': 'ERR_GUARDIAN_NOT_FOUND'}), 404
        
    # Ensure parent is authorized to edit this guardian
    if current_user.role.lower() == 'parent':
        authorized = any(s.parent_user_id == current_user.id for s in guardian.students)
        if not authorized:
            return jsonify({'error': 'Unauthorized to modify this guardian.', 'code': 'ERR_UNAUTHORIZED_GUARDIAN'}), 403
            
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request.', 'code': 'ERR_INVALID_BODY'}), 400
        
    if 'fullName' in data:
        guardian.full_name = data['fullName'].strip()
    if 'relationship' in data:
        guardian.relationship = data['relationship'].strip()
    if 'phoneNumber' in data:
        guardian.phone_number = data['phoneNumber'].strip()
    if 'email' in data:
        guardian.email = data['email'].strip().lower()
        
    db.session.commit()
    return jsonify({'message': 'Guardian profile updated successfully'}), 200

@guardians_bp.route('/<int:guardian_id>/unlink/<int:student_id>', methods=['DELETE'])
@token_required
@role_required(['Parent', 'Admin'])
def unlink_guardian(current_user, guardian_id, student_id):
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    guardian = Guardian.query.get(guardian_id)
    
    if not student or not guardian:
        return jsonify({'error': 'Student or Guardian not found.', 'code': 'ERR_NOT_FOUND'}), 404
        
    if current_user.role.lower() == 'parent' and student.parent_user_id != current_user.id:
        return jsonify({'error': 'Access denied.', 'code': 'ERR_ACCESS_DENIED'}), 403
        
    if guardian in student.guardians:
        student.guardians.remove(guardian)
        db.session.commit()
        
    return jsonify({'message': 'Guardian access revoked successfully for this student.'}), 200
