---
phase: 56-additional-business-creation
plan: 56-01
subsystem: api
tags: [server-actions, supabase, multi-tenancy, onboarding, middleware]

# Dependency graph
requires:
  - phase: 52-active-business-context
    provides: getActiveBusiness() pattern (deliberately NOT used here)
  - phase: 53-data-function-refactor
    provides: explicit businessId parameter pattern
  - phase: 55-clients-page
    provides: /businesses route that middleware now protects
provides:
  - createAdditionalBusiness() — pure INSERT server action (never upsert)
  - saveNewBusinessServices() — scoped UPDATE with explicit businessId
  - createNewBusinessCampaign() — inline preset duplication without getActiveBusiness()
  - completeNewBusinessOnboarding() — sets sms_consent + onboarding_completed_at on explicit businessId
  - /onboarding?mode=new bypasses completed-onboarding redirect
  - /businesses protected by middleware auth guard
affects:
  - 56-02 (CreateBusinessWizard UI — consumes all 4 actions)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Insert-only business creation: .insert() with user_id, NO .upsert()"
    - "Explicit businessId scoping: every action takes businessId param + .eq('user_id', user.id) ownership guard"
    - "Inline preset duplication: avoids getActiveBusiness() by accepting businessId directly"
    - "Mode-based route bypass: ?mode=new on /onboarding skips completed-redirect"

key-files:
  created:
    - lib/actions/create-additional-business.ts
  modified:
    - app/onboarding/page.tsx
    - middleware.ts
    - lib/actions/send.ts

key-decisions:
  - "createAdditionalBusiness uses .insert() only — never .upsert(), never conditional create-or-update"
  - "All .update() calls include .eq('user_id', user.id) as ownership guard in addition to RLS"
  - "createNewBusinessCampaign inlines duplicateCampaign() logic to avoid getActiveBusiness() dependency"
  - "isNewBusinessMode derived from params.mode === 'new' before the completed-onboarding redirect check"
  - "/businesses added to APP_ROUTES in middleware so unauthenticated users redirect to /login"

patterns-established:
  - "Additional business actions: always accept explicit businessId, never call getActiveBusiness()"
  - "Ownership guard pattern: .eq('id', businessId).eq('user_id', user.id) on every UPDATE"

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 56 Plan 01: Insert-only server actions + onboarding routing for additional businesses Summary

**Four scoped server actions (insert-only business creation, services save, campaign duplication, onboarding completion) plus ?mode=new bypass on /onboarding and /businesses middleware auth guard**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-27T19:54:42Z
- **Completed:** 2026-02-27T19:57:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `lib/actions/create-additional-business.ts` with 4 exported server actions, zero `getActiveBusiness()` calls, zero `.upsert()` calls
- All 3 `.update()` calls protected by both `.eq('id', businessId)` and `.eq('user_id', user.id)` ownership guard
- `/onboarding?mode=new` no longer redirects to `/dashboard` even for users who completed first-business onboarding
- `/businesses` added to middleware `APP_ROUTES` — unauthenticated users redirected to `/login`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create insert-only server actions** - `58bdb9b` (feat)
2. **Task 2: Onboarding page + middleware** - `4fcc60c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/actions/create-additional-business.ts` — 4 server actions for additional business creation (NEW)
- `app/onboarding/page.tsx` — searchParams extended with `mode?: string`, redirect now conditional on `!isNewBusinessMode`
- `middleware.ts` — `/businesses` added to `APP_ROUTES` array
- `lib/actions/send.ts` — Removed dead `getMonthlyCount()` helper (orphaned by prior session refactor)

## Decisions Made
- `createAdditionalBusiness` uses `.insert()` only — never `.upsert()`, never conditional create-or-update. This is the key safety invariant for multi-business creation.
- All `.update()` calls include `.eq('user_id', user.id)` as an ownership guard in addition to RLS — defense in depth.
- `createNewBusinessCampaign` inlines `duplicateCampaign()` logic rather than calling the existing function, because the existing function calls `getActiveBusiness()` internally. Inlining is the cleanest solution with no coupling.
- `isNewBusinessMode` is derived before the completed-onboarding redirect check (moved `params = await searchParams` earlier in the function).
- `/businesses` added to `APP_ROUTES` so middleware auth protection is consistent with all other dashboard routes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed orphaned `getMonthlyCount()` from `lib/actions/send.ts`**
- **Found during:** Task 1 (lint run after creating new actions file)
- **Issue:** `getMonthlyCount()` was defined but never called — its callers were replaced by `getPooledMonthlyUsage()` in a prior session refactor, but the dead function was left in place, causing ESLint `no-unused-vars` error
- **Fix:** Removed the 17-line `getMonthlyCount()` helper function entirely
- **Files modified:** `lib/actions/send.ts`
- **Verification:** `pnpm lint` passes after removal
- **Committed in:** `58bdb9b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — dead code)
**Impact on plan:** Required to unblock lint. No scope creep — dead code removal only.

## Issues Encountered
None — plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 server actions are ready for Plan 56-02 to consume
- Plan 56-02 will add `CreateBusinessWizard` component and wire the conditional render in `app/onboarding/page.tsx`
- No blockers

---
*Phase: 56-additional-business-creation*
*Completed: 2026-02-27*
