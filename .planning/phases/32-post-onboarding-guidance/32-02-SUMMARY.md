---
phase: 32-post-onboarding-guidance
plan: 02
subsystem: ui
tags: [react, server-actions, onboarding, checklist, dashboard]

# Dependency graph
requires:
  - phase: 32-01
    provides: OnboardingChecklist type and database schema (JSONB column)
provides:
  - getChecklistState() server function for computing checklist from actual data
  - updateChecklistState() server action for dismiss/collapse/expand/markSeen
  - GettingStartedChecklist component for dashboard display
affects: [32-03, 32-04, dashboard-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Auto-detection from actual data counts (not manual tracking)
    - Parallel Supabase queries for performance
    - JSONB merge pattern for partial updates

key-files:
  created:
    - lib/data/checklist.ts
    - lib/actions/checklist.ts
    - components/onboarding/getting-started-checklist.tsx
  modified: []

key-decisions:
  - "Checklist completion computed from actual data (jobs, campaigns, enrollments) not manual flags"
  - "4 V2-aligned items: add job, review campaign, complete job, get review click"
  - "Auto-collapse after 3 days of first viewing (reduces friction for returning users)"
  - "Review click tracked via campaign_enrollments.stop_reason = 'review_clicked'"

patterns-established:
  - "Data-driven checklist: Query real counts instead of storing completion flags"
  - "JSONB merge pattern: Spread existing object before updating specific keys"
  - "markSeen action: Track first view timestamp for time-based behaviors"

# Metrics
duration: 8min
completed: 2026-02-06
---

# Phase 32-02: Checklist Data & Component Summary

**Server function to auto-compute checklist state from actual data, server action for dismiss/collapse, and Getting Started Checklist card component for dashboard**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-06T22:22:34Z
- **Completed:** 2026-02-06T22:30:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- getChecklistState function that queries jobs, campaigns, and enrollments in parallel
- updateChecklistState server action supporting dismiss, collapse, expand, and markSeen modes
- GettingStartedChecklist component with progress bar, linked items, and congrats state
- V2-aligned checklist items: Add job, Review campaign, Complete job, Get review click
- Auto-collapse after 3 days and first-seen tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Create checklist data function** - `a537b06` (feat)
2. **Task 2: Create dismiss checklist server action** - `3c7ee3b` (feat)
3. **Task 3: Create Getting Started Checklist component** - `fdaaf52` (feat)

## Files Created

- `lib/data/checklist.ts` - CHECKLIST_ITEMS constant and getChecklistState() for computing completion from actual data
- `lib/actions/checklist.ts` - updateChecklistState() server action for dismiss/collapse/expand/markSeen
- `components/onboarding/getting-started-checklist.tsx` - Dashboard card with progress bar, item links, dismiss button

## Decisions Made

1. **Auto-detection over manual tracking** - Checklist completion is computed from actual data counts (jobs > 0, campaigns > 0, etc.) rather than storing completion flags. More reliable and reflects true state.

2. **Review click tracking via stop_reason** - Instead of tracking "first review" ambiguously, we track actual funnel success by counting campaign_enrollments with stop_reason='review_clicked'. This is the real conversion metric.

3. **Parallel queries for performance** - All 5 queries (jobs, completed jobs, campaigns, review clicks, business) run in Promise.all for faster load.

4. **JSONB merge pattern** - Server action spreads existing checklist before updating specific keys, preserving any other data in the JSONB column.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused variable lint error**
- **Found during:** Task 3 (GettingStartedChecklist component)
- **Issue:** `setShowCongrats` was declared but never used, causing lint failure
- **Fix:** Removed state setter, use `allComplete` prop directly for congrats display
- **Files modified:** components/onboarding/getting-started-checklist.tsx
- **Verification:** `pnpm lint` passes
- **Committed in:** fdaaf52 (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor code cleanup, no scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data function ready to be called from dashboard page
- Component ready to be rendered on dashboard
- Plan 32-03 will integrate checklist into dashboard layout
- Plan 32-04 will add contextual help tooltips

---
*Phase: 32-post-onboarding-guidance*
*Completed: 2026-02-06*
