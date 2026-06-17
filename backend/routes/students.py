from flask import Blueprint, request, jsonify
from models import db, Student, User
from middleware import token_required, role_required

students_bp = Blueprint('students', __name__)

@students_bp.route('', methods=['GET'])
@token_required
def get_students(current_user):
    search_query = request.args.get('search', '').strip()
    class_filter = request.args.get('class', '').strip()
    
    query = Student.query.filter_by(is_deleted=False)
    
    # Enforce access boundaries
    if current_user.role.lower() == 'parent':
        query = query.filter_by(parent_user_id=current_user.id)
        
    if class_filter:
        query = query.filter(Student.grade_class.ilike(f"%{class_filter}%"))
        
    if search_query:
        query = query.filter(
            db.or_(
                Student.first_name.ilike(f"%{search_query}%"),
                Student.last_name.ilike(f"%{search_query}%")
            )
        )
        
    students = query.order_by(Student.last_name.asc()).all()
    return jsonify({'students': [s.to_dict() for s in students]}), 200

@students_bp.route('/<int:student_id>', methods=['GET'])
@token_required
def get_student_by_id(current_user, student_id):
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    if not student:
        return jsonify({'error': 'Student not found.', 'code': 'ERR_STUDENT_NOT_FOUND'}), 404
        
    if current_user.role.lower() == 'parent' and student.parent_user_id != current_user.id:
        return jsonify({'error': 'Unauthorized access to student record.', 'code': 'ERR_UNAUTHORIZED_STUDENT'}), 403
        
    return jsonify({'student': student.to_dict()}), 200

@students_bp.route('', methods=['POST'])
@token_required
@role_required(['Admin'])
def add_student(current_user):
    data = request.get_json()
    if not data or not data.get('firstName') or not data.get('lastName') or not data.get('gradeClass') or not data.get('parentEmail'):
        return jsonify({'error': 'All fields are required.', 'code': 'ERR_MISSING_FIELDS'}), 400
        
    first_name = data.get('firstName').strip()
    last_name = data.get('lastName').strip()
    grade_class = data.get('gradeClass').strip()
    parent_email = data.get('parentEmail').strip().lower()
    
    # Validate parent exists, otherwise create automatically
    parent = User.query.filter(User.email == parent_email, User.role.in_(['parent', 'Parent'])).first()
    if not parent:
        existing_user = User.query.filter_by(email=parent_email).first()
        if existing_user:
            return jsonify({'error': f"An account with email {parent_email} already exists with role '{existing_user.role}'.", 'code': 'ERR_ROLE_COLLISION'}), 400
            
        parent = User(
            email=parent_email,
            firebase_uid=f"pending_{parent_email}",
            role='parent',
            full_name="Parent (Pending Registration)",
            is_active=False
        )
        db.session.add(parent)
        db.session.commit()
        
    # Prevent duplicate student in same class
    existing = Student.query.filter_by(
        first_name=first_name,
        last_name=last_name,
        grade_class=grade_class,
        is_deleted=False
    ).first()
    if existing:
        return jsonify({'error': 'A student with this name is already registered in this class.', 'code': 'ERR_DUPLICATE_STUDENT'}), 400
        
    student = Student(
        first_name=first_name,
        last_name=last_name,
        grade_class=grade_class,
        parent_user_id=parent.id
    )
    db.session.add(student)
    db.session.commit()
    
    return jsonify({'message': 'Student registered successfully', 'studentId': student.id}), 201

@students_bp.route('/<int:student_id>', methods=['PUT'])
@token_required
@role_required(['Admin'])
def update_student(current_user, student_id):
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    if not student:
        return jsonify({'error': 'Student not found.', 'code': 'ERR_STUDENT_NOT_FOUND'}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid request body.', 'code': 'ERR_INVALID_BODY'}), 400
        
    if 'firstName' in data:
        student.first_name = data['firstName'].strip()
    if 'lastName' in data:
        student.last_name = data['lastName'].strip()
    if 'gradeClass' in data:
        student.grade_class = data['gradeClass'].strip()
        
    db.session.commit()
    return jsonify({'message': 'Student profile updated successfully'}), 200

@students_bp.route('/<int:student_id>', methods=['DELETE'])
@token_required
@role_required(['Admin'])
def delete_student(current_user, student_id):
    student = Student.query.filter_by(id=student_id, is_deleted=False).first()
    if not student:
        return jsonify({'error': 'Student not found.', 'code': 'ERR_STUDENT_NOT_FOUND'}), 404
        
    # Soft delete to preserve log history integrity
    student.is_deleted = True
    db.session.commit()
    
    return jsonify({'message': 'Student record deleted successfully'}), 200
