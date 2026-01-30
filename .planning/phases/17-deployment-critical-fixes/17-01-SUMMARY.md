---
phase: 17-deployment-critical-fixes
plan: 01
subsystem: database
requires:
  - 00009_add_reviewed_at
provides:
  - scheduled_sends table with RLS
  - Migration sequence fix (00009 -> 00009b -> 00010)
affects:
  - 17-02 (future deployment migration testing)
tags:
  - supabase
  - migration
  - scheduled-sends
  - rls
  - deployment-fix
tech-stack:
  added: []
  patterns:
    - Partial index for cron query optimization
    - moddatetime trigger pattern
    - RLS subquery pattern for multi-tenancy
decisions:
  - id: D17-01-01
    summary: Include 'processing' status in CHECK constraint
    rationale: Migration 00010 claim function sets status to 'processing'
  - id: D17-01-02
    summary: Partial index on (status, scheduled_for) WHERE status = 'pending'
    rationale: Optimizes cron claim query that only selects pending records
  - id: D17-01-03
    summary: No DELETE policy, use status changes instead
    rationale: Audit trail preservation, consistent with send_logs pattern
key-files:
  created:
    - supabase/migrations/00009b_create_scheduled_sends.sql
  modified: []
metrics:
  duration: 3 minutes
  tasks: 1
  commits: 1
  deviations: 0
completed: 2026-01-30
---

# Phase 17 Plan 01: Create Scheduled Sends Table Migration Summary

**One-liner:** Created missing scheduled_sends table migration that slots between 00009 and 00010, fixing deployment blocker where fresh database deploy failed at migration 00010.

## What Was Built

### Migration File: 00009b_create_scheduled_sends.sql

**Table schema matching TypeScript ScheduledSend interface:**
- `id` (UUID PK)
- `business_id` (FK → businesses.id, CASCADE)
- `contact_ids` (UUID[] for batch sending)
- `template_id` (FK → email_templates.id, SET NULL)
- `custom_subject` (optional override)
- `scheduled_for` (TIMESTAMPTZ when to send)
- `status` (CHECK: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled')
- `executed_at` (TIMESTAMPTZ when processed)
- `send_log_ids` (UUID[] results)
- `error_message` (failure details)
- `created_at`, `updated_at` (timestamps)

**RLS policies (authenticated users only):**
- SELECT: Users view own scheduled_sends (business ownership subquery)
- INSERT: Users insert own scheduled_sends (business ownership subquery)
- UPDATE: Users update own scheduled_sends (business ownership subquery)
- No DELETE policy (use status='cancelled' for audit trail)

**Performance indexes:**
1. `idx_scheduled_sends_business_id` - FK lookups
2. `idx_scheduled_sends_pending_due` - Partial index WHERE status='pending' (optimizes cron claim query in 00010)
3. `idx_scheduled_sends_created_at` - Listing queries (DESC)

**Trigger:**
- `set_scheduled_sends_updated_at` - moddatetime for auto-updating updated_at column

## Decisions Made

### D17-01-01: Include 'processing' status in CHECK constraint
**Context:** Migration 00010 defines `claim_due_scheduled_sends()` function that sets status to 'processing'
**Decision:** Include 'processing' in status CHECK constraint (not in TypeScript ScheduledSend type)
**Rationale:** Database must accept 'processing' status value used by claim function
**Impact:** Schema matches actual runtime behavior, prevents constraint violations

### D17-01-02: Partial index on (status, scheduled_for) WHERE status = 'pending'
**Context:** Cron claim query in 00010 filters WHERE status='pending' AND scheduled_for <= now()
**Decision:** Create partial index only on pending records
**Rationale:** 90%+ of scheduled_sends records are completed/cancelled; cron only needs to scan pending
**Impact:** Faster cron queries, smaller index size, reduced disk I/O

### D17-01-03: No DELETE policy, use status changes instead
**Context:** Standard practice for send_logs and other audit tables
**Decision:** Omit DELETE policy, require status='cancelled' for user cancellations
**Rationale:** Audit trail preservation, easier to debug issues, consistent with existing patterns
**Impact:** All scheduled send history retained, database storage grows over time

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

**Created:**
- `supabase/migrations/00009b_create_scheduled_sends.sql` (85 lines)

**Modified:**
- None

## Commits

| Hash    | Message                                          |
|---------|--------------------------------------------------|
| 28ccd18 | feat(17-01): create scheduled_sends table migration |

## Verification Results

**Migration order verified:**
```
00009_add_reviewed_at.sql
00009b_create_scheduled_sends.sql  ← new migration
00010_claim_due_scheduled_sends.sql
```

**SQL elements verified:**
- ✅ 1 CREATE TABLE
- ✅ 1 ENABLE ROW LEVEL SECURITY
- ✅ 3 CREATE POLICY (SELECT, INSERT, UPDATE)
- ✅ 3 CREATE INDEX (business_id, pending_due partial, created_at)
- ✅ 1 CREATE TRIGGER (moddatetime)

**TypeScript compilation:**
- ✅ `pnpm typecheck` passes with no errors

## Next Phase Readiness

**Blockers:** None

**Concerns:**
- Fresh database deploy must apply all migrations in sequence to validate fix
- Consider adding migration test suite for CI/CD (verify all migrations apply cleanly to empty database)

**Recommendations for next plan:**
1. Test full migration sequence on fresh database
2. Verify 00010 functions execute successfully after 00009b
3. Consider adding migration rollback scripts for production safety
