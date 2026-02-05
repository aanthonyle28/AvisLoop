---
phase: 27-dashboard-redesign
plan: 02
subsystem: ui
tags: [react, phosphor-icons, tailwind, dashboard, client-components]

# Dependency graph
requires:
  - phase: 27-01
    provides: Dashboard data types (DashboardKPIs, KPIMetric)
provides:
  - Action Summary Banner component with all-clear and items-pending states
  - KPI Widgets component with two-tier outcome/pipeline hierarchy
  - KPI Widgets skeleton for loading states with zero layout shift
  - TrendIndicator subcomponent with up/down icons and color coding
affects: [27-03, dashboard-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [two-tier-kpi-hierarchy, clickable-outcome-cards, informational-pipeline-cards]

key-files:
  created:
    - components/dashboard/action-summary-banner.tsx
    - components/dashboard/kpi-widgets.tsx
  modified: []

key-decisions:
  - "All-clear state uses green banner with CheckCircle, items-pending uses yellow banner with WarningCircle"
  - "Banner is clickable button that scrolls to ready-to-send or alerts section"
  - "Outcome metrics (reviews, rating, conversion) use text-4xl with monthly trends"
  - "Pipeline metrics (requests sent, active sequences, pending) use text-2xl with weekly trends"
  - "Outcome cards wrapped in Link for navigation, pipeline cards are informational only"
  - "Zero trends show muted dash instead of 0% for cleaner UI"

patterns-established:
  - "TrendIndicator: Internal subcomponent pattern with size variants (default, sm) and color-coded percentage display"
  - "Skeleton matching: KPIWidgetsSkeleton mirrors exact layout structure to prevent layout shift"
  - "Accessible banner: Button element with full-width text-left for keyboard and screen reader support"

# Metrics
duration: 1.5min
completed: 2026-02-04
---

# Phase 27 Plan 02: Action Summary Banner and KPI Widgets

**Two-tier dashboard UI with action banner (answers "Do I need to do anything?") and KPI widgets (outcome metrics large with monthly trends, pipeline metrics small with weekly trends)**

## Performance

- **Duration:** 1.5 min
- **Started:** 2026-02-04T21:18:36Z
- **Completed:** 2026-02-04T21:20:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Action Summary Banner instantly answers "Do I need to do anything?" with all-clear or items-pending states
- KPI Widgets display two-tier hierarchy emphasizing outcome metrics over pipeline metrics
- Outcome cards (reviews, rating, conversion) are clickable for navigation to detail pages
- Skeleton components prevent layout shift during loading

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Action Summary Banner component** - `a4ac601` (feat)
2. **Task 2: Create KPI Widgets component with skeleton** - `f51e0b8` (feat)

## Files Created/Modified
- `components/dashboard/action-summary-banner.tsx` - Banner showing all-clear (green) or items-pending (yellow) state with dynamic subtext and click-to-scroll
- `components/dashboard/kpi-widgets.tsx` - Two-tier KPI grid with large outcome metrics (text-4xl, monthly trends) and small pipeline metrics (text-2xl, weekly trends), plus skeleton

## Decisions Made

**1. All-clear vs items-pending visual distinction**
- All-clear: green background, CheckCircle icon, non-interactive
- Items-pending: yellow background, WarningCircle icon, clickable button with ArrowDown

**2. Two-tier KPI sizing hierarchy**
- Outcome metrics: text-4xl values, "vs last month" trends, p-6 padding
- Pipeline metrics: text-2xl values, "vs last week" trends, p-4 padding
- Emphasizes business outcomes over pipeline activity

**3. Clickable outcome cards only**
- Outcome cards: Wrapped in Link with InteractiveCard for navigation
- Pipeline cards: Regular Card (informational, no navigation)
- Rationale: Outcomes have meaningful detail pages (history, feedback), pipeline metrics don't need drill-down

**4. Zero trend display**
- Show muted dash (—) instead of "0%" when trend value is zero
- Rationale: Cleaner UI, avoids implying meaningful data when there's no change

**5. Banner scroll behavior**
- Ready count > 0: Scrolls to #ready-to-send-queue
- Alert count > 0 (no ready): Scrolls to #attention-alerts
- All-clear: No click handler (non-interactive)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Banner and KPI components ready to receive data from dashboard page
- Ready for Task 3 (Ready to Send Queue component)
- No blockers

---
*Phase: 27-dashboard-redesign*
*Completed: 2026-02-04*
