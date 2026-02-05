---
phase: 27-dashboard-redesign
plan: 05
subsystem: ui
tags: [nextjs, server-components, parallel-fetch, navigation, badges, dashboard]

# Dependency graph
requires:
  - phase: 27-01
    provides: Dashboard data functions (getDashboardKPIs, getReadyToSendJobs, getAttentionAlerts, getDashboardCounts)
  - phase: 27-02
    provides: ActionSummaryBanner and KPIWidgets components
  - phase: 27-03
    provides: ReadyToSendQueue component
  - phase: 27-04
    provides: AttentionAlerts component
provides:
  - Dashboard page at /dashboard with parallel data fetching
  - Updated navigation with Dashboard as first item
  - Attention badge system for dashboard alerts
  - Persistent "Add Job" button in sidebar
  - Mobile bottom nav with 5 key items
affects: [28-onboarding-redesign, 29-agency-mode, all-future-dashboard-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel data fetching via Promise.all in Server Components"
    - "Badge prop threading through layout hierarchy"
    - "getDashboardCounts() with internal auth pattern"

key-files:
  created:
    - app/(dashboard)/dashboard/page.tsx
  modified:
    - components/layout/sidebar.tsx
    - components/layout/bottom-nav.tsx
    - components/layout/app-shell.tsx
    - app/(dashboard)/layout.tsx
    - components/dashboard/attention-alerts.tsx

key-decisions:
  - "Dashboard link first in navigation (Home pattern)"
  - "Badge shows total attention items (ready-to-send + alerts)"
  - "getDashboardCounts called in layout for every page load"
  - "Add Job button persistent in sidebar (global action)"
  - "Requests renamed to Activity in navigation"

patterns-established:
  - "Server Component page pattern: auth check → parallel fetch → render"
  - "Badge prop passed from layout → AppShell → Sidebar"
  - "Non-critical data fetches with try/catch fallback to zero"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 27 Plan 05: Dashboard Assembly & Navigation Summary

**Dashboard page at /dashboard with parallel data fetching and updated navigation featuring attention badges and persistent Add Job button**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-05T00:47:07Z
- **Completed:** 2026-02-05T00:50:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Dashboard page assembles all four sections (banner, KPIs, queue, alerts) with parallel data fetch
- Navigation restructured with Dashboard as first item matching CONTEXT.md
- Attention badge system shows total items needing action (red badge with count)
- "Add Job" button accessible from any page via sidebar
- Mobile bottom nav expanded to 5 items for key workflows

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dashboard page with parallel data fetching** - `74cb932` (feat)
2. **Task 2: Update navigation (sidebar, bottom-nav, app-shell, layout)** - `0974918` (feat)

## Files Created/Modified
- `app/(dashboard)/dashboard/page.tsx` - Server Component assembling dashboard sections with parallel Promise.all fetch
- `components/layout/sidebar.tsx` - Dashboard nav item with badge, Add Job button, Activity rename
- `components/layout/bottom-nav.tsx` - 5-item mobile nav with Dashboard first
- `components/layout/app-shell.tsx` - Badge prop passthrough to Sidebar
- `app/(dashboard)/layout.tsx` - getDashboardCounts() fetch for badge
- `components/dashboard/attention-alerts.tsx` - Remove unused feedbackCount prop

## Decisions Made

**Dashboard link placement:** Dashboard is first nav item (House icon). Matches home/overview pattern from CONTEXT.md. Users land on dashboard to see what needs attention.

**Badge shows total count:** Badge displays `readyToSend + attentionAlerts` from getDashboardCounts(). Single number communicates "items needing action" without breakdown (breakdown visible on page).

**getDashboardCounts in layout:** Called in app/(dashboard)/layout.tsx so badge updates on every page navigation. Lightweight query (4 count queries in parallel). Non-critical fetch - badge shows 0 on error.

**Add Job persistent button:** Button added above Account section in sidebar. Always accessible (not buried in Jobs page). Links to `/jobs?action=add` to trigger add modal.

**Activity rename:** "Requests" → "Activity" per CONTEXT.md terminology. More intuitive label for send history/activity log.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused feedbackCount prop from AttentionAlerts**
- **Found during:** Task 2 (lint check)
- **Issue:** AttentionAlerts component accepted feedbackCount prop but never used it (lint error)
- **Fix:** Removed from AttentionAlertsProps interface and component signature
- **Files modified:** components/dashboard/attention-alerts.tsx, app/(dashboard)/dashboard/page.tsx
- **Verification:** pnpm lint passes
- **Committed in:** 0974918 (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor cleanup. feedbackCount was scaffolding from Plan 27-04 that wasn't actually needed.

## Issues Encountered
None

## Next Phase Readiness
- Dashboard page complete and functional
- Navigation updated for v2.0 flows
- Phase 27 has 2 remaining plans (27-06 Analytics, 27-07 Polish & Mobile)
- Ready to proceed with remaining Phase 27 plans

---
*Phase: 27-dashboard-redesign*
*Completed: 2026-02-05*
