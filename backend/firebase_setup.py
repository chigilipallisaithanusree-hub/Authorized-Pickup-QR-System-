import os
import logging
import firebase_admin
from firebase_admin import credentials, auth

logger = logging.getLogger(__name__)

# Global firebase app reference
firebase_app = None

def initialize_firebase():
    global firebase_app
    if firebase_app is not None:
        return firebase_app

    # Try to initialize from service account JSON
    service_account_path = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON')
    if not service_account_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path1 = os.path.join(base_dir, 'firebase-service-account.json')
        path2 = os.path.join(base_dir, 'serviceAccountKey.json')
        if os.path.exists(path1):
            service_account_path = path1
        elif os.path.exists(path2):
            service_account_path = path2
        else:
            service_account_path = path1  # Default fallback

    try:
        if service_account_path and os.path.exists(service_account_path):
            logger.info(f"Initializing Firebase Admin SDK from service account file: {service_account_path}")
            cred = credentials.Certificate(service_account_path)
            firebase_app = firebase_admin.initialize_app(cred)
        else:
            # Do not initialize default app to avoid blocking/timeouts on network calls if credentials aren't set
            logger.info("Service account JSON file not found. Firebase Admin SDK will run in offline/development fallback mode.")
            firebase_app = None
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        firebase_app = None
        
    return firebase_app

# Run initialization at module load
initialize_firebase()
