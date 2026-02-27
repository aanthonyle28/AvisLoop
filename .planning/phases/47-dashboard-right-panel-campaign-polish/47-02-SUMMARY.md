---
phase: 47-dashboard-right-panel-campaign-polish
plan: "02"
subsystem: ui
tags: [sparkline, svg, dashboard, kpi, activity-feed, phosphor-icons, next-link]

# Dependency graph
requires:
  - phase: 47-01
    provides: DayBucket type and 14-day history arrays on KPIMetric (reviewsThisMonth.history, averageRating.history, conversionRate.history)
provides:
  - SVG sparkline component rendering 14-day trend lines on right panel KPI cards
  - Gray muted background (bg-muted/40) on each KPI card for visual differentiation
  - Colored circle icon badges on activity feed (green/blue/orange/muted by event type)
  - Clickable activity feed items navigating to relevant pages via Next.js Link
  - Increased vertical spacing between activity items (space-y-2)
affects: [48, 49, 50, 51, dashboard-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-rolled SVG sparkline: polyline + linearGradient fill, no charting library"
    - "KPI_COLORS constants at module level matching icon accent colors"
    - "getEventStyle() returning { Icon, bg, text } for colored circle badges"
    - "getEventHref() mapping event type to navigation destination"
    - "Empty state sparkline: dashed horizontal line (strokeDasharray=4 3)"

key-files:
  created:
    - components/dashboard/sparkline.tsx
  modified:
    - components/dashboard/right-panel-default.tsx

key-decisions:
  - "Hand-rolled SVG (no recharts): zero bundle weight, no SSR issues, fully theme-aware"
  - "Gradient fill uses stopOpacity 0.15 at top to 0 at bottom for subtle area chart effect"
  - "gradientId derived from color prop via regex strip — stable and collision-resistant for 3 fixed colors"
  - "Empty state when data.length < 2: dashed line rendered by Sparkline + 'Not enough data' label below"
  - "Activity icon size w-7 h-7 circle with size={14} icon (matches plan spec)"
  - "Pipeline counter row: completely unchanged per plan requirement"

patterns-established:
  - "Sparkline pattern: pass number[] (mapped from DayBucket[].map(d => d.value)) to keep component generic"
  - "Colored activity icon: cn(fixed-classes, style.bg) + style.Icon with weight=fill"

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 47 Plan 02: Sparklines and Activity Feed Polish Summary

**SVG sparkline component with gradient fill renders 14-day KPI trends on gray-background cards; activity feed upgraded to colored circle icons and clickable Link navigation**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-27T01:13:46Z
- **Completed:** 2026-02-27T01:15:45Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 updated)

## Accomplishments
- New `Sparkline` SVG component: 14-point polyline with gradient area fill, dashed-line empty state, no library dependency
- KPI cards in right panel upgraded: gray `bg-muted/40` background + sparkline trend graph below each metric value
- Activity feed icons replaced with colored 7×7 circle badges: green (review), blue (send), orange (feedback), muted (enrollment)
- Activity items converted from `<div>` to `<Link>` with `getEventHref()` navigation mapping
- Vertical spacing between activity items increased from `space-y-0.5` to `space-y-2`
- Pipeline counter row (compact 3-column grid) preserved exactly as-is

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reusable SVG Sparkline component** - `4983041` (feat)
2. **Task 2: Update right panel with sparklines, colored icons, clickable items** - `91fb5f2` (feat)

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `components/dashboard/sparkline.tsx` - Pure SVG sparkline: empty state (dashed line) + normal state (polyline + gradient fill), accepts `data: number[]`, `color: string`, `height?: number`
- `components/dashboard/right-panel-default.tsx` - KPI cards with bg-muted/40 + Sparkline; activity feed with getEventStyle/getEventHref, Link wrapping, space-y-2 spacing

## Decisions Made
- **Hand-rolled SVG over recharts**: No install needed, zero bundle overhead, no SSR mismatch risk, fully controllable with CSS variables — per research recommendation
- **gradientId from color**: `color.replace(/[^a-z0-9]/gi, '')` produces stable IDs for the 3 fixed colors (`spark-F59E0B`, `spark-008236`, `spark-2C879F`)
- **`data.length < 2` empty state**: Both Sparkline (dashed line) and parent (label text) handle the no-data case — dashed line in SVG makes clear it's a placeholder, not broken
- **KPI_COLORS at module level**: Single source of truth linking icon accent colors to sparkline stroke colors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Sparkline component is reusable — can be imported by any other dashboard card in future phases
- Right panel visual layer is complete; data layer (47-01) + visual layer (47-02) form the complete sparkline feature
- Activity feed navigation targets are type-level only (no deep-links to specific records); CampaignEvent type would need rawId field for deep-linking in a future phase

---
*Phase: 47-dashboard-right-panel-campaign-polish*
*Completed: 2026-02-27*
