---
phase: 56-additional-business-creation
plan: 02
subsystem: ui
tags: [react, nextjs, onboarding, wizard, multi-tenant, business-creation]

# Dependency graph
requires:
  - phase: 56-01
    provides: createAdditionalBusiness, saveNewBusinessServices, createNewBusinessCampaign, completeNewBusinessOnboarding server actions + isNewBusinessMode routing bypass
  - phase: 54
    provides: switchBusiness action for setting active business cookie
  - phase: 55-02
    provides: BusinessesClient component to attach Add Business button

provides:
  - CreateBusinessWizard 3-step client component (components/onboarding/create-business-wizard.tsx)
  - /onboarding?mode=new route renders CreateBusinessWizard instead of OnboardingWizard
  - Add Business button on /businesses page links to /onboarding?mode=new
  - Full end-to-end flow: create business → set services → pick campaign preset → SMS consent → switch active business → redirect to dashboard

affects:
  - Phase 58 (job completion form) — new businesses created via this wizard will be available for job completion
  - Future UX phases — pattern established for multi-step wizard with inline steps (no imported step components)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline sub-steps pattern: 3-step wizard with all step UI defined in the same file to avoid action coupling with existing step components"
    - "Scoped action isolation: wizard calls only create-additional-business.ts actions, never the getActiveBusiness()-dependent onboarding actions"
    - "Post-wizard business switch: completeNewBusinessOnboarding → switchBusiness → router.push('/dashboard') sequence"

key-files:
  created:
    - components/onboarding/create-business-wizard.tsx
  modified:
    - app/onboarding/page.tsx
    - components/businesses/businesses-client.tsx

key-decisions:
  - "Inline sub-components (BusinessSetupStep, CampaignPresetStep, SMSConsentStep) defined in wizard file rather than imported from existing step components — avoids adding optional callback props to 3 existing components and keeps coupling clear"
  - "No localStorage draft persistence for the 3-step wizard — intentional, only 3 steps and no mid-session resume needed unlike the 4-step first-business onboarding"
  - "switchBusiness() called ONLY after completeNewBusinessOnboarding() succeeds — not mid-wizard, never on step 1 or step 2"

patterns-established:
  - "Multi-business wizard uses scoped actions exclusively — future additional-business flows should follow create-additional-business.ts pattern"
  - "Add Business button in /businesses header uses Button asChild + Link for native Next.js navigation, no JS redirect needed"

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 56 Plan 02: CreateBusinessWizard UI + Wiring Summary

**Self-contained 3-step wizard (business setup, campaign preset, SMS consent) for creating additional businesses, wired into /onboarding?mode=new and surfaced via Add Business button on /businesses page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T20:01:25Z
- **Completed:** 2026-02-27T20:03:45Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Built `CreateBusinessWizard` 3-step component that calls ONLY scoped actions from `create-additional-business.ts` (plan 56-01)
- Wired `/onboarding?mode=new` to conditionally render `CreateBusinessWizard` instead of `OnboardingWizard` — existing wizard completely unchanged
- Added "Add Business" primary button in `/businesses` page header linking to `/onboarding?mode=new`
- Post-completion flow: `completeNewBusinessOnboarding()` → `switchBusiness()` → `router.push('/dashboard')` — user lands on dashboard with new business active

## Task Commits

Each task was committed atomically:

1. **Task 1: CreateBusinessWizard component** - `dacf8d1` (feat)
2. **Task 2: Wire into onboarding page + Add Business button** - `e0a82ec` (feat)

**Plan metadata:** See final docs commit below.

## Files Created/Modified

- `components/onboarding/create-business-wizard.tsx` (NEW) — Self-contained 3-step wizard with inline BusinessSetupStep, CampaignPresetStep, SMSConsentStep sub-components. Imports only from `create-additional-business.ts` and `active-business.ts`. No localStorage.
- `app/onboarding/page.tsx` — Added `CreateBusinessWizard` import; conditional return: `isNewBusinessMode` → `CreateBusinessWizard`, else → `OnboardingWizard` (unchanged)
- `components/businesses/businesses-client.tsx` — Added `Link`, `Plus`, `Button` imports; page header now flex row with title block left + Add Business button right

## Decisions Made

- **Inline sub-components:** The 3 step UIs are defined as private functions within the wizard file (`BusinessSetupStep`, `CampaignPresetStep`, `SMSConsentStep`). This avoids adding optional callback props to the existing shared step components which hardcode `saveBusinessBasics()` et al. — cleaner isolation with no coupling risk.
- **No draft persistence:** The 3-step new-business wizard does NOT use localStorage. The existing wizard uses `'onboarding-draft-v3'`. Skipping draft for the new wizard avoids key conflicts and is appropriate for a short 3-step flow.
- **switchBusiness only at completion:** `switchBusiness(newBusinessId)` is called ONLY after `completeNewBusinessOnboarding()` succeeds (step 3 final submit), consistent with safety rule #3 from the plan.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Lint and typecheck both pass cleanly.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 56 is now fully complete (both plans done)
- The complete "Add additional business" flow is live: `/businesses` → Add Business button → `/onboarding?mode=new` → 3-step wizard → dashboard with new active business
- Phase 58 (job completion form) can proceed — new businesses created via this wizard are immediately available for job completion

---
*Phase: 56-additional-business-creation*
*Completed: 2026-02-27*
