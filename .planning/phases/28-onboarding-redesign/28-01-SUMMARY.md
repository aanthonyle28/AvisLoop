---
phase: 28-onboarding-redesign
plan: 01
subsystem: onboarding
tags: [database, types, validation, migration, schema]
requires:
  - phase: 27
    provides: Dashboard redesign complete
  - phase: 22
    provides: SERVICE_TYPES constant for validation
provides:
  - Business table with phone, software_used, sms_consent_acknowledged columns
  - OnboardingBusiness type with all 7-step wizard fields
  - Step-specific Zod validation schemas (businessBasics, reviewDestination, servicesOffered, softwareUsed, smsConsent)
affects:
  - phase: 28-02+
    reason: Step components will consume these types and schemas
tech-stack:
  added: []
  patterns:
    - Step-specific Zod validation schemas
    - Discriminated onboarding form state
key-files:
  created:
    - supabase/migrations/20260205044834_add_business_onboarding_fields.sql
    - lib/validations/onboarding.ts
  modified:
    - lib/types/database.ts
    - lib/types/onboarding.ts
    - lib/validations/business.ts
decisions:
  - slug: business-phone-column
    title: Business phone stored as nullable TEXT
    status: accepted
    context: 7-step onboarding captures business phone for SMS sender ID
    decision: Add phone column as nullable TEXT, validate E.164 in app code
    alternatives:
      - Use separate business_contacts table (over-engineered for single phone)
  - slug: software-used-enum-in-app
    title: Software options validated in Zod, not DB constraint
    status: accepted
    context: CRM/field service software list may expand
    decision: Store as TEXT, validate enum in Zod schema
    alternatives:
      - DB enum constraint (harder to migrate when adding options)
  - slug: sms-consent-acknowledged-boolean
    title: SMS consent tracked as boolean flag + timestamp
    status: accepted
    context: TCPA requires proof business owner was informed
    decision: Boolean flag + timestamp captures acknowledgment in onboarding
    alternatives:
      - Separate compliance_acknowledgments table (over-engineered)
metrics:
  duration: 2.3 minutes
  tasks-completed: 2
  commits: 2
  files-changed: 5
completed: 2026-02-05
---

# Phase 28 Plan 01: Database Schema & Type Foundations Summary

**One-liner:** Added business onboarding fields (phone, software_used, SMS consent) with TypeScript types and 5 step-specific Zod validation schemas for the 7-step wizard.

## What Was Built

### Database Migration
Created migration `20260205044834_add_business_onboarding_fields.sql` adding four columns to businesses table:
- `phone` (TEXT, nullable) - Business phone number for SMS sender ID
- `software_used` (TEXT, nullable) - CRM/field service software selection
- `sms_consent_acknowledged` (BOOLEAN, DEFAULT false) - TCPA acknowledgment flag
- `sms_consent_acknowledged_at` (TIMESTAMPTZ, nullable) - Acknowledgment timestamp

### TypeScript Type Updates
**lib/types/database.ts:**
- Added 4 fields to `Business` interface (phone, software_used, sms_consent_acknowledged, sms_consent_acknowledged_at)

**lib/types/onboarding.ts:**
- Expanded `OnboardingBusiness` type from 2 to 6 fields:
  - name, phone, google_review_link (existing)
  - software_used, service_types_enabled, sms_consent_acknowledged (new)

**lib/validations/business.ts:**
- Added `phone` field validation (max 20 chars, optional)

### Validation Schemas
**lib/validations/onboarding.ts (NEW):**
Created 5 step-specific Zod schemas for wizard validation:
1. `businessBasicsSchema` - Name, phone, Google review link (step 1)
2. `reviewDestinationSchema` - Google review URL with Google domain check (step 2)
3. `servicesOfferedSchema` - Service type array (min 1 required) using SERVICE_TYPES enum (step 3)
4. `softwareUsedSchema` - CRM/software selection (step 4)
5. `smsConsentSchema` - Acknowledgment checkbox (must be true) (step 7)

Added `SOFTWARE_OPTIONS` constant with 4 CRM options: ServiceTitan, Jobber, Housecall Pro, None/Other.

## Technical Details

### Schema Design
- **Nullable vs Required:** phone and software_used nullable (optional steps), sms_consent_acknowledged NOT NULL (required step)
- **Timestamp Pattern:** Follows existing pattern (sms_consent_acknowledged_at mirrors customer consent fields)
- **Validation Location:** Enum validation in Zod (app layer) rather than DB constraints for flexibility

### Type Safety
- OnboardingBusiness type mirrors wizard state shape
- Step schemas export typed inputs for form components
- SERVICE_TYPES import ensures service validation consistency with jobs table

### Migration Safety
- IF NOT EXISTS prevents errors on re-run
- DEFAULT false for boolean ensures existing rows don't break
- Comments document column purpose and validation rules

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### Business Phone Column
**Context:** 7-step onboarding captures business phone for SMS sender ID configuration.

**Decision:** Add `phone` column as nullable TEXT, validate E.164 format in app code (not DB constraint).

**Rationale:**
- Validation in app layer provides better error messages
- Consistent with customer phone validation pattern
- Nullable allows skipping step if business doesn't want SMS

**Alternatives Considered:**
- Separate business_contacts table → Over-engineered for single phone field
- DB constraint for E.164 → Harder to provide user-friendly validation errors

### Software Enum in Zod
**Context:** CRM/field service software options may expand as integrations are added.

**Decision:** Store `software_used` as TEXT, validate enum values in Zod schema.

**Rationale:**
- Easier to add new software options (code change vs migration)
- Zod schema provides type-safe validation
- NULL semantics simpler than DB enum (NULL vs 'none')

**Alternatives Considered:**
- DB enum type → Requires migration to add new options
- JSONB with metadata → Over-engineered for single selection

### SMS Consent Boolean Flag
**Context:** TCPA compliance requires proof business owner was informed of SMS consent requirements.

**Decision:** Track with `sms_consent_acknowledged` boolean + `sms_consent_acknowledged_at` timestamp.

**Rationale:**
- Simple boolean flag for onboarding gate
- Timestamp provides audit trail
- Mirrors customer SMS consent pattern

**Alternatives Considered:**
- Separate compliance_acknowledgments table → Over-engineered for single flag
- Text field for acknowledgment type → Boolean sufficient for onboarding

## Testing Notes

### Verification Steps
1. ✅ Migration SQL syntax valid (IF NOT EXISTS, correct data types)
2. ✅ TypeScript typecheck passes with no errors
3. ✅ Business interface includes all 4 new fields
4. ✅ OnboardingBusiness type includes 6 fields
5. ✅ lib/validations/onboarding.ts exports 5 schemas
6. ✅ SERVICE_TYPES import works correctly

### Edge Cases Handled
- Empty string handling in schemas (`.or(z.literal(''))`)
- Optional vs required fields (phone optional, serviceTypes required)
- SMS consent must be true (z.literal(true) enforces checkbox)

## What's Next

**Immediate next steps:**
1. Plan 28-02: Build step components (BusinessBasicsStep, ReviewDestinationStep, etc.)
2. Plan 28-03: Wire up 7-step wizard navigation and state management
3. Plan 28-04: Migrate existing onboarding data to new schema

**Dependencies for next plans:**
- Step components will import schemas from lib/validations/onboarding.ts
- Wizard state will match OnboardingBusiness type shape
- Server action will write to new business columns

## Files Changed

**Created:**
- `supabase/migrations/20260205044834_add_business_onboarding_fields.sql` - Business table onboarding fields
- `lib/validations/onboarding.ts` - Step-specific Zod validation schemas

**Modified:**
- `lib/types/database.ts` - Business interface with 4 new fields
- `lib/types/onboarding.ts` - OnboardingBusiness type expanded to 6 fields
- `lib/validations/business.ts` - businessSchema with phone validation

## Commits

1. `e940635` - feat(28-01): add business onboarding fields migration
2. `4bd51d2` - feat(28-01): add onboarding types and validation schemas

## Lessons Learned

1. **Zod z.literal syntax:** z.literal(true, { message: '...' }) uses message property, not errorMap
2. **Type-first development:** Creating types before components ensures clean contracts
3. **Schema reuse:** SERVICE_TYPES import from job.ts prevents duplication
4. **Migration comments:** COMMENT ON COLUMN provides documentation at DB level

## Metrics

- **Duration:** 2.3 minutes
- **Tasks completed:** 2/2
- **Commits:** 2 (1 per task)
- **Files changed:** 5 (2 created, 3 modified)
- **Lines added:** ~100
- **Type safety:** 100% (all fields typed, all schemas exported)
