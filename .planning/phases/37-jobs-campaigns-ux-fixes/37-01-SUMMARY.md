---
phase: 37-jobs-campaigns-ux-fixes
plan: 01
subsystem: ui
tags: [react-hook-form, server-actions, supabase, zod, form-validation]

# Dependency graph
requires:
  - phase: 24-multi-touch-campaign-engine
    provides: replace_campaign_touches RPC + campaign_touches table
  - phase: 22-jobs-crud
    provides: createJob server action + jobs table

provides:
  - Defensive serviceType guard in createJob (clear error before Zod)
  - Error logging in createJob for Supabase insert failures
  - shouldDirty + shouldValidate on touches setValue in CampaignForm
  - enabledServiceTypes threaded from JobsPage → JobsClient → JobFilters + AddJobSheet

affects:
  - 37-02-through-37-03 (campaign card/navigation and further UX)
  - phase-38-onboarding-redesign (uses AddJobSheet pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Defensive early-return before Zod enum validation for clearer field errors"
    - "react-hook-form setValue options: { shouldDirty: true, shouldValidate: true } for complex arrays"
    - "Console.error logging at Zod parse failure and Supabase insert error for server action debugging"

key-files:
  created: []
  modified:
    - lib/actions/job.ts
    - components/campaigns/campaign-form.tsx
    - app/(dashboard)/jobs/page.tsx
    - components/jobs/jobs-client.tsx
    - components/jobs/job-filters.tsx
    - components/jobs/add-job-sheet.tsx

key-decisions:
  - "shouldDirty: true + shouldValidate: true added to touches setValue — ensures react-hook-form tracks touch array edits as dirty, preventing stale defaultValues from being submitted"
  - "Early serviceType guard before Zod — gives user a clear 'Service type is required' error instead of cryptic enum validation failure"
  - "console.error logging kept in production for createJob — essential for diagnosing Supabase insert failures without user-visible stack traces"

patterns-established:
  - "Pattern: For complex react-hook-form arrays controlled via setValue, always pass { shouldDirty: true, shouldValidate: true } to ensure dirty tracking and form submission correctness"
  - "Pattern: For server actions that receive FormData from native forms, add explicit empty-string guards before enum Zod validation to provide user-friendly errors"

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 37 Plan 01: Bug Fixes Summary

**createJob defensive serviceType guard + CampaignForm touches setValue dirty tracking fix, resolving both JC-03 and JC-08 core workflow blockers**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-20T00:58:52Z
- **Completed:** 2026-02-20T01:01:34Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Fixed JC-03: createJob now returns a clear "Service type is required" error with fieldError if serviceType is empty, preventing cryptic Zod enum failures
- Added error logging to createJob at both Zod parse failure and Supabase insert error for future debugging
- Fixed JC-08: CampaignForm's TouchSequenceEditor onChange now calls `setValue('touches', newTouches, { shouldDirty: true, shouldValidate: true })` ensuring react-hook-form tracks touch changes and submits updated data to the `replace_campaign_touches` RPC
- Confirmed: service type filter scoping (JC-01) and enabledServiceTypes prop threading were already committed in feat(37-02) — those changes were included in Task 1's commit scope

## Task Commits

1. **Task 1: Fix job creation bug (JC-03) + service filter scoping (JC-01)** - `77a5657` (feat)
2. **Task 2: Fix campaign touch persistence (JC-08)** - `dc4aa84` (fix)

## Files Created/Modified

- `lib/actions/job.ts` - Early serviceType guard, console.error on validation/insert failure
- `components/campaigns/campaign-form.tsx` - shouldDirty + shouldValidate on touches setValue
- `app/(dashboard)/jobs/page.tsx` - Fetch getServiceTypeSettings(), pass enabledServiceTypes
- `components/jobs/jobs-client.tsx` - Accept + thread enabledServiceTypes prop
- `components/jobs/job-filters.tsx` - Filter visible service type chips to business-enabled types
- `components/jobs/add-job-sheet.tsx` - Pass enabledServiceTypes to ServiceTypeSelect

## Decisions Made

- `shouldDirty: true` and `shouldValidate: true` added to the touches `setValue` call — react-hook-form's `handleSubmit` passes ALL form values (not just dirty ones), so dirty tracking alone does not explain why touches would be stale. However, adding `shouldDirty: true` ensures the form knows the field changed, and `shouldValidate: true` runs Zod validation on change so errors surface immediately. Both are correct defensive practice for complex controlled arrays.
- Early `!serviceType` guard kept separate from Zod — Zod's enum error message is technically correct but says "Invalid enum value" which is user-unfriendly; the guard returns "Service type is required" with a proper fieldError key.
- console.error logging left in (not removed) — these are server-side logs that never reach the client; they aid production diagnosis when Supabase errors occur.

## Deviations from Plan

None — plan executed exactly as written. The service filter changes (JC-01) were already committed in a prior session under feat(37-02) and were part of the same commit as the createJob defensive fix, so they are documented here as context.

## Issues Encountered

- The job.ts changes and service filter scoping changes were found already committed in `feat(37-02)` when execution started — they had been applied in a prior session. Only the campaign-form.tsx change (Task 2) was uncommitted. Committed Task 2 separately with the correct fix(37-01) prefix.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- JC-03 and JC-08 are resolved — core V2 workflows (job creation and campaign edit) are now unblocked
- JC-01 (service filter scoping) is also complete
- Phase 37-02 through 37-03 can proceed: campaign card full-click, back button fix, campaign edit panel (Sheet), preset centering, and filter visual distinction

---
*Phase: 37-jobs-campaigns-ux-fixes*
*Completed: 2026-02-19*
