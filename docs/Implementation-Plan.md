# Project Implementation Plan
## Project Name: FirstCry Intelliots Portal

This document outlines the detailed development phases, dependencies, deliverables, and acceptance criteria for constructing and deploying the FirstCry Intelliots Portal.

---

## Phase 1: Project Setup
Initialize code repositories, setup project tooling, and configure base environment files.
*   **Tasks:**
    *   Initialize frontend repository (React App).
    *   Initialize backend repository (Python Flask, install dependencies: `Flask`, `Flask-CORS`, `PyJWT`, `cryptography`, `Flask-SQLAlchemy`, `Flask-Migrate`, `qrcode`).
    *   Setup code linting (ESLint/Prettier for React, Flake8 for Python).
    *   Configure environmental configuration layouts (`.env.example` templates).
*   **Dependencies:** None.
*   **Deliverables:** Clean git repositories with boilerplates, initial dependency files (`package.json`, `requirements.txt`).
*   **Acceptance Criteria:** Frontend runs locally on port `3000` showing initial welcome text; backend spins up on port `5000` returning `{ "status": "ok" }` on root ping.

---

## Phase 2: Database Design
Build the relational schema in MySQL and define ORM models.
*   **Tasks:**
    *   Deploy local MySQL instance or setup managed service (e.g. Aiven/planetscale).
    *   Construct migration script files mapping out all 7 primary tables (`users`, `students`, `guardians`, `student_guardians`, `qr_tokens`, `pickup_logs`, `notifications`).
    *   Configure connection pool parameters inside SQLAlchemy configs.
    *   Write Python seed files containing standard roles and test accounts.
*   **Dependencies:** Phase 1.
*   **Deliverables:** Alembic migration folder, seed script (`seed.py`).
*   **Acceptance Criteria:** Running the migrations creates database tables with specified schemas, foreign keys, and indexes. Running `seed.py` successfully populates test accounts without integrity errors.

---

## Phase 3: Authentication & Authorization
Build registration, login, token distribution, and RBAC routers.
*   **Tasks:**
    *   Implement user registration and hash hashing routines (`bcrypt` on backend).
    *   Build POST `/api/auth/login` returning JWT access tokens.
    *   Write authorization middleware (`@token_required` and `@role_required` decorators).
    *   Build React login panel with a Segmented Role selector tab.
    *   Write React AuthContext + ProtectedRoute layouts preventing routing to panels without roles.
*   **Dependencies:** Phase 2.
*   **Deliverables:** Auth route controllers, protected client router configuration.
*   **Acceptance Criteria:** Users can authenticate via dashboard forms; protected pages restrict access, returning `403` or redirecting to `/login` if claims are missing.

---

## Phase 4: Student Management
Admin panel to perform CRUD operations on students.
*   **Tasks:**
    *   Write backend routes for CRUD operations: `GET`, `POST`, `PUT`, `DELETE` under `/api/students`.
    *   Implement client table displaying student lists with searchable inputs and class filters.
    *   Create Add/Edit Student modals inside the React dashboard view.
    *   Add soft-delete logic checking `is_deleted` column during retrievals.
*   **Dependencies:** Phase 3.
*   **Deliverables:** Student CRUD REST controllers, searchable React student registry page.
*   **Acceptance Criteria:** Admins can add new student profiles, search the directory by first/last names, edit details, and trigger soft deletions.

---

## Phase 5: Guardian Management
Authorize pickup contacts and bind them to children.
*   **Tasks:**
    *   Build route `POST /api/guardians` supporting relationship metadata binding.
    *   Create database association mappings in `student_guardians` bridge.
    *   Build Parent Portal cards rendering children and their linked guardians.
    *   Add client modal allowing parents to input guardian details (Name, relationship, contact data).
*   **Dependencies:** Phase 4.
*   **Deliverables:** Guardian mapping endpoints, Parent Portal guardian registration cards.
*   **Acceptance Criteria:** Parents can register dynamic pickup contacts, link them to specific children, and view active lists.

---

## Phase 6: QR Generation
Generate secure, time-bound, cryptographically signed QR code tokens.
*   **Tasks:**
    *   Build encryption utility encoding student ID, guardian ID, and expires timestamp using AES-256-GCM.
    *   Implement route `POST /api/qr/generate` creating database token entries.
    *   Integrate python `qrcode` library converting encrypted strings into Base64 PNGs.
    *   Add Parent Portal UI triggering generation modals and displaying QR codes with countdown clocks.
*   **Dependencies:** Phase 5.
*   **Deliverables:** Server-side encryption pipeline, base64 QR endpoint, generation modal with timer.
*   **Acceptance Criteria:** Parent clicking "Generate QR" receives a Base64 image representing the encrypted token, and an active database entry is logged under `qr_tokens`.

---

## Phase 7: QR Verification & Scanner
Camera-based scan decoder interface for teachers.
*   **Tasks:**
    *   Integrate react-qr-reader or custom canvas decoder mapping camera stream.
    *   Build endpoint `POST /api/pickups/verify` decrypting token string and applying rules:
        *   Expiry check.
        *   Used-status check.
        *   Relationship check.
    *   Design Green (Approved) and Red (Rejected) validation overlay views.
*   **Dependencies:** Phase 6.
*   **Deliverables:** Decryption validation module, teacher scanner interface, visual outcome overlays.
*   **Acceptance Criteria:** Teacher camera decodes a QR code, calls verification endpoint, and displays student/guardian information on a green background if approved, or a red message specifying the failure if rejected.

---

## Phase 8: Pickup Logs
Record dismissal transactions and teacher actions.
*   **Tasks:**
    *   Create endpoint `POST /api/pickups/confirm` saving scans to `pickup_logs`.
    *   Bind verification result logging (status approved or rejected, timestamp, IP address).
    *   Build simple recent activities component for teacher scans.
*   **Dependencies:** Phase 7.
*   **Deliverables:** Auditing persistence logic, Teacher recent history tables.
*   **Acceptance Criteria:** Submitting a scan records an immutable log entry containing exact transaction metadata (including client IP).

---

## Phase 9: Dashboard Analytics
Compile aggregate metrics for dashboards.
*   **Tasks:**
    *   Write optimized SQL aggregation queries (aggregating counts for total students, active guardians, today's pickups, expired/rejected scans).
    *   Build dashboard metric cards with positive/negative indicators.
    *   Implement auto-refresh timer loop (every 30 seconds) on the Admin dashboard view.
*   **Dependencies:** Phase 8.
*   **Deliverables:** Metrics compilation endpoints, aggregate visualization cards.
*   **Acceptance Criteria:** Opening the Admin dashboard pulls accurate, current totals matching database state.

---

## Phase 10: Reports & Data Exports
Compile compliance and logs history datasets to files.
*   **Tasks:**
    *   Implement Route `GET /api/reports/export` accepting date range query variables.
    *   Write PDF compiler using Python's `ReportLab` library (building formatted grid tables and headers).
    *   Write CSV streaming controller generating CSV outputs.
    *   Add Admin Portal reports section with download links.
*   **Dependencies:** Phase 9.
*   **Deliverables:** PDF generator helper, CSV streaming routes, download links inside Admin portal.
*   **Acceptance Criteria:** Clicking export downloads valid files formatting all logged dismissals matching date filter constraints.

---

## Phase 11: Notifications
Send automated emails confirming dismissals and security events.
*   **Tasks:**
    *   Configure SMTP mail client inside Flask configuration.
    *   Write modular HTML email templates (QR code details, success confirm, rejection warnings).
    *   Build asynchronous notifier queue inserting records to `notifications` and shipping emails on a background thread.
*   **Dependencies:** Phase 3 (Auth context email properties) & Phase 8.
*   **Deliverables:** SMTP configuration, email templates, background mail sender.
*   **Acceptance Criteria:** Performing a pickup triggers an immediate HTML email confirming pickup details sent to the parent's registered email address.

---

## Phase 12: Testing
Verify functionality across devices and ensure edge case safety.
*   **Tasks:**
    *   Write backend unit tests checking rule engine logic (expiration, double-scan block).
    *   Perform browser layout checks on simulated mobile viewports (320px width).
    *   Verify role blockages (NFR checks).
*   **Dependencies:** Phase 11.
*   **Deliverables:** Jest tests suite configuration, PyTest test runners.
*   **Acceptance Criteria:** Test runners show 100% success rates on business workflows.

---

## Phase 13: Deployment
Ship applications to cloud environments.
*   **Tasks:**
    *   Provision production MySQL instance.
    *   Configure Vercel project linking frontend repository; set API endpoint variables.
    *   Configure Render application deployment linking backend repository; bind system variables.
    *   Run production Alembic database migrations.
*   **Dependencies:** Phase 12.
*   **Deliverables:** Living web application running on production URLs.
*   **Acceptance Criteria:** Live application loads and functions end-to-end on Vercel/Render domains.
