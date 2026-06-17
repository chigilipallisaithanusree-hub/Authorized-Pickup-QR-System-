# App Flow Document
## Project Name: FirstCry Intelliots Portal

---

## 1. Authentication Flow
Every user journey begins with authentication. Users must log in via the unified login page where they select their role.

### Step-by-Step Flow
1.  **Access App:** The user loads the root URL `/`. If no valid token is found, they are redirected to `/login`.
2.  **Select Role:** The login form features a segmented role selector: `Parent`, `Teacher`, or `Admin`.
3.  **Enter Credentials:** The user inputs their email and password.
4.  **Backend Dispatch:** The frontend sends a `POST` request to `/api/auth/login`.
5.  **Validation Check:**
    *   **Failure:** The backend returns `401 Unauthorized` with an error message. The frontend catches this and displays a red Alert component containing the details.
    *   **Success:** The backend returns `200 OK` with a JSON payload containing the JWT token and the user's role profile.
6.  **Store Token:** The frontend writes the JWT token to secure LocalStorage and updates the global `AuthContext` state.
7.  **Redirect:** The application inspects the user role and routes them accordingly:
    *   `Parent` ──► `/parent/dashboard`
    *   `Teacher` ──► `/teacher/scanner`
    *   `Admin` ──► `/admin/dashboard`

---

## 2. Parent User Journey & QR Generation Flow
The primary workflow for a parent is registering an authorized guardian, binding them to a child, and generating a time-bound QR code.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Parent Dashboard Screen                     │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Click "Add Guardian"
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Add Guardian Modal Dialog                    │
│  - Fill form (Name, Relationship, Contact details)              │
│  - Click "Save Guardian" (Triggers API POST)                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Success Response
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Guardian Registered in System                  │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Click "Generate QR Code"
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Generate QR Configuration                    │
│  - Choose Student (dropdown selector)                           │
│  - Choose Guardian (dropdown selector)                          │
│  - Select Expiration (1 hour, 2 hours, 4 hours)                 │
│  - Click "Generate QR"                                          │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Backend Generates & Encrypts
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Display Secure QR Code                     │
│  - Renders QR Image containing encrypted token                  │
│  - Displays expiration timer countdown                         │
│  - Automatically triggers QR Generation Email to Parent         │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Workflow Step-by-Step:
1.  **Log In:** The parent logs in and lands on `/parent/dashboard`.
2.  **View Student Card:** The dashboard displays card elements for each of the parent's children, showing their name, grade, and active guardian list.
3.  **Add Guardian:**
    *   The parent clicks **"Add Guardian"**.
    *   A Modal appears with input fields for Name, Relationship (e.g., Uncle, Nanny, Grandmother), Phone Number, and Email.
    *   The parent fills the form and submits.
    *   The API validates fields and records the guardian. The parent dashboard updates via Toast Notification.
4.  **Initiate QR Code:**
    *   The parent clicks **"Generate QR"** on the child's dashboard card.
    *   A dropdown lists all registered guardians linked to the child.
    *   The parent selects a guardian and selects an expiration duration (e.g. 2 hours).
    *   The parent clicks **"Generate"**.
5.  **Receive and Share QR:**
    *   The backend encrypts the token, stores it in `qr_tokens` as `Active`, and returns a Base64 QR code image.
    *   The parent views the QR code on screen. They can capture a screenshot or click **"Share via Email"** to send the code directly to the guardian's device.
    *   An automated email is sent to the parent confirming that a QR code has been generated.

---

## 3. Teacher User Journey & QR Verification Flow
Teachers verify guardians on campus during dismissal using a mobile-optimized scanning interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Teacher Scanner Interface                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Align guardian QR inside frame
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Capture QR Token                          │
│  - Decoder reads encrypted token string                         │
│  - Triggers POST API call to /api/pickups/verify                │
└────────────────────────────────┬────────────────────────────────┘
                                 │ Backend Rule Engine Validation
                                 ▼
                    Check Token Status Results
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼ Valid                                         ▼ Invalid / Blocked
┌───────────────────────────────────┐           ┌───────────────────────────────────┐
│          APPROVED Screen          │           │          REJECTED Screen          │
│  - Green visual background        │           │  - Red visual background          │
│  - Shows Student photo placeholder│           │  - Shows rejection reason details │
│  - Shows Guardian details         │           │  - Action buttons disabled        │
│  - Click "Approve and Release"    │           │  - Logs exception record          │
└────────────────┬──────────────────┘           └───────────────────────────────────┘
                 │
                 ▼
┌───────────────────────────────────┐
│          Pickup Committed         │
│  - Token status transits to Used   │
│  - Parent receives Approval Email │
│  - Screen returns to Scan mode    │
└───────────────────────────────────┘
```

### Detailed Workflow Step-by-Step:
1.  **Log In:** The teacher logs in and is redirected to the `/teacher/scanner` interface.
2.  **Initiate Scanner:**
    *   The application requests camera permissions (HTML5 Canvas stream).
    *   An active scanner view screen is presented with a centering alignment frame.
3.  **Scan QR Code:**
    *   The guardian arrives and presents the QR code on their smartphone.
    *   The teacher holds their phone camera over the QR code.
    *   The app captures and extracts the raw token payload.
4.  **Backend Verification Loop:**
    *   The app invokes `POST /api/pickups/verify` transmitting the token.
    *   The backend decrypts the token, checks the cryptographic signature, and executes the business logic rules:
        *   Checks `expires_at` against the current time.
        *   Checks if the token has been marked as `Used`.
        *   Validates that the guardian relationship exists and is active.
5.  **Renders Verification Outcomes:**
    *   **Result A: APPROVED**
        *   Renders a bright Green container.
        *   Displays the Student's Name, Classroom/Grade, Guardian's Name, and Relationship.
        *   Displays two actions: **"Approve & Release"** and **"Cancel"**.
        *   The teacher clicks **"Approve & Release"**. The backend updates token status to `Used`, creates a success record in `pickup_logs`, and sends an email confirmation to the parent.
    *   **Result B: REJECTED**
        *   Renders a bright Red container.
        *   Displays the exact rejection code (e.g. `ERR_EXPIRED`, `ERR_ALREADY_USED`, `ERR_UNAUTHORIZED`).
        *   Displays a warning banner detailing the issue.
        *   The action button is disabled. The teacher clicks **"Back to Scan"** to reset the interface. The system logs the rejected pickup attempt.

---

## 4. Admin User Journey
Administrators monitor daily activity, manage rosters, and audit records.

1.  **Roster Management:**
    *   Admin navigates to `/admin/students`.
    *   Clicks **"Add Student"** to open a creation form.
    *   Inputs details, assigns a class, and binds the primary parent's user account.
    *   Clicks **"Save"**. Student details propagate to parent dashboards immediately.
2.  **Audit Logs & Reports:**
    *   Admin navigates to `/admin/reports`.
    *   Selects date range (e.g. "Today", "Last 7 Days", "Custom Range"), filters by student name or pickup status.
    *   Clicks **"Export PDF"** or **"Export CSV"**. The application streams the file compile response, downloading the document to the admin's device.
3.  **Security Dashboard Monitoring:**
    *   Admin monitors dashboard metric cards for any anomalies.
    *   The "Rejected Pickups" card highlights any validation failures. Clicking the card opens a filtered view of the logs showing the exact teacher, guardian, and timestamp of the failed scan.

---

## 5. Error Flows, Edge Cases & State Transitions

### Error Flows
*   **Camera Permission Denied:**
    *   If the teacher denies camera access, the scanner interface displays an Empty State placeholder with a retry button: `"Camera Access Required. Click here to enable camera."` and provides a manual input text field to type the short-code under the QR image.
*   **Lost Network Connectivity:**
    *   If network access drops during scan validation, the frontend interceptor halts the API request, throws a Toast alert: `"Network error: Verification failed. Retrying connection..."`, and holds the transaction in a loading state.

### Edge Cases
*   **Brute Force Detection:**
    *   If the backend detects 3 failed scans from the same scanner IP or account within 5 minutes, it flags the transaction and sends a high-priority email alert to the admin, logging it with status `SECURITY_ALERT`.
*   **Concurrent Scans:**
    *   If a parent shares a single-use QR code with two guardians, and they scan it simultaneously at different gates, the database transaction lock prevents race conditions. The first scan completes successfully and transitions the token status to `Used` within the database transaction block. The second scan reads the updated state, triggers an immediate rejection, and flags a duplicate scan exception.

### State Transitions (QR Token Lifecycle)
```
          Generate QR
┌────────┐   API    ┌────────┐    Scan Success    ┌────────┐
│ Pending├───-───-─►│ Active ├────────-───-──────►│  Used  │
└────────┘          └───┬────┘                    └────────┘
                        │
                        │ Expiration Timer Elapsed
                        ▼
                    ┌────────┐
                    │Expired │
                    └────────┘
```
*   **Pending:** Token is created but not yet serialized or sent.
*   **Active:** Token is generated, encrypted, and currently within its validity window.
*   **Used:** Token has been scanned and approved by a teacher. It can never be scanned again.
*   **Expired:** Token's `expires_at` timestamp has passed without being scanned.
