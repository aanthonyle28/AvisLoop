---
phase: 45-foundation-visual-changes
plan: "03"
subsystem: ui
tags: [dashboard, ready-to-send-queue, attention-alerts, card-styling, empty-states]

# Dependency graph
requires:
  - phase: 45-01
    provides: soft button variant and dashboard audit foundation
provides:
  - Card-style rows in Ready to Send queue (space-y-2 + rounded-lg border border-border bg-card)
  - Card-style rows in Needs Attention queue (same card pattern)
  - Skeleton rows updated to match live card pattern in both queues
  - Ready to Send no-history empty state: solid border with bg-card
  - Needs Attention empty state: solid border card (no bare floating text)
  - Add Jobs button in empty state wired to openAddJob() drawer trigger
affects: [dashboard visual polish, any future queue components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Queue row card pattern: space-y-2 container + rounded-lg border border-border bg-card per row"
    - "Empty state solid border pattern: rounded-lg border border-border bg-card (no border-dashed)"
    - "Drawer trigger from dashboard: useAddJob() hook from add-job-provider"

key-files:
  created: []
  modified:
    - components/dashboard/ready-to-send-queue.tsx
    - components/dashboard/attention-alerts.tsx

key-decisions:
  - "Queue rows use space-y-2 (not divide-y) + individual card borders for visual separation"
  - "Empty states use solid border + bg-card — no dashed borders anywhere in dashboard queues"
  - "Add Jobs button in empty state opens drawer via useAddJob() instead of navigating to /jobs"
  - "Skeleton rows mirror live row card styling to prevent layout shift on load"

patterns-established:
  - "Card row pattern: space-y-2 container, each row gets rounded-lg border border-border bg-card"
  - "Empty state border pattern: border border-border bg-card (1px solid, white background)"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 45 Plan 03: Queue Row Card Styling, Empty State Solid Borders, Add Jobs Drawer Trigger Summary

**Queue rows converted to individual card units with rounded borders and bg-card backgrounds; empty states use solid borders; Add Jobs drawer wired directly from dashboard empty state**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T00:20:11Z
- **Completed:** 2026-02-26T00:21:30Z
- **Tasks:** 4
- **Files modified:** 2

## Accomplishments
- Ready to Send and Needs Attention queue rows now render as individual card units (space-y-2 + rounded-lg border border-border bg-card) instead of flat divide-y rows
- Skeleton rows in both ReadyToSendQueueSkeleton and AttentionAlertsSkeleton updated to match the live card pattern for visual consistency during loading
- Both empty states converted to solid bordered cards (border border-border bg-card) — no more dashed borders or bare floating text
- Add Jobs button in Ready to Send no-history empty state now opens the Add Job drawer directly via useAddJob() hook instead of navigating away to /jobs

## Task Commits

Each task was committed atomically:

1. **Task 1: DQ-01 card-style rows in Ready to Send queue** - `b9bd755` (feat)
2. **Task 2: DQ-01 card-style rows in Needs Attention queue** - `ac9f2d9` (feat)
3. **Task 3: DQ-02+DQ-04 Ready to Send empty state solid border + drawer trigger** - `757e127` (feat)
4. **Task 4: DQ-03 Needs Attention empty state solid border** - `f82af58` (feat)

## Files Created/Modified
- `components/dashboard/ready-to-send-queue.tsx` - Card rows (space-y-2 + border), solid empty state, useAddJob hook wired
- `components/dashboard/attention-alerts.tsx` - Card rows (space-y-2 + border), solid empty state for all-clear

## Decisions Made
- No padding added to the outer row div in ReadyToSendQueue — children (button + actions div) already provide it; adding outer padding would create dead click space on the left button
- Skeleton rows match live rows exactly so there is no layout shift when data loads

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard queue visual changes complete; ready for any remaining 45-phase work
- Card pattern established: space-y-2 + rounded-lg border border-border bg-card — reusable for future list components

---
*Phase: 45-foundation-visual-changes*
*Completed: 2026-02-26*
