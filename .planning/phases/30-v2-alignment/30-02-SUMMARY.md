---
phase: 30-v2-alignment
plan: 02
status: complete
completed_at: 2026-02-06
commit: ae0a8af

artifacts_created:
  - supabase/migrations/20260206_add_job_scheduled_status.sql

artifacts_modified:
  - lib/validations/job.ts
  - lib/actions/job.ts
  - lib/types/database.ts

tech_added:
  - Three-state job workflow (scheduled, completed, do_not_send)
  - JOB_STATUS_DESCRIPTIONS constant
  - markJobComplete action (alias for backward compat)

key_decisions:
  - Default status changed to 'scheduled' (was 'completed')
  - Campaign enrollment only triggers on 'completed' status
  - Partial index added for scheduled jobs queries
---

## Summary

Added 'scheduled' job status to support V2's dispatch-based workflow where jobs can be created ahead of time and marked complete later. This is the core status transition that triggers campaign enrollment.

## What Was Built

### Database Migration
- Added 'scheduled' to jobs status CHECK constraint
- Changed default from 'completed' to 'scheduled'
- Created partial index `idx_jobs_scheduled` for "Ready to Complete" queries

### lib/validations/job.ts
- `JOB_STATUSES` now includes 'scheduled'
- Default status in schema changed to 'scheduled'
- Added `JOB_STATUS_DESCRIPTIONS` constant for UI tooltips

### lib/actions/job.ts
- `createJob` defaults to 'scheduled' status
- `updateJob` handles all status transitions correctly
- `markJobComplete()` added as primary export (V2 naming)
- `markJobCompleted` kept as alias for backward compatibility

### lib/types/database.ts
- `JobStatus` type updated to include 'scheduled'

## V2 Workflow

```
scheduled ────────────────► completed ────────► enrolled
              ↑                    ↑
         User action          THE TRIGGER
        (one tap)           (automation starts)
```

- Jobs created with status 'scheduled' by default
- "Mark Complete" triggers status change + campaign enrollment
- Campaign enrollment logic unchanged (fires on 'completed')

## Key Patterns

```typescript
// Status transition logic in updateJob
if (status === 'completed' && currentJob?.status !== 'completed') {
  completedAt = new Date().toISOString()
} else if (status === 'scheduled' || status === 'do_not_send') {
  completedAt = null
}
```

## Dependencies

- Used by: Plan 30-04 (Mark Complete button)
- Requires: Database migration to be run

## Verification

- [x] TypeScript compiles without errors
- [x] JOB_STATUSES array includes 'scheduled'
- [x] JOB_STATUS_LABELS has label for 'scheduled'
- [x] JOB_STATUS_DESCRIPTIONS has description for all statuses
- [x] markJobComplete action exported
- [x] Migration creates partial index
