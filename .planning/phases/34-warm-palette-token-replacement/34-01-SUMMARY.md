---
phase: 34-warm-palette-token-replacement
plan: 01
subsystem: ui
tags: [tailwind, css-variables, design-system, tokens, dark-mode, accessibility]

# Dependency graph
requires:
  - phase: 33-hardcoded-color-audit
    provides: Tier 1 hardcoded color inventory — all status badge hex values identified for token migration
provides:
  - Complete warm amber/cream palette in globals.css (light + dark)
  - Four new semantic tokens: --highlight, --highlight-foreground, --surface, --surface-foreground
  - Tailwind config mappings for highlight and surface token utilities
  - Status badges using token classes instead of inline hex styles with borders for warm-background contrast
  - UI primitives using bg-muted/bg-secondary for interactive hover/focus instead of bg-accent
  - AI preview-diff using bg-highlight token for added diff spans
affects:
  - 34-02 (UI shell warm background application — builds on these tokens)
  - 35-card-variants-dashboard-quick-wins (uses status, highlight, surface tokens)
  - All future phases using UI primitives (button, select, dropdown-menu, dialog)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSS custom properties follow HSL triplet format (H S% L%) — no hsl() wrapper in :root/.dark"
    - "Semantic token pairs use DEFAULT + foreground pattern matching shadcn/ui convention"
    - "Status badge colors defined as token classes (bg-status-*-bg text-status-*-text) not inline styles"
    - "Interactive hover/focus states use bg-muted or bg-secondary — accent is decorative only"
    - "Dark mode independently calibrated: H=24 backgrounds at 8% saturation, not lightness-inverted from light"

key-files:
  created: []
  modified:
    - app/globals.css
    - tailwind.config.ts
    - components/history/status-badge.tsx
    - components/ui/button.tsx
    - components/ui/select.tsx
    - components/ui/dropdown-menu.tsx
    - components/ui/dialog.tsx
    - components/jobs/customer-autocomplete.tsx
    - components/ai/preview-diff.tsx

key-decisions:
  - "Warm palette anchored at H=36 for background/card (cream), H=24 for dark mode backgrounds (warm charcoal), H=38 for amber accent"
  - "Primary stays soft blue (213 60% 42%) — amber fails WCAG AA on cream background at sufficient lightness"
  - "Dark mode uses H=24 at 8% saturation independently — not lightness-inverted light mode values"
  - "Status badges get borders (border-status-*-text/20) for distinguishability on warm cream background"
  - "bg-secondary (not bg-muted) for outline button hover — secondary is darker than muted, better hover affordance"
  - "bg-muted for ghost button, dropdown items, select items, dialog close — lighter interactive surface"
  - "bg-highlight token for AI preview-diff added spans — distinct warm amber tint vs bg-primary/15 blue"

patterns-established:
  - "Token-based status badges: config object has className field not bg/text fields, no style props"
  - "Accent = decorative only: never used for interactive hover/focus bg in UI primitives"

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 34 Plan 01: Warm Palette Token Replacement Summary

**Warm cream/amber palette swapped into globals.css with 4 new semantic tokens, status badges migrated from inline hex to Tailwind token classes, and all UI primitive interactive states updated from amber accent to neutral muted**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T03:40:53Z
- **Completed:** 2026-02-19T03:44:02Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced entire CSS custom property system with warm palette: cream background (36 20% 96%), warm near-black foreground (24 10% 10%), soft blue primary (213 60% 42%), amber accent (38 92% 50%)
- Dark mode independently calibrated with H=24 warm charcoal backgrounds at 8% saturation — not lightness-inverted
- Added 4 new semantic tokens: --highlight, --highlight-foreground, --surface, --surface-foreground in globals.css and tailwind.config.ts
- Migrated status-badge.tsx from 6 sets of hardcoded hex bg/text pairs to Tailwind token classes with borders
- Updated 5 UI primitive files (button, select, dropdown-menu, dialog, customer-autocomplete) to use bg-muted/bg-secondary for interactive states instead of bg-accent
- Migrated preview-diff.tsx to use bg-highlight token for diff-added spans

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace CSS tokens with warm palette and add highlight/surface tokens** - `3ab11df` (feat)
2. **Task 2: Migrate status-badge from inline hex styles to Tailwind token classes** - `50e8ccd` (feat)
3. **Task 3: Update UI primitive focus/hover states and migrate preview-diff to highlight token** - `6fc15f7` (feat)

## Files Created/Modified

- `app/globals.css` — Complete warm palette :root and .dark blocks with 4 new semantic tokens
- `tailwind.config.ts` — highlight and surface token mappings added between accent and lime entries
- `components/history/status-badge.tsx` — statusConfig uses className field with Tailwind token classes; no style prop; borders added
- `components/ui/button.tsx` — outline uses hover:bg-secondary, ghost uses hover:bg-muted
- `components/ui/select.tsx` — SelectItem focus:bg-muted focus:text-foreground
- `components/ui/dropdown-menu.tsx` — SubTrigger, MenuItem, CheckboxItem, RadioItem all use focus:bg-muted
- `components/ui/dialog.tsx` — close button open state uses data-[state=open]:bg-muted
- `components/jobs/customer-autocomplete.tsx` — all hover/active states use bg-muted
- `components/ai/preview-diff.tsx` — diff-added spans use bg-highlight text-highlight-foreground

## Decisions Made

- Primary stays blue (213 60% 42%) — amber at warm lightness fails WCAG AA (2.2:1 ratio) on cream; consistent with accumulated decision
- bg-secondary for outline button hover (stronger visual affordance than bg-muted, semantically correct for interactive surface)
- bg-muted for ghost/dropdown/select/dialog states (lighter neutral, prevents amber wash)
- Status badge borders set to border-status-*-text/20 — subtle but sufficient for warm background distinguishability
- bg-highlight for preview-diff added spans — warm amber tint aligns with new palette, semantically named over primary/15

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Warm palette tokens are live and resolve across the entire app via CSS variables
- All UI primitives cleaned up — no amber wash on interactive hover/focus
- Phase 34-02 (UI shell application) can now apply bg-background, bg-card, bg-surface classes to layout components
- Phase 35 (card variants and dashboard quick wins) can reference highlight and surface tokens immediately

---
*Phase: 34-warm-palette-token-replacement*
*Completed: 2026-02-19*
