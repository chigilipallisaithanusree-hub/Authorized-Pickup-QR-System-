# Product Requirements Document (PRD)
## Project Name: FirstCry Intelliots Portal

---

## 1. Vision
The **FirstCry Intelliots Portal** aims to become the definitive trust and security layer for child pickups in educational institutions. By replacing manual, error-prone visual checks with secure, dynamic, cryptographically verifiable QR codes, the system establishes a foolproof mechanism that guarantees children are only released to verified, authorized guardians.

## 2. Problem Statement
Schools, preschools, and daycare centers face a critical security challenge during daily dismissal hours. Currently, verification relies heavily on teacher memory, physical ID cards (which can be lost, stolen, or duplicated), or paper-based pickup authorization lists. This introduces several major vulnerabilities:
*   **Security Risks:** High risk of custodial disputes, unauthorized pickups, or child abductions.
*   **Operational Inefficiency:** Manual verification slows down dismissal, leading to long traffic queues and chaotic environments.
*   **Lack of Traceability:** In the event of a dispute, schools lack verifiable, tamper-proof logs showing who picked up which student, verified by which teacher, at what exact time.
*   **Stale Data:** Changes to authorized guardians (e.g., due to updated legal arrangements or temporary family emergencies) take too long to propagate to teachers on duty.

## 3. Objectives
*   **Zero Unauthorized Pickups:** Ensure that no child is released to an unverified guardian.
*   **Rapid Verification:** Enable teachers to scan and verify a guardian's authorization status in under 3 seconds.
*   **Comprehensive Audit Trail:** Log 100% of pickup events, including timestamp, student ID, guardian ID, scanning teacher ID, verification status, and location/notes.
*   **Dynamic Authorization Management:** Allow parents to instantly update authorized pickup guardians in real-time.
*   **Automatic High-Priority Alerts:** Immediately flag expired tokens, reuse attempts, unauthorized attempts, and repeated failures to school administrators.

## 4. Scope

### In Scope
*   **Multi-Role Access Control:** Custom portals for Parents, Teachers, and Administrators.
*   **Guardian Management:** Parent portal to add, edit, and bind authorized guardians to students.
*   **Dynamic QR Code Generation:** Secure generation of time-bound, single-use, cryptographically verified QR codes.
*   **Scanner Interface:** Web-based QR scanner interface optimized for teacher mobile devices.
*   **Verification Engine:** Real-time backend rule engine evaluating expiration, status, and assignment.
*   **Admin Dashboard:** Management of students/guardians, live activity tracking, and comprehensive reporting.
*   **Notification Engine:** Automated system emails for QR generation, pickup verification events, and security exceptions.

### Out of Scope
*   **Native Mobile Applications:** This release is purely a responsive Web App.
*   **Hardware Scanners:** Verification relies on mobile device cameras running the web app (no specialized physical scanners needed).
*   **School Bus Tracking:** Only covers on-campus parent/guardian pick-up lines.
*   **Direct SMS Gateway Integration:** All notifications will be delivered via Email in the initial release.

---

## 5. User Personas

### Persona A: Sarah (Parent)
*   **Profile:** Working mother of two children (ages 5 and 7) attending preschool.
*   **Needs:** A fast, reliable way to delegate pickup authority to her brother (the children's uncle) when she has to work late. She needs absolute peace of mind that her kids are safe and that she will be notified the instant they are picked up.
*   **Frustrations:** Forgetting to send written notes to school, worrying if the teacher read the email about the pickup change, and standing in long queues during dismissal.

### Persona B: Mr. Davis (Teacher)
*   **Profile:** Kindergarten teacher responsible for dismissing 22 students daily.
*   **Needs:** An easy-to-use mobile interface that rapidly scans codes, displays clear visual indicators (Approved/Rejected), shows student photos/names, and requires minimal typing or manual searching.
*   **Frustrations:** Managing chaotic pickup lines, attempting to identify unfamiliar guardians, and having to manually look up emergency cards.

### Persona C: Principal Martinez (Admin)
*   **Profile:** School principal overseeing safety policies and administrative records.
*   **Needs:** A high-level overview of daily pickup statistics, searchable logs for compliance, the ability to resolve disputed pickups immediately, and control over student/guardian registries.
*   **Frustrations:** Incomplete paperwork, lack of historical lookup during parental disputes, and lack of real-time visibility into dismissal progress.

---

## 6. User Stories

### Parent Stories (PA)
*   **PA-01:** As a Parent, I want to log in securely so that I can manage my children's pickup details.
*   **PA-02:** As a Parent, I want to add an authorized guardian (name, relationship, phone number, email) to a student profile, so they are legally permitted to pick up my child.
*   **PA-03:** As a Parent, I want to generate a secure QR code for a specific guardian and student, so that the guardian can present it at school.
*   **PA-04:** As a Parent, I want to view a history of all pickups for my child, including timestamps and who picked them up, so I can keep track of their dismissal.
*   **PA-05:** As a Parent, I want to revoke or delete a guardian's pickup authorization instantly, so they can no longer generate QR codes or pick up my child.

### Teacher Stories (TE)
*   **TE-01:** As a Teacher, I want to log in on my mobile device, so that I can access the scanning interface.
*   **TE-02:** As a Teacher, I want to scan a guardian's QR code using my device camera, so that I don't have to manually type verification tokens.
*   **TE-03:** As a Teacher, I want to see a clear visual validation screen (Green/Approved or Red/Rejected) showing the student's name, classroom, and the guardian's details.
*   **TE-04:** As a Teacher, I want to submit a pickup decision (approve or reject with a reason), so that the system logs the event and updates the parent.
*   **TE-05:** As a Teacher, I want to view a log of my scans for the current day, so that I can verify my dismissal progress.

### Admin Stories (AD)
*   **AD-01:** As an Admin, I want to add, edit, and delete students and assign them to classrooms, so that the school registry is accurate.
*   **AD-02:** As an Admin, I want to view a dashboard with key metrics (total students, active QR codes, today's pickups, failed/rejected pickups), so that I can monitor dismissal status in real-time.
*   **AD-03:** As an Admin, I want to search and filter pickup logs by student name, guardian, teacher, date range, or status, so that I can audit historical events.
*   **AD-04:** As an Admin, I want to export pickup logs to PDF or CSV files, so that I can share compliance reports with district boards.
*   **AD-05:** As an Admin, I want to receive immediate alerts for security exceptions (e.g., three failed scans in a row), so that I can intervene immediately.

---

## 7. Functional Requirements

### 7.1 Authentication & Profile Management
*   **FR-1.1:** The system shall support three roles: Parent, Teacher, and Admin.
*   **FR-1.2:** Users must authenticate using email and password, returning a JSON Web Token (JWT) stored in HTTP-only cookies or secure local storage.
*   **FR-1.3:** The system must restrict endpoint access using Role-Based Access Control (RBAC).

### 7.2 Student & Guardian Directory
*   **FR-2.1:** Parents can link multiple guardians to their children.
*   **FR-2.2:** Admins can perform CRUD operations on students, teachers, and guardians.
*   **FR-2.3:** Search queries must support partial matching on student first/last names and guardian contact details.

### 7.3 QR Code Generation & Expiration Engine
*   **FR-3.1:** Parents can select a child, select an authorized guardian, set an expiration window, and generate a dynamic QR code.
*   **FR-3.2:** QR codes must wrap a cryptographically signed token (containing student ID, guardian ID, generation time, and expiration time).
*   **FR-3.3:** QR tokens must be single-use. Once scanned and processed, the token status must transit to `Used` and refuse any subsequent scans.
*   **FR-3.4:** QR tokens must automatically expire after the configured duration (default: 2 hours).

### 7.4 QR Scanning & Validation Rule Engine
*   **FR-4.1:** The scanning interface must capture the token, decrypt it, and evaluate it against business rules.
*   **FR-4.2:** The validation page must display a clear visual result:
    *   **APPROVED:** Green screen showing student name, class, guardian name, relationship, and an "Approve Pickup" confirmation button.
    *   **REJECTED:** Red screen showing rejection reason (e.g., "Expired QR Code", "QR Already Used", "Unauthorized Guardian").
*   **FR-4.3:** Teachers must confirm the release of the child, which commits the record to `pickup_logs` with a status of `APPROVED` or `REJECTED`.

### 7.5 Audit Logging & Analytics Dashboard
*   **FR-5.1:** The database must record every verification attempt with client IP, timestamp, scan status, teacher ID, student ID, and guardian ID.
*   **FR-5.2:** The Admin Dashboard must load metrics dynamically: Total Students, Active Guardians, Today's Pickups, Expired QR Codes, Rejected Pickups, and Active QR Codes.
*   **FR-5.3:** Recent Activities panel must list the 10 most recent scans in real-time.

### 7.6 Reporting & Export
*   **FR-6.1:** The system must generate PDF reports containing a clean table of pickup history, school header, and summary statistics.
*   **FR-6.2:** The system must generate CSV files of raw pickup logs filtered by date range, student, or status.

### 7.7 Automated Email Notifications
*   **FR-7.1:** Email sent to parent immediately when a new QR code is generated for their child.
*   **FR-7.2:** Email sent to parent immediately when a teacher scans and approves a pickup, documenting the guardian name and time.
*   **FR-7.3:** Email alert sent to parent and admin if a verification check fails due to unauthorized guardian or expired QR code.

---

## 8. Non-Functional Requirements

### 8.1 Security & Compliance
*   **NFR-1.1:** Data in transit must be encrypted using TLS 1.3.
*   **NFR-1.2:** Passwords must be hashed using bcrypt with a work factor of at least 12.
*   **NFR-1.3:** JWTs must expire after 8 hours and use the HS256 algorithm with a strong, environment-configured secret key.
*   **NFR-1.4:** The application must protect against SQL injection (via parameterized queries or ORM) and XSS (via HTML escaping in React).

### 8.2 Performance
*   **NFR-2.1:** QR verification API responses must return in less than 500ms under standard network conditions.
*   **NFR-2.2:** Dashboard metrics query must execute in less than 200ms using optimized indexing.

### 8.3 Accessibility & Responsiveness
*   **NFR-3.1:** The teacher scanning UI must be fully mobile-responsive (optimized for viewports starting at 320px wide).
*   **NFR-3.2:** Contrast ratios for text elements must meet WCAG AA standards (minimum 4.5:1 ratio).

### 8.4 Maintainability
*   **NFR-4.1:** The system must separate concerns: React for presentation, Flask for business logic, and MySQL for persistence.
*   **NFR-4.2:** Detailed console logs must be generated for all critical transactions, using standardized logs containing correlation IDs.

---

## 9. Business Rules (Rule-Based Logic)

The system relies strictly on a rule-based logic framework. The rules are applied sequentially in the following order:

```
[Scan Received]
       │
       ▼
Rule 1: Is Token Formatted Correctly? ──No──► [REJECT: Invalid Signature]
       │ Yes
       ▼
Rule 2: Is Token Expired? ──────────────Yes─► [REJECT: Token Expired]
       │ No
       ▼
Rule 3: Is Token Already Used? ─────────Yes─► [REJECT: QR Already Used]
       │ No
       ▼
Rule 4: Is Guardian Authorized? ────────No──► [REJECT: Unauthorized Guardian]
       │ Yes
       ▼
Rule 5: Are there Multiple Failures? ───Yes─► [APPROVE + Log HIGH PRIORITY ALERT]
       │ No
       ▼
[APPROVE PICKUP]
```

*   **Rule 1 (Signature Validation):** If the decrypted token does not match the system's cryptographic signature, immediately reject. Log as "Invalid Signature" and increment the system-wide failed attempts count.
*   **Rule 2 (Expiration Check):** Compare current timestamp with `expires_at` embedded in the token. If `current_time > expires_at`, trigger `Expired QR Alert` email notification to parent and display "Expired QR Code" rejection.
*   **Rule 3 (Re-use Prevention):** Query `qr_tokens` table. If the token status is already marked as `Used`, reject with "QR Already Used". Trigger a security email notification to parent.
*   **Rule 4 (Authorization Boundary):** Validate that the `guardian_id` in the token is actively mapped to the `student_id` in the `student_guardians` mapping table. If no active relation exists, reject with "Unauthorized Guardian".
*   **Rule 5 (Rate Limiting/Brute Force):** If the same IP address or the same scanning account generates 3 or more failed scans within 5 minutes, mark the transaction, log it, and trigger an immediate "High Priority Alert" email to the administrator.

---

## 10. Success Metrics
*   **System Reliability:** 99.9% uptime for the API server and database.
*   **Safety Compliance:** 0% unauthorized children released.
*   **Parent Adoption:** Greater than 90% parent login rates within the first month of deployment.
*   **Teacher Efficiency:** Dismissal queue wait times reduced by 30% compared to legacy paper rosters.
*   **Audit Resolution Time:** Average time to audit a historical pickup inquiry reduced from hours to under 2 minutes.

---

## 11. Acceptance Criteria

### Authentication Acceptance Criteria
*   Given a user with correct credentials and role, when they post to `/api/auth/login`, they receive a valid JWT and a dashboard layout tailored to their role.
*   Given a user trying to access `/api/admin/students` without an Admin role, the system returns a `403 Forbidden` response.

### QR Code Acceptance Criteria
*   Given a parent generating a QR code, when they specify a student and guardian, the backend must save a record in `qr_tokens` with an expiration timestamp and return a valid Base64-encoded QR image.
*   Given an expired QR code scanned by a teacher, the screen must display a red warning indicating expiration, and the "Confirm Release" button must be disabled.

### Reporting Acceptance Criteria
*   Given an admin downloading a pickup report, when they click "Export PDF", the server must stream a formatted PDF with headers, date range filters applied, and accurate summary totals matching the database state.
