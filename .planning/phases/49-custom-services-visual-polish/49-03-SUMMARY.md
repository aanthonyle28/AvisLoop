---
phase: 49-custom-services-visual-polish
plan: "03"
subsystem: ui
tags: [tailwind, typography, table, design-system, consistency]

# Dependency graph
requires:
  - phase: 48-onboarding-dashboard-behavior-fixes
    provides: dashboard patterns and design system baseline
provides:
  - Normalized page subtitle pattern across all 5 dashboard pages
  - White bg-card table row backgrounds on Jobs and History tables
  - Dead code removal (ChatCircle icon import from feedback page)
affects: [future dashboard pages, any new data table implementations]

# Tech tracking
tech-stack:
  added: []
  patterns: [canonical subtitle pattern — text-2xl font-semibold tracking-tight h1 + text-muted-foreground subtitle with static description and optional middot + count]

key-files:
  created: []
  modified:
    - components/jobs/jobs-client.tsx
    - app/(dashboard)/analytics/page.tsx
    - app/(dashboard)/feedback/page.tsx
    - app/(dashboard)/campaigns/campaigns-shell.tsx
    - components/customers/customers-client.tsx
    - components/jobs/job-table.tsx
    - components/history/history-table.tsx

key-decisions:
  - "QuickSendModal spacing skipped — DialogContent base already has gap-4 (grid layout), adding space-y-4 would double-space"
  - "bg-card applied only to tbody/data rows — thead and empty-state TableRow rows left unchanged"
  - "bg-card applied at call site (job-table.tsx, history-table.tsx) — ui/table.tsx NOT modified"
  - "Analytics subtitle uses static description only (no count — service type count is not meaningful)"
  - "Campaigns subtitle uses static description only (campaign count not available in shell without new prop)"

patterns-established:
  - "Subtitle canonical pattern: <h1 className='text-2xl font-semibold tracking-tight'> + <p className='text-muted-foreground'>{static} &middot; {count} total</p>"
  - "Table row white background: apply bg-card to individual <tr>/<TableRow> at call site, not in base table component"

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 49 Plan 03: Page Subtitle Normalization and Table Row Backgrounds Summary

**Unified dashboard page subtitles to canonical pattern (text-2xl font-semibold tracking-tight + middot count) and added bg-card white backgrounds to Jobs and History table body rows**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T03:22:00Z
- **Completed:** 2026-02-26T03:24:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All 5 dashboard pages (Jobs, Analytics, Feedback, Campaigns, Customers) now use consistent `text-2xl font-semibold tracking-tight` h1 with `text-muted-foreground` subtitle
- Jobs and Feedback pages now show dynamic counts in subtitle (`totalJobs` and `stats.total`)
- Customers page normalized from `text-3xl font-bold` to `text-2xl font-semibold` with count
- Removed inline ChatCircle icon from Feedback page header (no other pages use icons in h1 row)
- Jobs table `<tbody>` rows and History table data `<TableRow>` elements now render white (`bg-card`) backgrounds
- `ui/table.tsx` base component was not modified — white background applied at call site only

## Task Commits

Each task was committed atomically:

1. **Task 1: Normalize page subtitles across dashboard pages** - `ede09ed` (feat)
2. **Task 2: Add white backgrounds to table rows** - `0b8cfc0` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/jobs/jobs-client.tsx` - Subtitle: "Track your service jobs · N total"
- `app/(dashboard)/analytics/page.tsx` - Subtitle: static description, font normalized
- `app/(dashboard)/feedback/page.tsx` - Subtitle: "Private feedback from your review funnel · N total", ChatCircle import removed
- `app/(dashboard)/campaigns/campaigns-shell.tsx` - Added tracking-tight to h1
- `components/customers/customers-client.tsx` - Normalized text-3xl→text-2xl, bold→semibold, added count
- `components/jobs/job-table.tsx` - bg-card on tbody tr rows
- `components/history/history-table.tsx` - bg-card on data TableRow

## Decisions Made
- **QuickSendModal spacing skipped:** DialogContent base already has `gap-4` via its `grid ... gap-4` base class. Adding `space-y-4` would double-space. No change needed.
- **Analytics count omitted:** The `analyticsData` is a service type breakdown array — showing its `.length` as "3 total" is meaningless to users. Static subtitle only.
- **Campaigns count omitted:** Campaign count not available in `campaigns-shell.tsx` without threading a new prop from the server page. Static subtitle is sufficient.

## Deviations from Plan

None - plan executed exactly as written. The QuickSendModal task noted in the plan that if DialogContent already had consistent gap we could skip — confirmed it does (gap-4 in base class), so no change was needed.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All dashboard pages follow the canonical subtitle pattern — ready for future page additions to match
- Table row white background pattern established for call-site application
- Phase 49 (custom-services-visual-polish) plan 03 complete; remaining plans in this phase can proceed

---
*Phase: 49-custom-services-visual-polish*
*Completed: 2026-02-26*
