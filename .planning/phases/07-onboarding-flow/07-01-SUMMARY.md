---
phase: 07-onboarding-flow
plan: 01
subsystem: database
tags: [supabase, onboarding, migration, server-action]

# Dependency graph
requires:
  - phase: 02-business-setup
    provides: businesses table with user_id
  - phase: 03-contact-management
    provides: contacts table with business_id
  - phase: 04-core-sending
    provides: send_logs table with business_id
provides:
  - onboarding_completed_at column on businesses table
  - onboarding_steps_completed JSONB column for granular tracking
  - getOnboardingStatus() data layer function
  - markOnboardingComplete() server action
affects: [07-02, 07-03, 07-04, dashboard-checklist, onboarding-wizard]

# Tech tracking
tech-stack:
  added: []
  patterns: [count query with head:true for existence checks]

key-files:
  created:
    - supabase/migrations/00008_add_onboarding.sql
    - lib/data/onboarding.ts
    - lib/actions/onboarding.ts
  modified: []

key-decisions:
  - "Use JSONB for onboarding_steps_completed to allow flexible step tracking"
  - "Partial index on user_id WHERE onboarding_completed_at IS NULL for admin queries"
  - "Count queries with { count: 'exact', head: true } pattern for step existence checks"

patterns-established:
  - "OnboardingStatus type with boolean steps object for UI rendering"
  - "Server action returns { success: boolean, error?: string } pattern"

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 7 Plan 1: Onboarding Data Layer Summary

**Database schema and data layer for tracking onboarding completion with 4-step status checks (business, review link, contacts, sent messages)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T10:00:00Z
- **Completed:** 2026-01-27T10:04:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Migration adding onboarding tracking columns to businesses table
- Data layer function that queries all 4 onboarding steps from database
- Server action to mark onboarding complete with cache invalidation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create onboarding migration** - `794c20a` (feat)
2. **Task 2: Create onboarding data layer** - `2223f53` (feat)
3. **Task 3: Create markOnboardingComplete server action** - `186ec74` (feat)

## Files Created/Modified
- `supabase/migrations/00008_add_onboarding.sql` - Adds onboarding_completed_at and onboarding_steps_completed columns with partial index
- `lib/data/onboarding.ts` - Exports OnboardingStatus type and getOnboardingStatus function
- `lib/actions/onboarding.ts` - Exports markOnboardingComplete server action

## Decisions Made
- [07-01] Use JSONB array for onboarding_steps_completed to support granular step tracking
- [07-01] Partial index on user_id WHERE onboarding_completed_at IS NULL for efficient incomplete onboarding queries
- [07-01] Count queries use { count: 'exact', head: true } pattern (no data transfer, just count)
- [07-01] getOnboardingStatus returns null for unauthenticated users (not throwing)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**Migration requires manual application.** Run in Supabase SQL Editor:
1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/00008_add_onboarding.sql`
3. Run the migration
4. Verify with the verification queries in the migration comments

## Next Phase Readiness
- Data layer ready for wizard UI (07-02, 07-03)
- Dashboard checklist (07-04) can use getOnboardingStatus()
- markOnboardingComplete() available for wizard completion flow

---
*Phase: 07-onboarding-flow*
*Completed: 2026-01-27*
