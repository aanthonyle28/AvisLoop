---
phase: 33-hardcoded-color-audit
plan: 01
subsystem: ui
tags: [tailwind, design-tokens, css-custom-properties, dark-mode, sidebar, layout]

# Dependency graph
requires:
  - phase: 30-v2-alignment
    provides: Sidebar, page-header, and app-shell layout chrome files that this plan tokenizes
  - phase: 30.1-audit-gaps
    provides: Component consistency baseline this plan extends to color tokens

provides:
  - Token-based layout chrome — all five layout/settings files use only CSS custom property tokens
  - Zero hardcoded hex arbitrary values in components/
  - delete-account-dialog migrated from raw button elements to Button component with destructive variant

affects:
  - 33-02: Next plan in phase — scans remaining components after layout chrome is clean
  - 34-warm-palette-token-replacement: Phase 34 swaps CSS custom property values; layout chrome now picks up changes correctly

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic token pattern: bg-secondary for active nav state, border-border for dividers, bg-card for surfaces, bg-destructive/text-destructive-foreground for badges"
    - "Redundant dark: override elimination: bg-white dark:bg-card → bg-card (bg-card already maps correctly in both modes)"
    - "bg-[#F2F2F2] → bg-secondary: --secondary is 0 0% 92% (#EBEBEB), semantically correct for active nav state"
    - "Button component usage: all destructive actions use Button variant='destructive' rather than raw button elements"

key-files:
  created: []
  modified:
    - components/layout/app-shell.tsx
    - components/layout/sidebar.tsx
    - components/layout/page-header.tsx
    - components/layout/notification-bell.tsx
    - components/settings/delete-account-dialog.tsx

key-decisions:
  - "bg-secondary chosen for active nav state (was bg-[#F2F2F2]): --secondary is 0 0% 92% which is semantically correct for secondary/muted interactive backgrounds"
  - "Dark-mode overrides removed where redundant: bg-card is already correct in both light (#FFFFFF) and dark mode, so dark:bg-card is unnecessary"
  - "bg-destructive/text-destructive-foreground replaces bg-red-500 text-white for nav badges: tokens ensure palette swap in Phase 34 propagates automatically"
  - "Delete account dialog migrated to Button component: all project destructive actions should use the shared Button primitive for consistency and future theming"

patterns-established:
  - "Token-only layout rule: no bg-[#...], text-[#...], or border-[#...] allowed in components/ — verified by grep"
  - "Redundant dark: override removal: when --card, --background, --border tokens are already mode-aware, dark:bg-X overrides add noise without value"
  - "Button component for all interactive elements: even in dialogs/modals, raw button elements should be replaced with the Button primitive"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 33 Plan 01: Hardcoded Color Audit — Layout Chrome Summary

**Removed all hardcoded hex arbitrary values from five layout/settings files, replacing with semantic Tailwind design tokens (bg-secondary, bg-card, border-border, bg-destructive, text-destructive-foreground), enabling Phase 34 palette swap to propagate automatically.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T03:12:23Z
- **Completed:** 2026-02-19T03:14:44Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Eliminated all `bg-[#...]`, `border-[#...]`, and `text-[#...]` arbitrary hex values from `components/` (zero hits confirmed by grep)
- Replaced redundant `bg-white dark:bg-card` and `bg-[#F9F9F9] dark:bg-background` patterns with single-token equivalents (`bg-card`, `bg-background`)
- Migrated `delete-account-dialog.tsx` from three raw `<button>` elements to the Button component with `variant="destructive"` and `variant="outline"`, plus destructive tokens for focus ring and error text
- Lint and typecheck pass with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace hardcoded hex values in layout chrome files** - `0fcdc2a` (refactor)
2. **Task 2: Migrate delete-account-dialog.tsx to use Button component** - `950afbd` (refactor)
3. **Task 3: Verify lint and typecheck pass** - (no commit — verification only, changes already in Task 1/2 commits)

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `components/layout/app-shell.tsx` - `bg-[#F9F9F9] dark:bg-background` → `bg-background`
- `components/layout/sidebar.tsx` - Active nav: `bg-[#F2F2F2]` → `bg-secondary`; borders: `border-[#E2E2E2]` → `border-border`; surface: `bg-white dark:bg-card` → `bg-card`; badges: `bg-red-500 text-white` → `bg-destructive text-destructive-foreground`; account hover: `hover:bg-[#F2F2F2]/70` → `hover:bg-secondary/70`
- `components/layout/page-header.tsx` - `bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border` → `bg-card border-b border-border`
- `components/layout/notification-bell.tsx` - Hover: `hover:bg-[#F2F2F2]/70` → `hover:bg-secondary/70`; badge: `bg-red-500 text-white` → `bg-destructive text-destructive-foreground`
- `components/settings/delete-account-dialog.tsx` - Added Button import; replaced 3 raw button elements with Button component (variants: destructive, outline, destructive); replaced `text-red-600` with `text-destructive`; replaced `ring-red-500/border-red-500` with `ring-destructive/50/border-destructive`

## Decisions Made
- `bg-secondary` was chosen for the active nav state (`bg-[#F2F2F2]` replacement) because `--secondary` maps to `0 0% 92%` (#EBEBEB in light), which is semantically correct for secondary/muted interactive surface states.
- Redundant `dark:` overrides were removed where CSS custom properties already handle mode switching — `bg-card` is `#FFFFFF` in light and the correct dark surface in dark mode without needing an explicit `dark:bg-card` override.
- `bg-destructive text-destructive-foreground` replaces `bg-red-500 text-white` so Phase 34's palette swap (amber accent) propagates automatically to all badge-style elements.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Layout chrome is now fully token-based; Phase 34 warm palette swap will affect these files automatically
- Plan 33-02 can proceed to scan remaining components for hardcoded values outside layout chrome
- grep baseline established: `grep -rn "bg-\[#\|text-\[#\|border-\[#" components/` returns zero hits

---
*Phase: 33-hardcoded-color-audit*
*Completed: 2026-02-19*
