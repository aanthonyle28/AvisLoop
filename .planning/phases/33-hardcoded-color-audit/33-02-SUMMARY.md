---
phase: 33-hardcoded-color-audit
plan: 02
subsystem: ui
tags: [tailwind, design-system, color-tokens, css-variables, audit]

# Dependency graph
requires:
  - phase: 33-hardcoded-color-audit
    provides: Research document (33-RESEARCH.md) with Tier 1 file list and Tier 2 overview

provides:
  - Complete inventory of all 210 inline Tailwind color-scale class occurrences across 51 component files
  - 16-category classification distinguishing form validation, status badges, data-viz, warning banners, success/info callouts, stars, marketing, and destructive actions
  - Phase 35 token recommendations with specific CSS variable names, HSL values, and Tailwind config additions
  - Atomic replacement units identified (conditional blocks that must be replaced together)
  - Quick-win replacements flagged (5 cases using existing --destructive token)

affects:
  - phase-35 (semantic token creation — this document is the primary input)
  - phase-34 (palette swap — confirms no additional Tier 2 items needed before swap)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tier 2 color audit: categorize by semantic meaning (warning/success/info/error/data-viz/marketing) not by color value"
    - "Atomic replacement units: conditional color blocks (if/else/switch) must be replaced as complete units in Phase 35"

key-files:
  created:
    - .planning/phases/33-hardcoded-color-audit/TIER2-COLOR-AUDIT.md
  modified: []

key-decisions:
  - "Data visualization colors (chart dots, status dot indicators) stay inline — no token needed"
  - "Star rating yellow stays inline — yellow IS the star color, tokenizing adds no semantic value"
  - "Marketing components stay inline — separate from app design system"
  - "New tokens needed for Phase 35: --warning-*, --success-*, --info-*, --error-text (9 new CSS vars)"
  - "Form validation text-red-500/600 mapped to new --error-text token, NOT --destructive (different shade, different semantic role)"

patterns-established:
  - "Audit-first approach: categorize before replacing; avoid piecemeal tokenization that creates new inconsistencies"

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 33 Plan 02: Tier 2 Color Audit Summary

**Complete 510-line inventory of 210 inline Tailwind color-scale classes across 51 component files, categorized into 16 semantic groups with actionable Phase 35 token recommendations**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T03:12:48Z
- **Completed:** 2026-02-19T03:17:02Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- Ran exhaustive grep across all 51 files with inline color-scale classes (210 occurrences confirmed — research said 206, actual count is 210)
- Classified every occurrence into 16 categories covering all semantic use cases: warning banners, form validation errors, status badges, data-viz dots, SMS consent indicators, success/info callouts, star ratings, destructive buttons, danger zone, AI indicators, onboarding completion, marketing, CSV import results, SMS char counters, template channel badges, and the notification bell badge (already scheduled)
- Produced Phase 35 token spec with 9 new CSS variables (`--warning-*`, `--success-*`, `--info-*`, `--error-text`), Tailwind config additions, and utility class mappings
- Identified 9 atomic replacement units (conditional/switch blocks that must be changed as complete groups)
- Flagged 5 quick-win replacements using existing `--destructive` token, and 3 permanent inline-stays (data-viz, stars, marketing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Audit all inline color-scale classes in components/** - `ddcf477` (docs)

**Plan metadata:** included in task commit (documentation-only plan)

## Files Created/Modified

- `.planning/phases/33-hardcoded-color-audit/TIER2-COLOR-AUDIT.md` — 510-line audit document with category summary table, per-category file inventory, Phase 35 token spec, atomic replacement units, and verification commands

## Decisions Made

- **Data-viz colors stay inline:** `campaign-stats.tsx` chart dots (`bg-green-500`, `bg-yellow-500`, `bg-gray-400`, `bg-red-500`) and `bulk-send-columns.tsx` status dots are fixed data visualization palettes, not UI chrome. No token would add semantic value.
- **Star yellow stays inline:** `text-yellow-400` for star ratings in `satisfaction-rating.tsx`, `feedback-card.tsx`, `stat-strip.tsx` — yellow IS the universal star metaphor. Tokenizing adds indirection without benefit.
- **Marketing components stay inline:** `components/marketing/hero.tsx` and `animated-demo.tsx` are product marketing, not app design system. Their colors are independent aesthetic choices.
- **`--error-text` is distinct from `--destructive`:** Form validation errors (`text-red-500/600`) need a darker text shade than `--destructive` (which is calibrated for button backgrounds). Phase 35 must decide: unify at `--destructive` or introduce `--error-text`.
- **Phase 35 should batch-replace by category, not by file:** Replacing by file risks inconsistency; replacing by category (all warning banners together, all form errors together) ensures semantic coherence across the codebase.

## Deviations from Plan

None — plan executed exactly as written. Document-only plan with no component modifications.

## Issues Encountered

Minor: the research document said 206 occurrences across 54 files; actual grep produced 210 occurrences across 51 files. Likely explained by:
- Research grep may have used slightly different pattern
- Some files may have been added/removed between research and audit
- Count difference is minor and does not affect categorization quality

All 51 files were categorized; the 3-file discrepancy with the research estimate does not affect Phase 35 planning.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 33 Plan 01** (Tier 1 hex + badge fixes): Ready to execute. TIER2-COLOR-AUDIT.md confirms no additional files need Tier 1 treatment.
- **Phase 34** (palette swap): Ready once Phase 33 plan-01 completes. Tier 2 is documented, not blocking.
- **Phase 35** (semantic tokens): This document is the complete input. Phase 35 should:
  1. Add 9 new CSS variables to `globals.css`
  2. Add token utilities to `tailwind.config.ts`
  3. Batch-replace by category using this document's per-category file lists
  4. Use the atomic replacement units table for conditional blocks

---
*Phase: 33-hardcoded-color-audit*
*Completed: 2026-02-19*
