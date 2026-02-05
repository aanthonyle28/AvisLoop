---
phase: 28-onboarding-redesign
plan: 05
subsystem: onboarding-wizard
status: complete
tags: [onboarding, ui-components, forms, validation, wizard-steps]

# Dependency graph
requires:
  - 28-03 # Onboarding server actions
  - 28-04 # 7-step wizard shell

provides:
  - Step 1-4 UI components (business basics, review link, services, software)
  - Complete form validation for steps 1-4
  - Multi-select service type UI with timing display
  - Radio-style software selection cards
  - URL validation and test-open functionality

affects:
  - 28-06 # Steps 5-7 depend on this pattern
  - onboarding-wizard # All wizard functionality

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client component form pattern with useTransition
    - Server action integration with error handling
    - Radio-style card selection UI
    - Multi-select checkbox grid layout

# File tracking
key-files:
  created:
    - components/onboarding/steps/business-basics-step.tsx
    - components/onboarding/steps/review-destination-step.tsx
    - components/onboarding/steps/services-offered-step.tsx
    - components/onboarding/steps/software-used-step.tsx
  modified:
    - components/onboarding/onboarding-steps.tsx

decisions:
  - id: STEP_PATTERN
    choice: "Use consistent client component pattern for all steps"
    rationale: "All steps follow same structure: useState, useTransition, form submit, server action call"
    impact: "Uniform UX, predictable behavior, easy maintenance"

  - id: SERVICE_TIMING_DISPLAY
    choice: "Show timing info inline with service type checkboxes"
    rationale: "Users need to understand what timing defaults they're accepting"
    impact: "Better informed decisions during onboarding"

  - id: SOFTWARE_CARD_SELECTION
    choice: "Radio-style cards instead of native radio buttons"
    rationale: "More visual, easier to click, follows modern UI patterns"
    impact: "Better mobile experience, clearer selection state"

  - id: URL_TEST_BUTTON
    choice: "Add 'Test your link' button that opens in new tab"
    rationale: "Users need to verify their Google review link works before continuing"
    impact: "Reduces setup errors, builds confidence"

# Metrics
metrics:
  duration: "4 minutes"
  completed: "2026-02-05"
---

# Phase 28 Plan 05: Step Components 1-4 Implementation

**One-liner:** Business basics, review destination, services offered, and software selection step components with full validation and server action integration.

## What Was Built

### Step Components (1-4)

Created four complete step components following the established onboarding pattern:

**1. BusinessBasicsStep (components/onboarding/steps/business-basics-step.tsx)**
- Three input fields: Business name (required), phone (optional), Google review link (optional)
- Calls `saveBusinessBasics` server action
- Client-side validation: name required (min 1 char)
- Pre-fills from business data if available
- Single "Continue" button with loading state

**2. ReviewDestinationStep (components/onboarding/steps/review-destination-step.tsx)**
- Google review link validation (must be valid URL containing 'google')
- "Test your link" button opens link in new tab
- Success indicator (green checkmark) after test
- Calls `saveReviewDestination` server action
- Back/Continue buttons + "Skip for now" link
- Skippable step

**3. ServicesOfferedStep (components/onboarding/steps/services-offered-step.tsx)**
- 2-column grid of checkboxes (4x2 on desktop, 1 column mobile)
- 8 service types: HVAC, Plumbing, Electrical, Cleaning, Roofing, Painting, Handyman, Other
- Each checkbox shows timing info: "Review request: 24h after job"
- Minimum 1 selection required
- Calls `saveServicesOffered` server action
- Visual feedback: selected items get primary border + background tint

**4. SoftwareUsedStep (components/onboarding/steps/software-used-step.tsx)**
- Radio-style card selection for 4 options:
  - ServiceTitan: "Enterprise field service management"
  - Jobber: "Small-to-mid field service scheduling"
  - Housecall Pro: "Home service business management"
  - None / Other: "I use something else or no software"
- Info banner: "This is for our roadmap planning only. No integration will be set up now."
- Calls `saveSoftwareUsed` server action
- Back/Continue buttons + "Skip for now" link
- Skippable step

### Step Router Integration

**Updated components/onboarding/onboarding-steps.tsx:**
- Imported all 4 new step components
- Wired cases 1-4 to render real step components
- Passed business data as defaultValues props
- Removed old inline BusinessNameStep and GoogleReviewLinkStep functions
- Removed unused imports (updateBusiness, saveReviewLink from business.ts)
- Cases 5-7 already wired to real components from Plan 06

## Verification Results

1. ✅ `pnpm typecheck` passes - All step components compile without errors
2. ✅ `pnpm lint` passes - No linting issues
3. ✅ Step 1 shows business name, phone, and Google review link inputs
4. ✅ Step 2 shows link verification with "Test your link" button
5. ✅ Step 3 shows 8 service type checkboxes with timing info
6. ✅ Step 4 shows 4 software option cards with descriptions
7. ✅ All steps have proper Back/Continue navigation
8. ✅ Steps 2 and 4 have "Skip for now" option

## Decisions Made

### Step Pattern Consistency
**Decision:** All steps follow same client component pattern
- useState for form fields
- useTransition for async actions
- Form submission with validation
- Server action call with error handling

**Rationale:** Uniform UX, predictable behavior, easy for future developers to extend

**Impact:** New steps can be added quickly by copying existing pattern

### Service Type Timing Display
**Decision:** Show "Review request: Xh after job" inline with each service type checkbox

**Rationale:** Users need to understand what timing defaults they're accepting during onboarding

**Impact:** Better informed decisions, fewer surprise delays, aligns with Phase 22 service type timing

### Software Card Selection UI
**Decision:** Radio-style cards with descriptions instead of native radio buttons

**Rationale:**
- More visual and easier to click (especially on mobile)
- Space for descriptive text
- Follows modern UI patterns (like Stripe, Vercel)

**Impact:** Better mobile experience, clearer selection state, more accessible

### URL Test Button
**Decision:** Add "Test your link" button that opens in new tab with success indicator

**Rationale:** Users need to verify their Google review link works before continuing

**Impact:**
- Reduces setup errors (wrong link, 404s)
- Builds confidence in the setup process
- Shows green checkmark after test for visual confirmation

## Technical Notes

### Form Validation Strategy
All steps use client-side validation before server action:
1. Check required fields (name, at least 1 service type)
2. Validate URL format (review link)
3. Show inline error messages
4. Disable submit during pending state

### Server Action Integration
Each step calls a dedicated server action from `lib/actions/onboarding.ts`:
- `saveBusinessBasics({ name, phone, googleReviewLink })`
- `saveReviewDestination({ googleReviewLink })`
- `saveServicesOffered({ serviceTypes })`
- `saveSoftwareUsed({ softwareUsed })`

All actions validate with Zod schemas and update business record.

### Default Values Pattern
Steps accept default values from business data:
```typescript
defaultValues={{
  name: business?.name || '',
  phone: business?.phone || '',
  google_review_link: business?.google_review_link || '',
}}
```

This allows users to go back and edit without losing data.

### Multi-Select Implementation
ServicesOfferedStep uses array state management:
```typescript
const handleToggle = (serviceType: string) => {
  setSelected((prev) =>
    prev.includes(serviceType)
      ? prev.filter((s) => s !== serviceType)
      : [...prev, serviceType]
  )
}
```

Validation ensures at least one selection before submit.

## Next Phase Readiness

### For Plan 06
Steps 5-7 already implemented and wired:
- Campaign preset selection (step 5)
- Customer import (step 6)
- SMS consent acknowledgment (step 7)

Plan 06 execution already completed before this plan.

### For Dashboard Integration
All steps properly save to business table:
- `name`, `phone`, `google_review_link` (step 1)
- `service_types_enabled`, `service_type_timing` (step 3)
- `software_used` (step 4)

Dashboard and settings pages can read this data immediately.

### For Campaign Enrollment
Step 3 sets both `service_types_enabled` AND `service_type_timing` (per Phase 28-03 decision):
- Prevents incomplete state
- Enables immediate campaign enrollment after onboarding
- Timing defaults from `DEFAULT_TIMING_HOURS` constant

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 4a3c321 | feat(28-05): create step components 1-4 | 4 new step component files |

## Deviations from Plan

None - plan executed exactly as written. Steps 5-7 integration was already complete from Plan 06, so step router was already in final state.

## Lessons Learned

1. **Plan sequencing:** Plan 06 ran before Plan 05, creating steps 5-7 first. This is fine because plans are independent and can run in parallel waves.

2. **Linter auto-imports:** ESLint automatically imported step 5-7 components when they became available, correctly updating the router integration.

3. **Default values pattern:** Passing `defaultValues` object to steps works well for forms with multiple fields, cleaner than individual props.

4. **Visual selection feedback:** Card-style radio buttons with border/background changes provide better UX than native radio inputs.
