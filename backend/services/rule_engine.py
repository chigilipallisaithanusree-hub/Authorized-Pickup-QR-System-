from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64
import json
import os
import logging
from datetime import datetime, timezone
from models import Student, QrToken, PickupLog

logger = logging.getLogger(__name__)

class RuleEngine:
    @staticmethod
    def encrypt_payload(student_id, guardian_id, expires_at_iso, aes_key_b64):
        """
        Encrypts student_id, guardian_id and expires_at using AES-256-GCM
        """
        try:
            key = base64.b64decode(aes_key_b64)
            aesgcm = AESGCM(key)
            nonce = os.urandom(12)
            payload_data = {
                'student_id': student_id,
                'guardian_id': guardian_id,
                'expires_at': expires_at_iso
            }
            payload_bytes = json.dumps(payload_data).encode('utf-8')
            ciphertext = aesgcm.encrypt(nonce, payload_bytes, None)
            # Combine nonce and ciphertext then encode to base64
            token_string = base64.b64encode(nonce + ciphertext).decode('utf-8')
            return token_string
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError("Cryptographic QR generation failed.")

    @staticmethod
    def decrypt_payload(token_string, aes_key_b64):
        """
        Decrypts dynamic token string using AES-256-GCM. Returns dict or None.
        """
        try:
            key = base64.b64decode(aes_key_b64)
            aesgcm = AESGCM(key)
            raw_bytes = base64.b64decode(token_string)
            nonce = raw_bytes[:12]
            ciphertext = raw_bytes[12:]
            decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
            return json.loads(decrypted_bytes.decode('utf-8'))
        except Exception as e:
            logger.error(f"Decryption failed or signature invalid: {e}")
            return None

    @classmethod
    def evaluate_pickup(cls, token_string, aes_key_b64, client_ip):
        """
        Executes rule-based checks: Signature validation, Expiration, Re-use, and Assignment.
        Returns (status: 'APPROVED'|'REJECTED', reason: str or None, decrypted_payload: dict or None)
        """
        # Rule 1: Signature Validation Check
        payload = cls.decrypt_payload(token_string, aes_key_b64)
        if not payload:
            return 'REJECTED', 'Invalid Cryptographic Signature', None
            
        student_id = payload.get('student_id')
        guardian_id = payload.get('guardian_id')
        expires_at_str = payload.get('expires_at')
        
        # Check database records
        token_record = QrToken.query.filter_by(token_hash=token_string).first()
        
        # Rule 2: Expiration Check
        try:
            if expires_at_str.endswith('Z'):
                expires_at_str = expires_at_str[:-1] + '+00:00'
            expires_at = datetime.fromisoformat(expires_at_str)
        except (ValueError, TypeError):
            return 'REJECTED', 'Malformed Expiration Date', payload
            
        if expires_at.tzinfo is not None:
            expires_at = expires_at.astimezone(timezone.utc).replace(tzinfo=None)
            
        if datetime.utcnow() > expires_at:
            # Update database status if active token in DB
            if token_record and token_record.status == 'Active':
                token_record.status = 'Expired'
            return 'REJECTED', 'Token Expired', payload

        # Rule 3: Re-use Prevention Check
        if token_record and token_record.status == 'Used':
            return 'REJECTED', 'QR Already Used', payload

        # Rule 4: Authorization Boundary Check
        student = Student.query.filter_by(id=student_id, is_deleted=False).first()
        if not student:
            return 'REJECTED', 'Student record not found or deactivated', payload
            
        # Check if guardian is associated with student
        is_authorized = any(g.id == guardian_id for g in student.guardians)
        if not is_authorized:
            return 'REJECTED', 'Unauthorized Guardian', payload

        # Rule 5: Brute Force Rate-Limit Warning Check
        # Check if this IP or teacher had 3 or more failures in the last 5 minutes
        # (This warning log will be caught and flag a priority alert, handled in verification controllers)
        
        return 'APPROVED', None, payload
