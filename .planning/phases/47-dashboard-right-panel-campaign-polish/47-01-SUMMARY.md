---
phase: 47
plan: "01"
name: "Dashboard KPI History Data Layer"
subsystem: "dashboard/data"
status: complete
tags: [dashboard, kpi, sparkline, data-layer, typescript]

dependency-graph:
  requires: []
  provides:
    - DayBucket type in lib/types/dashboard.ts
    - KPIMetric.history optional field
    - bucketByDay() utility in lib/data/dashboard.ts
    - 14-day history arrays on reviewsThisMonth, averageRating, conversionRate
  affects:
    - "47-02 (right panel KPI sparkline components consume history arrays)"
    - "Any consumer of DashboardKPIs type gets history data automatically"

tech-stack:
  added: []
  patterns:
    - "bucketByDay: timestamp array -> DayBucket[] with zero-fill for empty days"
    - "Parallel Promise.all expansion: add history queries alongside existing metric queries"
    - "Daily average computation: ratingsByDay accumulation with reduce/length"
    - "Conversion rate daily: sendsByDay vs reviewsByDay ratio per bucket"

key-files:
  created: []
  modified:
    - lib/types/dashboard.ts
    - lib/data/dashboard.ts

decisions:
  - id: "D1"
    decision: "bucketByDay is module-internal (not exported) — utility is dashboard-specific"
    rationale: "No other module needs timestamp bucketing; keeps API surface minimal"
  - id: "D2"
    decision: "ratings history uses daily average (not count) to match the averageRating KPI semantics"
    rationale: "Sparkline should visualize same metric as the KPI value (a 1-5 average, not a count)"
  - id: "D3"
    decision: "conversionHistory derived from 14-day sends query (not a separate reviews query)"
    rationale: "Reuses sendsHistoryResult which already includes reviewed_at — avoids extra DB query"
  - id: "D4"
    decision: "Pipeline metrics (requestsSentThisWeek, activeSequences, pendingQueued) do NOT get history"
    rationale: "Per plan spec — only the 3 outcome KPIs display sparklines in the right panel"
  - id: "D5"
    decision: "Zero-state error fallback adds history: [] to outcome metrics"
    rationale: "Consumers can safely call .map() on history without null guards"

metrics:
  duration: "2 minutes"
  completed: "2026-02-27"
  tasks-completed: 2
  tasks-total: 2
---

# Phase 47 Plan 01: Dashboard KPI History Data Layer Summary

**One-liner:** Extended `getDashboardKPIs()` with 14-day daily history arrays for sparkline rendering via `DayBucket` type and parallel Supabase queries.

## What Was Built

Added the data layer that powers sparkline trend graphs on the right panel KPI cards. Two changes:

1. **`lib/types/dashboard.ts`** — New `DayBucket` interface (`date: string, value: number`) exported for consumer use. `KPIMetric.history?: DayBucket[]` optional field added without breaking existing consumers.

2. **`lib/data/dashboard.ts`** — `bucketByDay()` module-internal utility that zero-fills N daily buckets and counts timestamps per day. `getDashboardKPIs()` expanded with `fourteenDaysAgo` anchor, 3 new parallel queries (reviews history, ratings history, sends+conversion history), and post-query computation of `reviewsHistory`, `ratingsHistory`, and `conversionHistory`. All 3 outcome KPI return objects receive the computed `history` arrays.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add DayBucket type and extend KPIMetric with history field | ee3ff52 | lib/types/dashboard.ts |
| 2 | Add bucketByDay utility and 14-day history queries to getDashboardKPIs | 112a006 | lib/data/dashboard.ts |

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| D1 | bucketByDay not exported | Dashboard-specific utility, minimal API surface |
| D2 | Ratings history = daily average | Matches KPI semantics (1-5 scale, not a count) |
| D3 | Conversion derived from sendsHistoryResult | Avoids extra DB query; reviewed_at already in payload |
| D4 | Pipeline metrics omit history | Per spec — only outcome KPIs get sparklines |
| D5 | Error fallback has history: [] | Safe for consumers calling .map() without null guards |

## Verification Results

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- Promise.all destructuring: 14 elements (11 existing + 3 new)
- history field present on: reviewsThisMonth, averageRating, conversionRate
- history field absent on: requestsSentThisWeek, activeSequences, pendingQueued

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

Plan 47-02 (sparkline UI components) can now consume `kpis.reviewsThisMonth.history`, `kpis.averageRating.history`, and `kpis.conversionRate.history` — each is a `DayBucket[]` with 14 entries sorted oldest-first. The type is already in `lib/types/dashboard.ts` and ready to import.
