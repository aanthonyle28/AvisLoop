---
phase: 42-dashboard-navigation-polish
plan: 01
subsystem: ui
tags: [dashboard, attention-alerts, ready-to-send, phosphor-icons, react-state]

# Dependency graph
requires:
  - phase: 41-activity-page-overhaul
    provides: activity page fixes and dashboard readiness
provides:
  - AlertRow without left border, size-5 severity icons, dismiss X button (desktop + mobile)
  - dismissedIds state filtering visibleAlerts with live badge + show-more count updates
  - Ready to Send "no jobs yet" dashed-border empty state with Briefcase icon in circle
  - Skeleton rows without border-l-2, size-5 icon placeholder
affects:
  - dashboard layout
  - attention-alerts.tsx consumers

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dismissedIds: Set<string> state for lightweight UI-only alert dismissal"
    - "visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id)) filtering before slice"

key-files:
  created: []
  modified:
    - components/dashboard/attention-alerts.tsx
    - components/dashboard/ready-to-send-queue.tsx

key-decisions:
  - "Dismiss is UI-only — hides from rendered list, does not acknowledge server-side"
  - "Dashed-border empty state pattern for first-run guidance (matches empty states elsewhere)"

patterns-established:
  - "Empty state with dashed border: rounded-lg border-2 border-dashed border-border + icon circle"
  - "Dismiss pattern: local Set<string> state, filter before slice, badge uses visibleAlerts.length"

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 42 Plan 01: Dashboard Attention Alerts + Ready to Send Polish Summary

**AlertRow left-border removed with size-5 icons, dismiss button added (desktop X + mobile menu item), and Ready to Send empty state upgraded to dashed-border Briefcase design**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T04:32:11Z
- **Completed:** 2026-02-25T04:33:58Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed `border-l-2`/`getBorderColor` from AlertRow — rows now visually match Ready to Send rows
- Added dismiss capability: X button on desktop, Dismiss menu item on mobile; `dismissedIds` state filters `visibleAlerts`, badge count and show-more count update reactively
- Upgraded Ready to Send "no jobs yet" empty state to dashed-border container with `Briefcase` icon in `rounded-full bg-muted` circle — consistent with standard empty state pattern
- Updated `AttentionAlertsSkeleton` skeleton rows to `px-3` (no left border) and `size-5` icon placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix AlertRow styling, add dismiss, update skeleton** - `2ff128f` (feat)
2. **Task 2: Replace Ready to Send empty state with dashed-border design** - `eb26ec0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `components/dashboard/attention-alerts.tsx` — Removed getBorderColor, border-l-2; updated SeverityIcon to size-5; added onDismiss prop to AlertRowProps/AlertRow; added dismiss X button (desktop) and Dismiss DropdownMenuItem (mobile); added dismissedIds state + visibleAlerts filter + handleDismiss in AttentionAlerts; updated skeleton to px-3 + size-5 icon
- `components/dashboard/ready-to-send-queue.tsx` — Added Briefcase to Phosphor import; replaced bare Plus empty state with dashed-border container + Briefcase icon circle

## Decisions Made

- Dismiss is UI-only (hides from list, does not resolve underlying issue server-side) — consistent with STATE.md accumulated decision
- "All caught up" empty state intentionally unchanged — only first-run "no jobs yet" state gets dashed border treatment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint/formatter removed Briefcase from import after first Edit**
- **Found during:** Task 2 verification (pnpm lint)
- **Issue:** After the Edit tool inserted `Briefcase,` into the import block, a linter pass removed it as "unused" before the empty state edit was applied (separate Edit calls)
- **Fix:** Re-added `Briefcase` to the import after the empty state replacement was already in place
- **Files modified:** components/dashboard/ready-to-send-queue.tsx
- **Verification:** `pnpm lint` passes with no errors
- **Committed in:** eb26ec0 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking — import stripped by formatter between edits)
**Impact on plan:** Single minor tooling issue, no scope creep.

## Issues Encountered

None beyond the Briefcase import strip noted above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard attention alerts and ready-to-send queue are polished and consistent
- Ready for 42-02 (sidebar active state) and remaining Phase 42 plans
- No blockers

---
*Phase: 42-dashboard-navigation-polish*
*Completed: 2026-02-25*
