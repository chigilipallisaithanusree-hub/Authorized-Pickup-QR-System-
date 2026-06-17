# Technical Requirements Document (TRD)
## Project Name: FirstCry Intelliots Portal

---

## 1. System Architecture
The FirstCry Intelliots Portal is designed as a decoupled full-stack web application consisting of a static Single Page Application (SPA) frontend, a stateless RESTful API backend, and a relational database.

```
┌────────────────────────────────────────────────────────┐
│                    Client Browser                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │                     React SPA                    │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │ HTTPS (REST APIs)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (Render)                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    Python Flask                  │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌────────┐  │  │
│  │  │  Auth Router  │ │  Rule Engine  │ │ Mailer │  │  │
│  │  └───────────────┘ └───────────────┘ └────────┘  │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼─────────────────────────────┘
                           │ MySQL Protocol (TCP 3306)
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Database (Managed MySQL)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   MySQL Server                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

*   **Communication Protocols:** All communication between the React SPA and the Flask backend is conducted over HTTP/S using JSON payloads. All traffic is encrypted using TLS 1.3.
*   **Decoupling:** The frontend and backend run on separate physical hosts (Vercel and Render, respectively), enforcing CORS restrictions and decoupling deployment lifecycles.

---

## 2. Frontend Architecture
The frontend is built as a Single Page Application (SPA) using React, React Router for client-side routing, and Vanilla CSS for styling.

### Component Structure
The project components are organized using a feature-based structure:
*   `src/components/common/`: Reusable, layout-agnostic components (Buttons, Input Fields, Alerts, Cards, Table, Modal, Toast Notifications).
*   `src/components/layout/`: Fixed left sidebar navigation, top bar dashboard headers, footer.
*   `src/pages/`: Page containers (Login, AdminDashboard, ParentPortal, TeacherScanner, ReportsPage).
*   `src/context/`: Authentication Context (`AuthContext`) managing the logged-in user state and token refresh.
*   `src/services/`: API client classes (using `fetch` with preconfigured interceptors for injecting JWT headers).

### State Management
*   **Authentication State:** Managed globally using React Context API. It stores user profiles (excluding passwords and sensitive credentials) and current authorization permissions.
*   **UI State:** Local state (using `useState` and `useReducer` hooks) manages loading spinners, modal visibility, search queries, filter states, and notification lists.

### Routing & Protection
*   The router utilizes `react-router-dom`.
*   Protected routes are enforced via a wrapper component `<ProtectedRoute roles={['Admin', 'Teacher', 'Parent']}>` that checks user roles in `AuthContext` and redirects unauthorized access to the `/login` page.

---

## 3. Backend Architecture
The backend is a lightweight, stateless REST API built using Python Flask.

### Component Structure
*   `app.py`: Entry point and Flask configuration.
*   `config.py`: Environment-based settings (database connection string, JWT secret key, SMTP settings).
*   `routes/`: Module containing blueprints for routing:
    *   `auth.py`: Handles login, logout, token refresh, and registration.
    *   `students.py`: Student CRUD endpoints.
    *   `guardians.py`: Guardian association and registry.
    *   `qr.py`: Encryption and generation of tokens.
    *   `pickups.py`: Verification, scan rules, and approvals.
    *   `dashboard.py`: Statistics compilation queries.
    *   `reports.py`: CSV/PDF file builders.
*   `services/`: Business logic implementations:
    *   `rule_engine.py`: Encapsulates rule-based pickup verification.
    *   `notification_service.py`: Asynchronous email dispatcher.
    *   `pdf_generator.py`: Generates formatted PDF records using ReportLab.
*   `utils/`: Core utilities (crypto handlers, JWT helpers, date formatting).

### Middleware & Interceptors
*   **Authentication Middleware:** A decorator `@token_required` validates the signature and expiration of the JWT in the `Authorization` request header.
*   **RBAC Middleware:** A decorator `@role_required(allowed_roles=['Admin', 'Teacher'])` restricts endpoints by comparing the claims payload inside the decoded JWT.
*   **Error Handler:** A global handler traps exceptions, logs errors with traceback, and returns standardized JSON error responses:
    ```json
    {
      "error": "Error message details",
      "code": "ERROR_CODE_STRING"
    }
    ```

---

## 4. Database Architecture
Persistence is handled using a relational MySQL database.

*   **Connection Pooling:** Flask-SQLAlchemy manages a connection pool (max pool size: 20, overflow: 10, pool recycle: 3600 seconds) to prevent socket exhaustion.
*   **ORMs & Query Builder:** SQLAlchemy is used as the Object-Relational Mapper (ORM), ensuring that queries are parameterized and escape dangerous characters automatically.
*   **Database Migrations:** Managed using `Alembic` (via `Flask-Migrate`), tracking changes incrementally with versions.
*   **Data Layout:** Relational schema enforcing referential integrity with cascading deletes only on safe entities (e.g. dynamic tokens, notification queue). Student records utilize soft-deletes (`is_deleted` flag) to preserve historical audit logs in `pickup_logs`.

---

## 5. Security Architecture

### 5.1 Authentication (JWT & RBAC)
*   **JWT Generation:** Generated upon successful login with HS256 algorithm.
    *   **Payload Claims:**
        ```json
        {
          "sub": "user_id_uuid_or_int",
          "role": "Parent | Teacher | Admin",
          "exp": 1781523456,
          "iat": 1781494656
        }
        ```
*   **Token Expiration:** JWT access tokens expire after 8 hours. No refresh tokens are required in the initial release; users re-authenticate upon expiry.

### 5.2 Encryption
*   **Data at Rest:** Database passwords are salted and hashed using `bcrypt` (rounds: 12).
*   **Dynamic QR Tokens:** The token payload embedded in the QR is encrypted using **AES-256-GCM** with a system-wide secret key. This prevents parents/guardians from tampering with the QR payload (e.g. changing expiration time or child association) and allows decrypters to verify authenticity.
*   **Transport Security:** HTTPS/TLS 1.3 is enforced globally. Backend sets `Strict-Transport-Security` headers.

### 5.3 Core Security Controls
*   **CORS Configuration:** Flask-CORS is configured explicitly. Wildcards (`*`) are disallowed in production; only the designated Vercel frontend domain is whitelisted.
*   **Security Headers:** Backend injects headers via middleware:
    *   `X-Frame-Options: DENY` (prevents clickjacking)
    *   `X-Content-Type-Options: nosniff` (prevents MIME-sniffing)
    *   `Content-Security-Policy` (limits dynamic resource loading)

---

## 6. Deployment Architecture

```
                      ┌──────────────────────┐
                      │    GitHub Repo       │
                      └──────────┬───────────┘
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
      ┌─────────────────┐                 ┌─────────────────┐
      │   Vercel Build  │                 │   Render Build  │
      │   (Frontend)    │                 │   (Backend)     │
      └────────┬────────┘                 └────────┬────────┘
               │                                   │
               ▼                                   ▼
      ┌─────────────────┐                 ┌─────────────────┐
      │  Static Hosting │                 │  Gunicorn App   │
      │  HTTPS Gateway  │                 │  HTTPS Gateway  │
      └─────────────────┘                 └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │   MySQL Server  │
                                          │   (Managed DB)  │
                                          └─────────────────┘
```

### Frontend (Vercel)
*   **Hosting:** Fully static React application compiled with production optimization.
*   **Configuration:** Custom `vercel.json` maps all paths to `index.html` to support client-side routing.
*   **Environment Variables:** Configures `REACT_APP_API_URL` targeting the backend Render endpoint.

### Backend (Render)
*   **App Server:** Python application running on `Gunicorn` with multiple worker processes (formula: `2 * CPU_cores + 1`).
*   **Configuration:** Deployment triggered automatically via GitHub commit hooks.
*   **Port binding:** Gunicorn binds to the port provided in the `$PORT` environment variable.

### Database (Managed MySQL)
*   **Engine:** MySQL 8.0.
*   **Connection:** Whitelisted to only accept connections from the Render backend IP ranges or secure credentials. Database configuration URL passed securely using env variables.

---

## 7. Technology Decisions

| Technology | Selected | Alternatives Considered | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React (SPA) | Vue, Angular | Large developer ecosystem, component modularity, lightweight builds, and seamless integration with Stitch UI tools. |
| **Backend Framework** | Python Flask | Django, Node.js Express | Lightweight, modular design suited for implementing rule-based endpoint validation, with native Python libraries for report generation and AES encryption. |
| **Database** | MySQL | PostgreSQL, MongoDB | Relational integrity is mandatory for parent-child registries, and strict structure suits transaction logging. |
| **QR Library** | `qrcode` (Python) | Frontend-side generation | Server-side QR generation ensures cryptographic signing and encryption of tokens, preventing client-side spoofing. |
| **Reporting Engine** | ReportLab (Python) | JS-PDF (Frontend) | Server-side PDF generation ensures consistent formatting and layout across all browsers/devices, and runs independently of client performance limits. |

---

## 8. Scalability & Resilience
*   **Database Query Optimization:** Indexes are created for all foreign keys, status flags, and date parameters commonly used in dashboard queries and logging operations.
*   **Stateless REST API:** The backend stores no session state on disk, allowing it to scale horizontally by running multiple instances behind Render's load balancer.
*   **Memory Management:** Export routes stream datasets incrementally to avoid memory exhaustion on the backend when handling large pickup tables.

---

## 9. API Design & Communication Strategy
*   **RESTful Standards:** Standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) map directly to CRUD operations.
*   **Response Envelope:** Consistent payload design:
    *   **Success Response:** Returns data payload directly or wrapped in `data` key.
    *   **Status Codes:**
        *   `200 OK`: Request succeeded.
        *   `201 Created`: Resource created successfully.
        *   `400 Bad Request`: Validation failure or execution block.
        *   `401 Unauthorized`: Invalid or missing credentials.
        *   `403 Forbidden`: User role lacks permission.
        *   `404 Not Found`: Resource does not exist.
        *   `500 Internal Server Error`: Infrastructure or exception block.
*   **JSON Serialization:** CamelCase keys are used in JSON payloads to match standard Javascript conventions, while Python properties map them to snake_case backend parameters.
