---
phase: 35-card-variants-dashboard-quick-wins
plan: 01
subsystem: ui
tags: [cva, class-variance-authority, card, design-system, phosphor-icons]

# Dependency graph
requires:
  - phase: 34-warm-palette-token-replacement
    provides: semantic CSS tokens (bg-card, border-border) that card default variant relies on
provides:
  - CVA-backed Card component with 7 variants (default, amber, blue, green, red, ghost, subtle)
  - CVA-backed InteractiveCard with always-visible ArrowRight affordance replacing translate-y lift
  - Exported cardVariants for downstream use by other components/phases
affects:
  - 35-02 and later plans that consume card variants
  - Any component using InteractiveCard (navigability affordance now consistent)
  - KPI widgets, campaign cards, job cards (can opt into color variants)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CVA (class-variance-authority) for Card variants — same pattern as button.tsx
    - group/group-hover Tailwind pattern for child element hover transitions
    - Absolute-positioned navigability indicator (ArrowRight) inside InteractiveCard

key-files:
  created: []
  modified:
    - components/ui/card.tsx

key-decisions:
  - "Use low-opacity modifiers (/60 bg, /50 border) for color variant tints — keeps them whisper-quiet, decorative only"
  - "Tailwind color scale classes for card variants (not semantic tokens) — tints are decorative card-level, not semantic status"
  - "ArrowRight always visible (muted-foreground/30) with group-hover to /70 — never hidden, signals clickability without dominating"
  - "Replace translate-y lift with hover:shadow-sm — subtler, less jarring, consistent with flat design direction"
  - "defaultVariants: { variant: 'default' } — full backward compatibility, no existing usage breaks"

patterns-established:
  - "Card variant pattern: cardVariants CVA + CardProps interface extending VariantProps — mirror for future compound components"
  - "InteractiveCard arrow: absolute bottom-3 right-3, group on parent, group-hover on icon"

# Metrics
duration: 1min
completed: 2026-02-19
---

# Phase 35 Plan 01: Card Variants Summary

**CVA-backed Card and InteractiveCard with 7 color variants (default/amber/blue/green/red/ghost/subtle) and always-visible ArrowRight navigability affordance replacing the translate-y lift**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-02-19T04:42:09Z
- **Completed:** 2026-02-19T04:43:05Z
- **Tasks:** 2 (implementation + build verification)
- **Files modified:** 1

## Accomplishments

- Converted Card and InteractiveCard from plain `cn()` wrappers to CVA-backed components with full variant support
- Added 6 named color variants (amber, blue, green, red, ghost, subtle) plus default — all backward-compatible via `defaultVariants`
- Replaced InteractiveCard's `motion-safe:hover:-translate-y-1` lift with always-visible ArrowRight indicator at bottom-right corner, transitioning from `muted-foreground/30` to `/70` on group-hover
- Exported `cardVariants` for downstream consumption by other components

## Task Commits

Each task was committed atomically:

1. **Task 1 + 2: Convert Card/InteractiveCard to CVA variants with arrow affordance** - `25609f8` (feat)

## Files Created/Modified

- `components/ui/card.tsx` - CVA cardVariants, CardProps interface, updated Card and InteractiveCard, exported cardVariants

## Decisions Made

- Low-opacity tints (/60 bg, /50 border) for all color variants — whisper-quiet decorative treatment as specified in CONTEXT.md
- Tailwind color scale classes (not semantic CSS vars) for card variant tints — card variants are decorative, not semantic status colors
- `hover:shadow-sm` replaces translate-y lift — subtler visual feedback consistent with flat design direction
- `group`/`group-hover` pattern for arrow color transition — standard Tailwind approach, no JS needed

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `card.tsx` is ready for Phase 35 plan 02 and beyond — any component can now accept `variant="amber"` etc.
- `cardVariants` export allows other files to reference variant type if needed
- No regressions — all existing Card/InteractiveCard usages continue working with default variant behavior

---
*Phase: 35-card-variants-dashboard-quick-wins*
*Completed: 2026-02-19*
