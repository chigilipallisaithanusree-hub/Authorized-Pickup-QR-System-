# Design System: FirstCry Intelliots Portal

## 1. Visual Theme & Atmosphere
A modern, clinical, yet warm and reassuring school safety SaaS platform. The visual atmosphere is "Academic Secure & Warm Cream" — combining the authoritative trust of Primary Brand Blue (#2D5288) with the comforting warmth of a Cream Ivory background (#FFFCEF). Containers and cards occupy distinct spatial zones, utilizing soft elevations and clean, readable typography.

## 2. Color Palette & Roles
*   **Canvas Base** (#FFFCEF) — Primary canvas background (Ivory Cream)
*   **Pure Surface** (#FFFFFF) — Card and container fill (White)
*   **Ink Primary** (#0F172A) — Primary text and display headings (Slate-900)
*   **Ink Secondary** (#475569) — Secondary body copy and metadata (Slate-600)
*   **Ink Muted** (#94A3B8) — Disabled buttons and placeholder text (Slate-400)
*   **Whisper Border** (#E2E8F0) — Standard component outlines and table grid dividers (Slate-200)
*   **Brand Primary** (#2D5288) — Primary brand color, CTA buttons, active sidebar backgrounds
*   **Brand Primary Hover** (#1F3A60) — Darker shade for primary hover states
*   **Status Success** (#22C55E) — Approved pickups and valid QR codes
*   **Status Warning** (#F59E0B) — Expiring tokens and pending validations
*   **Status Error** (#EF4444) — Validation rejections, blocked access, and priority alerts

## 3. Typography Rules
*   **Display:** Outfit — Track-tight (-0.02em letter-spacing), heavy weight hierarchy (Medium 500 / Semi-Bold 600 / Bold 700)
*   **Body:** Inter — Relaxed leading (1.5), max 65 characters per line
*   **Mono:** JetBrains Mono — For tokens, timestamps, numeric records, and ID codes
*   **Banned:** System default fonts, Inter in display headers, any generic serif fonts. No cursive or handwriting fonts.

## 4. Spacing & Grid System
*   **Baseline Grid:** 8px system (4px, 8px, 16px, 24px, 32px, 48px).
*   **Grid Principles:** CSS Grid-first layout. Card grids use `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`. Flexbox is restricted to inline horizontal alignment.

## 5. Shadow & Elevation System
*   **Small Shadow:** `box-shadow: 0 1px 2px 0 rgba(11, 37, 69, 0.05);` (used for small buttons, badges, status pills)
*   **Medium Shadow:** `box-shadow: 0 4px 6px -1px rgba(11, 37, 69, 0.08), 0 2px 4px -1px rgba(11, 37, 69, 0.03);` (used for standard cards, inputs, navigation items)
*   **Large Shadow:** `box-shadow: 0 10px 15px -3px rgba(11, 37, 69, 0.1), 0 4px 6px -2px rgba(11, 37, 69, 0.05);` (used for modals, dropdowns, and toast notifications)
*   **Elevation Hierarchy:**
    *   Level 0 (Canvas): Background `#FFFCEF`
    *   Level 1 (Surface): Cards, Sidebar, Tables (White, Small/Medium Shadow)
    *   Level 2 (Overlay): Modals, Dropdowns, Floating Toasts (White, Large Shadow)

## 6. Component Stylings
*   **Buttons:** Flat, solid colors. Height: 44px (touch target compliant). Active states translate -1px vertically on press.
*   **Cards:** Clean flat borders (1px solid #E2E8F0) with `border-radius: 12px`. White background, soft medium shadow.
*   **Inputs:** Border: 1px solid #E2E8F0, rounded 8px. Label sits strictly above input. Focus state changes border to #2D5288 and adds a light blue ring `box-shadow: 0 0 0 3px rgba(45, 82, 136, 0.15)`.
*   **Loaders:** Shimmering skeleton placeholders matching the exact card/table block bounds. No spinning wheels.
*   **Empty States:** Centered vector layouts (shield/calendar outlines) with a title, helper text, and CTA. No emojis.

## 7. Motion & Interaction
*   **Spring Physics:** Applied to active state transitions: `transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`.
*   **Choreography:** List items mount sequentially with a cascade delay of 40ms per item.
*   **Performance:** Animation properties limited to `transform` and `opacity` to maintain 60FPS on mobile viewports.

## 8. Anti-Patterns (Banned)
*   No emojis.
*   No profile picture placeholders or images (icons only).
*   No glowing neon dropshadows.
*   No warm gray and cool gray colors mixed in the same layout.
*   No fake or simulated statistics/performance data (must use clear labels if data is absent).
*   No overlapping containers.
