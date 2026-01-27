---
phase: 04-core-sending
plan: 01
subsystem: database
status: complete
tags: [migration, schema, types, validation, send-logs]

dependencies:
  requires: [03.1-01]
  provides: [send_logs_table, send_types, send_validation]
  affects: [04-02, 04-03, 04-04, 04-05]

tech-stack:
  added: []
  patterns: [rls-subquery-pattern, moddatetime-trigger]

key-files:
  created:
    - supabase/migrations/00005_create_send_logs.sql
    - lib/types/database.ts (SendLog types)
    - lib/validations/send.ts
  modified:
    - lib/types/database.ts (Contact, Business updates)

decisions:
  - id: send-status-enum
    decision: "Use TEXT with CHECK constraint for send status enum"
    rationale: "Matches existing pattern, supports webhook status updates without schema changes"
    alternatives: "Native Postgres ENUM type (less flexible for adding statuses)"

  - id: provider-id-storage
    decision: "Store provider_id (Resend/Postmark email ID) as TEXT column"
    rationale: "Enables webhook correlation and delivery tracking"
    alternatives: "Separate provider_events table (premature complexity for MVP)"

  - id: opted-out-contact
    decision: "Add opted_out boolean to contacts table"
    rationale: "Required for compliance (GDPR, CAN-SPAM) and user preference tracking"
    alternatives: "Separate opt_outs table (overkill for simple flag)"

  - id: business-tier
    decision: "Add tier column to businesses for MVP limit enforcement"
    rationale: "Enables basic/pro/trial tier limits (e.g., 100 sends/month for basic)"
    alternatives: "Separate subscriptions table (premature for MVP)"

metrics:
  duration: 2 min
  completed: 2026-01-27
---

# Phase 04 Plan 01: Database Schema & Types Summary

**One-liner:** Created send_logs table with RLS for email tracking, added opted_out/tier columns, TypeScript types, and Zod validation schemas.

## What Was Built

### Migration: 00005_create_send_logs.sql

1. **send_logs table**
   - Tracks email send operations with status progression
   - Fields: business_id, contact_id, template_id, status, provider_id, error_message, subject
   - Status enum: pending → sent → delivered/bounced/complained/failed/opened
   - Foreign keys with CASCADE/SET NULL for referential integrity

2. **RLS policies** (subquery pattern for business ownership)
   - SELECT: Users view own send_logs
   - INSERT: Users insert own send_logs
   - UPDATE: Users update own send_logs (for webhook status updates)

3. **Performance indexes**
   - idx_send_logs_business_id (FK lookups)
   - idx_send_logs_contact_id (per-contact history)
   - idx_send_logs_created_at DESC (recent send history - most common query)

4. **moddatetime trigger** for updated_at auto-updates

5. **contacts.opted_out column**
   - Boolean field for compliance (GDPR, CAN-SPAM)
   - Composite index on (business_id, status, opted_out) for sendable contacts query

6. **businesses.tier column**
   - TEXT enum: 'basic' | 'pro' | 'trial'
   - For MVP send limit enforcement

### TypeScript Types: lib/types/database.ts

- **SendLog interface** - matches migration schema exactly
- **SendLogInsert** - omits auto-generated fields (id, timestamps, provider_id, error_message)
- **SendLogUpdate** - partial updates for status, provider_id, error_message (webhook updates)
- **SendLogWithContact** - joined type for history display with contact name/email
- **Contact.opted_out** - added to existing interface
- **Business.tier** - added to existing interface

### Validation: lib/validations/send.ts

- **sendRequestSchema** - validates contactId (UUID), optional templateId, optional customSubject/customBody
- **batchSendSchema** - validates contactIds array (1-50 items), optional templateId
- **SendRequest, BatchSendRequest types** - inferred from schemas

## Commits

| Task | Commit  | Description                           |
|------|---------|---------------------------------------|
| 1    | 30dc797 | Create send_logs migration            |
| 2    | ffbfff8 | Add SendLog types to database.ts      |
| 3    | f0d5dd1 | Create send validation schemas        |

## Key Technical Decisions

### Status Enum Design
Used TEXT with CHECK constraint instead of native Postgres ENUM. This matches the existing pattern (contact.status, business.tier) and allows adding new statuses (e.g., "clicked", "replied") without ALTER TYPE migrations.

### Provider ID for Webhooks
Storing provider_id (Resend/Postmark email ID) in send_logs enables webhook correlation. When Resend sends a delivery status webhook, we can update the send_log row by matching provider_id.

### Opted Out Flag
Added to contacts table instead of separate opt_outs table. Simple boolean flag is sufficient for MVP. Future: may need opt_out_at timestamp for audit trail.

### Tier-based Limits
Added tier column to businesses for MVP send limit enforcement (basic = 100 sends/month). This avoids premature Stripe subscriptions integration while still enabling tiered limits in send logic.

## Verification Results

✅ `npx tsc --noEmit` - no type errors
✅ Migration file exists with all required sections (table, indexes, RLS, triggers, ALTER TABLEs)
✅ database.ts exports SendLog, SendLogInsert, SendLogUpdate, SendLogWithContact
✅ send.ts exports sendRequestSchema, batchSendSchema with proper validation
✅ Contact interface includes opted_out: boolean
✅ Business interface includes tier: 'basic' | 'pro' | 'trial'
✅ 3 RLS policies created (SELECT, INSERT, UPDATE)

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

### Ready for 04-02 (Send Flow UI)
- ✅ send_logs table ready for insertion
- ✅ SendLogInsert type available
- ✅ sendRequestSchema ready for Server Action validation
- ✅ opted_out field ready for "sendable contacts" filtering

### Ready for 04-03 (Email Provider Integration)
- ✅ provider_id field ready for Resend email ID storage
- ✅ status field ready for webhook updates
- ✅ error_message field ready for failure tracking

### Ready for 04-04 (Send History)
- ✅ send_logs table with created_at DESC index
- ✅ SendLogWithContact type for joined queries
- ✅ RLS policies ensure business isolation

### Ready for 04-05 (Webhook Handler)
- ✅ SendLogUpdate type for status updates
- ✅ UPDATE RLS policy allows webhook status changes
- ✅ provider_id enables webhook correlation

### No blockers identified

## Files Reference

**Migration:**
- `supabase/migrations/00005_create_send_logs.sql` - Apply via Supabase SQL Editor

**Types:**
- `lib/types/database.ts` - SendLog, SendLogInsert, SendLogUpdate, SendLogWithContact

**Validation:**
- `lib/validations/send.ts` - sendRequestSchema, batchSendSchema

## Performance Considerations

- **Indexes optimized for common queries:**
  - Recent send history: `idx_send_logs_created_at DESC`
  - Per-contact history: `idx_send_logs_contact_id`
  - Business-scoped queries: `idx_send_logs_business_id`
  - Sendable contacts: `idx_contacts_sendable` (partial index on active, not opted out)

- **RLS subquery pattern:** Matches existing migrations for consistency

## Compliance & Security

- **opted_out field** enables GDPR/CAN-SPAM compliance
- **RLS policies** ensure multi-tenant isolation (users only see their business's send logs)
- **Cascading deletes** maintain referential integrity (delete business → delete send_logs)
- **SET NULL on template deletion** preserves send history even if template deleted

## Documentation Updates Needed

- Update docs/DATA_MODEL.md with send_logs table schema and RLS policies
- Update docs/PROJECT_STATE.md "Completed Setup" section to note migration 00005 applied
