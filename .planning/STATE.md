# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Milestone v1.4 — Landing Page Redesign

## Current Position

**Phase:** Not started (researching)
**Plan:** —
**Status:** Researching landing page best practices and content strategy
**Last activity:** 2026-02-01 — Milestone v1.4 started

**Progress:** [████████████████████████████] 74/74 total plans complete (previous milestones)

```
v1.0 MVP:           ████████████████████████████████████████████████ 48/48 SHIPPED
v1.1 Scheduled:     █████ 5/5 SHIPPED
v1.2 Onboarding:    █████████ 9/9 SHIPPED
v1.2.1 Tech Debt:   ████ 4/4 SHIPPED
Phase 19 UX:        ████████ 8/8 COMPLETE
v1.3 UX Overhaul:   ░░░░░░░░ 0/? PLANNING
```

## What's Been Built

See .planning/MILESTONES.md for full history.

- **v1.0 MVP:** Auth, business profiles, contacts, sending, history, billing, onboarding, public pages, polish, bulk send
- **v1.1 Scheduled Sending:** Cron processing, scheduling UI, scheduled send management
- **v1.2 Onboarding Redesign:** Design system overhaul, dashboard redesign, Google OAuth, simplified onboarding
- **v1.2.1 Tech Debt:** Migration fix, Phase 4 verification, code cleanup, history pagination
- **Phase 19 UX/UI Redesign:** Send-first dashboard with Quick Send / Bulk Send tabs, 3-page navigation + account menu, collapsible onboarding drawer, stat strip + recent activity, request detail drawer with resend/cancel, dead code cleanup

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans

## Blockers & Concerns

- Resend FROM email domain verification needed for production
- Google OAuth provider must be configured in Supabase dashboard
- CRON_SECRET env var must be set before deployment
- Production domain and Vercel deployment configuration pending

## Decisions

| ID | Decision | Context | Date |
|----|----------|---------|------|
| nav-simplification | Reduced navigation from 5+4 items to 3 main + account dropdown | Phase 19-01 | 2026-02-01 |
| account-menu-pattern | Shared AccountMenu component for sidebar and mobile | Phase 19-01 | 2026-02-01 |
| logo-link-change | Logo links to /send instead of /dashboard | Phase 19-01 | 2026-02-01 |
| youtube-style-progress | Thin 2px progress bar for route transitions | Phase 19-02 | 2026-02-01 |
| toast-durations | 6s for actionable toasts, 5s for errors | Phase 19-02 | 2026-02-01 |
| compact-preview-default | Default to compact mode with expand/collapse | Phase 19-03 | 2026-02-01 |
| remove-inline-editing | MessagePreview is read-only | Phase 19-03 | 2026-02-01 |
| pill-drawer-pattern | Onboarding as collapsible pill + drawer | Phase 19-04 | 2026-02-01 |
| filter-chip-or-logic | Multiple active filters use OR logic | Phase 19-06 | 2026-02-01 |
| sticky-bar-positioning | Fixed bottom with sidebar offset | Phase 19-06 | 2026-02-01 |
| drawer-right-side | Detail drawer opens from right | Phase 19-07 | 2026-02-01 |
| hover-reveal-actions | Row actions visible on hover | Phase 19-07 | 2026-02-01 |

## Session Continuity

**Last session:** 2026-02-01
**Stopped at:** Milestone v1.4 started — researching
**Resume file:** None
**Next action:** Complete research, define requirements, create roadmap for v1.4 Landing Page Redesign
