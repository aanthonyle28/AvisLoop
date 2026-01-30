---
phase: 16-onboarding-redesign
plan: 02
subsystem: onboarding
tags: [onboarding, wizard, ui-redesign, user-experience]

requires:
  - "16-01-database-migration-and-google-oauth"

provides:
  - "2-step onboarding wizard"
  - "Simplified onboarding flow"
  - "Horizontal progress bar"

affects:
  - "16-03-dashboard-onboarding-cards"

tech-stack:
  added: []
  patterns:
    - "Inline step components within onboarding-steps.tsx"
    - "Fixed bottom progress bar pattern"

key-files:
  created: []
  modified:
    - "components/onboarding/onboarding-wizard.tsx"
    - "components/onboarding/onboarding-steps.tsx"
    - "components/onboarding/onboarding-progress.tsx"
    - "app/(dashboard)/onboarding/page.tsx"

decisions:
  - id: "D16-02-01"
    decision: "2-step wizard (business name, Google review link)"
    rationale: "Faster onboarding, less intimidating for new users"
    impact: "medium"
  - id: "D16-02-02"
    decision: "Inline step components instead of separate files"
    rationale: "Simple single-input forms don't need complex form libraries or separate files"
    impact: "low"
  - id: "D16-02-03"
    decision: "Horizontal progress bar at bottom with counter"
    rationale: "Cleaner UI matching modern onboarding patterns"
    impact: "low"

metrics:
  duration: "3 minutes"
  completed: "2026-01-30"
---

# Phase 16 Plan 02: Wizard Redesign Summary

**One-liner:** Redesigned onboarding from 3 steps to 2 steps with centered headings, inline forms, and bottom progress bar

## What Was Built

### Core Changes
1. **2-step wizard configuration**
   - Step 1: Business Name (required, cannot skip)
   - Step 2: Google Review Link (optional, skippable)
   - Removed old 3-step flow (Business Info, Add Contact, Send Request)

2. **Simplified step components**
   - Inline `BusinessNameStep` and `GoogleReviewLinkStep` components in `onboarding-steps.tsx`
   - Large centered headings with descriptive subtitles
   - Single-input forms with clear CTAs
   - Step 2 includes Back, Finish, and "Skip for now" options

3. **Horizontal progress bar**
   - Fixed at bottom of viewport
   - Shows progress percentage as filled bar
   - Step counter format: "1/2"
   - ARIA attributes for accessibility

4. **Server page updates**
   - Removed unused data fetching (getContacts, getEmailTemplates)
   - Changed step clamping from 3 to 2
   - Removed container wrapper (wizard handles its own layout)
   - Only fetches business data needed for 2 steps

### Architectural Changes
- Moved from 3 separate step component files to 2 inline step functions
- Removed dependencies on ContactStep, SendStep, and related types
- Simplified wizard props (removed firstContact, defaultTemplate)
- Progress bar now uses fixed positioning at bottom vs. top stepper

## Implementation Details

### Component Structure
```
OnboardingWizard (client)
├── OnboardingSteps (client)
│   ├── BusinessNameStep (inline, required)
│   └── GoogleReviewLinkStep (inline, optional)
└── OnboardingProgress (fixed bottom bar)
```

### Step Flow
1. **Step 1 - Business Name**
   - Heading: "What's your business called?"
   - Single input with validation (required, max 100 chars)
   - Calls updateBusiness with name only
   - Auto-advances to step 2 on success

2. **Step 2 - Google Review Link**
   - Heading: "Add your Google review link"
   - Optional URL input with Google domain validation
   - Three actions:
     - Back → return to step 1
     - Finish → save link, mark onboarding complete, redirect to dashboard
     - Skip → mark complete without saving link, redirect to dashboard

### Data Flow
- Both steps use the existing `updateBusiness` server action
- Step 1 updates only the `name` field
- Step 2 updates only the `google_review_link` field
- On completion, calls `markOnboardingComplete()` and redirects to `/dashboard?onboarding=complete`

## Deviations from Plan

None - plan executed exactly as written.

## Testing Evidence

### Typecheck Results
```bash
$ pnpm typecheck
✓ No type errors
```

### File Verification
- ✅ Step clamping uses `Math.min(Math.max(1, stepParam), 2)`
- ✅ STEPS config has exactly 2 steps
- ✅ Progress bar at bottom with "1/2" counter
- ✅ No unused imports (ContactStep, SendStep removed)
- ✅ markOnboardingComplete called on wizard completion

### Commit History
- b80a0bc: feat(16-02): redesign onboarding wizard to 2 steps
- 2a8c05d: feat(16-02): update onboarding page for 2-step wizard

## Next Phase Readiness

**Ready for 16-03:** Dashboard Onboarding Cards
- ✅ 2-step wizard complete and functional
- ✅ Onboarding completion flow intact
- ✅ Business data properly stored
- Contact creation, template creation, and test sending moved to dashboard (Plan 04)

**Blockers:** None

**Concerns:** None

## Knowledge Transfer

### For Future Developers

**What changed:**
- Onboarding is now 2 steps instead of 3
- Contact and template creation no longer part of onboarding flow
- Progress bar moved from top stepper to bottom horizontal bar

**Why it matters:**
- Faster onboarding improves activation rate
- Less overwhelming for new users
- Contact/template/sending features will be dashboard cards (Plan 04)

**Technical notes:**
- Step components are inline functions, not separate files (simpler for single-input forms)
- Both steps use the same `updateBusiness` action (selective field updates)
- Skip functionality on step 2 calls `markOnboardingComplete` without saving the link

### Key Patterns Established

1. **Inline step components for simple forms**
   - When steps have single inputs, inline functions are cleaner than separate files
   - Reduces file count and improves maintainability

2. **Fixed bottom progress bar**
   - Modern pattern for multi-step flows
   - Doesn't take up top screen real estate
   - Clear visual progress feedback

3. **Selective field updates**
   - updateBusiness action handles partial updates
   - Each step only updates its own fields
   - Reduces form complexity

## Acceptance Criteria

- [x] Wizard has exactly 2 steps
- [x] Step 1 collects business name (required)
- [x] Step 2 collects Google review link (optional/skippable)
- [x] Progress bar at bottom with "1/2" counter format
- [x] After completion, redirects to /dashboard with onboarding marked complete
- [x] No unused imports or dead code from old 3-step wizard
- [x] pnpm typecheck passes

## Files Modified

### Components
- `components/onboarding/onboarding-wizard.tsx` - Updated to 2-step config, removed unused props
- `components/onboarding/onboarding-steps.tsx` - Rewrote with inline step components
- `components/onboarding/onboarding-progress.tsx` - Replaced stepper with horizontal progress bar

### Pages
- `app/(dashboard)/onboarding/page.tsx` - Removed unused data fetching, updated step clamping to 2

## Related Documentation

- Plan: `.planning/phases/16-onboarding-redesign/16-02-PLAN.md`
- Next: `.planning/phases/16-onboarding-redesign/16-03-PLAN.md` (Dashboard Onboarding Cards)
