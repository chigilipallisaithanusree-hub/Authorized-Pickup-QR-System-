from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from models import db, Student, Guardian, QrToken, PickupLog
from firebase_config import require_firebase_auth

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/metrics', methods=['GET'])
@require_firebase_auth
def get_metrics(current_user):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    if current_user.role.lower() in ['admin', 'teacher']:
        total_students = Student.query.filter_by(is_deleted=False).count()
        total_guardians = Guardian.query.count()
        active_qr_codes = QrToken.query.filter_by(status='Active').filter(QrToken.expires_at > datetime.utcnow()).count()
        today_pickups = PickupLog.query.filter(PickupLog.status == 'APPROVED', PickupLog.created_at >= today_start).count()
        rejected_pickups = PickupLog.query.filter(PickupLog.status == 'REJECTED', PickupLog.created_at >= today_start).count()
        expired_qr_codes = QrToken.query.filter_by(status='Expired').count()
        
        # Pull recent activity logs (last 10 transactions)
        recent_logs = PickupLog.query.order_by(PickupLog.created_at.desc()).limit(10).all()
        recent_activity = [log.to_dict() for log in recent_logs]
        
        # Data for Recharts charts
        # 1. Pickup Trends (Approved vs Rejected last 7 days)
        trends = []
        for i in range(6, -1, -1):
            day = datetime.utcnow().date() - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time())
            day_end = datetime.combine(day, datetime.max.time())
            
            approved = PickupLog.query.filter(PickupLog.status == 'APPROVED', PickupLog.created_at.between(day_start, day_end)).count()
            rejected = PickupLog.query.filter(PickupLog.status == 'REJECTED', PickupLog.created_at.between(day_start, day_end)).count()
            
            trends.append({
                'date': day.strftime('%a'),
                'approved': approved,
                'rejected': rejected
            })
            
        # 2. QR Status Distribution
        active = QrToken.query.filter(QrToken.status == 'Active', QrToken.expires_at > datetime.utcnow()).count()
        used = QrToken.query.filter_by(status='Used').count()
        expired = QrToken.query.filter_by(status='Expired').count()
        
        qr_distribution = [
            {'name': 'Active', 'value': active},
            {'name': 'Used', 'value': used},
            {'name': 'Expired', 'value': expired}
        ]
        
        return jsonify({
            'totalStudents': total_students,
            'totalGuardians': total_guardians,
            'activeQrCodes': active_qr_codes,
            'todayPickups': today_pickups,
            'rejectedPickups': rejected_pickups,
            'expiredQrCodes': expired_qr_codes,
            'recentActivity': recent_activity,
            'charts': {
                'pickupTrends': trends,
                'qrDistribution': qr_distribution
            }
        }), 200
        
    elif current_user.role.lower() == 'parent':
        # Parent specific metrics
        students = Student.query.filter_by(parent_user_id=current_user.id, is_deleted=False).all()
        student_ids = [s.id for s in students]
        
        total_students = len(students)
        
        total_guardians = Guardian.query.join(Guardian.students).filter(
            Student.id.in_(student_ids) if student_ids else False
        ).count()
        
        active_qr_codes = QrToken.query.filter(
            QrToken.student_id.in_(student_ids) if student_ids else False,
            QrToken.status == 'Active',
            QrToken.expires_at > datetime.utcnow()
        ).count()
        
        total_pickups = PickupLog.query.filter(
            PickupLog.student_id.in_(student_ids) if student_ids else False,
            PickupLog.status == 'APPROVED'
        ).count()
        
        # Recent logs for parent's children
        recent_logs = PickupLog.query.filter(
            PickupLog.student_id.in_(student_ids) if student_ids else False
        ).order_by(PickupLog.created_at.desc()).limit(5).all()
        
        recent_activity = [log.to_dict() for log in recent_logs]
        
        return jsonify({
            'totalStudents': total_students,
            'totalGuardians': total_guardians,
            'activeQrCodes': active_qr_codes,
            'totalPickups': total_pickups,
            'recentActivity': recent_activity
        }), 200
