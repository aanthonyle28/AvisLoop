---
phase: 24-multi-touch-campaign-engine
plan: 03
subsystem: type-system
tags: [typescript, zod, validation, constants]
status: complete

dependency_graph:
  requires:
    - 24-01-database-schema
  provides:
    - Campaign TypeScript types
    - Campaign Zod validation schemas
    - Campaign preset constants
  affects:
    - 24-04-campaign-crud
    - 24-05-campaign-ui
    - All future campaign features

tech_stack:
  added: []
  patterns:
    - Discriminated union types for status enums
    - Zod schema refinement for sequential validation
    - Constant-driven preset definitions

file_tracking:
  created:
    - lib/validations/campaign.ts
    - lib/constants/campaigns.ts
  modified:
    - lib/types/database.ts
    - lib/actions/campaign.ts

decisions:
  - id: campaign-type-structure
    choice: Separate Campaign, CampaignTouch, CampaignEnrollment interfaces
    rationale: Matches database normalization, enables selective joins
    alternatives: Single denormalized interface
  - id: sequential-touch-validation
    choice: Zod refine function validates touch numbers are 1,2,3,4
    rationale: Prevents gaps/duplicates at form validation layer
    alternatives: Database constraint only
  - id: preset-as-constants
    choice: CAMPAIGN_PRESETS array mirrors seeded database data
    rationale: Client-side access without DB query, type-safe
    alternatives: Always query database for presets

metrics:
  duration: 5 minutes
  completed: 2026-02-04
---

# Phase 24 Plan 03: Campaign Types & Validation Summary

**One-liner:** TypeScript types, Zod schemas, and preset constants for campaign system with sequential touch validation

## What was built

**Task 1: Campaign Types (database.ts)**
- Added Campaign interface with status, service_type, is_preset fields
- Added CampaignTouch interface for touch sequences (1-4)
- Added CampaignEnrollment interface with denormalized touch timestamps
- Added CampaignWithTouches join type for nested data
- Added CampaignEnrollmentWithDetails join type for list views
- Added ClaimedCampaignTouch type for RPC return values
- Added status enums: CampaignStatus, EnrollmentStatus, TouchStatus
- Added EnrollmentStopReason union type (8 stop reasons)
- Insert/Update types for all CRUD operations

**Task 2: Validation Schemas (validations/campaign.ts)**
- campaignSchema: Validates name, service_type, status
- campaignTouchSchema: Validates touch config (1-720 hour delay)
- campaignWithTouchesSchema: Validates full campaign with sequential touch numbers
- enrollmentUpdateSchema: Validates stop operations
- Zod refine function ensures touch numbers are sequential (1,2,3,4)
- Exported form data types for React Hook Form integration

**Task 3: Campaign Constants (constants/campaigns.ts)**
- CAMPAIGN_PRESETS array with 3 presets (conservative, standard, aggressive)
- PresetTouch and CampaignPreset interfaces
- getPresetById helper function
- Rate limits: DEFAULT_EMAIL_RATE_LIMIT, DEFAULT_SMS_RATE_LIMIT (100/hour)
- Quiet hours: QUIET_HOURS (9 PM - 8 AM) for TCPA compliance
- Display labels: TOUCH_STATUS_LABELS, ENROLLMENT_STATUS_LABELS, STOP_REASON_LABELS
- Enrollment cooldown constants (7-90 days, default 30)

**Preset Definitions (matching 24-02 seeded data):**
- Conservative: 2 email touches (24h, 72h) - for HVAC, plumbing, electrical, roofing
- Standard: 2 email + 1 SMS (24h, 72h, 168h) - for painting, handyman, other
- Aggressive: 4 alternating touches (4h SMS, 24h email, 72h SMS, 168h email) - for cleaning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed improper any type in campaign.ts**
- **Found during:** Task 3 lint check
- **Issue:** lib/actions/campaign.ts line 258 used `any` type for CampaignTouch
- **Fix:** Changed `(t: any)` to `(t: CampaignTouch)` in duplicateCampaign function
- **Files modified:** lib/actions/campaign.ts
- **Commit:** fa99114

**2. [Rule 1 - Bug] Removed unused SERVICE_TYPES import**
- **Found during:** Task 2 typecheck
- **Issue:** lib/constants/services.ts doesn't exist yet
- **Fix:** Defined serviceTypeEnum directly in validation file
- **Files modified:** lib/validations/campaign.ts
- **Commit:** 1faee9e (fixed before commit)

## Key Technical Decisions

**Sequential Touch Validation:**
Used Zod's `.refine()` to validate touch numbers are sequential:
```typescript
.refine(
  (touches) => {
    const numbers = touches.map(t => t.touch_number).sort((a, b) => a - b)
    return numbers.every((n, i) => n === i + 1)
  },
  { message: 'Touch numbers must be sequential (1, 2, 3, 4)' }
)
```
This prevents users from creating campaigns with gaps (1,3,4) or duplicates (1,1,2).

**Null Semantics:**
- Campaign.service_type: NULL = "all services" campaign
- Campaign.business_id: NULL = system preset
- CampaignTouch.template_id: NULL = template not yet configured

**Type Safety:**
All types match database schema exactly. Insert/Update types omit auto-generated fields (id, timestamps) and immutable fields (business_id, is_preset).

## Integration Points

**Upstream (depends on):**
- 24-01: Database schema defines column types
- 24-02: Preset seed data matches CAMPAIGN_PRESETS constant

**Downstream (enables):**
- 24-04: Server actions use these types for CRUD operations
- 24-05: Forms use Zod schemas for validation
- Future: All campaign features import from these type definitions

## Next Phase Readiness

**Ready for Phase 24-04 (Campaign CRUD):**
- [x] All campaign types defined
- [x] Validation schemas ready for server actions
- [x] Constants provide preset data for UI

**Blockers:** None

**Follow-up needed:**
- None - types are complete and tested

## Verification Results

**Typecheck:** ✅ Pass (ran `pnpm typecheck`)
**Lint:** ✅ Pass (ran `pnpm lint`)
**Type Coverage:**
- Campaign: ✅ Full CRUD types (Insert, Update, WithTouches)
- CampaignTouch: ✅ Full CRUD types
- CampaignEnrollment: ✅ Full CRUD types (Insert, WithDetails)
- ClaimedCampaignTouch: ✅ RPC return type

**Schema Coverage:**
- Campaign creation: ✅ campaignSchema
- Touch configuration: ✅ campaignTouchSchema
- Full campaign + touches: ✅ campaignWithTouchesSchema
- Sequential validation: ✅ Zod refine function
- Enrollment updates: ✅ enrollmentUpdateSchema

**Constant Coverage:**
- Presets: ✅ 3 presets defined (conservative, standard, aggressive)
- Touch counts: ✅ 2, 3, 4 touches respectively
- Rate limits: ✅ Email/SMS limits defined
- Quiet hours: ✅ TCPA compliance hours (9 PM - 8 AM)
- Display labels: ✅ All statuses and stop reasons

## Files Changed

**Created:**
- `lib/validations/campaign.ts` (66 lines) - Zod validation schemas
- `lib/constants/campaigns.ts` (100 lines) - Preset definitions and constants

**Modified:**
- `lib/types/database.ts` (+110 lines) - Campaign types
- `lib/actions/campaign.ts` (+1 line) - Fixed any type → CampaignTouch

**Total:** 277 lines added, 1 line modified

## Commits

1. `843d935` - feat(24-03): add campaign types to database.ts
2. `1faee9e` - feat(24-03): create campaign validation schemas
3. `fa99114` - feat(24-03): create campaign constants and fix lint error
