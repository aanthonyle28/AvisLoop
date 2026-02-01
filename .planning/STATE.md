# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Milestone v1.3 — Dashboard UX Overhaul

## Current Position

**Phase:** 20 of 27 (Status Badges & Layout Fixes)
**Plan:** 02 of 02 complete
**Status:** Phase complete
**Last activity:** 2026-02-01 — Completed 20-02-PLAN.md (layout fixes)

**Progress:** [████████████████████████████░] 76/77+ total plans complete

```
v1.0 MVP:           ████████████████████████████████████████████████ 48/48 SHIPPED
v1.1 Scheduled:     █████ 5/5 SHIPPED
v1.2 Onboarding:    █████████ 9/9 SHIPPED
v1.2.1 Tech Debt:   ████ 4/4 SHIPPED
Phase 19 UX:        ████████ 8/8 COMPLETE
Phase 20 Layout:    ██ 2/2 COMPLETE
v1.4 Landing Page:  ░░░░░░░░ 0/4 NOT STARTED
```

## What's Been Built

See .planning/MILESTONES.md for full history.

- **v1.0 MVP:** Auth, business profiles, contacts, sending, history, billing, onboarding, public pages, polish, bulk send
- **v1.1 Scheduled Sending:** Cron processing, scheduling UI, scheduled send management
- **v1.2 Onboarding Redesign:** Design system overhaul, dashboard redesign, Google OAuth, simplified onboarding
- **v1.2.1 Tech Debt:** Migration fix, Phase 4 verification, code cleanup, history pagination
- **Phase 19 UX/UI Redesign:** Send-first dashboard, 3-page nav, onboarding drawer, stat/activity strips, request detail drawer
- **Phase 20 Layout Fixes:** Unified status badges, sticky settings header, optimized activity strip layout

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase (Postgres + Auth), Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans

## Blockers & Concerns

- Resend FROM email domain verification needed for production
- Google OAuth provider must be configured in Supabase dashboard
- CRON_SECRET env var must be set before deployment
- Phase 22 (v1.3) requires DB migration (notes column on contacts table)
- v1.4 hero section user testing needed with 5-10 local business owners before build
- v1.4 performance budget must be enforced (LCP <2.5s, CLS <0.1)

## Decisions

| ID | Decision | Context | Date |
|----|----------|---------|------|
| sticky-header-frosted-glass | Use backdrop-blur with bg-background/95 for modern sticky header UX | Phase 20-02 | 2026-02-01 |
| shrink-truncation-pattern | Non-last chips shrink-0, last chip truncates for optimal horizontal fill | Phase 20-02 | 2026-02-01 |
| inline-styles-for-figma-colors | Use inline styles with exact hex values instead of Tailwind classes for status badges | Figma spec requires precise colors not in Tailwind palette | 2026-02-01 |
| legacy-status-normalization | Normalize legacy status strings to 6 canonical statuses via normalizeStatus function | Maintains backwards compatibility with database/Resend status values | 2026-02-01 |
| css-first-animations | Use CSS-first animation strategy with selective JavaScript | v1.4 Phase 24 | 2026-02-01 |
| v2-component-directory | New landing page components in components/marketing/v2/ for safe migration | v1.4 architecture | 2026-02-01 |
| mobile-first-design | Design mobile layout first (320-428px), then scale up | v1.4 responsive strategy | 2026-02-01 |
| outcome-focused-copy | Use outcome language ("Get 3x more reviews") not feature lists | v1.4 messaging | 2026-02-01 |
| badge-unification | Single StatusBadge component replaces all ad-hoc badge implementations | v1.3 Phase 20 | 2026-02-01 |
| drawer-right-side | Detail drawer opens from right | Phase 19-07 | 2026-02-01 |
| compact-preview-default | Default to compact mode with expand/collapse | Phase 19-03 | 2026-02-01 |
| pill-drawer-pattern | Onboarding as collapsible pill + drawer | Phase 19-04 | 2026-02-01 |

## Session Continuity

**Last session:** 2026-02-01
**Stopped at:** Phase 20 complete, verified ✓
**Resume file:** None
**Next action:** `/gsd:plan-phase 21`
