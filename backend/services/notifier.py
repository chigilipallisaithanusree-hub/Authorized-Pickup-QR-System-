import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from models import db, Notification
from datetime import datetime
import threading
import logging

logger = logging.getLogger(__name__)

def send_email_async(app_context, notification_id):
    """
    Sends email in a background thread to prevent blocking main thread
    """
    with app_context:
        notification = Notification.query.get(notification_id)
        if not notification:
            return
            
        smtp_server = current_app.config.get('SMTP_SERVER')
        smtp_port = current_app.config.get('SMTP_PORT')
        smtp_user = current_app.config.get('SMTP_USERNAME')
        smtp_pass = current_app.config.get('SMTP_PASSWORD')
        sender = current_app.config.get('SMTP_SENDER')
        
        # If no credentials configured, simulate delivery for development ease
        if not smtp_user or not smtp_pass:
            logger.info(f"[SIMULATED MAIL DELIVERY] To: {notification.recipient_email} | Subject: {notification.subject}")
            notification.status = 'SENT'
            notification.sent_at = datetime.utcnow()
            db.session.commit()
            return
            
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = notification.subject
            msg['From'] = sender
            msg['To'] = notification.recipient_email
            
            part = MIMEText(notification.body_content, 'html')
            msg.attach(part)
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender, notification.recipient_email, msg.as_string())
                
            notification.status = 'SENT'
            notification.sent_at = datetime.utcnow()
            db.session.commit()
            logger.info(f"Notification {notification_id} sent successfully to {notification.recipient_email}")
        except Exception as e:
            logger.error(f"Failed to deliver notification {notification_id}: {e}")
            notification.status = 'FAILED'
            db.session.commit()

class Notifier:
    @staticmethod
    def queue_notification(user_id, type_, recipient_email, subject, body_content):
        """
        Saves notification log to DB and launches async sender thread
        """
        try:
            notification = Notification(
                user_id=user_id,
                type=type_,
                recipient_email=recipient_email,
                subject=subject,
                body_content=body_content,
                status='PENDING'
            )
            db.session.add(notification)
            db.session.commit()
            
            # Spin up async thread to send SMTP mail
            app_context = current_app._get_current_object().app_context()
            threading.Thread(
                target=send_email_async,
                args=(app_context, notification.id),
                daemon=True
            ).start()
            
            return notification
        except Exception as e:
            logger.error(f"Error queueing notification: {e}")
            return None
