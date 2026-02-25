---
phase: 43-cross-page-consistency
plan: 01
subsystem: ui
tags: [next.js, loading, skeleton, suspense, server-components]

# Dependency graph
requires:
  - phase: 42-dashboard-navigation-polish
    provides: sidebar active state redesign and dashboard polish patterns
provides:
  - Route-level loading.tsx for all 7 dashboard data pages using Skeleton component
  - Consistent container py-6 space-y-8 wrapper pattern across all loading files
  - Elimination of double-loading pattern (spinner then skeleton) on jobs, customers, history pages
affects: [future-dashboard-pages, new-route-additions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route-level loading.tsx as single loading state per page — no inline Suspense in page.tsx"
    - "container py-6 space-y-8 as standard loading wrapper for full-width pages"
    - "container max-w-4xl py-6 space-y-8 for constrained pages (feedback, billing, settings)"
    - "Skeleton component from @/components/ui/skeleton — never raw bg-muted animate-pulse divs"

key-files:
  created:
    - app/(dashboard)/analytics/loading.tsx
    - app/(dashboard)/settings/loading.tsx
  modified:
    - app/(dashboard)/settings/page.tsx
    - app/(dashboard)/jobs/loading.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/customers/loading.tsx
    - app/(dashboard)/customers/page.tsx
    - app/(dashboard)/history/loading.tsx
    - app/(dashboard)/history/page.tsx
    - app/(dashboard)/feedback/loading.tsx
    - app/(dashboard)/billing/loading.tsx
  deleted:
    - app/(dashboard)/contacts/loading.tsx

key-decisions:
  - "Settings page keeps inline Suspense — loading.tsx handles route-level, inline Suspense handles streaming within page"
  - "contacts/loading.tsx deleted as dead code — contacts page is only a redirect to /customers"
  - "Double-loading eliminated by making page.tsx itself async — Next.js shows loading.tsx while page awaits data"

patterns-established:
  - "Loading skeleton: always use Skeleton component, never raw bg-muted divs with animate-pulse"
  - "Full-width pages: container py-6 space-y-8 wrapper"
  - "Constrained pages (settings, billing, feedback): container max-w-4xl py-6 space-y-8"
  - "No inline Suspense in page.tsx when loading.tsx exists — async page = single loading state"

# Metrics
duration: 9min
completed: 2026-02-25
---

# Phase 43 Plan 01: Loading Skeleton Standardization Summary

**Route-level loading.tsx files with consistent Skeleton component added to all 7 dashboard data pages, eliminating spinner/double-loading patterns on jobs, customers, and history pages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-25T05:44:48Z
- **Completed:** 2026-02-25T05:47:25Z
- **Tasks:** 2 completed
- **Files modified:** 11 (2 created, 1 deleted, 8 updated)

## Accomplishments

- Created analytics/loading.tsx and settings/loading.tsx (previously missing)
- Normalized all 6 existing loading.tsx files to `py-6 space-y-8` wrapper pattern with Skeleton components
- Deleted dead contacts/loading.tsx (contacts page is a redirect)
- Eliminated double-loading pattern on jobs, customers, history by removing inline Suspense spinners and making pages direct async server components

## Task Commits

Each task was committed atomically:

1. **Task 1: Create missing loading.tsx files and normalize existing ones** - `3f0e7ae` (feat)
2. **Task 2: Remove inline Suspense spinners from pages that have loading.tsx** - `fb90708` (refactor)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/(dashboard)/analytics/loading.tsx` - Created: header + 3 summary cards + table breakdown skeleton
- `app/(dashboard)/settings/loading.tsx` - Created: sticky header + tabs bar + content card skeleton
- `app/(dashboard)/settings/page.tsx` - Updated: replaced raw `bg-muted animate-pulse` divs with Skeleton component in inline fallback
- `app/(dashboard)/jobs/loading.tsx` - Normalized: space-y-6 → space-y-8, added subtitle skeleton
- `app/(dashboard)/jobs/page.tsx` - Refactored: removed Suspense, direct async export
- `app/(dashboard)/customers/loading.tsx` - Normalized: space-y-6 → space-y-8, added subtitle skeleton
- `app/(dashboard)/customers/page.tsx` - Refactored: removed Suspense, direct async export
- `app/(dashboard)/history/loading.tsx` - Normalized: space-y-6 → space-y-8, added subtitle skeleton
- `app/(dashboard)/history/page.tsx` - Refactored: merged HistoryContent into HistoryPage, removed Suspense
- `app/(dashboard)/feedback/loading.tsx` - Normalized: py-8 → py-6, manual mb-8 → space-y-8
- `app/(dashboard)/billing/loading.tsx` - Normalized: container mx-auto px-4 → container max-w-4xl, space-y-6 → space-y-8
- `app/(dashboard)/contacts/loading.tsx` - Deleted: dead code (page is only a redirect)

## Decisions Made

- **Settings keeps inline Suspense:** The settings page.tsx uses Suspense correctly for streaming — loading.tsx handles route-level (before page.tsx renders), inline Suspense handles async data within the page. Both are needed and correct.
- **contacts/loading.tsx deleted:** The contacts route is a pure redirect to /customers. A loading skeleton there is unreachable dead code.
- **Double-loading fix:** Making page.tsx itself async (no wrapper function with Suspense) causes Next.js to automatically use loading.tsx as the single fallback. No code runs in page.tsx until data resolves — clean swap from skeleton to content.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 7 dashboard data pages now have consistent skeleton loading states
- Pattern established: every new route should have loading.tsx with `container py-6 space-y-8` wrapper
- Ready for Plan 02: empty state standardization (already committed)

---
*Phase: 43-cross-page-consistency*
*Completed: 2026-02-25*
