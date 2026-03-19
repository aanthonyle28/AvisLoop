---
phase: 76
plan: "01"
name: extract-shared-v4-design-system
subsystem: marketing
tags: [design-system, framer-motion, components, refactor, marketing]

dependency-graph:
  requires: [75-01, 75-02]
  provides: [components/marketing/v4/nav, components/marketing/v4/footer, components/marketing/v4/shared, components/marketing/v4/sections]
  affects: [76-02, 76-03]

tech-stack:
  added: []
  patterns: [shared-component-library, named-exports, data-props-pattern]

key-files:
  created:
    - components/marketing/v4/nav.tsx
    - components/marketing/v4/footer.tsx
    - components/marketing/v4/shared.tsx
    - components/marketing/v4/sections.tsx
  modified:
    - app/new/page.tsx

decisions:
  - AccentBar uses whileInView by default (not animate) so it fires on scroll; Hero overrides with delay prop
  - V4FAQ re-exported AccentBar from shared rather than duplicating the motion.div pattern
  - page.tsx data arrays (stats, testimonials, faqs) stay as page-local constants — they are page-specific content, not shared design tokens
  - Unused Link import removed from page.tsx (lint catch)

metrics:
  duration: "~4m"
  completed: "2026-03-19"
---

# Phase 76 Plan 01: Extract Shared V4 Design System Summary

**One-liner:** Extracted Nav, Footer, FloatingShapes, AnimatedNumber, MarqueeRow, AccentBar, SectionDivider, V4Stats, V4Testimonials, and V4FAQ from the 1100-line `app/new/page.tsx` monolith into 4 shared component files under `components/marketing/v4/`.

## What Was Built

### New Files

| File | Exports | Purpose |
|------|---------|---------|
| `components/marketing/v4/nav.tsx` | `V4Nav` | Transparent→frosted glass nav with mobile overlay, accepts links + calendlyUrl props |
| `components/marketing/v4/footer.tsx` | `V4Footer` | Logo + copyright + configurable right-side links |
| `components/marketing/v4/shared.tsx` | `FloatingShapes`, `AnimatedNumber`, `MarqueeRow`, `AccentBar`, `SectionDivider` | Visual building blocks |
| `components/marketing/v4/sections.tsx` | `V4Stats`, `V4Testimonials`, `V4FAQ` | Data-driven reusable page sections |

### Modified Files

- `app/new/page.tsx` — Pure refactor: replaced inline component definitions with imports from new shared files. Line count reduced from ~1100 to ~420 lines of page-specific content. Page renders identically.

## Decisions Made

1. **AccentBar whileInView vs animate**: The shared `AccentBar` uses `whileInView` so it fires when scrolled into view. Hero section overrides this pattern with an explicit `motion.div` with `animate` + delay since the hero is visible on load (not scrolled into view).

2. **Data stays in page**: The content data (stats values, testimonial quotes, FAQ text) stays as page-local constants in `page.tsx` — these are page-specific content, not shared design tokens. The section components accept this data via props.

3. **V4FAQ uses AccentBar**: Rather than duplicating the `motion.div` width-animation pattern inline, `V4FAQ` imports `AccentBar` from `shared.tsx`. This ensures consistent visual behavior.

4. **Named exports only**: All components use named exports (`export function V4Nav`) rather than default exports, matching Next.js App Router conventions and enabling tree-shaking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused `Link` import in refactored page.tsx**

- **Found during:** Task 5 — `pnpm lint` caught it
- **Issue:** `Link` from `next/link` was imported in the original page.tsx for the Footer links, but `V4Footer` now handles those links internally
- **Fix:** Removed unused `import Link from 'next/link'` from `app/new/page.tsx`
- **Files modified:** `app/new/page.tsx`
- **Commit:** `02c2f07`

## Verification Results

- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- All 4 new component files created with correct named exports
- `app/new/page.tsx` uses imports instead of inline definitions
- No duplicate component definitions remain in page.tsx for extracted components

## Next Phase Readiness

Phase 76-02 and 76-03 can now import from:
- `@/components/marketing/v4/nav` → `V4Nav`
- `@/components/marketing/v4/footer` → `V4Footer`
- `@/components/marketing/v4/shared` → `FloatingShapes`, `AnimatedNumber`, `MarqueeRow`, `AccentBar`, `SectionDivider`
- `@/components/marketing/v4/sections` → `V4Stats`, `V4Testimonials`, `V4FAQ`

No blockers.
