---
phase: 55-clients-page
plan: 01
subsystem: database
tags: [supabase, postgres, typescript, zod, server-actions]

# Dependency graph
requires:
  - phase: 52-agency-multi-business
    provides: businesses table with user_id ownership + RLS
  - phase: 53-data-function-refactor
    provides: established pattern for data functions accepting businessId
provides:
  - 10 nullable agency metadata columns on businesses table (migration)
  - Extended Business TypeScript interface with all 10 agency fields
  - getUserBusinessesWithMetadata() data function returning all user businesses
  - updateBusinessMetadata() server action with Zod validation + revalidatePath
  - updateBusinessNotes() fire-and-forget server action for auto-save
  - businessMetadataSchema Zod schema for 9 editable metadata fields
affects:
  - 55-02 (card grid consumes getUserBusinessesWithMetadata and Business interface)
  - 55-03 (detail drawer calls updateBusinessMetadata and updateBusinessNotes)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Separate Zod schema for partial/nullable metadata (agency_notes excluded, has own action)
    - Fire-and-forget server action pattern (no revalidatePath on notes auto-save)
    - getUserBusinessesWithMetadata uses select('*') with user_id filter (not getActiveBusiness)

key-files:
  created:
    - supabase/migrations/20260227_add_agency_metadata.sql
    - lib/types/database.ts (modified)
    - lib/data/businesses.ts
    - lib/actions/business-metadata.ts
    - lib/validations/business-metadata.ts
  modified:
    - lib/types/database.ts

key-decisions:
  - "NUMERIC(2,1) for ratings — exact decimal precision avoids 4.299999 floating point issues"
  - "NUMERIC(10,2) for monthly_fee — currency precision"
  - "agency_notes excluded from businessMetadataSchema — has dedicated updateBusinessNotes action"
  - "updateBusinessNotes omits revalidatePath — notes auto-save is fire-and-forget"
  - "getUserBusinessesWithMetadata does NOT use getActiveBusiness() — Clients Page shows ALL businesses"

patterns-established:
  - "Separate action for auto-save notes (no revalidatePath) vs metadata fields (with revalidatePath)"
  - "businessMetadataSchema.safeParse before database write — first field error surfaced as string"

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 55 Plan 01: Agency Metadata Data Layer Summary

**10 nullable agency metadata columns on businesses table with full TypeScript types, Zod validation, and two server actions (metadata update with revalidation, notes auto-save without)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T10:12:35Z
- **Completed:** 2026-02-27T10:14:22Z
- **Tasks:** 2
- **Files modified:** 5 (1 modified, 4 created)

## Accomplishments
- Migration adds 10 nullable agency metadata columns to businesses table (safe for existing data, all nullable)
- Extended Business TypeScript interface with all 10 new fields — zero PGRST116 risk, additive only
- getUserBusinessesWithMetadata() returns full Business[] for all businesses the user owns
- Two server actions: updateBusinessMetadata() (Zod + revalidatePath) and updateBusinessNotes() (fire-and-forget)
- businessMetadataSchema validates 9 editable fields; agency_notes deliberately excluded (handled separately)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + TypeScript types** - `2c0f758` (feat)
2. **Task 2: Data function + server actions + validation** - `b2a570e` (feat)

**Plan metadata:** committed with docs commit below

## Files Created/Modified
- `supabase/migrations/20260227_add_agency_metadata.sql` - Adds 10 nullable columns to businesses, with COMMENT ON COLUMN for each
- `lib/types/database.ts` - Extended Business interface with 10 agency metadata fields (all nullable)
- `lib/data/businesses.ts` - getUserBusinessesWithMetadata() — returns all user businesses as Business[]
- `lib/validations/business-metadata.ts` - businessMetadataSchema Zod schema + BusinessMetadataInput type
- `lib/actions/business-metadata.ts` - updateBusinessMetadata() and updateBusinessNotes() server actions

## Decisions Made
- `NUMERIC(2,1)` for rating columns — avoids floating point representation issues (4.3 vs 4.299999)
- `NUMERIC(10,2)` for monthly_fee — standard currency column precision
- `agency_notes` excluded from businessMetadataSchema — it has its own `updateBusinessNotes()` with a simple length check and no revalidation
- `updateBusinessNotes` does NOT call `revalidatePath` — auto-save notes should be invisible to the user, no page re-render needed
- `getUserBusinessesWithMetadata` does NOT call `getActiveBusiness()` — the Clients Page shows all businesses, not just the active one

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

After deploying, run the migration against the production database:

```bash
supabase db push
```

This adds 10 nullable columns — safe for live data, no existing rows are affected.

## Next Phase Readiness
- Plan 55-02 (card grid) can now import `getUserBusinessesWithMetadata` and render the Business[] array
- Plan 55-03 (detail drawer) can import `updateBusinessMetadata` and `updateBusinessNotes` for the edit form
- All 10 new fields are nullable — no breaking changes to existing components that use the Business interface

---
*Phase: 55-clients-page*
*Completed: 2026-02-27*
