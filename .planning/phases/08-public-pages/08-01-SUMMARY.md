---
phase: 08-public-pages
plan: 01
subsystem: ui
tags: [marketing, landing-page, seo, next.js, server-components]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Auth pages (/auth/login, /auth/sign-up) for CTA links
provides:
  - Marketing route group with shared layout
  - Landing page with hero, features, CTA sections
  - SEO metadata configuration
affects: [08-02-pricing, 08-03-legal-pages, widget-embed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route groups for layout isolation
    - Static year in footer for SSG compatibility

key-files:
  created:
    - app/(marketing)/layout.tsx
    - app/(marketing)/page.tsx
    - components/marketing/hero.tsx
    - components/marketing/features.tsx
    - components/marketing/cta-section.tsx
  modified: []

key-decisions:
  - "Use route group (marketing) for public pages with separate layout"
  - "Static year in footer to avoid Next.js 16 prerender errors"
  - "Server Components only - no client-side JS for marketing content"

patterns-established:
  - "Marketing layout: navbar (logo, links, auth buttons) + footer (4-column grid)"
  - "Section spacing: py-20 for major sections"
  - "Container max-width: max-w-6xl for content width consistency"

# Metrics
duration: 5min
completed: 2026-01-28
---

# Phase 8 Plan 1: Landing Page & Marketing Layout Summary

**Marketing route group with landing page featuring hero, features, and CTA sections plus shared navbar/footer layout**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-28T03:21:04Z
- **Completed:** 2026-01-28T03:26:04Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Marketing route group with reusable layout (navbar with auth buttons, 4-column footer)
- Landing page with value proposition hero, 4 feature cards, final CTA
- SEO metadata with OpenGraph and Twitter card configuration
- Removed boilerplate starter template page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create marketing route group with layout** - `2223f53` (feat, from prior session)
2. **Task 2: Create landing page with hero section** - `7866433` (feat)
3. **Task 3: Remove boilerplate page.tsx** - `8eb38ed` (chore)
4. **Bug fix: Static year in footer** - `db3a8f2` (fix)

## Files Created/Modified

- `app/(marketing)/layout.tsx` - Marketing layout with navbar and footer
- `app/(marketing)/page.tsx` - Landing page with SEO metadata
- `components/marketing/hero.tsx` - Hero section with headline and CTAs
- `components/marketing/features.tsx` - 4 feature cards with icons
- `components/marketing/cta-section.tsx` - Final CTA section
- `app/page.tsx` - Deleted (was boilerplate)

## Decisions Made

- **Route group pattern:** Using `(marketing)` route group isolates the marketing layout from dashboard layout while serving pages at root URLs
- **Static footer year:** Used hardcoded `2025` instead of `new Date().getFullYear()` to comply with Next.js 16 prerendering requirements for Server Components
- **Server Components only:** All marketing components are Server Components (no "use client") for optimal performance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed new Date() prerender error**

- **Found during:** Verification (build check)
- **Issue:** `new Date().getFullYear()` in footer caused Next.js 16 prerendering error
- **Fix:** Replaced with static year `2025`
- **Files modified:** app/(marketing)/layout.tsx
- **Verification:** typecheck and lint pass
- **Committed in:** db3a8f2

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix required for Next.js 16 SSG compatibility. No scope creep.

## Issues Encountered

- **Pre-existing billing page build error:** The `/billing` page has an unrelated prerendering issue (uncached data outside Suspense). This is out of scope for this plan and does not affect marketing pages.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Marketing layout ready for pricing page (Plan 02)
- Footer links to `/about`, `/contact`, `/privacy`, `/terms` will 404 until those pages are created
- CTAs link to existing `/auth/sign-up` and `/auth/login` pages

---

*Phase: 08-public-pages*
*Completed: 2026-01-28*
