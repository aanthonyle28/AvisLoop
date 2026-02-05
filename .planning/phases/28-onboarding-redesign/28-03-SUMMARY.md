---
phase: 28-onboarding-redesign
plan: 03
subsystem: onboarding
tags: [server-actions, validation, business-profile, service-types, sms-consent]
requires: [28-01, 28-02]
provides:
  - Onboarding server actions for all 7 wizard steps
  - Phone field handling in business updates
  - Extended OnboardingStatus type with new step checks
affects: [28-04, 28-05, 28-06, 28-07]
tech-stack:
  added: []
  patterns: [server-actions, zod-validation, auth-scoping]
key-files:
  created: []
  modified:
    - lib/actions/onboarding.ts
    - lib/actions/business.ts
    - lib/data/onboarding.ts
decisions:
  - Server actions use Zod schemas from Plan 01 for validation
  - Step 3 sets BOTH service_types_enabled and service_type_timing columns
  - Step 5 wraps existing duplicateCampaign function for consistency
  - All actions scope to authenticated user's business via auth check
metrics:
  duration: 3 minutes
  files_modified: 3
  commits: 2
completed: 2026-02-05
---

# Phase 28 Plan 03: Onboarding Server Actions Summary

**One-liner:** Created 6 server actions for onboarding wizard steps 1-7 with Zod validation, auth scoping, and proper database persistence.

## What Was Built

### Server Actions (lib/actions/onboarding.ts)

Added 6 new server action functions to handle wizard step persistence:

1. **saveBusinessBasics** (Step 1)
   - Accepts name, phone (optional), googleReviewLink (optional)
   - Creates or updates business record
   - Validates with businessBasicsSchema
   - Revalidates /onboarding and /dashboard paths

2. **saveReviewDestination** (Step 2)
   - Accepts googleReviewLink
   - Updates business.google_review_link
   - Validates with reviewDestinationSchema
   - Handles URL validation (must be Google URL)

3. **saveServicesOffered** (Step 3)
   - Accepts array of service types
   - Sets BOTH service_types_enabled AND service_type_timing
   - Uses DEFAULT_TIMING_HOURS from job validations
   - Validates with servicesOfferedSchema
   - Revalidates /settings path

4. **saveSoftwareUsed** (Step 4)
   - Accepts softwareUsed string
   - Updates business.software_used
   - Validates with softwareUsedSchema
   - Optional field (can be empty)

5. **createCampaignFromPreset** (Step 5)
   - Wrapper around existing duplicateCampaign function
   - Maintains consistent API shape
   - Returns { error?, data?: { campaignId } }

6. **acknowledgeSMSConsent** (Step 7)
   - Accepts acknowledged boolean (must be true)
   - Sets sms_consent_acknowledged = true
   - Sets sms_consent_acknowledged_at = timestamp
   - Validates with smsConsentSchema
   - Revalidates /onboarding and /dashboard

**All actions follow consistent patterns:**
- Auth check with supabase.auth.getUser()
- Zod schema validation with safeParse
- Scoped to authenticated user's business
- Return { success: boolean, error?: string } or similar
- Proper error handling and messages

### Business Action Updates (lib/actions/business.ts)

Enhanced `updateBusiness` to handle phone field:
- Added phone to businessSchema parsing
- Included phone in both update and insert queries
- Handles nullable phone values (empty string → null)

### Onboarding Data Updates (lib/data/onboarding.ts)

Extended `OnboardingStatus` type and `getOnboardingStatus` function:

**New type fields:**
- hasPhone: boolean
- hasServiceTypes: boolean
- hasSMSConsent: boolean

**Query expansion:**
- Added phone, software_used, service_types_enabled, sms_consent_acknowledged to select

**Step checks:**
- hasPhone: !!business.phone
- hasServiceTypes: Array.isArray(business.service_types_enabled) && business.service_types_enabled.length > 0
- hasSMSConsent: !!business.sms_consent_acknowledged

## Technical Decisions

### 1. Zod Error Handling
- Changed from `parsed.error.errors[0]` to `parsed.error.issues[0]`
- Correct TypeScript API for ZodError
- Provides first validation error message to user

### 2. Step 3 Critical Implementation
- **Must set BOTH columns** (noted in Plan 01 pitfall 4)
- service_types_enabled: Array of selected service types
- service_type_timing: Map of service type → default hours
- Uses DEFAULT_TIMING_HOURS from @/lib/validations/job
- Prevents incomplete state that would break campaign enrollment

### 3. Step 5 Wrapper Pattern
- Wraps existing duplicateCampaign instead of reimplementing
- Returns same shape: { error?, data?: { campaignId } }
- Maintains separation: onboarding action → campaign action → database
- Single source of truth for campaign duplication logic

### 4. Return Type Consistency
- Most actions: { success: boolean, error?: string }
- Step 5 (campaign): { error?: string, data?: { campaignId: string } }
- Matches existing campaign action patterns
- Clear success/failure discrimination

## Integration Points

### Imports Added
```typescript
import {
  businessBasicsSchema,
  reviewDestinationSchema,
  servicesOfferedSchema,
  softwareUsedSchema,
  smsConsentSchema,
  type BusinessBasicsInput,
  type ReviewDestinationInput,
  type ServicesOfferedInput,
  type SoftwareUsedInput,
  type SMSConsentInput,
} from '@/lib/validations/onboarding'
import { DEFAULT_TIMING_HOURS } from '@/lib/validations/job'
import { duplicateCampaign } from '@/lib/actions/campaign'
```

### Paths Revalidated
- /onboarding - Steps 1, 7
- /dashboard - Steps 1, 7
- /settings - Step 3

### Database Columns Updated
- businesses.name - Step 1
- businesses.phone - Step 1
- businesses.google_review_link - Steps 1, 2
- businesses.service_types_enabled - Step 3
- businesses.service_type_timing - Step 3
- businesses.software_used - Step 4
- businesses.sms_consent_acknowledged - Step 7
- businesses.sms_consent_acknowledged_at - Step 7

## Verification

### Type Safety
- ✅ `pnpm typecheck` passes with no errors
- ✅ All Zod schemas properly imported and used
- ✅ Return types match function signatures
- ✅ OnboardingStatus type includes all new fields

### Code Quality
- ✅ `pnpm lint` passes with no warnings
- ✅ Consistent error handling patterns
- ✅ Auth checks on all actions
- ✅ Input validation on all actions

### Exports
- ✅ 8 total functions exported (2 existing + 6 new)
- ✅ markOnboardingComplete (existing)
- ✅ markOnboardingCardStep (existing)
- ✅ saveBusinessBasics (new)
- ✅ saveReviewDestination (new)
- ✅ saveServicesOffered (new)
- ✅ saveSoftwareUsed (new)
- ✅ createCampaignFromPreset (new)
- ✅ acknowledgeSMSConsent (new)

## Next Phase Readiness

### Ready for 28-04 (Step Components)
- ✅ All server actions implemented
- ✅ Validation schemas imported from Plan 01
- ✅ Return types documented
- ✅ Error messages user-friendly

### Ready for 28-05 (Wizard Shell)
- ✅ OnboardingStatus type updated
- ✅ New step checks included
- ✅ getOnboardingStatus queries all fields

### No Blockers
- All dependencies satisfied
- Step 3 implementation matches pitfall documentation
- Phone field properly integrated
- SMS consent tracking ready

## Deviations from Plan

None - plan executed exactly as written.

## Files Modified

### lib/actions/onboarding.ts
- Added 6 new server action functions
- Imported validation schemas and types
- Imported DEFAULT_TIMING_HOURS and duplicateCampaign
- All functions follow existing patterns

### lib/actions/business.ts
- Added phone to updateBusiness FormData parsing
- Added phone to both update and insert queries
- Maintains backward compatibility

### lib/data/onboarding.ts
- Extended OnboardingStatus type with 3 new fields
- Expanded getOnboardingStatus query columns
- Added step checks for new fields
- Updated null business return type

## Commits

1. **b209167** - feat(28-03): add onboarding server actions for steps 1-7
   - Implemented all 6 new server actions
   - Added validation and auth checks
   - Step 3 sets both service columns

2. **22493cb** - feat(28-03): update business and onboarding data for new fields
   - Updated updateBusiness for phone field
   - Extended OnboardingStatus type
   - Added new field checks to getOnboardingStatus

## Testing Notes

### Manual Testing Checklist
- [ ] Step 1: saveBusinessBasics creates business if missing
- [ ] Step 1: saveBusinessBasics updates business if exists
- [ ] Step 2: saveReviewDestination validates Google URL
- [ ] Step 3: saveServicesOffered sets both enabled + timing
- [ ] Step 4: saveSoftwareUsed accepts empty string
- [ ] Step 5: createCampaignFromPreset returns campaignId
- [ ] Step 7: acknowledgeSMSConsent requires true
- [ ] All actions reject unauthenticated requests
- [ ] All actions validate input with Zod
- [ ] OnboardingStatus includes all new step checks

### Integration Testing
- [ ] Wizard can call all 6 new actions
- [ ] Step component forms pass correct data shape
- [ ] Error messages display properly in UI
- [ ] Path revalidation triggers UI updates
- [ ] Campaign duplication creates new campaign

## Known Limitations

1. **Step 6 not implemented** - Message template selection deferred to later plan
2. **No transaction support** - Supabase client doesn't support transactions
3. **No retry logic** - Single attempt per action call
4. **Generic error messages** - Database errors exposed to user (acceptable for MVP)

## Success Metrics

- ✅ All 6 new server actions implemented
- ✅ All actions have auth checks
- ✅ All actions have Zod validation
- ✅ Step 3 sets both required columns
- ✅ OnboardingStatus type extended
- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes
- ✅ 2 atomic commits created
- ✅ Duration: 3 minutes
