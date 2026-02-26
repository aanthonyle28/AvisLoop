---
phase: 46
plan: 01
subsystem: campaign-enrollment
tags: [supabase, migration, typescript, campaign, enrollment, frozen-status]
dependency-graph:
  requires: []
  provides: [frozen-enrollment-status, expanded-unique-index, deleteCampaign-frozen-handling]
  affects: [46-02, 46-03, 46-04, 46-05]
tech-stack:
  added: []
  patterns: [enrollment-status-state-machine-extension]
key-files:
  created:
    - supabase/migrations/20260226_add_frozen_enrollment_status.sql
  modified:
    - lib/types/database.ts
    - lib/actions/campaign.ts
decisions:
  - Frozen enrollments are treated as "in-progress" in all deletion and reassignment queries
  - Partial unique index expanded to cover both active and frozen statuses
  - stopEnrollment function left unchanged (stops individual enrollment by ID, not bulk campaign operations)
metrics:
  duration: ~5 minutes
  completed: 2026-02-26
---

# Phase 46 Plan 01: Supabase Migration + TypeScript Types + deleteCampaign Queries Summary

**One-liner:** Added frozen enrollment status to DB constraint, TypeScript type, and deleteCampaign/getCampaignDeletionInfo queries to unblock campaign pause/resume work.

## What Was Done

### Task 1: Supabase Migration
Created `supabase/migrations/20260226_add_frozen_enrollment_status.sql` with two changes:
1. **ALTER CHECK constraint** on `campaign_enrollments.status` to include `'frozen'` alongside `active`, `completed`, `stopped`
2. **Expanded partial unique index** `idx_enrollments_unique_active` from `WHERE status = 'active'` to `WHERE status IN ('active', 'frozen')` -- prevents duplicate frozen+active enrollments for same customer+campaign

### Task 2: TypeScript Type Update
Updated `EnrollmentStatus` in `lib/types/database.ts` (line 311):
- From: `'active' | 'completed' | 'stopped'`
- To: `'active' | 'completed' | 'stopped' | 'frozen'`

### Task 3: Campaign Deletion Query Updates
Updated 5 queries in `lib/actions/campaign.ts` from `.eq('status', 'active')` to `.in('status', ['active', 'frozen'])`:
1. `getCampaignDeletionInfo` -- enrollment count now includes frozen
2. `deleteCampaign` reassign branch -- fetch enrollments includes frozen
3. `deleteCampaign` reassign branch -- stop old enrollments includes frozen
4. `deleteCampaign` reassign branch -- check existing in target includes frozen
5. `deleteCampaign` no-reassign branch -- stop enrollments includes frozen

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Frozen treated as "in-progress" in all delete/reassign queries | A frozen enrollment IS still in progress (just paused), so deleting a campaign must handle it |
| Unique index covers active+frozen | Prevents duplicate enrollments that could occur if a customer gets a new active enrollment while their existing one is frozen |
| stopEnrollment unchanged | This function stops a single enrollment by ID; frozen enrollments should be unfrozen via resume, not individually stopped |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- Migration file exists with correct ALTER CONSTRAINT and DROP/CREATE INDEX
- TypeScript type includes `'frozen'` at line 311
- 5 occurrences of `.in('status', ['active', 'frozen'])` in campaign.ts (confirmed via grep)
- Only remaining `.eq('status', 'active')` in file are in `toggleCampaignStatus` (46-02 scope) and `stopEnrollment` (correctly unchanged)
- Pre-existing typecheck error (`customServiceNames` missing in layout.tsx) is unrelated to this plan

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 831eb88 | feat(46-01): add frozen enrollment status to Supabase migration |
| 2 | e381fcb | feat(46-01): add frozen to EnrollmentStatus TypeScript type |
| 3 | 2e2314e | feat(46-01): update deleteCampaign + getCampaignDeletionInfo for frozen enrollments |

## Next Phase Readiness

Plan 46-02 is unblocked:
- `frozen` status is now valid in the DB constraint
- TypeScript type accepts `frozen`
- `toggleCampaignStatus` still uses the old stop-on-pause pattern (to be rewritten in 46-02)
- Conflict resolver, dashboard queries, and enrollment conflict checks still need frozen handling (46-02 scope)
