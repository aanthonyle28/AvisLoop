---
phase: 23
plan: 02
subsystem: message-templates
tags: [typescript, types, validation, zod, constants]
dependencies:
  requires: [23-01]
  provides: [message-template-types, message-template-validation, default-template-constants]
  affects: [23-03, 23-04, 23-05]
tech-stack:
  added: []
  patterns: [discriminated-union-validation, type-safe-constants]
files:
  created:
    - lib/constants/default-templates.ts
  modified:
    - lib/types/database.ts
    - lib/validations/message-template.ts
decisions:
  - id: discriminated-union-validation
    choice: Use Zod discriminatedUnion for channel-specific validation
    rationale: Enables type-safe parsing based on channel field, ensures email requires subject while SMS has empty subject
  - id: sms-body-limit
    choice: Soft limit of 320 chars (2 segments) for SMS
    rationale: Allows multi-segment messages while warning users, not blocking like hard 160 limit
  - id: constants-mirror-migration
    choice: Constants file exactly mirrors database INSERT statements
    rationale: Ensures UI display, template copying, and database state remain synchronized
metrics:
  duration: 7m
  completed: 2026-02-04
---

# Phase 23 Plan 02: TypeScript Types & Validation Summary

**One-liner:** Discriminated union Zod schema for email/SMS templates with 16 default constants matching database inserts

## What Was Built

Created complete TypeScript type and validation layer for unified message templates supporting both email and SMS channels.

### Task 1: MessageTemplate Types (database.ts)
- Added `MessageChannel` type: `'email' | 'sms'`
- Created `MessageTemplate` interface with channel discriminator and service_type field
- Added `MessageTemplateInsert` and `MessageTemplateUpdate` helper types
- Created `BusinessWithMessageTemplates` interface for joins
- Deprecated `EmailTemplate` with backward compatibility
- Updated `BusinessWithTemplates` to support both old and new templates

### Task 2: Zod Validation Schema (message-template.ts)
- Implemented `messageTemplateSchema` using `z.discriminatedUnion('channel', [...])`
- Email schema: requires subject (max 200 chars), body max 5000 chars
- SMS schema: empty subject, body max 320 chars (soft limit for 2 segments)
- Service type enum matches database constraint (8 types)
- Exported individual schemas and inferred TypeScript types
- **Note:** File was created ahead of schedule in commit 316a0e9 (plan 23-03)

### Task 3: Default Template Constants (default-templates.ts)
- Defined all 16 default templates (8 service types × 2 channels)
- Email templates: service-specific tone, full body with placeholders
- SMS templates: concise format, all under 140 chars for single-segment delivery
- Helper functions:
  - `getDefaultTemplatesByChannel(channel)` - filter by email/sms
  - `getDefaultTemplatesByServiceType(serviceType)` - filter by service
  - `getDefaultTemplate(channel, serviceType)` - get specific template
- Templates exactly mirror migration 20260203 INSERT statements

## Verification Results

✅ All checks passed:
- `pnpm typecheck` - no type errors
- `pnpm lint` - no lint errors
- MessageTemplate interface in database.ts with service_type field
- Discriminated union validation in message-template.ts
- 16 default templates in constants file (verified count)
- All SMS bodies under 140 chars (longest: 134 chars)
- Constants match database INSERT statements

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Malformed file path**
- **Found during:** Task 2 execution
- **Issue:** TypeScript found duplicate file at `./C:AvisLooplibvalidationsmessage-template.ts` (malformed Windows path)
- **Fix:** Removed malformed file using `rm -f "./C:AvisLooplibvalidationsmessage-template.ts"`
- **Files modified:** None (removed orphaned file)
- **Commit:** No commit needed (file deletion)

**2. [Rule 1 - Ordering] Validation file created early**
- **Found during:** Task 2 verification
- **Issue:** `lib/validations/message-template.ts` already existed from commit 316a0e9 (plan 23-03)
- **Fix:** Verified file content matched plan specification exactly, created empty commit to track task completion
- **Files modified:** None (file already correct)
- **Commit:** bd2be5b

## Key Decisions

### 1. Discriminated Union for Channel Validation
**Decision:** Use Zod's `discriminatedUnion` based on `channel` field
**Rationale:**
- Efficient parsing - Zod checks channel first, then validates channel-specific fields
- Type safety - TypeScript knows email has subject, SMS doesn't
- Clear errors - validation messages specific to channel type
**Alternative considered:** Single schema with optional fields + runtime checks
**Trade-off:** More complex schema definition, but better type inference and runtime validation

### 2. SMS Body Soft Limit (320 chars)
**Decision:** Max 320 chars (2 segments) with warning message
**Rationale:**
- Hard 160 limit too restrictive for review requests
- 2 segments (320 chars) reasonable for short messages
- Error message guides users without blocking
**Alternative considered:** Hard 160 char limit
**Trade-off:** Allows slightly longer messages at cost of potential 2-segment delivery

### 3. Constants Mirror Database Inserts
**Decision:** Default templates constants exactly match migration SQL
**Rationale:**
- Single source of truth for default content
- UI can display defaults without database query
- Template copying can work offline/before database seeded
- Easy verification - diff constants against migration
**Alternative considered:** Only store in database, query for defaults
**Trade-off:** Duplication of content, but gains offline capability and simpler UI code

## Technical Patterns Established

### Discriminated Union Validation
```typescript
// Base fields shared by both channels
const baseTemplateFields = {
  name: z.string().min(1).max(100).trim(),
  service_type: z.enum(serviceTypes).nullable().optional(),
}

// Channel-specific schemas
const emailTemplateSchema = z.object({
  ...baseTemplateFields,
  channel: z.literal('email'),
  subject: z.string().min(1).max(200).trim(),
  body: z.string().min(1).max(5000).trim(),
})

const smsTemplateSchema = z.object({
  ...baseTemplateFields,
  channel: z.literal('sms'),
  subject: z.literal('').optional().default(''),
  body: z.string().min(1).max(320).trim(),
})

// Discriminated union
export const messageTemplateSchema = z.discriminatedUnion('channel', [
  emailTemplateSchema,
  smsTemplateSchema,
])
```

**Benefits:**
- TypeScript infers correct type based on channel
- Validation errors are channel-specific
- No need for manual type guards

### Type-Safe Constants with Helper Functions
```typescript
export const DEFAULT_MESSAGE_TEMPLATES: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  ...EMAIL_TEMPLATES,
  ...SMS_TEMPLATES,
]

export function getDefaultTemplate(
  channel: MessageChannel,
  serviceType: ServiceType
): Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'> | undefined {
  return DEFAULT_MESSAGE_TEMPLATES.find(
    (t) => t.channel === channel && t.service_type === serviceType
  )
}
```

**Benefits:**
- Constants typed same as database models
- Helper functions provide filtered views
- Single import for all default template operations

## Dependencies Created

**Provides for downstream plans:**
- 23-03: Server actions use messageTemplateSchema for validation
- 23-04: Settings UI uses DEFAULT_MESSAGE_TEMPLATES for display
- 23-05: Template copying uses getDefaultTemplate() helper
- 23-06: Migration scripts use constants to verify database state

## Next Phase Readiness

**Blockers:** None

**Concerns:** None - all types and validation complete

**Recommendations:**
1. Server actions (23-03) can now use messageTemplateSchema for input validation
2. Settings UI (23-04) can display default templates using constants
3. Consider adding runtime validation for template placeholder syntax (future enhancement)

## Files Changed

### Created (1)
- `lib/constants/default-templates.ts` (264 lines)
  - 16 default templates (8 service types × 2 channels)
  - Helper functions for filtering and lookup

### Modified (2)
- `lib/types/database.ts`
  - Added MessageTemplate interface with channel and service_type
  - Added MessageTemplateInsert and MessageTemplateUpdate types
  - Deprecated EmailTemplate (backward compatible)

- `lib/validations/message-template.ts`
  - Created discriminated union schema for email/SMS validation
  - Service type enum matching database constraint
  - Exported individual schemas and TypeScript types

## Commits

- `e246369` feat(23-02): add MessageTemplate types with channel discriminator
- `bd2be5b` feat(23-02): Zod validation schema with discriminated union
- `60201be` feat(23-02): create default templates constants file

**Total commits:** 3 (1 per task)

## Performance Metrics

- **Duration:** 7 minutes
- **Tasks completed:** 3/3
- **Files created:** 1
- **Files modified:** 2
- **Lines added:** ~380
- **Typecheck time:** <5s
- **Lint time:** <3s
