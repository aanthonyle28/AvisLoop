---
phase: 37-jobs-campaigns-ux-fixes
plan: 02
subsystem: ui
tags: [nextjs, react, jobs, filters, autocomplete, service-types]

# Dependency graph
requires:
  - phase: 37-jobs-campaigns-ux-fixes
    provides: Research and plan for jobs/campaigns UX fix scope
  - phase: 22-jobs-crud
    provides: Jobs page, job-filters, add-job-sheet, service-type-select components
  - phase: 28-onboarding
    provides: getServiceTypeSettings() and service_types_enabled business column
provides:
  - Service type filter on Jobs page scoped to business's configured types (JC-01)
  - AddJobSheet ServiceTypeSelect scoped to enabled service types
  - Smart name/email detection in customer autocomplete with dynamic placeholder and badge (JC-02)
  - Visually distinct status vs service type filter chips via shape + group labels (JC-09)
affects:
  - 37-03 (campaign form fixes — same jobs/campaigns context)
  - 37-04 (any further jobs UX work)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prop threading: server component fetches setting → client component threads to children"
    - "Fallback pattern: empty array → show all 8 service types (graceful degradation)"
    - "isEmailQuery computed from query.includes('@') — no input type change (avoids focus loss)"
    - "Shape-based filter distinction: rounded-full for status, rounded-md for service types"

key-files:
  created: []
  modified:
    - app/(dashboard)/jobs/page.tsx
    - components/jobs/jobs-client.tsx
    - components/jobs/job-filters.tsx
    - components/jobs/add-job-sheet.tsx
    - components/jobs/customer-autocomplete.tsx

key-decisions:
  - "Keep input type=text in autocomplete even in email mode — type changes cause focus loss"
  - "Show 'email' badge only at query.length >= 3 to avoid flash on bare @ character"
  - "Separator div gets h-6 + self-center for reliable vertical alignment in flex-wrap row"
  - "Shape alone (rounded-full vs rounded-md) + group labels is sufficient distinction — no color change needed"

patterns-established:
  - "Group label pattern: text-xs font-medium text-muted-foreground uppercase tracking-wider above chip groups"
  - "Filter fallback: enabledServiceTypes && enabledServiceTypes.length > 0 ? filtered : all"

# Metrics
duration: 2min
completed: 2026-02-20
---

# Phase 37 Plan 02: Jobs UX — Service Filter Scoping, Smart Autocomplete, Filter Distinction Summary

**Jobs service type filter scoped to business-configured types via prop threading, customer autocomplete gains @ detection with dynamic placeholder and 'email' badge, and filter chips gain visual distinction via shape (pill vs rounded-rect) and group labels.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-20T01:00:06Z
- **Completed:** 2026-02-20T01:01:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Service type filter on Jobs page now shows only the types the business enabled during onboarding (e.g., HVAC + Plumbing only, not all 8). Falls back to all 8 if service types not configured.
- AddJobSheet's ServiceTypeSelect also respects enabled types — consistent experience throughout job creation.
- Customer autocomplete detects `@` in the query, switches placeholder to "Search by email address..." and shows a subtle "email" badge at the right edge of the input (only when query >= 3 chars to prevent flickering).
- Filter chips are now visually distinct: status chips remain `rounded-full` (pill) while service type chips use `rounded-md` (rounded rectangle). Both groups have uppercase group labels ("Status", "Service") and a vertical separator between them.

## Task Commits

Each task was committed atomically:

1. **Task 1: Thread serviceTypesEnabled from server component to filters and AddJobSheet (JC-01)** - `77a5657` (feat)
2. **Task 2: Smart name/email detection in autocomplete and filter visual distinction (JC-02, JC-09)** - `23dfa5e` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/(dashboard)/jobs/page.tsx` - Added `getServiceTypeSettings()` to Promise.all, computed `enabledServiceTypes`, passed as prop to JobsClient
- `components/jobs/jobs-client.tsx` - Added `enabledServiceTypes?: ServiceType[]` prop, threads to JobFilters and AddJobSheet
- `components/jobs/job-filters.tsx` - Added `enabledServiceTypes` prop, `visibleServiceTypes` computed with fallback, group labels ("Status"/"Service"), separator with h-6, service chips changed to `rounded-md`
- `components/jobs/add-job-sheet.tsx` - Added `enabledServiceTypes?: ServiceType[]` prop, passes `enabledTypes={enabledServiceTypes}` to ServiceTypeSelect
- `components/jobs/customer-autocomplete.tsx` - Added `isEmailQuery` from `query.includes('@')`, dynamic placeholder, aria-label, and conditional "email" badge indicator

## Decisions Made

- Keep `type="text"` on the autocomplete input even when in email mode — changing input type dynamically causes focus loss in some browsers (plan explicitly called this out as pitfall #5).
- Email badge only shows at `query.length >= 3` — bare `@` character would cause an immediate flash with no useful context.
- Shape-based distinction (rounded-full vs rounded-md) combined with group labels is sufficient visual differentiation — no color change needed.
- `ServiceTypeSelect` already supported `enabledTypes` prop internally — only needed to wire the data through the prop chain.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 37-02 complete. Props chain is clean and typed.
- Ready for Plan 37-03 (campaign form save bug fix).
- The `enabledServiceTypes` pattern is reusable if campaign filtering by service type needs similar scoping later.

---
*Phase: 37-jobs-campaigns-ux-fixes*
*Completed: 2026-02-20*
