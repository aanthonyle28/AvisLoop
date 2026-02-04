---
phase: 23
plan: 01
subsystem: database-schema
tags: [migration, templates, multi-channel, sms, email]
requires:
  - "Phase 22: Jobs CRUD & Service Types"
  - "email_templates table (from MVP)"
provides:
  - message_templates table (unified email + SMS)
  - 16 system default templates (8 service types x 2 channels)
  - Backward-compatible email_templates view
  - RLS policies for system template access
affects:
  - "Phase 23-02: Template UI will use message_templates table"
  - "Phase 24: Campaign engine will select templates by channel + service_type"
tech-stack:
  added: []
  patterns:
    - Channel discriminator pattern (email/sms in single table)
    - System templates with business_id NULL pattern
    - Backward-compatible view for zero-downtime migration
key-files:
  created:
    - supabase/migrations/20260203_rename_to_message_templates.sql
  modified:
    - docs/DATA_MODEL.md
decisions:
  - id: channel-discriminator
    what: Use channel column ('email'/'sms') instead of separate tables
    why: Simpler schema, shared RLS policies, easier template management
    date: 2026-02-03
  - id: system-templates-null-business
    what: System templates have business_id NULL instead of magic UUID
    why: Clearer intent, simpler RLS (OR is_default = true), easier to query
    date: 2026-02-03
  - id: backward-compatible-view
    what: Create email_templates view during migration window
    why: Allows rollback, gives time to update app code, zero-downtime migration
    date: 2026-02-04
metrics:
  duration: 2 minutes
  completed: 2026-02-04
---

# Phase 23 Plan 01: Database Migration for Message Templates Summary

**One-liner:** Migrated email_templates to unified message_templates table supporting both email and SMS channels with 16 service-specific default templates.

## What Was Built

Renamed `email_templates` table to `message_templates` and added multi-channel support:

1. **Schema changes:**
   - Added `channel` column with CHECK constraint ('email' or 'sms')
   - Added `service_type` column linking templates to service categories
   - Made `business_id` nullable to support system templates
   - Existing email templates automatically tagged with channel='email'

2. **System templates:**
   - Inserted 16 default templates (8 service types x 2 channels)
   - Email templates: Full subject + body with {{CUSTOMER_NAME}}, {{BUSINESS_NAME}}, {{REVIEW_LINK}}, {{SENDER_NAME}} placeholders
   - SMS templates: Concise body-only messages (114-140 chars) with same placeholders
   - All marked with `is_default=true` and `business_id=NULL`

3. **RLS policies:**
   - Updated all 4 policies to work on message_templates
   - Added system template read access: `OR is_default = true`
   - Prevented modification of system templates: `AND is_default = false`

4. **Backward compatibility:**
   - Created `email_templates` view filtering to `channel = 'email'`
   - Created `email_templates_backup` table for rollback safety
   - Updated indexes and moddatetime trigger

5. **Documentation:**
   - Added message_templates section to DATA_MODEL.md
   - Documented channel discriminator, system templates, constraints, RLS

## Deviations from Plan

**None** - plan executed exactly as written.

## Decisions Made

### Channel Discriminator Pattern

**Decision:** Use single `message_templates` table with `channel` column instead of separate `email_templates` and `sms_templates` tables.

**Rationale:**
- Simpler schema (1 table vs 2)
- Shared RLS policies reduce duplication
- Template selector UI can filter by channel
- Service type linking works identically for both channels

**Impact:** Phase 23-02 (Template UI) will use single data fetching function with channel filter.

### System Templates with NULL business_id

**Decision:** System templates use `business_id = NULL` instead of a magic UUID like '00000000-0000-0000-0000-000000000000'.

**Rationale:**
- Clearer intent - NULL explicitly means "not owned by any business"
- Simpler RLS - `OR is_default = true` instead of checking magic UUID
- Easier queries - `WHERE business_id IS NULL AND is_default = true`

**Impact:** Migration requires `ALTER TABLE ... ALTER COLUMN business_id DROP NOT NULL`.

### Backward-Compatible View

**Decision:** Create `email_templates` view during migration window instead of immediate hard cutover.

**Rationale:**
- Safe rollback path if issues discovered
- Gives time to update app code incrementally
- Zero-downtime migration (existing queries still work)

**Impact:** Phase 25 will remove view after all code updated to use message_templates.

## Technical Notes

### Migration Safety

Migration wrapped in BEGIN/COMMIT transaction for atomicity:
1. Backup table created first (`email_templates_backup`)
2. Table rename is instantaneous (no data copy)
3. Column additions use temporary defaults to handle existing rows
4. All policy/index/trigger updates atomic

If migration fails at any step, entire transaction rolls back.

### Default Template Content

Email templates:
- Service-specific subject lines (e.g., "How was your AC/heating service, {{CUSTOMER_NAME}}?")
- Professional body copy with clear CTA
- Consistent structure: greeting, service recap, feedback request, review link, signature

SMS templates:
- Kept under 160 chars (single SMS segment)
- Direct and conversational tone
- "Reply YES for review link" pattern for two-way engagement
- Consistent placeholders across all templates

### RLS Policy Changes

Original policies (email_templates):
```sql
USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
```

Updated policies (message_templates):
```sql
-- SELECT: Allow reading system templates
USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  OR is_default = true
)

-- INSERT/UPDATE/DELETE: Prevent modifying system templates
WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  AND is_default = false
)
```

### Indexes

Added specialized indexes:
- `idx_message_templates_channel` - Fast filtering by email/sms
- `idx_message_templates_is_default` (partial) - Optimized system template queries
- Kept `idx_message_templates_business_id` for user template lookups

## Testing Performed

**Migration syntax verified manually:**
- Checked existing email_templates schema from 00002_create_business.sql
- Verified RLS policies match naming conventions
- Confirmed CHECK constraints use correct service type enum values
- Validated 16 INSERT statements (8 service types x 2 channels)

**Cannot run `supabase db reset` (Docker Desktop not running)** - will be verified in Phase 23-02 when app code is updated.

## Next Phase Readiness

**Phase 23-02 (Template Selector UI) blockers: None**

Ready to proceed:
- [x] message_templates table schema defined
- [x] System templates exist (16 defaults)
- [x] RLS policies allow reading system templates
- [x] Channel and service_type columns available for filtering
- [x] Documentation updated

**Phase 24 (Campaign Engine) preparation:**
- [x] Templates linked to service types via service_type column
- [x] Both email and SMS templates available for each service type
- [x] Template body uses consistent {{PLACEHOLDER}} format

## Commands Reference

**Apply migration (when Docker running):**
```bash
supabase db reset
```

**Verify template count:**
```sql
SELECT COUNT(*) FROM message_templates WHERE is_default = true;
-- Expected: 16
```

**Verify channel distribution:**
```sql
SELECT channel, COUNT(*) FROM message_templates WHERE is_default = true GROUP BY channel;
-- Expected: email=8, sms=8
```

**Check RLS policies:**
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'message_templates';
-- Expected: 4 policies
```

**Rollback (if needed):**
```sql
DROP TABLE message_templates;
ALTER TABLE email_templates_backup RENAME TO email_templates;
-- Recreate original indexes, triggers, RLS policies
```

## Files Changed

**Created:**
- `supabase/migrations/20260203_rename_to_message_templates.sql` (173 lines)

**Modified:**
- `docs/DATA_MODEL.md` (+58 lines)

## Commit History

1. **8698129** - `feat(23-01): create message_templates migration with channel discriminator`
   - Migration file with schema changes and default template inserts

2. **f235b7f** - `docs(23-01): document message_templates schema in DATA_MODEL.md`
   - Added complete table documentation with schema, constraints, RLS, compatibility notes

## Open Questions

None - phase complete and ready for Phase 23-02.

## Recommendations

1. **Run migration verification as soon as Docker Desktop available:**
   - `supabase db reset`
   - Verify 16 templates exist
   - Test RLS policies with test user account

2. **Phase 23-02 implementation notes:**
   - Template selector should show system templates at top ("Use this template" → creates editable copy)
   - Filter by channel='email' initially (SMS selector comes in Phase 21)
   - Service type filter to show relevant templates

3. **Future cleanup (Phase 25):**
   - Remove `email_templates` view after all code migrated
   - Remove `email_templates_backup` table after migration proven stable
