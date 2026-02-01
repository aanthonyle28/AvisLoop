# Roadmap: AvisLoop

## Overview

AvisLoop is a review request SaaS for local service businesses. All planned milestones through v1.2.1 are shipped. The product is feature-complete for its current scope (email review requests with scheduling, billing, and onboarding).

## Milestones

- **v1.0 MVP** - Phases 1-11 (shipped 2026-01-28) — [Archive](milestones/v1.0-ROADMAP.md)
- **v1.1 Scheduled Sending** - Phases 12-14 (shipped 2026-01-30) — [Archive](milestones/v1.1-ROADMAP.md)
- **v1.2 Onboarding Redesign + Google Auth** - Phases 15-16 (shipped 2026-01-30) — [Archive](milestones/v1.2-ROADMAP.md)
- **v1.2.1 Tech Debt Closure** - Phases 17-18 (shipped 2026-02-01) — [Archive](milestones/v1.2.1-ROADMAP.md)

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

### Phase 19: UX/UI Redesign — Send-First Dashboard

**Goal:** Redesign the app's core IA and UI: dashboard becomes Send-first with Quick Send / Bulk Send tabs, navigation simplified to 3 pages + account menu, onboarding rebuilt as collapsible drawer, Requests page gains detail drawer and resend actions.

**Plans:** 8 plans

Plans:
- [ ] 19-01-PLAN.md — Rebuild navigation and layout shell (3-item nav + account dropdown)
- [ ] 19-02-PLAN.md — Loading states, skeletons, and actionable toast patterns
- [ ] 19-03-PLAN.md — Send page shell + Quick Send tab
- [ ] 19-04-PLAN.md — Onboarding setup progress pill and drawer
- [ ] 19-05-PLAN.md — Stat strip and recent activity strip
- [ ] 19-06-PLAN.md — Bulk Send tab with filter chips and action bar
- [ ] 19-07-PLAN.md — Requests page detail drawer and resend actions
- [ ] 19-08-PLAN.md — Dashboard deprecation and dead code cleanup

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-11 | v1.0 | 48/48 | Complete | 2026-01-28 |
| 12-14 | v1.1 | 5/5 | Complete | 2026-01-30 |
| 15-16 | v1.2 | 9/9 | Complete | 2026-01-30 |
| 17-18 | v1.2.1 | 4/4 | Complete | 2026-02-01 |
| 19 | UX/UI Redesign | 0/8 | In Progress | — |

**Total:** 19 phases, 74 plans (66 complete, 8 in progress).

## What's Next

Phase 19 in progress. After completion:
- **v2.0 SMS Channel** — Add Twilio SMS as second channel
- **v2.0 Multi-Location** — Pro users manage multiple business locations
- **v2.0 Analytics** — Send/open/click rate dashboards
- **Production deployment** — Configure Resend, Google OAuth, Stripe for production

---
*Last updated: 2026-02-01 after Phase 19 planning*
