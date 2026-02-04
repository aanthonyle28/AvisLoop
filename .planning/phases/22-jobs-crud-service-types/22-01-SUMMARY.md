---
phase: 22-jobs-crud-service-types
plan: 01
subsystem: database
tags: [postgres, supabase, rls, jobs, service-types, migrations]

# Dependency graph
requires:
  - phase: 20-database-migration-customer-enhancement
    provides: customers table that jobs reference via FK
provides:
  - Jobs table with RLS for business-scoped job tracking
  - Service type taxonomy (8 types) with CHECK constraint
  - Business service type settings (enabled types, timing defaults)
affects: [22-02-jobs-ui, 22-03-jobs-api, 24-campaign-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service type as TEXT with CHECK constraint (not enum) for migration flexibility"
    - "Business-scoped RLS via subquery pattern"
    - "JSONB for service type timing config"

key-files:
  created:
    - supabase/migrations/20260203_create_jobs.sql
    - supabase/migrations/20260203_add_service_type_settings.sql
  modified:
    - docs/DATA_MODEL.md

key-decisions:
  - "TEXT with CHECK constraint over ENUM for service types - easier to add/remove types in future"
  - "Lowercase service types to avoid casing issues in queries"
  - "Default timing values based on service type (cleaning 4h, roofing 72h, etc.)"

patterns-established:
  - "Jobs table follows same RLS pattern as customers (business_id subquery)"
  - "Service type timing stored per-business in JSONB for customization"

# Metrics
duration: 2min
completed: 2026-02-04
---

# Phase 22 Plan 01: Jobs Table Schema Summary

**Jobs table with service type taxonomy, RLS policies, and business service type settings for campaign targeting**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-04T00:50:05Z
- **Completed:** 2026-02-04T00:52:25Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Jobs table with FK to customers and businesses (CASCADE delete)
- Service type CHECK constraint for 8 home service categories
- Status workflow (completed/do_not_send) for campaign enrollment control
- Business service type settings for per-type timing defaults
- RLS policies following established business-scoped subquery pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create jobs table migration** - `bbad444` (feat)
2. **Task 2: Add service type settings to businesses table** - `38d6030` (feat)
3. **Task 3: Update DATA_MODEL.md with jobs table documentation** - `26858b3` (docs)

## Files Created/Modified

- `supabase/migrations/20260203_create_jobs.sql` - Jobs table with RLS, indexes, constraints, and moddatetime trigger
- `supabase/migrations/20260203_add_service_type_settings.sql` - Business columns for service type config
- `docs/DATA_MODEL.md` - Jobs table documentation following customers pattern

## Decisions Made

- **TEXT with CHECK over ENUM:** Service types use CHECK constraint for easier future migrations
- **Lowercase service types:** Avoids casing issues in queries and UI matching
- **Default timing per type:** Based on service completion verification needs (cleaning 4h quick, roofing 72h weather-dependent)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod 4 validation syntax in job schema**
- **Found during:** Verification (typecheck)
- **Issue:** Pre-existing `lib/validations/job.ts` used unsupported `{ message }` object syntax with Zod 4
- **Fix:** Changed to standard `.uuid('message')` pattern matching codebase conventions
- **Files modified:** lib/validations/job.ts
- **Verification:** `pnpm typecheck` passes
- **Committed in:** `b662916`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was for pre-existing file not in plan scope. No impact on planned deliverables.

## Issues Encountered

None - migrations created successfully following established patterns.

## User Setup Required

None - no external service configuration required. Migrations will be applied on next `supabase db push` or `supabase db reset`.

## Next Phase Readiness

- Jobs table schema ready for 22-02 (Jobs UI)
- Service types and timing defaults ready for campaign engine (Phase 24)
- TypeScript types already exist in `lib/types/database.ts` (from parallel work)
- Validation schemas in `lib/validations/job.ts` ready for forms

---
*Phase: 22-jobs-crud-service-types*
*Completed: 2026-02-04*
