---
phase: 76-v4-design-system-rollout
plan: "04"
subsystem: ui
tags: [framer-motion, marketing, pricing, client-portal, v4-design-system, next-js]

# Dependency graph
requires:
  - phase: 76-02
    provides: V4 shared components (FloatingShapes, AccentBar, V4FAQ) established in homepage redesign
  - phase: 76-03
    provides: Server component + _components/ client pattern for marketing pages with Framer Motion

provides:
  - /pricing redesigned with V4 3-column grid, stagger animations, dark Advanced card, FAQ section
  - /client-portal redesigned with FloatingShapes background, AccentBar, info blocks, animated lookup form
  - Both pages follow server component (metadata) + client component (animation) pattern

affects:
  - 76-05 (marketing layout update — both these pages use the (marketing) layout)
  - 76-06 (any final polishing pass)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server component page.tsx exports metadata; _components/<name>-content.tsx is 'use client' for Framer Motion"
    - "whileInView animations for scroll-triggered entrance; animate (not whileInView) for above-fold hero elements"

key-files:
  created:
    - app/(marketing)/pricing/_components/pricing-content.tsx
    - app/(marketing)/client-portal/_components/portal-content.tsx
  modified:
    - app/(marketing)/pricing/page.tsx
    - app/(marketing)/client-portal/page.tsx

key-decisions:
  - "Pricing page uses animate (not whileInView) for hero header since it's above-fold; PricingGrid uses whileInView for stagger"
  - "Client portal uses animate throughout since the page is short enough to be fully visible"
  - "FloatingShapes on client-portal kept subtle — positioned as background layer without overwhelming the form"
  - "Reviews Add-On card uses /reputation href (not Calendly) — matches homepage behavior"

patterns-established:
  - "Marketing page pattern: page.tsx = Server Component (metadata only) + _components/x-content.tsx = Client Component ('use client')"

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 76 Plan 04: Redesign Pricing + Client Portal Pages Summary

**V4-redesigned /pricing (3-col grid, stagger animations, dark Advanced card, FAQ) and /client-portal (FloatingShapes background, AccentBar, info blocks) using server component + client component pattern**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-19T23:35:00Z
- **Completed:** 2026-03-19T23:38:17Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 updated)

## Accomplishments

- `/pricing` redesigned with oversized animated hero headline ("Simple pricing. / No surprises."), 3-column pricing grid (Basic $199, Advanced $299 dark/popular, Reviews Add-On $99) with staggered Framer Motion entrance, and V4FAQ with 6 web-design-specific questions
- `/client-portal` wrapped with FloatingShapes background, AccentBar + animated headline, existing ClientPortalLookup preserved unchanged, 3 info blocks (Submit Revisions / Track Progress / View History) with Phosphor duotone icons, animated entrance
- `pnpm lint && pnpm typecheck` pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Redesign /pricing page** - `b8bfe30` (feat)
2. **Task 2: Redesign /client-portal page** - `4776684` (feat)
3. **Task 3: Lint + typecheck verification** - included in plan metadata commit

**Plan metadata:** (this commit)

## Files Created/Modified

- `app/(marketing)/pricing/_components/pricing-content.tsx` — Client component with PricingGrid, hero header, V4FAQ integration
- `app/(marketing)/pricing/page.tsx` — Server component, exports updated SEO metadata, renders PricingContent
- `app/(marketing)/client-portal/_components/portal-content.tsx` — Client component with FloatingShapes, AccentBar, ClientPortalLookup, info blocks
- `app/(marketing)/client-portal/page.tsx` — Server component, exports metadata, renders PortalContent

## Decisions Made

- **Pricing page animate vs whileInView**: Hero headline uses `animate` (fires on mount, above fold), PricingGrid uses `whileInView` for stagger (below fold, scroll-triggered)
- **Client portal animate strategy**: Entire page uses `animate` since the content is short enough to be above fold on most viewports
- **FloatingShapes opacity**: Used as-is from shared.tsx — the component is already subtle by design
- **Reviews Add-On CTA**: Links to `/reputation` (not Calendly) — consistent with homepage behavior where "Learn More" → /reputation
- **ClientPortalLookup unchanged**: Preserved exactly — only wrapped with V4 visual treatment per plan specification

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both pages complete with V4 styling and metadata
- Ready for 76-05: marketing layout update (V4Nav + V4Footer for the (marketing) route group)
- No blockers

---
*Phase: 76-v4-design-system-rollout*
*Completed: 2026-03-19*
