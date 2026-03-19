---
phase: 76-v4-design-system-rollout
plan: "05"
subsystem: ui
tags: [marketing, nav, footer, framer-motion, legal, typography, v4-design-system]

# Dependency graph
requires:
  - phase: 76-02
    provides: V4Nav/V4Footer components and (home) route group pattern; V4 design language established

provides:
  - Marketing layout nav replaced with V4 transparent→frosted glass scroll nav
  - Marketing layout footer replaced with V4 minimal single-row footer
  - Legal pages (privacy, terms, sms-compliance) with Back to home breadcrumb
  - MarketingNav client component at components/marketing/marketing-nav.tsx

affects:
  - Any future changes to /reputation, /pricing, /client-portal, /privacy, /terms, /sms-compliance, /audit

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-renders AuthSlot (async SC), passes as prop to client MarketingNav — avoids useEffect auth check in client boundary"
    - "Fixed nav + h-16 spacer div — prevents content overlap without padding-top on every page"
    - "SSR-safe Phosphor icon import via @phosphor-icons/react/dist/ssr for server components"

key-files:
  created:
    - components/marketing/marketing-nav.tsx
  modified:
    - app/(marketing)/layout.tsx
    - app/(marketing)/privacy/page.tsx
    - app/(marketing)/terms/page.tsx
    - app/(marketing)/sms-compliance/page.tsx

key-decisions:
  - "AuthSlot as async server component — renders UserMenu (authenticated) or Book a Call pill (unauthenticated); passed as prop (authSlot) to MarketingNav client component so Suspense boundary wraps only the auth-sensitive part"
  - "ThemeSwitcher lives inside AuthSlot, not MarketingNav — keeps client component surface minimal"
  - "Marketing nav links to pages (/reputation, /pricing) not hash anchors — correct for (marketing) layout which wraps interior pages, not the homepage"
  - "h-16 spacer div after fixed MarketingNav — cleaner than adding pt-16 to every child page's top-level container"
  - "sms-compliance narrowed to max-w-3xl (was max-w-4xl) to match privacy/terms readability standard"

patterns-established:
  - "Server component props into client component: authSlot pattern lets server-side auth info flow into client nav without making nav async"

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 76 Plan 05: Update Marketing Layout + Legal Pages Typography Summary

**V4-style transparent→frosted glass nav and minimal single-row footer in (marketing) layout, with Back to home breadcrumb on all three legal pages**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T23:35:38Z
- **Completed:** 2026-03-19T23:39:25Z
- **Tasks:** 4 (Tasks 1+2 combined in one commit)
- **Files modified:** 5

## Accomplishments

- Replaced old sticky nav (4 hash-anchor links + MobileNav dropdown) with V4-pattern MarketingNav client component featuring transparent→frosted glass on scroll, full-screen mobile overlay, and correct page links
- Replaced 4-column grid footer (py-16, complex layout) with V4 minimal single-row footer matching homepage footer exactly
- AuthSlot server component pattern: auth state server-rendered and passed as prop to client nav — no client-side auth fetch, no useEffect
- Added "Back to home" breadcrumb (CaretLeft icon + link) to all three legal pages
- Narrowed sms-compliance container from max-w-4xl to max-w-3xl for consistent readability

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: Marketing layout nav + footer** - `c727150` (feat)
2. **Task 3: Legal pages breadcrumb** - `f90f898` (feat)
3. **Task 4: Lint + typecheck** - verified (no separate commit needed, both passed clean)

**Plan metadata:** (final commit below)

## Files Created/Modified

- `components/marketing/marketing-nav.tsx` - New V4-style MarketingNav client component with scroll-aware frosted glass, full-screen mobile overlay, page links
- `app/(marketing)/layout.tsx` - Replaced nav+footer; AuthSlot server component; uses MarketingNav; V4 minimal footer
- `app/(marketing)/privacy/page.tsx` - Added Back to home breadcrumb (no content changes)
- `app/(marketing)/terms/page.tsx` - Added Back to home breadcrumb (no content changes)
- `app/(marketing)/sms-compliance/page.tsx` - Added Back to home breadcrumb; narrowed to max-w-3xl

## Decisions Made

- **authSlot prop pattern**: `AuthSlot` is an async server component that resolves user auth and renders either `UserMenu` or a Book a Call pill (with `ThemeSwitcher`). It's passed as `authSlot` prop to the `MarketingNav` client component. This keeps the client component boundary minimal and avoids any client-side auth checks or hydration surprises.
- **ThemeSwitcher inside AuthSlot**: Keeps it co-located with the auth-sensitive UI (both live in the right side of nav). Simpler than splitting it out separately.
- **Fixed nav + spacer div**: Added `<div className="h-16" />` after `MarketingNav` so pages don't need `pt-16` or similar overrides. Clean and centralized.
- **Nav links are page routes, not anchors**: The (marketing) layout wraps interior pages like `/reputation` and `/privacy`. Hash anchors (e.g., `/#pricing`) only make sense from the homepage. Nav correctly links to `/reputation`, `/pricing` as pages.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Marketing layout nav and footer fully V4-aligned — all (marketing) child routes now inherit the updated design
- Legal pages have breadcrumb navigation and consistent narrow container widths
- Ready for Phase 76-06 (next plan in the V4 Design System Rollout)

---
*Phase: 76-v4-design-system-rollout*
*Completed: 2026-03-19*
