# Roadmap: AvisLoop

## Overview

AvisLoop is a review request SaaS for local service businesses. All planned milestones through v1.2.1 and Phase 19 are shipped. Milestone v1.3 focuses on dashboard UX polish: unified status badges, email preview refinements, detail drawers for contacts and requests, and onboarding setup improvements.

## Milestones

- **v1.0 MVP** - Phases 1-11 (shipped 2026-01-28) — [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Scheduled Sending** - Phases 12-14 (shipped 2026-01-30) — [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Onboarding Redesign + Google Auth** - Phases 15-16 (shipped 2026-01-30) — [Archive](milestones/v1.2-ROADMAP.md)
- **v1.2.1 Tech Debt Closure** - Phases 17-18 (shipped 2026-02-01) — [Archive](milestones/v1.2.1-ROADMAP.md)
- **Phase 19 UX/UI Redesign** - Phase 19 (shipped 2026-02-01)
- **v1.3 Dashboard UX Overhaul & Onboarding Polish** - Phases 20-23 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-11) - SHIPPED 2026-01-28</summary>

- [x] Phase 1: Foundation & Auth (6 plans)
- [x] Phase 2: Business Setup (3 plans)
- [x] Phase 3: Contact Management (6 plans)
- [x] Phase 3.1: Critical Fixes (1 plan)
- [x] Phase 4: Core Sending (5 plans)
- [x] Phase 5: Message History (2 plans)
- [x] Phase 5.1: Code Review Fixes (1 plan)
- [x] Phase 6: Billing & Limits (5 plans)
- [x] Phase 7: Onboarding Flow (4 plans)
- [x] Phase 8: Public Pages (2 plans)
- [x] Phase 8.1: Code Review Fixes (2 plans)
- [x] Phase 9: Polish & UX (4 plans)
- [x] Phase 10: Landing Page Redesign (5 plans)
- [x] Phase 11: Bulk Send & Integrations (3 plans)

</details>

<details>
<summary>v1.1 Scheduled Sending (Phases 12-14) - SHIPPED 2026-01-30</summary>

- [x] Phase 12: Cron Processing (1 plan)
- [x] Phase 13: Scheduling & Navigation (2 plans)
- [x] Phase 14: Scheduled Send Management (2 plans)

</details>

<details>
<summary>v1.2 Onboarding Redesign + Google Auth (Phases 15-16) - SHIPPED 2026-01-30</summary>

- [x] Phase 15: Design System & Dashboard Redesign (4 plans)
- [x] Phase 16: Onboarding Redesign + Google Auth (5 plans)

</details>

<details>
<summary>v1.2.1 Tech Debt Closure (Phases 17-18) - SHIPPED 2026-02-01</summary>

- [x] Phase 17: Deployment & Critical Fixes (2 plans)
- [x] Phase 18: Code Cleanup (2 plans)

</details>

<details>
<summary>Phase 19: UX/UI Redesign — Send-First Dashboard - COMPLETE 2026-02-01</summary>

- [x] 19-01-PLAN.md — Rebuild navigation and layout shell (3-item nav + account dropdown)
- [x] 19-02-PLAN.md — Loading states, skeletons, and actionable toast patterns
- [x] 19-03-PLAN.md — Send page shell + Quick Send tab
- [x] 19-04-PLAN.md — Onboarding setup progress pill and drawer
- [x] 19-05-PLAN.md — Stat strip and recent activity strip
- [x] 19-06-PLAN.md — Bulk Send tab with filter chips and action bar
- [x] 19-07-PLAN.md — Requests page detail drawer and resend actions
- [x] 19-08-PLAN.md — Dashboard deprecation and dead code cleanup

</details>

### v1.3 Dashboard UX Overhaul & Onboarding Polish (In Progress)

**Milestone Goal:** Unify visual consistency (status badges), add detail drawers for contacts and inline request viewing, polish the email preview and template selection experience, and complete the onboarding setup flow.

- [ ] **Phase 20: Status Badges & Layout Fixes** - Unified badge component + sticky settings nav + activity strip layout
- [ ] **Phase 21: Email Preview & Template Selection** - Compact preview snippet, full preview modal, template dropdown with create option
- [ ] **Phase 22: Detail Drawers** - Request drawer on send page, contact drawer on contacts page, resend with template selector, contact notes
- [ ] **Phase 23: Onboarding & Setup Polish** - Bonus credit, simplified checklist, completion banner, help & support menu

## Phase Details

### Phase 20: Status Badges & Layout Fixes
**Goal**: Every status indicator across the app uses one consistent, Figma-spec badge component, and layout irritants (settings scroll, activity strip overflow) are resolved.
**Depends on**: Phase 19 (complete)
**Requirements**: BDGE-01, LAYO-01, LAYO-02
**Success Criteria** (what must be TRUE):
  1. Status badges on send page, history page, contacts page, drawers, and recent activity strip all render with identical colors, icons, and typography matching the Figma spec
  2. Scrolling the settings page keeps the navbar visible and fixed at the top
  3. Recent activity chips fill all available horizontal space before the View All button, with the last chip truncating gracefully when space runs out
**Plans**: TBD

### Phase 21: Email Preview & Template Selection
**Goal**: Users see a compact email confidence snippet before sending and can open a full rendered preview, and the template dropdown includes a shortcut to create new templates.
**Depends on**: Phase 20 (badges used in preview context)
**Requirements**: PREV-01, PREV-02, TMPL-01
**Success Criteria** (what must be TRUE):
  1. Below the compose area, a compact preview (80-140px) shows the subject line (1 line), body snippet (2-3 lines clamped), and a "View full email" link -- visible without scrolling or expanding a separate section
  2. Clicking "View full email" opens a read-only modal displaying the subject, resolved body with contact name/variables filled in, a rendered review CTA button, footer text, and From/To header
  3. Template dropdown on the send page lists all saved templates plus a "Create Template" option that navigates to the settings template page
**Plans**: TBD

### Phase 22: Detail Drawers
**Goal**: Users can inspect request details and contact details inline via drawers without leaving the current page.
**Depends on**: Phase 20 (badges displayed in drawers)
**Requirements**: DRWR-01, DRWR-02, DRWR-03, DRWR-04
**Success Criteria** (what must be TRUE):
  1. Clicking a recent activity chip on the send page opens the request detail drawer inline (no navigation to /history)
  2. Clicking a contact row on the contacts page opens a detail drawer showing contact info, a notes field, and action items (send, edit, archive, view history)
  3. The request detail drawer includes a resend option with a template selector dropdown
  4. The contact detail drawer has an editable notes textbox; typing and saving persists the note to the database and it reappears on next open
**Plans**: TBD

### Phase 23: Onboarding & Setup Polish
**Goal**: The onboarding setup flow is streamlined -- new users get a silent bonus credit, the checklist is simplified, completion is celebrated, and Help & Support is functional.
**Depends on**: Phase 19 (complete) -- independent of Phases 20-22
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05
**Success Criteria** (what must be TRUE):
  1. A new user who completes onboarding has 1 extra send credit beyond their plan quota (added silently on the backend; the UI shows the standard quota number)
  2. The setup checklist no longer includes a "create template" step; the only template-related action is choosing a template on the send page
  3. After completing all checklist steps, the checklist is replaced by a "Setup Complete" banner with restart and finish options (restart resets checklist state, finish removes the banner permanently)
  4. The Help & Support dropdown in the account menu includes a "Restart Setup Checklist" option that resets onboarding progress
  5. The Help & Support menu item in the account dropdown is clickable and opens a functional dropdown submenu
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 48/48 | Complete | 2026-01-28 |
| 12-14 | v1.1 | 5/5 | Complete | 2026-01-30 |
| 15-16 | v1.2 | 9/9 | Complete | 2026-01-30 |
| 17-18 | v1.2.1 | 4/4 | Complete | 2026-02-01 |
| 19 | UX/UI Redesign | 8/8 | Complete | 2026-02-01 |
| 20 | v1.3 | 0/TBD | Not started | - |
| 21 | v1.3 | 0/TBD | Not started | - |
| 22 | v1.3 | 0/TBD | Not started | - |
| 23 | v1.3 | 0/TBD | Not started | - |

**Total:** 23 phases, 74 plans complete (+ v1.3 plans TBD).

## What's Next

After v1.3:
- **v2.0 SMS Channel** — Add Twilio SMS as second channel
- **v2.0 Multi-Location** — Pro users manage multiple business locations
- **v2.0 Analytics** — Send/open/click rate dashboards
- **Production deployment** — Configure Resend, Google OAuth, Stripe for production

---
*Last updated: 2026-02-01 after v1.3 roadmap creation*
