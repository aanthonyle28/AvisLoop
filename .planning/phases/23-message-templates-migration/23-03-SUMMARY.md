---
phase: 23-message-templates-migration
plan: 03
subsystem: backend-data-layer
tags: [supabase, server-actions, crud, validation, zod]

requires:
  - 23-01-database-migration
provides:
  - message-template-crud-api
  - template-validation-layer
affects:
  - 23-04-settings-ui-refactor
  - 23-05-send-flow-integration

tech-stack:
  added: []
  patterns:
    - discriminated-union-validation
    - channel-based-filtering
    - business-scoped-queries

key-files:
  created:
    - lib/actions/message-template.ts
    - lib/data/message-template.ts
    - lib/validations/message-template.ts
  modified: []

decisions:
  - id: validation-discriminated-union
    what: Use Zod discriminated union for email vs SMS validation
    why: Email requires subject field, SMS does not - discriminated union enforces this at compile and runtime
    alternatives: [separate-schemas-per-channel, optional-subject-with-manual-check]

  - id: channel-filtering-optional
    what: All data functions accept optional channel parameter
    why: UI needs to filter templates by channel (email vs SMS send flows) but also show all templates in settings

  - id: system-template-protection
    what: Prevent editing/deleting system templates (is_default=true)
    why: System templates are seeded defaults - users must copy to customize

  - id: copy-template-workflow
    what: copySystemTemplate creates editable copy with user's business_id
    why: Allows users to customize system templates without modifying originals

metrics:
  duration: 4min 28sec
  tasks-completed: 2/2
  commits: 2
  files-created: 3
  files-modified: 0
  completed: 2026-02-04
---

# Phase 23 Plan 03: Server Actions & Data Functions Summary

**One-liner:** Message template CRUD with discriminated union validation and channel-based filtering

## What was built

Created complete backend API for message template management:

**Server Actions (lib/actions/message-template.ts):**
- `createMessageTemplate` - validates and inserts templates with business scoping
- `updateMessageTemplate` - prevents editing system templates, validates channel-specific fields
- `deleteMessageTemplate` - prevents deleting system defaults
- `copySystemTemplate` - creates editable copy from system templates

**Data Functions (lib/data/message-template.ts):**
- `getMessageTemplates` - fetch user templates with optional channel filter
- `getMessageTemplate` - fetch single template by ID
- `getDefaultMessageTemplates` - fetch system templates for "Use this template" flow
- `getAvailableTemplates` - fetch user + system templates for send form dropdowns

**Validation Schema (lib/validations/message-template.ts):**
- Discriminated union based on `channel` field
- Email schema requires subject (1-200 chars)
- SMS schema has no subject, shorter body limit (320 chars for 2 segments)
- Service type enum matching database constraint

## Key implementation details

**Discriminated Union Pattern:**
```typescript
export const messageTemplateSchema = z.discriminatedUnion('channel', [
  emailTemplateSchema,  // requires subject
  smsTemplateSchema,    // subject is empty string
])
```

**Business Scoping:**
All queries filter by `business_id` obtained from `auth.uid()` → `businesses.user_id` lookup.

**RLS Integration:**
Data functions rely on RLS policies to enforce ownership. Server actions explicitly check `is_default` flag to prevent mutations on system templates.

**Channel Filtering:**
All fetch functions accept optional `channel?: MessageChannel` parameter for email/SMS-specific queries.

**Error Handling:**
- Auth errors return empty arrays (data functions) or error state (actions)
- Validation errors return `fieldErrors` mapped to form fields
- Supabase errors return generic error message

## Testing completed

- ✅ `pnpm typecheck` - no type errors
- ✅ `pnpm lint` - no lint errors
- ✅ Verified 4 exported functions in actions file
- ✅ Verified 4 exported functions in data file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed corrupted validation schema file**
- **Found during:** Task 1 verification
- **Issue:** Parallel plan 23-02 created lib/validations/message-template.ts but file content was "new file" (1 line), causing TypeScript error "Cannot find name 'file'"
- **Fix:** Deleted corrupted file and recreated with proper Zod schema using bash heredoc
- **Files modified:** lib/validations/message-template.ts
- **Commit:** 316a0e9 (included in Task 1 commit)
- **Impact:** No delay - file needed to exist for server actions to compile

## Next Phase Readiness

**Ready for:**
- Phase 23-04: Settings UI can now call CRUD actions
- Phase 23-05: Send flow can fetch templates via getAvailableTemplates

**Blockers:** None

**Open questions:**
- Should service_type be required or optional for templates? Currently nullable/optional
- Default template selection workflow needs UI design (browse system templates, copy, customize)

## Files Modified

**Created:**
- `lib/actions/message-template.ts` (238 lines) - 4 server actions with validation
- `lib/data/message-template.ts` (131 lines) - 4 data fetching functions
- `lib/validations/message-template.ts` (56 lines) - Discriminated union schema

**Modified:** None

## Migration Notes

None - no schema changes, only API layer additions.

## Performance Considerations

**Database Queries:**
- All queries scoped by business_id (indexed)
- channel filtering uses indexed column
- System template queries use is_default index
- getAvailableTemplates uses OR condition (may scan both user + system templates)

**Caching:**
- revalidatePath('/settings') after all mutations
- No per-template caching yet (consider for high-traffic send flows)

## Security Notes

- All actions validate auth.uid() before business lookup
- RLS policies enforce business ownership on message_templates table
- System templates (is_default=true) protected from edit/delete
- Form data validated with Zod before database operations
- SQL injection prevented by Supabase parameterized queries
