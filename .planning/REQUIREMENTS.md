# Requirements: v2.5 UI/UX Redesign

**Milestone:** v2.5 — Warm Design System Overhaul + All-Page UX Fixes
**Created:** 2026-02-18
**Status:** Scoped

---

## Design System

- [x] **DS-01**: Warm palette migration — replace all CSS custom properties in `globals.css` (light + dark mode) with warm amber/gold accents, cream backgrounds, warm borders, warm-tinted darks
- [x] **DS-02**: Card variants — add CVA variants (highlight, surface, muted, ghost, outlined) to Card component for colored background differentiation
- [x] **DS-03**: New semantic tokens — add `--highlight`, `--highlight-foreground`, `--surface`, `--surface-foreground` to globals.css and tailwind.config.ts
- [x] **DS-04**: Hardcoded color audit — replace all hardcoded hex values (`bg-white`, `border-[#E2E2E2]`, `bg-[#F9F9F9]`, `bg-[#F2F2F2]`) with semantic tokens across sidebar, page-header, app-shell, notification-bell
- [x] **DS-05**: Consistent page padding — normalize padding/spacing across all dashboard pages (dashboard, jobs, campaigns, analytics, customers, send, history, feedback, billing, settings) to use consistent values

## Login & Auth

- [ ] **AUTH-01**: Password visibility toggle — create `PasswordInput` component with show/hide eye icon (Phosphor) wrapping existing Input, use in login, signup, and password reset forms
- [ ] **AUTH-02**: Password requirements checklist — add live validation checklist (length, uppercase, number, special character) visible while typing on signup and password reset forms
- [ ] **AUTH-03**: Google OAuth fix — verify and fix Google OAuth provider configuration in Supabase dashboard and auth flow

## Dashboard

- [x] **DASH-01**: Welcome greeting — add "Welcome back, [Name]" with current date at top of dashboard page
- [x] **DASH-02**: Arrow hover affordance — replace translate-y lift on InteractiveCard with arrow indicator on hover to signal clickability
- [x] **DASH-03**: Remove notification badge — remove number badge from Dashboard nav item in sidebar
- [x] **DASH-04**: Differentiate lower cards — make the 3 bottom dashboard metric cards visually distinct from the top 3 KPI cards (different card variant, sizing, or layout)

## Onboarding

- [ ] **ONB-01**: Consolidate wizard steps — reduce from 7 to 5 steps: remove duplicate Google review link step (merge into Business Basics), remove Software Used step
- [ ] **ONB-02**: Horizontal service tiles — change services offered step from vertical list to horizontal selectable tiles/chips layout
- [ ] **ONB-03**: Plain English campaign presets — rename Fast/Standard/Slow presets to user-friendly names with clear, plain-language descriptions of what each does
- [ ] **ONB-04**: Getting started pill warm color — update getting started pill styling to use warm palette colors (amber accent) instead of cold blue tint
- [ ] **ONB-05**: Campaign review step fix — getting started checklist "Review campaign" step should only complete when user actually navigates to and reviews their campaign, not auto-complete

## Jobs & Campaigns

- [x] **JC-01**: Filter services to user selection — Jobs page service type filter only shows services the user selected during onboarding (from `service_types_enabled`)
- [x] **JC-02**: Smart name/email field — auto-detect whether user is typing a name or email in Add Job form and adjust label/input type accordingly
- [x] **JC-03**: Fix job creation bug — investigate and fix the bug preventing new job creation
- [x] **JC-04**: Campaign edit as panel — open campaign editor as side panel or modal instead of full-page navigation
- [x] **JC-05**: Campaign card full-click — make entire campaign card clickable to open details, not just action buttons (with stopPropagation on internal controls)
- [x] **JC-06**: Back button hit area — fix oversized back button on campaigns detail/edit pages
- [x] **JC-07**: Standard preset centered — center the "Standard" campaign preset card in the preset picker layout

## Navigation & Manual Request

- [ ] **NAV-01**: Eliminate Manual Request page — remove /send page from navigation, extract QuickSendForm, create QuickSendModal accessible from campaigns page and customer detail drawer
- [ ] **NAV-02**: Add Job toggle for one-off send — add option in Add Job flow to trigger immediate manual send for one-off situations

## Other Pages

- [x] **PG-01**: Analytics empty state — add guidance prompts and suggested actions when analytics page has no data yet
- [x] **PG-02**: Customers padding — fix inconsistent padding and spacing on Customers page
- [x] **PG-03**: Feedback UI consistency — fix padding and visual consistency on Feedback page to match other dashboard pages
- [x] **PG-04**: All-page padding normalization — audit and normalize padding on all pages to use consistent spacing values (p-6 cards, space-y-6 sections, consistent header spacing)

---

## Future Requirements (Deferred)

- Login split-screen image/illustration (deferred — need design asset)
- Increased border radius (keep current 8px)
- Colored KPI card backgrounds (keep current white cards)
- Getting started pill position change (keep in current location)

## Out of Scope

- Dark mode redesign beyond warm-tinting (no new dark mode features)
- New component library (stay with shadcn/ui + CVA)
- Performance optimization (not in scope for this milestone)
- Data model changes (pure UI milestone)
- Landing page redesign (separate Phase 31)
- Agency-mode/multi-tenant (separate Phase 29)

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DS-01 | Phase 34 | Complete |
| DS-02 | Phase 35 | Complete |
| DS-03 | Phase 34 | Complete |
| DS-04 | Phase 33 | Complete |
| DS-05 | Phase 35 | Complete |
| AUTH-01 | Phase 36 | Pending |
| AUTH-02 | Phase 36 | Pending |
| AUTH-03 | Phase 36 | Pending |
| DASH-01 | Phase 35 | Complete |
| DASH-02 | Phase 35 | Complete |
| DASH-03 | Phase 35 | Complete |
| DASH-04 | Phase 35 | Complete |
| ONB-01 | Phase 38 | Complete |
| ONB-02 | Phase 38 | Complete |
| ONB-03 | Phase 38 | Complete |
| ONB-04 | Phase 38 | Complete |
| ONB-05 | Phase 38 | Complete |
| JC-01 | Phase 37 | Complete |
| JC-02 | Phase 37 | Complete |
| JC-03 | Phase 37 | Complete |
| JC-04 | Phase 37 | Complete |
| JC-05 | Phase 37 | Complete |
| JC-06 | Phase 37 | Complete |
| JC-07 | Phase 37 | Complete |
| NAV-01 | Phase 39 | Pending |
| NAV-02 | Phase 39 | Pending |
| PG-01 | Phase 35 | Complete |
| PG-02 | Phase 35 | Complete |
| PG-03 | Phase 35 | Complete |
| PG-04 | Phase 35 | Complete |
