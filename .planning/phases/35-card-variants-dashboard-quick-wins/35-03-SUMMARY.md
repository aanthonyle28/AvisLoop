---
phase: 35-card-variants-dashboard-quick-wins
plan: "03"
subsystem: ui
tags: [dashboard, kpi-cards, personalization, greeting, card-variants, amber, subtle, analytics, sidebar]

# Dependency graph
requires:
  - phase: 35-01
    provides: Card component with CVA variants (amber, subtle, default, blue, green, red, ghost) and InteractiveCard with ArrowRight indicator
provides:
  - Personalized time-of-day greeting with first name on dashboard (DASH-01)
  - Top 3 KPI cards use white background with per-card colored icons + hoverAccent hover borders (DASH-02, revised)
  - Bottom 3 pipeline cards use default (white) variant (DASH-02, revised)
  - Dashboard nav badge removed from sidebar (DASH-03)
  - Analytics empty state upgraded to project-standard pattern with icon, heading, CTA (DASH-04)
affects:
  - 35-04 (dashboard quick wins continue)
  - 35-05 (final quick wins)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Greeting function: server-side getGreeting() using new Date().getHours() — runs in server timezone (UTC on Vercel), acceptable tradeoff"
    - "Card variant hierarchy: amber (outcome metrics) > subtle (pipeline metrics) for visual priority"
    - "Badge removal: set badge: undefined in NavLink item spread — dashboardBadge kept in prop interface/chain for future use"
    - "Standard empty state: rounded-full bg-muted p-6 icon wrapper, text-xl font-semibold heading, muted description, Button CTA"

key-files:
  created: []
  modified:
    - app/(dashboard)/dashboard/page.tsx
    - components/dashboard/kpi-widgets.tsx
    - components/layout/sidebar.tsx
    - components/dashboard/analytics-service-breakdown.tsx

key-decisions:
  - "dashboardBadge removed from Sidebar destructured params (fixes lint) but kept in SidebarProps interface and AppShell prop chain — zero breaking changes"
  - "Server-timezone greeting acceptable — UTC difference is at most a few hours, not worth client-side hydration complexity"
  - "KPI cards revised: white backgrounds with per-card colored icons (amber star, green=#008236 chart, blue=#2C879F target) and matching hover borders — replaces uniform amber tint"
  - "Pipeline cards revised: default (white) variant instead of subtle — all dashboard cards now share white rest state"

patterns-established:
  - "Visual hierarchy via icon color + hover accent: each KPI card differentiated by icon color, hover border matches icon"
  - "Standard empty state: icon in muted rounded circle, xl semibold heading, muted-foreground description, Button CTA linking to action"

# Metrics
duration: 8min
completed: 2026-02-18
---

# Phase 35 Plan 03: Dashboard Quick Wins Summary

**Personalized time-of-day greeting + white KPI cards with per-card colored icons and hover accents + badge removal + standard analytics empty state**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-18T00:00:00Z
- **Completed:** 2026-02-18T00:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Dashboard now greets user by first name with time-appropriate salutation (Good morning/afternoon/evening)
- Top KPI cards: white background with per-card colored icons (amber Star, green #008236 ChartBar, blue #2C879F Target) and matching hover accents (border + arrow color)
- Bottom pipeline cards: white background (default variant)
- Dashboard nav item no longer shows a distracting badge number in the sidebar
- Analytics empty state follows project-standard pattern: icon, heading, descriptive text, and "Add your first job" CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Add dashboard greeting and apply card variants to KPI widgets** - `b24ad51` (feat)
2. **Task 2: Remove dashboard badge and fix analytics empty state** - `58fd163` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/(dashboard)/dashboard/page.tsx` - Added `getGreeting()` function, Supabase user fetch for first name, greeting heading with subtitle replacing bare `<h1>Dashboard</h1>`
- `components/dashboard/kpi-widgets.tsx` - Applied `hoverAccent` (amber/green/blue) to 3 top InteractiveCards with per-card colored icons (weight="fill"); changed 3 bottom Cards from `variant="subtle"` to `variant="default"` (white)
- `components/layout/sidebar.tsx` - Changed Dashboard nav badge from `dashboardBadge` to `undefined`; removed `dashboardBadge` from destructured params (kept in interface)
- `components/dashboard/analytics-service-breakdown.tsx` - Replaced bare `<p>` empty state with standard icon+heading+description+CTA pattern using ChartBar icon and Link to /jobs?action=add

## Decisions Made

- `dashboardBadge` removed from Sidebar destructured params to fix lint, but kept in `SidebarProps` interface and AppShell prop chain to avoid breaking changes — AppShell still accepts and passes the prop, Sidebar simply ignores it
- Server-timezone greeting (UTC on Vercel) is an acceptable tradeoff — adding client-side hydration just for time-of-day would add complexity with minimal UX gain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dashboardBadge from Sidebar destructured params to fix lint error**

- **Found during:** Task 2 (sidebar badge removal)
- **Issue:** After setting `badge: undefined`, the `dashboardBadge` param in the destructured function signature was no longer referenced in the function body, causing `@typescript-eslint/no-unused-vars` lint error
- **Fix:** Removed `dashboardBadge` from the destructured `{ dashboardBadge, notificationCounts }` — kept in `SidebarProps` interface so prop chain from layout.tsx → AppShell → Sidebar still compiles without type errors
- **Files modified:** `components/layout/sidebar.tsx`
- **Verification:** `pnpm lint && pnpm typecheck` both pass
- **Committed in:** `58fd163` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug / lint)
**Impact on plan:** Necessary fix for lint compliance. No scope creep.

## Issues Encountered

None beyond the lint issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Dashboard visual improvements complete: greeting, card hierarchy, badge removal, analytics empty state
- Ready for Phase 35-04 (additional dashboard quick wins)
- Card variants (amber, subtle) are proven working in production-ready components

---
*Phase: 35-card-variants-dashboard-quick-wins*
*Completed: 2026-02-18*
