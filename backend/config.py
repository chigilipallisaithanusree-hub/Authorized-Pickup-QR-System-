import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-auth-key-change-in-prod')
    
    # Database Configuration
    # Fallback to local sqlite database in the backend directory for easy local execution
    db_user = os.environ.get('DB_USER', 'root')
    db_pass = os.environ.get('DB_PASSWORD', '')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '3306')
    db_name = os.environ.get('DB_NAME', 'authorized_pickup')
    
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"mysql+pymysql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"
    )
    
    # Safety fallback to SQLite for testing or if MySQL is not available
    if SQLALCHEMY_DATABASE_URI.startswith('sqlite') or os.environ.get('USE_SQLITE', 'False').lower() == 'true':
        SQLALCHEMY_DATABASE_URI = "sqlite:///authorized_pickup.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Dynamic QR Security Key (must be 32 bytes URL-safe base64 string for AES-256)
    # Default provided is base64 for 32 zero bytes
    AES_KEY = os.environ.get('AES_KEY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=')

    # SMTP Mail Server Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_SENDER = os.environ.get('SMTP_SENDER', 'safety@school.edu')
