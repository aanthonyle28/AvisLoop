---
phase: 28-onboarding-redesign
plan: 04
subsystem: onboarding
tags: [wizard, navigation, react, routing, url-params]
requires:
  - phase: 28-01
    provides: Expanded OnboardingBusiness type with all wizard fields
  - phase: 24
    provides: CampaignWithTouches type for preset fetching
provides:
  - 7-step wizard shell with navigation and progress tracking
  - Step router with cases 1-7 (2 functional, 5 placeholder)
  - Campaign preset fetching for step 5
  - URL-based step navigation with ?step=N parameter
affects:
  - phase: 28-05
    reason: BusinessBasicsStep will replace BusinessNameStep placeholder
  - phase: 28-06
    reason: Step components 3-7 will replace placeholder UI
tech-stack:
  added: []
  patterns:
    - URL-based wizard navigation with clamped step range
    - Placeholder step components for incremental development
    - Campaign preset fetching using existing supabase client
key-files:
  created: []
  modified:
    - components/onboarding/onboarding-wizard.tsx
    - components/onboarding/onboarding-steps.tsx
    - app/onboarding/page.tsx
decisions:
  - slug: placeholder-step-approach
    title: Placeholder components for steps 3-7
    status: accepted
    context: Wizard shell needed before individual step components built
    decision: Add PlaceholderStep component with title/description props
    alternatives:
      - Wait for all step components before expanding wizard (blocks parallel work)
  - slug: step-2-navigation
    title: Step 2 navigates forward instead of completing
    status: accepted
    context: Step 2 no longer final step in 7-step flow
    decision: Change onComplete callback to onGoToNext in Step 2
    alternatives:
      - Keep Step 2 as completion point (would break 7-step flow)
  - slug: preset-fetch-client
    title: Use existing supabase client for preset fetch
    status: accepted
    context: System presets have RLS SELECT policy for authenticated users
    decision: Use existing authenticated supabase client from page
    alternatives:
      - createServiceClient for preset fetch (unnecessary, RLS already allows read)
metrics:
  duration: 3 minutes
  tasks-completed: 2
  commits: 2
  files-changed: 3
completed: 2026-02-05
---

# Phase 28 Plan 04: 7-Step Wizard Shell Expansion Summary

**One-liner:** Expanded onboarding wizard from 2 to 7 steps with URL navigation, progress tracking, campaign preset fetching, and placeholder UI for steps 3-7.

## What Was Built

### Wizard Shell Expansion (Task 1)
**components/onboarding/onboarding-wizard.tsx:**
- Updated STEPS config array from 2 to 7 steps:
  1. Business Basics (required)
  2. Review Destination (skippable)
  3. Services Offered (required)
  4. Software Used (skippable)
  5. Campaign Preset (required)
  6. Import Customers (skippable)
  7. SMS Consent (required)
- Added `campaignPresets` prop to OnboardingWizardProps
- Imported CampaignWithTouches type from database types
- Passed campaignPresets through to OnboardingSteps component
- Progress bar now shows X/7 steps
- Navigation logic works generically with STEPS.length (no hardcoding)

### Step Router & Page Updates (Task 2)
**components/onboarding/onboarding-steps.tsx:**
- Added `campaignPresets` prop to OnboardingStepsProps
- Expanded switch statement to handle cases 1-7
- Kept Step 1 (BusinessNameStep) and Step 2 (GoogleReviewLinkStep) functional
- Created PlaceholderStep component for steps 3-7 (to be built in Plans 05-06)
- Updated Step 2 to call `onGoToNext()` instead of `onComplete()` (no longer final step)
- Removed `isSubmitting` prop from Step 2 (mid-flow step doesn't need completion state)

**app/onboarding/page.tsx:**
- Updated step range clamp from `Math.min(Math.max(1, stepParam), 2)` to `Math.min(Math.max(1, stepParam), 7)`
- Updated page comments to reference 7-step flow with step names
- Added campaign preset fetching using existing authenticated supabase client:
  ```typescript
  const { data: presets } = await supabase
    .from('campaigns')
    .select('*, campaign_touches (*)')
    .eq('is_preset', true)
    .order('name')
  ```
- Added business data mapping to OnboardingBusiness type with all required fields:
  - name, phone, google_review_link, software_used, service_types_enabled, sms_consent_acknowledged
- Passed `campaignPresets` to OnboardingWizard component

### PlaceholderStep Component
Simple reusable component for steps 3-7 showing:
- Title and description (customizable per step)
- Back/Continue buttons with proper navigation
- Skippable flag support (changes button text to "Skip")
- Step 7 wraps onComplete in async handler for final submission

## Technical Details

### URL Navigation Pattern
- Step parameter: `/onboarding?step=N`
- Clamped range: 1-7 (invalid steps redirect to boundaries)
- Progress bar: Shows current position X/7
- Navigation functions work generically (no step count hardcoding)

### Campaign Preset Fetching
- Uses existing authenticated `supabase` client (created via `createClient()` in page)
- RLS policy allows SELECT for system presets (`is_preset = true`) by any authenticated user
- No service role client needed - standard RLS pattern
- Fetches campaigns with nested touches via `.select('*, campaign_touches (*)')`
- Passes empty array as fallback if fetch fails

### Step 2 Behavior Change
Old behavior (2-step wizard):
- Step 2 called `onComplete()` → marked onboarding complete → redirected to dashboard

New behavior (7-step wizard):
- Step 2 calls `onGoToNext()` → navigates to step 3
- Only step 7 calls `onComplete()` for final submission

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### Placeholder Step Approach
**Context:** Wizard shell infrastructure needed before individual step components built. Plans 05-06 will build the actual step UIs.

**Decision:** Create PlaceholderStep component with title/description props for steps 3-7.

**Rationale:**
- Allows wizard navigation testing immediately
- Enables parallel work (shell in 04, step components in 05-06)
- Clean separation of concerns (navigation vs step content)
- Placeholder clearly labeled with "This step will be built in Plan XX"

**Alternatives Considered:**
- Wait for all step components before expanding wizard → Would block parallel work, slower iteration

### Step 2 Navigation Change
**Context:** Step 2 (Google Review Link) no longer final step in 7-step wizard.

**Decision:** Change Step 2 to call `onGoToNext()` instead of `onComplete()`.

**Rationale:**
- Consistent mid-flow behavior (steps 1-6 navigate forward)
- Only step 7 completes onboarding
- Removed `isSubmitting` prop since step 2 is now mid-flow

**Alternatives Considered:**
- Keep Step 2 as completion point → Would break 7-step flow, incomplete onboarding data

### Preset Fetch Client Choice
**Context:** Campaign presets needed for step 5 (Campaign Preset selection).

**Decision:** Use existing authenticated `supabase` client from page for preset fetch.

**Rationale:**
- RLS policy already allows authenticated users to SELECT system presets
- Consistent with other page-level data fetching
- No service role escalation needed
- Simpler code (reuse existing client)

**Alternatives Considered:**
- createServiceClient for preset fetch → Unnecessary privilege escalation, RLS already allows read

## Testing Notes

### Verification Steps
1. ✅ `pnpm typecheck` passes cleanly
2. ✅ `pnpm lint` passes with no errors
3. ✅ Wizard shell compiles with 7 steps
4. ✅ Progress bar shows 1/7 on step 1
5. ✅ Step 2 navigates to step 3 (doesn't complete onboarding)
6. ✅ Steps 3-7 show placeholder UI
7. ✅ Navigation buttons work correctly (back/continue)
8. ✅ Step 7 "Continue" calls onComplete (redirects to dashboard)

### URL Navigation Testing
- `/onboarding` → Defaults to step 1
- `/onboarding?step=5` → Shows placeholder step 5
- `/onboarding?step=10` → Clamped to step 7 (max)
- `/onboarding?step=-1` → Clamped to step 1 (min)

## What's Next

**Immediate next steps:**
1. Plan 28-05: Build step components 1-4 (Business Basics, Review Destination, Services Offered, Software Used)
2. Plan 28-06: Build step components 5-7 (Campaign Preset, Import Customers, SMS Consent)
3. Plan 28-07: Wire up server actions to persist step data

**Dependencies for next plans:**
- Step components will consume OnboardingBusiness type and validation schemas from Plan 01
- Campaign preset step will use `campaignPresets` prop passed from page
- Server actions will write to business columns added in migration 01

## Files Changed

**Modified:**
- `components/onboarding/onboarding-wizard.tsx` - 7-step STEPS config, campaignPresets prop
- `components/onboarding/onboarding-steps.tsx` - 7-case switch, PlaceholderStep component
- `app/onboarding/page.tsx` - Step clamp 1-7, preset fetching, business mapping

## Commits

1. `b256162` - feat(28-04): expand wizard shell to 7 steps
2. `6816dd6` - feat(28-04): update step router and onboarding page for 7 steps

## Lessons Learned

1. **Placeholder pattern:** Using placeholder components allows shell development to proceed independently of step implementation
2. **Generic navigation:** Writing navigation functions to use STEPS.length instead of hardcoded values prevents future refactoring
3. **Mid-flow vs completion:** Steps 1-6 navigate forward, only step 7 completes - important distinction for state management
4. **RLS awareness:** Understanding RLS policies prevents unnecessary service role client usage

## Metrics

- **Duration:** 3 minutes
- **Tasks completed:** 2/2
- **Commits:** 2 (1 per task)
- **Files changed:** 3 (all modified, none created)
- **Lines added:** ~145
- **Type safety:** 100% (all props typed, RLS-aware fetching)
