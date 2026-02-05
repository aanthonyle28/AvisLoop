---
phase: 27-dashboard-redesign
plan: 04
subsystem: ui
tags: [react, server-actions, dashboard, alerts, supabase]

# Dependency graph
requires:
  - phase: 27-01
    provides: Dashboard data layer with getAttentionAlerts
  - phase: 24
    provides: Campaign enrollments and send_logs schema
  - phase: 26
    provides: Customer feedback table
provides:
  - Attention alerts component with severity-sorted display
  - Retry and acknowledge server actions for alert management
  - [ACK] prefix pattern for acknowledged alerts
affects: [27-05, 27-06, 27-07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "[ACK] prefix pattern for marking acknowledged alerts"
    - "Contextual actions per alert type (not generic retry)"
    - "useTransition for server action loading states"

key-files:
  created:
    - components/dashboard/attention-alerts.tsx
  modified:
    - lib/actions/dashboard.ts

key-decisions:
  - "Acknowledged alerts marked with [ACK] prefix in error_message field"
  - "Only failed sends are retryable, bounced emails require contact update"
  - "Overflow menu for acknowledge action (permanent failures)"
  - "Show 3 alerts by default, expandable to view all"

patterns-established:
  - "Retry action resets failed sends to pending for cron pickup"
  - "Acknowledge action prepends [ACK] to error_message to filter out alert"
  - "getAttentionAlerts excludes [ACK]% alerts from query"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 27 Plan 04: Attention Alerts Summary

**Severity-sorted alerts with contextual inline actions (Retry/Update contact/Respond) and acknowledge mechanism for permanent failures**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-04T18:40:09Z
- **Completed:** 2026-02-04T18:43:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Server actions for retry (failed sends) and acknowledge (permanent failures)
- Attention alerts component with severity ordering (critical > warning > info)
- Contextual actions per alert type (not generic retry button)
- Expand/collapse for 3+ alerts with reassuring empty state
- Loading skeleton for progressive enhancement

## Task Commits

Each task was committed atomically:

1. **Task 1: Add retrySend and acknowledgeAlert server actions** - `f07b1e2` (fix - restored quickEnrollJob)
2. **Task 2: Create Attention Alerts component** - `f1b78e4` (feat)

## Files Created/Modified
- `lib/actions/dashboard.ts` - Added retrySend and acknowledgeAlert server actions (also restored quickEnrollJob from 27-03)
- `components/dashboard/attention-alerts.tsx` - Severity-sorted alerts with contextual actions and empty state

## Decisions Made

**Acknowledge mechanism:** Mark alerts as acknowledged by prepending `[ACK]` to error_message field instead of adding new column. This keeps schema changes minimal and allows data layer to filter with `.not('error_message', 'like', '[ACK]%')`.

**Contextual actions:** Each alert type gets a specific action (failed: Retry, bounced: Update contact, feedback: Respond) instead of generic "Fix" or "Retry" buttons. Makes it clear what user needs to do.

**Overflow menu for acknowledge:** Permanent failures (bounced, STOP) show acknowledge in overflow menu, not as primary action. Forces deliberate choice instead of casual dismissal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored quickEnrollJob function**
- **Found during:** Task 1 (Creating dashboard actions file)
- **Issue:** Initial commit accidentally overwrote quickEnrollJob from Plan 27-03 due to parallel execution
- **Fix:** Merged quickEnrollJob implementation from commit 26ced19 with retrySend and acknowledgeAlert
- **Files modified:** lib/actions/dashboard.ts
- **Verification:** All three functions exported, typecheck passes
- **Committed in:** f07b1e2 (amended commit)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Necessary to restore parallel plan's work. No scope changes.

## Issues Encountered

Parallel execution with Plan 27-03: Both plans modified lib/actions/dashboard.ts simultaneously. Initial Task 1 commit overwrote quickEnrollJob. Detected immediately and fixed by merging both implementations. This is expected behavior when plans modify the same file - each plan's commits are atomic and can be merged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Attention alerts component ready for dashboard integration
- retrySend and acknowledgeAlert actions available for any alert UI
- [ACK] pattern established for future alert filtering needs
- Ready for Phase 27-05 (Ready-to-Send Queue) and 27-06 (Dashboard page integration)

---
*Phase: 27-dashboard-redesign*
*Completed: 2026-02-04*
