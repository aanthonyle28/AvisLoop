---
phase: 40-dashboard-command-center
plan: 03
subsystem: ui
tags: [react, sidebar, dashboard, checklist, notification]

# Dependency graph
requires:
  - phase: 40-01
    provides: DashboardShell, RightPanel, useDashboardPanel foundation types
provides:
  - NotificationBell removed from sidebar and mobile header
  - Dashboard nav badge wired to combined count (ready-to-send + needs-attention)
  - RightPanelGettingStarted component with full and compact modes
  - Setup progress pill/drawer suppressed on /dashboard
affects:
  - 40-02 (dashboard page refactor will integrate RightPanelGettingStarted)
  - 40-04 (right panel rendering will use RightPanelGettingStarted)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard nav badge: dashboardBadge prop threaded from layout.tsx -> AppShell -> Sidebar, wired to Dashboard nav item only"
    - "Route-based suppression: setup-progress suppresses on /dashboard via usePathname() check"
    - "Right panel component modes: full (pre-first-job) vs compact (post-first-job, pre-review) vs null (complete)"

key-files:
  created:
    - components/dashboard/right-panel-getting-started.tsx
  modified:
    - components/layout/sidebar.tsx
    - components/layout/app-shell.tsx
    - components/layout/page-header.tsx
    - app/(dashboard)/layout.tsx
    - components/onboarding/setup-progress.tsx

key-decisions:
  - "NotificationBell left as dead code file, not deleted — safe to remove later if desired"
  - "RightPanelGettingStarted returns null when all complete OR first_review_click is true (funnel success = onboarding done)"
  - "Compact mode triggers on first_job_added=true (not all-complete) — shows only incomplete items with tighter padding"

patterns-established:
  - "Dashboard badge: only Dashboard nav item gets badge; others get undefined — prevents per-page badge complexity"
  - "Route suppression pattern: client component uses usePathname() to return null for specific routes"

# Metrics
duration: 12min
completed: 2026-02-24
---

# Phase 40 Plan 03: Layout Cleanup — Notification Bell Removal + Getting Started Right Panel Component

**NotificationBell removed from sidebar and mobile header; dashboard nav badge restored; RightPanelGettingStarted component created with full/compact modes; setup-progress pill suppressed on /dashboard**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-24T00:00:00Z
- **Completed:** 2026-02-24T00:12:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Removed NotificationBell from sidebar footer and mobile page header entirely (DN-02)
- Wired `dashboardBadge` prop to the Dashboard nav item (was `badge: undefined`) — badge now shows combined count (DN-01)
- Simplified layout.tsx — removed `notificationCounts` variable, only `dashboardBadge` (counts.total) needed
- Created `RightPanelGettingStarted` with full card (pre-first-job), compact card (post-first-job/pre-review), and null (all done) modes (GS-01, GS-02)
- Suppressed setup progress pill/drawer on `/dashboard` always — was only suppressed when `completedCount === 0` (GS-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove NotificationBell and restore dashboard nav badge** - `eb91267` (refactor)
2. **Task 2: Create Getting Started right panel component and suppress pill/drawer on dashboard** - `7cb6677` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/layout/sidebar.tsx` - Removed NotificationBell import+render, removed notificationCounts prop, wired dashboardBadge to Dashboard nav item
- `components/layout/app-shell.tsx` - Removed notificationCounts from props and Sidebar/PageHeader render
- `components/layout/page-header.tsx` - Removed NotificationBell import, notificationCounts prop, and bell render from mobile header
- `app/(dashboard)/layout.tsx` - Removed notificationCounts variable; only dashboardBadge (counts.total) passed to AppShell
- `components/onboarding/setup-progress.tsx` - Suppressed on /dashboard always (was: only when completedCount === 0)
- `components/dashboard/right-panel-getting-started.tsx` - New component: full/compact/null modes based on checklist state

## Decisions Made
- `notification-bell.tsx` kept as dead code file rather than deleted — harmless, can be removed later
- `RightPanelGettingStarted` returns null when `first_review_click` is true (funnel success is the signal that onboarding is done, regardless of other items)
- Compact mode triggers on `first_job_added === true` (not "majority complete") — first job is the meaningful milestone

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Layout cleanup complete; sidebar and header no longer reference NotificationBell
- `RightPanelGettingStarted` ready to be integrated into the right panel in Plan 40-02 or 40-04
- Setup progress pill will render on /jobs, /campaigns, etc. but not /dashboard — correct behavior
- Plans 40-02 (dashboard page refactor) can now import and render `RightPanelGettingStarted` in the right panel slot

---
*Phase: 40-dashboard-command-center*
*Completed: 2026-02-24*
