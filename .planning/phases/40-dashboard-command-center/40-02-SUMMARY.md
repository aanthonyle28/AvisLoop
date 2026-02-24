---
phase: 40-dashboard-command-center
plan: 02
subsystem: ui
tags: [react, typescript, context, layout, dashboard, two-column]

# Dependency graph
requires:
  - phase: 40-01
    provides: DashboardShell, RightPanel, useDashboardPanel hook, RightPanelView types
provides:
  - RightPanelDefault component: compact KPI cards + pipeline counters + activity feed for right panel
  - Refactored ReadyToSendQueue: compact rows, Enroll All button, onSelectJob/selectedJobId props
  - Refactored AttentionAlerts: compact rows with colored left borders, onSelectAlert/selectedAlertId props
  - DashboardClient component: two-column layout wiring, header with greeting + subtitle + action buttons
  - Dashboard page updated to use DashboardShell two-column layout
affects:
  - 40-03 through 40-08 (all subsequent plans building on two-column layout)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inner/outer component pattern for React context access in DashboardClient (DashboardContent uses useDashboardPanel inside DashboardShell children)
    - Compact row pattern for left-column task lists (no Card wrapper, hover/selected state)
    - Colored left border (border-l-2) for severity indication in alert rows
    - Enroll All bulk action with AlertDialog confirmation listing all jobs

key-files:
  created:
    - components/dashboard/right-panel-default.tsx
    - components/dashboard/dashboard-client.tsx
  modified:
    - components/dashboard/kpi-widgets.tsx (exported TrendIndicator)
    - components/dashboard/ready-to-send-queue.tsx (compact rows, Enroll All, onSelectJob)
    - components/dashboard/attention-alerts.tsx (compact rows, colored borders, onSelectAlert)
    - app/(dashboard)/dashboard/page.tsx (uses DashboardClient)

key-decisions:
  - "DashboardContent inner component placed as children of DashboardShell so useDashboardPanel context is available when row click handlers are wired"
  - "Enroll All only shows enrollable jobs (completed, no conflict, has campaign, not one_off) in confirmation list"
  - "onSelectJob falls back to handleViewJob (existing drawer behavior) when no handler provided — preserves Jobs page compatibility"
  - "Alert rows keep inline action buttons (Retry, Acknowledge, etc.) even in compact form — detail panel content added in Plan 04"

patterns-established:
  - "Compact list row pattern: flex items-center, py-2.5 px-3, rounded-md, hover:bg-muted/50, bg-muted when selected"
  - "Severity border pattern: border-l-2 border-l-{destructive|warning|info} for alert rows"
  - "DashboardClient outer/inner split: outer creates panel content nodes, inner accesses panel state via context"

# Metrics
duration: 5min
completed: 2026-02-24
---

# Phase 40 Plan 02: Dashboard Command Center Layout Wiring Summary

**Two-column dashboard command center with compact task lists, right panel KPI/activity feed, Enroll All bulk action, and dynamic greeting subtitle**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-24T04:47:44Z
- **Completed:** 2026-02-24T04:52:23Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created `RightPanelDefault`: 3 compact KPI cards with TrendIndicator, 3-column pipeline counters (Sent/Active/Queued), and recent activity feed with up to 5 events
- Refactored `ReadyToSendQueue`: removed Card wrapper, compact hover rows, Enroll All button with AlertDialog confirmation listing all job names, `onSelectJob`/`selectedJobId` props for right panel integration
- Refactored `AttentionAlerts`: removed Card wrapper, compact rows with `border-l-2` severity colors (red=critical, amber=warning, blue=info), `onSelectAlert`/`selectedAlertId` props
- Created `DashboardClient`: wires DashboardShell with greeting header, dynamic subtitle showing job/alert counts, Add Job + View Campaigns action buttons
- Updated dashboard page to pass all server-fetched data to DashboardClient

## Task Commits

Each task was committed atomically:

1. **Task 1: Create right panel default content component** - `95b0031` (feat)
2. **Task 2: Refactor left column lists and wire dashboard page to two-column layout** - `0979a89` (feat)

**Plan metadata:** (committed with SUMMARY+STATE update)

## Files Created/Modified
- `components/dashboard/right-panel-default.tsx` - New: compact KPI cards, pipeline counters, activity feed for right panel default view
- `components/dashboard/dashboard-client.tsx` - New: DashboardShell wrapper with DashboardContent inner component for context access, greeting header, dynamic subtitle, action buttons
- `components/dashboard/kpi-widgets.tsx` - Modified: exported TrendIndicator for reuse in RightPanelDefault
- `components/dashboard/ready-to-send-queue.tsx` - Modified: compact rows, removed Card wrapper, Enroll All with confirmation, onSelectJob/selectedJobId props
- `components/dashboard/attention-alerts.tsx` - Modified: compact rows with colored left borders, removed Card wrapper, onSelectAlert/selectedAlertId props
- `app/(dashboard)/dashboard/page.tsx` - Modified: replaced old single-column layout with DashboardClient

## Decisions Made
- Inner/outer split for `DashboardClient`: outer component creates `RightPanelDefault` node and passes to `DashboardShell`, inner `DashboardContent` runs as children inside `DashboardShell` so `useDashboardPanel()` context is available to wire `onSelectJob`/`onSelectAlert` handlers
- `onSelectJob` falls back to `handleViewJob` (existing drawer) when no prop provided — ensures backward compatibility if component is ever used outside dashboard context
- Alert rows keep their inline action buttons (Retry, Update Email, Review Feedback) even in compact row form — the right panel detail view (Plan 04) will provide additional context, not replace the inline actions
- Enroll All button only appears when there are enrollable jobs (completed, no conflict, has matching campaign, not one_off) to avoid showing a button that would do nothing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Two-column layout is fully wired: dashboard renders DashboardShell with left column + right panel
- `useDashboardPanel().setPanelView({ type: 'job-detail', jobId })` is called when job rows are clicked
- `useDashboardPanel().setPanelView({ type: 'attention-detail', alertId })` is called when alert rows are clicked
- Plan 03 can implement job detail content for right panel (the `detailContent` prop currently passes `null`)
- Plan 04 can wire `detailContent` with actual job/alert detail views

---
*Phase: 40-dashboard-command-center*
*Completed: 2026-02-24*
