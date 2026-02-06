---
phase: 32
plan: 01
subsystem: database
tags: [onboarding, schema, jsonb]
completed: 2026-02-06
duration: ~5 minutes
requires: []
provides:
  - onboarding_checklist column on businesses table
  - OnboardingChecklist TypeScript interface
affects:
  - 32-02 (checklist loader and UI)
  - 32-03 (progress tracking)
  - 32-04 (dismissal flow)
tech-stack:
  added: []
  patterns:
    - JSONB for structured checklist state
    - Partial index for analytics queries
key-files:
  created:
    - supabase/migrations/20260206_add_onboarding_checklist.sql
  modified:
    - lib/types/database.ts
decisions: []
---

# Phase 32 Plan 01: Onboarding Checklist Schema Summary

JSONB column added to businesses table for tracking Getting Started checklist progress with TypeScript types.

## What Was Built

### Database Migration
Created `supabase/migrations/20260206_add_onboarding_checklist.sql`:
- Added `onboarding_checklist` JSONB column to `businesses` table
- Column is NOT NULL with structured default (all items false)
- Partial index for querying incomplete checklists

### Checklist Structure

```json
{
  "first_job_added": false,
  "campaign_reviewed": false,
  "job_completed": false,
  "first_review_click": false,
  "dismissed": false,
  "dismissed_at": null,
  "collapsed": false,
  "first_seen_at": null
}
```

### TypeScript Types
Updated `lib/types/database.ts`:
- Added `OnboardingChecklist` interface with JSDoc comments
- Updated `Business` interface with `onboarding_checklist: OnboardingChecklist | null`

## V2 Philosophy Alignment

The checklist tracks V2-aligned actions:
- `first_job_added` - Adding jobs (not customers)
- `campaign_reviewed` - Setting up automation (not manual sends)
- `job_completed` - Completing jobs (the one user action)
- `first_review_click` - Funnel success (automated outcome)

No customer-centric or manual-send metrics are tracked.

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| 574fd2e | Database migration for onboarding_checklist column | supabase/migrations/20260206_add_onboarding_checklist.sql |
| e510656 | OnboardingChecklist TypeScript types | lib/types/database.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps

- Plan 02: Create loader action and Getting Started UI component
- Plan 03: Add progress tracking server actions
- Plan 04: Implement dismissal and auto-collapse logic

## Verification Results

- `pnpm typecheck` - Pass
- `pnpm lint` - Pass
- Migration file exists at correct path
- OnboardingChecklist interface exported
- Business type includes onboarding_checklist field
