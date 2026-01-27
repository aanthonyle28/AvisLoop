---
phase: 02-business-setup
plan: 02
subsystem: business-api
tags: [server-actions, supabase, zod, business-crud]

dependency_graph:
  requires: [02-01]
  provides: [business-server-actions, data-fetching]
  affects: [02-03, 03-01]

tech_stack:
  added: []
  patterns: [server-actions-crud, upsert-pattern]

files:
  key_files:
    created:
      - lib/actions/business.ts
    modified: []

decisions:
  - id: use-upsert-pattern
    choice: Check existing business before insert/update
    reason: Simpler than PostgreSQL upsert, handles one-business-per-user MVP constraint

metrics:
  duration: 2 min
  completed: 2026-01-27
---

# Phase 02 Plan 02: Business Server Actions Summary

Server Actions for business and email template CRUD with auth validation and Zod parsing.

## Artifacts Created

| Artifact | Purpose | Key Exports |
|----------|---------|-------------|
| lib/actions/business.ts | Server Actions for business CRUD | updateBusiness, createEmailTemplate, deleteEmailTemplate, getBusiness, getEmailTemplates, BusinessActionState |

## Key Links Established

| From | To | Link Type |
|------|-----|-----------|
| lib/actions/business.ts | lib/validations/business.ts | import businessSchema, emailTemplateSchema |
| lib/actions/business.ts | lib/supabase/server.ts | import createClient |
| updateBusiness | supabase.from('businesses') | database query |
| createEmailTemplate | supabase.from('email_templates') | database query |

## Implementation Details

### Server Actions

1. **updateBusiness** - Upsert business profile
   - Auth validation with getUser()
   - Zod schema parsing with field-level errors
   - Check for existing business before insert/update
   - Convert empty strings to null for database
   - revalidatePath after mutation

2. **createEmailTemplate** - Add template to business
   - Requires business to exist first
   - Sets is_default to false for user templates
   - Full Zod validation on name, subject, body

3. **deleteEmailTemplate** - Remove user's template
   - Prevents deletion of default templates
   - RLS handles ownership authorization
   - Takes templateId directly (not formData)

### Data Fetching Functions

1. **getBusiness** - Load business with nested templates
   - For Server Components
   - Returns null if no business or unauthenticated

2. **getEmailTemplates** - Load sorted template list
   - Default templates first, then by created_at
   - Returns empty array if no business

### Pattern Conformance (Phase 1)

- `'use server'` directive at top
- `BusinessActionState` type matches `AuthActionState`
- `getUser()` for auth (not getSession)
- `safeParse` with `fieldErrors` from `flatten()`
- `revalidatePath` after all mutations

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upsert pattern | Check existing then insert/update | Clearer than PostgreSQL upsert, matches one-business-per-user MVP |
| Data fetching in same file | Collocate with mutations | Simplifies imports for settings page |
| deleteEmailTemplate signature | Takes string ID directly | Not a form action, cleaner API |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- [x] TypeScript compiles: `npx tsc --noEmit` passes
- [x] All exports present: BusinessActionState, updateBusiness, createEmailTemplate, deleteEmailTemplate, getBusiness, getEmailTemplates
- [x] Pattern conformance: matches Phase 1 auth.ts patterns
- [x] Full build: `npm run build` completes successfully

## Test Plan

Manual testing available after migration 00002 applied:
1. Create business profile via form
2. Update business settings
3. Create email template
4. Delete user-created template
5. Verify cannot delete default template
6. Check unauthenticated access blocked

## Next Phase Readiness

**Ready for 02-03:** UI forms can now use these Server Actions with useActionState pattern.

**Blockers:** None - migration 00002 must be applied to Supabase before runtime testing.
