---
phase: 69-dashboard-history-misc-fixes
plan: 01
subsystem: ui
tags: [dashboard, history, jobs, forms, accessibility, tanstack, timezone, supabase]

# Dependency graph
requires:
  - phase: 68-campaign-bug-fixes
    provides: Campaign bug fixes (frozen enrollment, toggleCampaignStatus error handling)
provides:
  - /analytics navigation restored from dashboard Conversion Rate KPI card
  - Mobile dashboard 375px overflow eliminated (View Campaigns hidden on mobile)
  - UTC-explicit history date range filter (end-of-day timezone fix)
  - Idempotent software_used migration for Supabase Dashboard SQL Editor
  - Job table sortable column headers (Service Type, Status, Created) with direction indicators
  - ServiceTypeSelect trigger at 44px WCAG touch target minimum
affects:
  - Production deployment (all 6 bugs resolved)
  - History page date filtering reliability across server timezones

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UTC ISO string construction for date-only to datetime conversion (avoid setHours timezone dependency)"
    - "TanStack getCanSort/getIsSorted/getToggleSortingHandler for conditional sortable headers"
    - "enableSorting: false on nested accessor columns that require custom sort functions"

key-files:
  created:
    - supabase/migrations/20260304_add_software_used_column.sql
  modified:
    - components/dashboard/right-panel-default.tsx
    - components/dashboard/dashboard-client.tsx
    - lib/data/send-logs.ts
    - components/jobs/service-type-select.tsx
    - components/jobs/job-table.tsx
    - components/jobs/job-columns.tsx

key-decisions:
  - "Changed only the Conversion Rate card link (not all 3 KPI cards) to /analytics — most semantically appropriate since conversion rate IS an analytics metric"
  - "Used dateTo + 'T23:59:59.999Z' string concatenation instead of new Date(dateTo).setHours() to guarantee UTC interpretation regardless of server timezone"
  - "Scoped h-11 fix to service-type-select.tsx only, not global SelectTrigger — avoids cascade risk across all other selects in the app"
  - "enableSorting: false on Customer column because accessorKey 'customers.name' is a nested path requiring custom sort function — flat accessorKeys (service_type, status, created_at) sort automatically"
  - "Migration requires manual Supabase Dashboard SQL Editor application (same pattern as Phase 68) — no Docker or postgres credentials configured locally"

patterns-established:
  - "UTC ISO construction: dateTo + 'T23:59:59.999Z' for end-of-day, avoids setHours() timezone dependency"
  - "Sortable TH pattern: getCanSort() gates conditional button wrapper with getToggleSortingHandler() + sorted indicator"
  - "Responsive header hiding: hidden sm:inline-flex on Button component to hide overflow elements on mobile"

# Metrics
duration: 2min
completed: 2026-03-04
---

# Phase 69 Plan 01: Dashboard, History, and Misc Fixes Summary

**Six QA bugs resolved: /analytics nav restored, mobile overflow fixed, UTC date filter, software_used migration, sortable job table headers, and 44px touch target on ServiceTypeSelect**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T04:36:24Z
- **Completed:** 2026-03-04T04:38:38Z
- **Tasks:** 3
- **Files modified:** 6 (+ 1 created)

## Accomplishments
- BUG-DASH-06: Conversion Rate KPI card in right panel now links to /analytics (was incorrectly linking to /history)
- BUG-DASH-10: "View Campaigns" button hidden on mobile via `hidden sm:inline-flex` — eliminates 17px overflow at 375px viewport
- BUG-HIST-01: History date filter end-of-day computed as `dateTo + 'T23:59:59.999Z'` — UTC-explicit, no longer varies by server timezone
- BUG-ONB-01: Idempotent migration `20260304_add_software_used_column.sql` created for Supabase Dashboard SQL Editor manual application
- BUG-JOBS-01: Job table column headers (Service Type, Status, Created) are now clickable sort buttons with ↑/↓ direction indicators using TanStack's built-in sorting API
- BUG-FORM-01: ServiceTypeSelect trigger increased to h-11 (44px) meeting WCAG touch target minimum

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dashboard KPI navigation and mobile header overflow** - `b84acbe` (fix)
2. **Task 2: Fix history timezone bug, create software_used migration, increase touch target** - `6d51882` (fix)
3. **Task 3: Wire job table column header sort handlers** - `0d250f9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/dashboard/right-panel-default.tsx` - Conversion Rate card href changed from /history to /analytics
- `components/dashboard/dashboard-client.tsx` - View Campaigns button gets `hidden sm:inline-flex` class
- `lib/data/send-logs.ts` - End-of-day date computation changed to UTC-explicit string concatenation
- `supabase/migrations/20260304_add_software_used_column.sql` - New: idempotent ADD COLUMN IF NOT EXISTS migration
- `components/jobs/service-type-select.tsx` - SelectTrigger className includes h-11 for 44px height
- `components/jobs/job-table.tsx` - th rendering replaced with conditional sortable button wrapper
- `components/jobs/job-columns.tsx` - Customer column gets `enableSorting: false`

## Decisions Made
- Changed only the Conversion Rate card link to /analytics (not all 3 KPI cards) — semantically correct since conversion rate is an analytics metric; reviews->history and rating->feedback are appropriate as-is
- Used `dateTo + 'T23:59:59.999Z'` string concatenation for end-of-day UTC construction — cleaner and timezone-safe compared to `setHours()` which uses local server timezone
- Scoped `h-11` fix to `service-type-select.tsx` only, not the global `SelectTrigger` in `components/ui/select.tsx` — avoids unintended cascade to all other selects across the app
- Set `enableSorting: false` on the Customer column (nested accessor `customers.name`) — TanStack requires custom sort functions for nested object paths; flat accessorKeys (service_type, status, created_at) sort correctly out of the box
- Software_used migration requires manual Supabase Dashboard SQL Editor application (no local postgres credentials)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Database migration requires manual application.**

The `software_used` column migration must be applied via the Supabase Dashboard SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Run the contents of `supabase/migrations/20260304_add_software_used_column.sql`:
   ```sql
   ALTER TABLE public.businesses
     ADD COLUMN IF NOT EXISTS software_used TEXT;
   ```
3. This is idempotent — safe to run even if the column already exists

After applying: The onboarding CRM platform step (Phase 44) will successfully save the user's software choice.

## Next Phase Readiness

- All 6 bugs in Phase 69 plan resolved — `pnpm typecheck` and `pnpm lint` both pass clean
- v3.1.1 QA bug fix milestone complete (Phase 68 + Phase 69)
- 2 database migrations still pending manual application via Supabase Dashboard SQL Editor:
  1. Phase 68: `20260303_apply_frozen_enrollment_status.sql` (frozen enrollment status for campaign pause/resume)
  2. Phase 69: `20260304_add_software_used_column.sql` (software_used column for onboarding CRM step)
- Production deployment can proceed after applying both migrations and configuring production env vars

---
*Phase: 69-dashboard-history-misc-fixes*
*Completed: 2026-03-04*
