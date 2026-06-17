# Export decorators from firebase_admin for backward compatibility with existing route blueprints
from firebase_admin import require_firebase_auth as token_required, require_role as role_required
