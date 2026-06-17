import urllib.request
import urllib.parse
import json
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:5000"

class DBWrapper:
    def __init__(self, conn, is_mysql=False):
        self.conn = conn
        self.is_mysql = is_mysql

    def cursor(self):
        return CursorWrapper(self.conn.cursor(), self.is_mysql)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

class CursorWrapper:
    def __init__(self, cursor, is_mysql=False):
        self.cursor = cursor
        self.is_mysql = is_mysql

    def execute(self, sql, params=None):
        if self.is_mysql:
            sql = sql.replace('?', '%s')
        if params is not None:
            return self.cursor.execute(sql, params)
        else:
            return self.cursor.execute(sql)

    def fetchone(self):
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def close(self):
        self.cursor.close()

def get_db_connection():
    use_sqlite = os.environ.get('USE_SQLITE', 'False').lower() == 'true'
    if use_sqlite:
        db_path = os.path.join(os.path.dirname(__file__), "instance", "authorized_pickup.db")
        if not os.path.exists(db_path):
            db_path = os.path.join(os.path.dirname(__file__), "authorized_pickup.db")
        conn = sqlite3.connect(db_path)
        return DBWrapper(conn, is_mysql=False)
    else:
        import pymysql
        db_user = os.environ.get('DB_USER', 'root')
        db_pass = os.environ.get('DB_PASSWORD', '')
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_port = int(os.environ.get('DB_PORT', '3306'))
        db_name = os.environ.get('DB_NAME', 'authorized_pickup')
        conn = pymysql.connect(host=db_host, user=db_user, password=db_pass, port=db_port, database=db_name)
        return DBWrapper(conn, is_mysql=True)

def make_request(url, method="GET", headers=None, payload=None):
    if headers is None:
        headers = {}
    
    req_url = f"{BASE_URL}{url}"
    data = None
    if payload:
        data = json.dumps(payload).encode('utf-8')
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(req_url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode('utf-8')
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            err_json = json.loads(body)
        except:
            err_json = {"raw_error": body}
        return e.code, err_json

def test_flow():
    print("=========================================")
    print("STARTING E2E API INTEGRATION TESTS")
    print("=========================================")
    
    # Pre-test cleanup to make tests idempotent
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Delete student_guardians links
        cursor.execute("DELETE FROM student_guardians WHERE student_id IN (SELECT id FROM students WHERE first_name LIKE 'Billy%')")
        # Delete pickup logs
        cursor.execute("DELETE FROM pickup_logs WHERE student_id IN (SELECT id FROM students WHERE first_name LIKE 'Billy%')")
        # Delete QR tokens
        cursor.execute("DELETE FROM qr_tokens WHERE student_id IN (SELECT id FROM students WHERE first_name LIKE 'Billy%')")
        # Delete students
        cursor.execute("DELETE FROM students WHERE first_name LIKE 'Billy%'")
        # Delete guardians
        cursor.execute("DELETE FROM guardians WHERE email = 'billy.uncle@family.com' OR email = 'billy.grandfather@family.com'")
        conn.commit()
        conn.close()
        print("Pre-test database cleanup: SUCCESS")
    except Exception as e:
        print(f"Pre-test database cleanup warning: {e}")
        
    # 1. AUTHENTICATION TEST (PHASE 5)
    print("\n--- Phase 5: Authentication Tests ---")
    
    # Parent Login
    status, res = make_request("/api/auth/login", "POST", payload={
        "email": "parent@family.com",
        "password": "Password123!",
        "role": "Parent"
    })
    assert status == 200, f"Parent login failed: {res}"
    parent_token = res["token"]
    print("Parent Login: SUCCESS (JWT obtained)")
    
    # Teacher Login
    status, res = make_request("/api/auth/login", "POST", payload={
        "email": "davis@school.edu",
        "password": "Password123!",
        "role": "Teacher"
    })
    assert status == 200, f"Teacher login failed: {res}"
    teacher_token = res["token"]
    teacher_user_id = res["user"]["id"]
    print("Teacher Login: SUCCESS (JWT obtained)")
    
    # Admin Login
    status, res = make_request("/api/auth/login", "POST", payload={
        "email": "saithanusreechigilipalli@gmail.com",
        "password": "Password123!",
        "role": "Admin"
    })
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    parent_headers = {"Authorization": f"Bearer {parent_token}"}
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    print("Admin Login: SUCCESS (JWT obtained)")
    
    # 2. CRUD OPERATIONS (PHASE 4)
    print("\n--- Phase 4: CRUD Data Entry Tests ---")
    
    # Add Student
    student_payload = {
        "firstName": "Billy",
        "lastName": "Kid",
        "gradeClass": "Grade 1-A",
        "parentEmail": "parent@family.com"
    }
    status, res = make_request("/api/students", "POST", admin_headers, student_payload)
    assert status == 201, f"Create student failed: {res}"
    student_id = res["studentId"]
    print(f"Student Created: SUCCESS (ID: {student_id})")
    
    # Verify in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT first_name, last_name, grade_class, is_deleted FROM students WHERE id = ?", (student_id,))
    db_student = cursor.fetchone()
    assert db_student == ("Billy", "Kid", "Grade 1-A", 0), f"Student not persisted correctly in DB: {db_student}"
    print("Verify Student in SQLite: SUCCESS (persisted correctly)")
    
    # Edit Student
    edit_payload = {
        "firstName": "Billy Updated",
        "lastName": "Kid Updated",
        "gradeClass": "Grade 1-B"
    }
    status, res = make_request(f"/api/students/{student_id}", "PUT", admin_headers, edit_payload)
    assert status == 200, f"Update student failed: {res}"
    print("Update Student: SUCCESS")
    
    # Verify update in DB
    cursor.execute("SELECT first_name, last_name, grade_class FROM students WHERE id = ?", (student_id,))
    db_student_updated = cursor.fetchone()
    assert db_student_updated == ("Billy Updated", "Kid Updated", "Grade 1-B"), f"Student not updated in DB: {db_student_updated}"
    print("Verify Student Update in SQLite: SUCCESS (persisted correctly)")
    
    # Add Guardian
    guardian_payload = {
        "studentId": student_id,
        "fullName": "Billy Uncle",
        "relationship": "Uncle",
        "phoneNumber": "+1-555-9999",
        "email": "billy.uncle@family.com"
    }
    status, res = make_request("/api/guardians", "POST", admin_headers, guardian_payload)
    assert status == 201, f"Create guardian failed: {res}"
    guardian_id = res["guardianId"]
    print(f"Guardian Created: SUCCESS (ID: {guardian_id})")
    
    # Verify in DB
    cursor.execute("SELECT full_name, relationship, phone_number, email FROM guardians WHERE id = ?", (guardian_id,))
    db_guardian = cursor.fetchone()
    assert db_guardian == ("Billy Uncle", "Uncle", "+1-555-9999", "billy.uncle@family.com"), f"Guardian not persisted: {db_guardian}"
    print("Verify Guardian in SQLite: SUCCESS (persisted correctly)")
    
    # Check mapping in student_guardians table
    cursor.execute("SELECT student_id, guardian_id FROM student_guardians WHERE student_id = ? AND guardian_id = ?", (student_id, guardian_id))
    mapping = cursor.fetchone()
    assert mapping == (student_id, guardian_id), f"Student-Guardian mapping not in DB: {mapping}"
    print("Verify Student-Guardian Mapping in SQLite: SUCCESS")
    
    # Edit Guardian
    edit_guardian_payload = {
        "fullName": "Billy Uncle Updated",
        "relationship": "Grandfather",
        "phoneNumber": "+1-555-8888",
        "email": "billy.grandfather@family.com"
    }
    status, res = make_request(f"/api/guardians/{guardian_id}", "PUT", admin_headers, edit_guardian_payload)
    assert status == 200, f"Update guardian failed: {res}"
    print("Update Guardian: SUCCESS")
    
    # Verify guardian update in DB
    cursor.execute("SELECT full_name, relationship, phone_number, email FROM guardians WHERE id = ?", (guardian_id,))
    db_guardian_updated = cursor.fetchone()
    assert db_guardian_updated == ("Billy Uncle Updated", "Grandfather", "+1-555-8888", "billy.grandfather@family.com"), f"Guardian not updated: {db_guardian_updated}"
    print("Verify Guardian Update in SQLite: SUCCESS (persisted correctly)")
    
    # 3. QR WORKFLOW TEST (PHASE 6)
    print("\n--- Phase 6: E2E QR Workflow Tests ---")
    
    # Parent Generates QR code
    qr_payload = {
        "studentId": student_id,
        "guardianId": guardian_id,
        "expiryHours": 2
    }
    status, res = make_request("/api/qr/generate", "POST", parent_headers, qr_payload)
    assert status == 200, f"QR generation failed: {res}"
    token_id = res["tokenId"]
    print(f"QR Generated: SUCCESS (Token ID: {token_id})")
    
    # Retrieve the token_hash directly from the database for testing
    cursor.execute("SELECT token_hash FROM qr_tokens WHERE id = ?", (token_id,))
    token_hash = cursor.fetchone()[0]
    print(f"Fetched Token Hash from DB: {token_hash[:20]}...")
    
    # Teacher Scans & Verifies QR code
    verify_payload = {"token": token_hash}
    status, res = make_request("/api/pickups/verify", "POST", teacher_headers, verify_payload)
    assert status == 200, f"QR verification failed: {res}"
    assert res["status"] == "APPROVED", f"QR scan was rejected: {res}"
    print("Teacher Scan QR: APPROVED")
    
    # Confirm Pickup (Teacher approves)
    confirm_payload = {
        "studentId": student_id,
        "guardianId": guardian_id,
        "status": "APPROVED",
        "token": token_hash
    }
    status, res = make_request("/api/pickups/confirm", "POST", teacher_headers, confirm_payload)
    assert status == 201, f"Pickup confirmation failed: {res}"
    log_id = res["logId"]
    print(f"Confirm Pickup: SUCCESS (Log ID: {log_id})")
    
    # Verify pickup log in DB
    cursor.execute("SELECT student_id, guardian_id, teacher_user_id, status FROM pickup_logs WHERE id = ?", (log_id,))
    db_log = cursor.fetchone()
    assert db_log == (student_id, guardian_id, teacher_user_id, "APPROVED"), f"Pickup log not created: {db_log}"
    print("Verify Pickup Log in SQLite: SUCCESS (persisted correctly)")
    
    # Verify token status is now 'Used'
    cursor.execute("SELECT status FROM qr_tokens WHERE id = ?", (token_id,))
    db_token_status = cursor.fetchone()[0]
    assert db_token_status == "Used", f"Token status not updated to 'Used': {db_token_status}"
    print("Verify Token Status 'Used' in SQLite: SUCCESS")
    
    # 4. REPORT TEST (PHASE 8)
    print("\n--- Phase 8: Report Export Tests ---")
    
    # PDF export test
    req_pdf = urllib.request.Request(f"{BASE_URL}/api/reports/export?format=pdf", headers=admin_headers)
    with urllib.request.urlopen(req_pdf) as resp_pdf:
        assert resp_pdf.status == 200, "PDF export failed"
        pdf_data = resp_pdf.read()
        assert pdf_data.startswith(b"%PDF"), "Exported data is not a PDF"
        print("PDF Export: SUCCESS (received PDF binary)")
        
    # CSV export test
    req_csv = urllib.request.Request(f"{BASE_URL}/api/reports/export?format=csv", headers=admin_headers)
    with urllib.request.urlopen(req_csv) as resp_csv:
        assert resp_csv.status == 200, "CSV export failed"
        csv_data = resp_csv.read().decode('utf-8')
        assert "Student Name" in csv_data, "Exported data does not contain CSV headers"
        print("CSV Export: SUCCESS (received CSV text)")
        
    # 5. CLEANUP / DELETION TEST
    print("\n--- Cleanup / Deletion Tests ---")
    
    # Unlink Guardian
    status, res = make_request(f"/api/guardians/{guardian_id}/unlink/{student_id}", "DELETE", admin_headers)
    assert status == 200, f"Unlink failed: {res}"
    print("Unlink Guardian: SUCCESS")
    
    cursor.execute("SELECT * FROM student_guardians WHERE student_id = ? AND guardian_id = ?", (student_id, guardian_id))
    assert cursor.fetchone() is None, "Mapping still exists in DB after unlinking"
    print("Verify Unlinked Mapping in SQLite: SUCCESS")
    
    # Delete Student (Soft Delete)
    status, res = make_request(f"/api/students/{student_id}", "DELETE", admin_headers)
    assert status == 200, f"Delete student failed: {res}"
    print("Delete Student: SUCCESS")
    
    cursor.execute("SELECT is_deleted FROM students WHERE id = ?", (student_id,))
    assert cursor.fetchone()[0] == 1, "Student not soft-deleted in DB"
    print("Verify Soft-Delete in SQLite: SUCCESS")
    
    conn.close()
    
    print("\n=========================================")
    print("ALL API INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=========================================")

if __name__ == "__main__":
    test_flow()
