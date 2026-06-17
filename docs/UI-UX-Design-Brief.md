# UI/UX Design Brief & System Specification
## Project Name: FirstCry Intelliots Portal

This document serves as the absolute single source of truth for the frontend UI/UX design of the **FirstCry Intelliots Portal**. It defines visual design tokens, component specifications, information architecture, user journeys, and detailed layouts for all 13 core screens, ensuring that a React application can be generated directly without additional design decisions.

---

## 1. Design System

### 1.1 Color Palette & Roles
*   **Canvas Base:** `#FFFCEF` (Ivory Cream) — Primary background surface for the main content workspace. Gives a warm, premium, clinical academic look.
*   **Pure Surface:** `#FFFFFF` (White) — Card fills, modal dialog content containers, input fields, and table rows.
*   **Brand Primary:** `#2D5288` (Academic Blue) — Used for the sidebar background, primary CTA buttons, focus states, and active page headers.
*   **Brand Primary Hover:** `#1E3A60` — A darker shade of Brand Primary for hover interactions.
*   **Text Primary:** `#0F172A` (Slate-900) — Primary readable color for headings, titles, and body content.
*   **Text Secondary:** `#475569` (Slate-600) — Descriptive text, metadata fields, and table headers.
*   **Text Muted:** `#94A3B8` (Slate-400) — Disabled text states, placeholders, and icon fills.
*   **Border Gray:** `#E2E8F0` (Slate-200) — Default thin borders (`1px solid`).
*   **Status Success:** `#22C55E` (Green-500) — Verified/Approved state overlays, active success tokens.
*   **Status Warning:** `#F59E0B` (Amber-500) — Expiring indicators, pending states.
*   **Status Error:** `#EF4444` (Red-500) — Denied access, validation failures, duplicate QR detections.

### 1.2 Typography System
*   **Display Font:** `Outfit` (sans-serif) — Utilized for display titles, page headers, metric numbers.
*   **Body & Form Font:** `Inter` (sans-serif) — Utilized for forms, tables, body copy.
*   **Monospace Font:** `JetBrains Mono` — Utilized for UUID tokens, date-time logs, IP addresses.
*   **Sizes & Weights:**
    *   `Display Extra-Large`: `2.25rem (36px)` / Bold (`700`)
    *   `Display Large`: `1.75rem (28px)` / Semi-Bold (`600`)
    *   `Display Medium`: `1.25rem (20px)` / Medium (`500`)
    *   `Body Regular`: `1.0rem (16px)` / Regular (`400`)
    *   `Caption Small`: `0.85rem (13.6px)` / Regular (`400`)

### 1.3 Spacing & Grid System
*   **Baseline Spacing (8px grid):**
    *   `space-xs`: `4px` — Label to input gap.
    *   `space-sm`: `8px` — Inner element padding (e.g. badges, button labels).
    *   `space-md`: `16px` — Standard padding (e.g. inputs, list items, card gutters).
    *   `space-lg`: `24px` — Card container padding, sidebar item gaps.
    *   `space-xl`: `32px` — Page layout content margins.
*   **Grid System:** Responsive CSS Grid layouts. Grids default to 12 columns on desktop, collapsing to 1 column on mobile layout bounds (`< 768px`).

### 1.4 Border Radius Scale
*   `radius-sm`: `6px` — Form fields, small pills.
*   `radius-md`: `12px` — Metric cards, action buttons, table rows.
*   `radius-lg`: `20px` — Modals, dropdown boxes, slide-over panels.

### 1.5 Shadow & Elevation Scale
*   **Small Shadow (Level 1):** `box-shadow: 0 1px 2px 0 rgba(45, 82, 136, 0.05);` (used for buttons, badges, status indicators).
*   **Medium Shadow (Level 2):** `box-shadow: 0 4px 6px -1px rgba(45, 82, 136, 0.08), 0 2px 4px -1px rgba(45, 82, 136, 0.03);` (used for cards, search bars, inputs).
*   **Large Shadow (Level 3):** `box-shadow: 0 10px 15px -3px rgba(45, 82, 136, 0.1), 0 4px 6px -2px rgba(45, 82, 136, 0.05);` (used for dropdown selectors, overlay modals, alert banners, toasts).

### 1.6 Iconography & Avatars
*   **Avatar Constraint:** Under no circumstances should user profile photos or placeholders be rendered. Implement high-quality SVG icons only (e.g. Shield, UserCheck, AcademicCap, Calendar, Clock, AlertTriangle).
*   **System Icons:** Feather icons or Lucide icon library. Aligned left in navigation lists.

### 1.7 Button & Form Systems
*   **Primary Button:** Background `#2D5288`, Text `#FFFFFF`. Height 44px. Hover transitions background to `#1E3A60`, applies scale `scale(1.02)`, and lifts shadow. Active press translates `-1px` vertically.
*   **Secondary Button:** Background `#FFFFFF`, Border `1px solid #E2E8F0`, Text `#2D5288`. Hover applies light background tint `#F8FAFC`.
*   **Danger Button:** Background `#EF4444`, Text `#FFFFFF`.
*   **Disabled Button:** Background `#94A3B8`, Text `#FFFFFF`, Cursor `not-allowed`.
*   **Inputs:** Label always sits strictly above. Active state uses border color `#2D5288` and box-shadow glow: `box-shadow: 0 0 0 3px rgba(45, 82, 136, 0.15)`.

---

## 2. Information Architecture & Navigation

### Navigation Maps & Access Boundaries

#### A. Parent Navigation
*   `Parent Dashboard` (`/parent/dashboard`) — Student cards list, current pickups feed.
*   `Generate QR Code` (`/parent/qr`) — Child & guardian selector panels.
*   `Settings` (`/parent/settings`) — General password & security parameters.

#### B. Teacher Navigation
*   `Teacher Dashboard` (`/teacher/dashboard`) — Scan statistics, pending pickups, scanner launcher.
*   `QR Scanner Page` (`/teacher/scanner`) — Active Web camera feed and manual shortcode field.
*   `Pickup Logs` (`/teacher/logs`) — Individual logs verified by this teacher.
*   `Settings` (`/teacher/settings`) — Password & notification toggles.

#### C. Admin Navigation
*   `Admin Dashboard` (`/admin/dashboard`) — Analytics indicators, recent activities feed, exception alerts panel.
*   `Student Directory` (`/admin/students`) — Student management CRUD grid.
*   `Guardian Directory` (`/admin/guardians`) — Guardian records & child mappings.
*   `Pickup Logs` (`/admin/logs`) — Complete history, searchable tables, filters.
*   `Reports Page` (`/admin/reports`) — PDF/CSV exporter view.
*   `Settings` (`/admin/settings`) — General system preferences.

---

## 3. User Journey Maps

### Journey 1: Parent (Emily Watson)
```
[Logs In as Parent] ──► [Selects Leo Watson Card] ──► [Clicks Add Guardian] ──► [Enters John's Details]
                                                                                      │
                                                                                      ▼
[Views Shared QR Code] ◄── [Clicks Generate QR] ◄── [Selects John & Sets 2h Expiry] ◄── [Saves Guardian]
```

### Journey 2: Teacher (Mr. Robert Davis)
```
[Logs In as Teacher] ──► [Loads Camera Scanner] ──► [Scans Guardian's QR Code] ──► [Views Approval Card]
                                                                                        │
                                                                                        ▼
[Returned to Camera Scan] ◄── [Parent Receives Email Notification] ◄── [Clicks Confirm Release]
```

### Journey 3: Administrator (Director Sarah Martinez)
```
[Logs In as Admin] ──► [Views Alarm Alert Panel] ──► [Clicks Alarm Row] ──► [Inspects Failed Scan Logs]
                                                                                   │
                                                                                   ▼
[Downloads PDF Audit File] ◄── [Filters by Student ID] ◄── [Navigates to Reports Page]
```

---

## 4. Screen Inventory (Specifications & Mockup Layouts)

### 4.1 Screen 1: Login Page
*   **Purpose:** Central entry portal for Parent, Teacher, and Admin authentication.
*   **Layout Structure:**
    *   Responsive split view (100vh): Desktop has Left Graphic Block (60%) and Right Authentication Block (40%). Collapses to single column on mobile.
*   **Wireframe Layout:**
    ```
    ┌───────────────────────────────┬───────────────────────────────┐
    │                               │     [Logo Icon] Auth QR       │
    │   AUTHORIZED PICKUP SYSTEM    ├───────────────────────────────┤
    │                               │  [ Parent ] [ Teacher ] [Admin]│
    │   Protecting school dismissals│ ──────────────────────────────│
    │   with single-use dynamic QRs │  Email Input                  │
    │                               │  [..........................] │
    │   [Shield Graphic Overlay]    │  Password Input               │
    │                               │  [..........................] │
    │                               │  [ Login Button ]             │
    └───────────────────────────────┴───────────────────────────────┘
    ```
*   **Component List:** Role Segmented Tab Controller, Text Inputs (Email, Password), Primary Button, Alert Banner.
*   **User Actions:** Select Role, Enter Email, Enter Password, Click Login.
*   **Validation Rules:** Email field must match email regex; password minimum 8 characters.
*   **States:**
    *   *Loading:* Submit button replaces label with a loading ring; input inputs are disabled.
    *   *Empty:* Shows default forms.
    *   *Error:* Displays red Banner: `"Invalid credentials or role selected."`
    *   *Success:* Triggers dashboard router redirect.
*   **Responsive Behavior:** On viewport `< 768px`, Left graphic panel hides, right form block takes 100% width.

---

### 4.2 Screen 2: Parent Dashboard
*   **Purpose:** Give parents an overview of their children and active QR codes.
*   **Layout Structure:** Left sidebar layout. Content area displays grid cards of students.
*   **Wireframe Layout:**
    ```
    ┌──────────┬────────────────────────────────────────────────────┐
    │ Sidebar  │ Leo Watson [Kindergarten-A]                        │
    │          │ ┌──────────────────────┐  ┌──────────────────────┐  │
    │  Home    │ │ Registered Guardians │  │ Active QR Codes      │  │
    │  Gen QR  │ │ - John Watson (Uncle)│  │ - Presented to John  │  │
    │  Settings│ │ [Add Guardian Button]│  │   Expires in 42m     │  │
    │          │ └──────────────────────┘  └──────────────────────┘  │
    │          │ [Generate QR Code Button]                          │
    └──────────┴────────────────────────────────────────────────────┘
    ```
*   **Component List:** Student Card, List Components, Quick Action Buttons.
*   **User Actions:** Clicks Add Guardian (opens Modal), Clicks Generate QR (routes to Screen 5).
*   **States:**
    *   *Loading:* Pulse animation skeleton panels for student cards.
    *   *Empty:* Card displays `"No children registered. Contact administration."`
    *   *Error:* Notification toast: `"Failed to load student profiles."`
    *   *Success:* Updates dashboard records in real-time.

---

### 4.3 Screen 3: Student Management
*   **Purpose:** Administrative CRUD interface to manage student registries.
*   **Layout Structure:** Grid table page with search filters header.
*   **Component List:** Search input, Class filter dropdown, Add Student button, Data table, Add/Edit Modals.
*   **User Actions:** Input search query, select class, edit row, click Add Student.
*   **Validation Rules (Add Student):** First Name and Last Name must not be empty (max 50 chars); Grade/Class field must not be empty.
*   **States:**
    *   *Empty:* Table displays central shield graphic: `"No students found matching your query."`
    *   *Responsive:* Table columns hide selectively (Grade/Class hides on `< 480px` viewports).

---

### 4.4 Screen 4: Guardian Management
*   **Purpose:** Admin/Parent panel to track registered guardians and child mappings.
*   **Layout Structure:** Left sidebar. Content page shows guardian table grids.
*   **Component List:** Search input, Guardian Table, Add Guardian Modal, Assign Child dropdown.
*   **Validation Rules:** Email must be valid; Phone Number must comply with E.164 pattern.
*   **States:**
    *   *Loading:* Skeleton block rows.

---

### 4.5 Screen 5: Generate QR Page
*   **Purpose:** Configure and generate dynamic pickup QR codes.
*   **Layout Structure:** Two-column split: Left form selection configurations; Right QR Preview container.
*   **Wireframe Layout:**
    ```
    ┌──────────┬─────────────────────────┬──────────────────────────┐
    │ Sidebar  │ Select Student: [Leo ▾] │       QR CODE PREVIEW    │
    │          │ Select Guardian:[John▾] │  ┌────────────────────┐  │
    │  Home    │ Expiry: [ 2 Hours  ▾]   │  │  [  QR code Base64 ]│  │
    │  Gen QR  │                         │  │                    │  │
    │  Settings│ [ Generate QR Button ]  │  └────────────────────┘  │
    │          │                         │   Expires: 13:56:00      │
    └──────────┴─────────────────────────┴──────────────────────────┘
    ```
*   **Component List:** Dropdown Selectors, Primary CTA button, Base64 QR Image Container, Share button, Countdown Clock.
*   **User Actions:** Choose Student, Choose Guardian, Select Expiry duration, Click Generate.
*   **States:**
    *   *Success:* Displays QR image with countdown timer and issues Toast notification: `"QR Code Generated and emailed to Guardian."`

---

### 4.6 Screen 6: Teacher Dashboard
*   **Purpose:** Give dismissal teachers scan metrics and recent logs feed.
*   **Layout Structure:** Row of 3 metric cards (Today's Pickups, Rejected Scans, Active QRs), bottom recent scans list, and a floating circular scan trigger.
*   **Component List:** Metrics Cards, Recent Scans Table, "Launch Camera Scanner" button.
*   **User Actions:** Click Launch Scanner, view log entries.

---

### 4.7 Screen 7: QR Scanner Page
*   **Purpose:** Camera-based scanner for validating guardian QR tokens.
*   **Layout Structure:** Full viewport mobile-first window. Camera feed center block overlayed with a green/red visual response card.
*   **Component List:** Camera Viewfinder Canvas, Manual Short-code text input, Verification response overlay cards.
*   **States:**
    *   *Success:* Renders full-screen green overlay: `"APPROVED: Leo Watson. Release to John Watson (Uncle)."`
    *   *Error (Rejected):* Renders red overlay: `"REJECTED: Expired QR Token."`

---

### 4.8 Screen 8: Pickup Verification Page
*   **Purpose:** Show full student and guardian details for verification.
*   **Component List:** Student Detail card, Guardian Detail card, "Confirm Release" button, "Reject" button.
*   **User Actions:** Click Approve, Click Reject (opens rejection reasons select list).

---

### 4.9 Screen 9: Pickup Logs Page
*   **Purpose:** Audit log showing dismissal transaction history.
*   **Layout Structure:** Data table with filters (Date range, status pills, teacher ID, student search).
*   **Component List:** Data table, Date Range Picker, Export CSV button.

---

### 4.10 Screen 10: Admin Dashboard
*   **Purpose:** Overview of metrics, system safety alerts, and logs.
*   **Layout Structure:** Metrics card row, live activity timeline list on left, Exception Alerts pane on right (high-priority failures).
*   **Component List:** Metric cards, Activity Feed rows, System Exception alerts box (marked red if active).

---

### 4.11 Screen 11: Reports Page
*   **Purpose:** Generate CSV and PDF exports for administrators.
*   **Layout Structure:** Simple card layout showing report parameters (Start Date, End Date, Grade level, Status).
*   **User Actions:** Select parameters, click "Export PDF" or "Export CSV".

---

### 4.12 Screen 12: Notifications Page
*   **Purpose:** Track alert log feeds and email notifications dispatch logs.
*   **Layout Structure:** Chronological notification list with status tags (`Delivered`, `Failed`).

---

### 4.13 Screen 13: Settings Page
*   **Purpose:** Allow users to update passwords and toggle interface parameters.
*   **Layout Structure:** Segmented configuration block forms.

---

## 5. Interaction Specifications

### 5.1 Hover Effects (Mandatory)
*   **Sidebar Hover:** Smooth transition (`transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`). Hovering over a sidebar menu item causes:
    *   Background to darken to `#1A3258`.
    *   Text and icon translate right: `transform: translateX(4px);`.
    *   Shadow shifts from flat to small shadow.
*   **Card Hover:** Cards lift up and scale:
    *   `transform: translateY(-4px) scale(1.01);`
    *   Shadow transitions from Medium to Large shadow (`box-shadow: 0 10px 15px -3px rgba(45, 82, 136, 0.1)`).
*   **Button Hover:**
    *   Primary button scales: `transform: scale(1.02);`.
    *   Shadow shifts to Medium shadow.
    *   Background color shifts to `#1E3A60`.
*   **Table Row Hover:**
    *   Row background transitions to `#FFFCEF` at 50% opacity.
    *   Left border displays `#2D5288` accent indicator (`3px solid`).

### 5.2 Animations & State Transitions
*   **Modal Reveal:** Zoom and fade transition: `@keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }` running over `150ms`.
*   **Toast Alert:** Slide in from right edge, auto-dismiss slider width reduces to 0 over 4 seconds.
*   **Scan Success/Error Animations:**
    *   *Approved Check:* Success checkmark path animates in using SVG stroke offset.
    *   *Rejected Check:* Red alert shield pulses twice on screen load.
