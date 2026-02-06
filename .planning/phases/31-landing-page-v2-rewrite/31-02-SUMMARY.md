---
phase: 31-landing-page-v2-rewrite
plan: 02
subsystem: ui
tags: [marketing, landing-page, v2-philosophy, copy]

# Dependency graph
requires:
  - phase: 31-01
    provides: Hero section V2 rewrite
provides:
  - V2-aligned Problem/Solution section copy
  - V2-aligned How It Works workflow steps
  - JobStatus type fix for 'scheduled' state
affects: [31-03, 31-04, 31-05, landing-page-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "V2 pain points focus on automation gaps, not tool complexity"
    - "How It Works steps mirror actual V2 workflow (job -> enroll -> automation)"

key-files:
  created: []
  modified:
    - components/marketing/v2/problem-solution.tsx
    - components/marketing/v2/how-it-works.tsx
    - lib/types/database.ts

key-decisions:
  - "Pain points: forgotten follow-ups, no multi-touch system, bad review risk"
  - "Steps: Complete a Job, System Auto-Enrolls, Automation Runs"

patterns-established:
  - "V2 copy pattern: Emphasize automation and minimal user effort"
  - "V2 workflow pattern: One user action triggers full automation"

# Metrics
duration: 6min
completed: 2026-02-06
---

# Phase 31 Plan 02: Problem/Solution and How It Works V2 Rewrite Summary

**V2-aligned marketing copy replacing V1 manual workflow (Add Contact, Write Message, Send) with automation workflow (Complete Job, Auto-Enroll, Automation Runs)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-06T06:46:00Z
- **Completed:** 2026-02-06T06:52:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Replaced V1 pain points with V2 automation-focused pain points
- Rewrote How It Works to show V2 job-centric workflow
- Fixed pre-existing JobStatus type missing 'scheduled' value

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite problem-solution.tsx for V2** - `bb67d88` (feat)
2. **Task 2: Rewrite how-it-works.tsx for V2** - `26485d4` (feat)

## Files Created/Modified

- `components/marketing/v2/problem-solution.tsx` - V2 pain points: Forgotten Follow-Ups, No Follow-Up System, Bad Review Risk
- `components/marketing/v2/how-it-works.tsx` - V2 workflow: Complete a Job, System Auto-Enrolls, Automation Runs
- `lib/types/database.ts` - Added 'scheduled' to JobStatus type

## Decisions Made

1. **Pain point framing:** Changed from "Complex Tools" (which contradicts V2 since campaigns ARE the product) to "No Follow-Up System" (lack of automation)
2. **Step titles:** Used action-oriented titles that match V2 philosophy document exactly
3. **Copy emphasis:** Focus on time savings ("10 seconds", "50+ hour weeks") and automation ("system handles the rest")

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added 'scheduled' to JobStatus type**
- **Found during:** Task 2 verification (typecheck)
- **Issue:** `lib/types/database.ts` JobStatus type only had 'completed' | 'do_not_send', missing 'scheduled' added in V2 job lifecycle
- **Fix:** Updated type to include 'scheduled' as first value
- **Files modified:** lib/types/database.ts
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `26485d4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Pre-existing type inconsistency that blocked typecheck. Fix aligns type with V2 job lifecycle spec.

## Issues Encountered

None - plan executed smoothly after type fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Problem/Solution and How It Works sections ready for visual testing
- Screenshot placeholders remain in How It Works (separate concern)
- Ready for Plan 03 (Social Proof), Plan 04 (FAQ), Plan 05 (Final CTA)

---
*Phase: 31-landing-page-v2-rewrite*
*Completed: 2026-02-06*
