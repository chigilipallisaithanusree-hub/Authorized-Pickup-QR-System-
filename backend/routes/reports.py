from flask import Blueprint, request, make_response, jsonify
from datetime import datetime
import csv
import io
from models import PickupLog
from firebase_config import require_firebase_auth, require_role
from services.pdf_generator import PDFGenerator

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/export', methods=['GET'])
@require_firebase_auth
@require_role(['Admin'])
def export_reports(current_user):
    start_date_str = request.args.get('startDate', '').strip()
    end_date_str = request.args.get('endDate', '').strip()
    export_format = request.args.get('format', 'csv').strip().lower()
    
    query = PickupLog.query
    
    # Apply filters
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(PickupLog.created_at >= start_date)
        except ValueError:
            return jsonify({'error': 'Invalid startDate format. Must be YYYY-MM-DD.', 'code': 'ERR_INVALID_DATE'}), 400
            
    if end_date_str:
        try:
            # End of day filter
            end_date = datetime.strptime(end_date_str + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
            query = query.filter(PickupLog.created_at <= end_date)
        except ValueError:
            return jsonify({'error': 'Invalid endDate format. Must be YYYY-MM-DD.', 'code': 'ERR_INVALID_DATE'}), 400
            
    logs = query.order_by(PickupLog.created_at.desc()).all()
    logs_data = [log.to_dict() for log in logs]
    
    if export_format == 'pdf':
        try:
            pdf_bytes = PDFGenerator.generate_pickup_report(
                logs=logs_data,
                start_date_str=start_date_str,
                end_date_str=end_date_str
            )
            response = make_response(pdf_bytes)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename="pickup_report_{datetime.utcnow().date().isoformat()}.pdf"'
            return response
        except Exception as e:
            return jsonify({'error': f"Failed to generate PDF report: {str(e)}", 'code': 'ERR_PDF_FAIL'}), 500
            
    else:
        # Default CSV export
        si = io.StringIO()
        cw = csv.writer(si)
        # Write headers
        cw.writerow(['Log ID', 'Student ID', 'Student Name', 'Guardian Name', 'Guardian Relationship', 'Verified By (Teacher)', 'Status', 'Timestamp', 'Rejection Reason', 'IP Address'])
        
        for log in logs:
            cw.writerow([
                log.id,
                log.student_id,
                f"{log.student.first_name} {log.student.last_name}" if log.student else "Unknown",
                log.guardian.full_name if log.guardian else "Unknown",
                log.guardian.relationship if log.guardian else "Unknown",
                log.teacher.full_name if log.teacher else "Unknown",
                log.status,
                log.created_at.isoformat() if log.created_at else "",
                log.rejection_reason or "",
                log.ip_address
            ])
            
        response = make_response(si.getvalue())
        response.headers['Content-Type'] = 'text/csv'
        response.headers['Content-Disposition'] = f'attachment; filename="pickup_report_{datetime.utcnow().date().isoformat()}.csv"'
        return response
