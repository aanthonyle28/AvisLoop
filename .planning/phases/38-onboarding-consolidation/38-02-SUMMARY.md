---
phase: 38-onboarding-consolidation
plan: 02
subsystem: ui
tags: [onboarding, wizard, services, campaigns, chip-tiles, presets]

# Dependency graph
requires:
  - phase: 38-01
    provides: Onboarding wizard step reordering and URL clamping
provides:
  - Horizontal pill chip layout for services step (no more card grid)
  - "Other" service type reveals custom label input
  - Plain-English preset names: Gentle/Steady/Speedy Follow-Up
  - Cumulative day-based timing labels (Day 1, Day 4) instead of raw hours
affects:
  - 38-03 (onboarding styling/polish - uses same step components)
  - 38-04 (any onboarding verification step)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Chip tile multi-select: flex-wrap + rounded-full + bg-primary when selected + Check icon
    - Conditional reveal: selected.includes('other') gates Input render
    - Cumulative timing: reduce over touches slice to get total hours then format as Day N

key-files:
  created: []
  modified:
    - components/onboarding/steps/services-offered-step.tsx
    - components/onboarding/steps/campaign-preset-step.tsx
    - lib/constants/campaigns.ts

key-decisions:
  - "customServiceLabel state is UX-only — not saved to DB; value sent to saveServicesOffered is still the string[] enum array"
  - "Cumulative hours for timing display: sum all touches up to idx+1, then divide by 24 for Day N label"
  - "preset.meta?.name pattern falls back to preset.name (DB name) if no CAMPAIGN_PRESETS match — safe for unrecognized presets"
  - "Keep ids (conservative/standard/aggressive) unchanged — matching logic in campaign-preset-step.tsx uses preset.name.toLowerCase().includes(p.id)"

patterns-established:
  - "Chip multi-select: flex flex-wrap gap-2 container with rounded-full buttons; selected state = bg-primary + Check icon"
  - "Plain-English constants: technical IDs stay internal, display name field carries friendly copy"

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 38 Plan 02: Onboarding UI — Chip Tiles and Plain-English Presets Summary

**Horizontal pill chips replace services card-grid, "Other" reveals text input, and campaign presets renamed Gentle/Steady/Speedy Follow-Up with cumulative Day N timing labels**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T~04:13Z
- **Completed:** 2026-02-19T~04:15Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Services step: 2-col card grid replaced with `flex flex-wrap` pill chips — lighter, faster to scan for multi-select
- Selecting "Other" chip conditionally reveals a text `<Input>` for custom service name (UX-only, not persisted to DB)
- `CAMPAIGN_PRESETS` constant: Conservative/Standard/Aggressive renamed to Gentle/Steady/Speedy Follow-Up with plain-English descriptions
- Preset step: hardcoded `{preset.meta?.id === 'conservative' && 'Conservative'}` chain replaced with `{preset.meta?.name || preset.name}`
- Touch timing: raw `Xd` labels replaced with cumulative `Day N` (e.g., touch 2 of Gentle = Day 4, not Day 3)

## Task Commits

Each task was committed atomically:

1. **Task 1: Horizontal chip tiles with "Other" text input** - `bca2bf5` (feat)
2. **Task 2: Plain-English preset names and cumulative day timing labels** - `54b05d5` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/onboarding/steps/services-offered-step.tsx` - Chip layout + Other reveal input; removed DEFAULT_TIMING_HOURS import
- `components/onboarding/steps/campaign-preset-step.tsx` - meta.name pattern + cumulative timing IIFE
- `lib/constants/campaigns.ts` - Updated CAMPAIGN_PRESETS names and descriptions

## Decisions Made
- `customServiceLabel` state is UX-only: stored locally so the input is controlled, but `saveServicesOffered` still receives the string[] enum array. No DB column change needed in this phase.
- Cumulative hours approach for timing: compute `reduce` over `campaign_touches.slice(0, idx + 1)` so Day labels show when the customer will actually receive the message (not delay from previous touch).
- Sub-24h touches (e.g., 4h for Speedy first SMS) display raw `Xh` — clearer than "Day 0".
- `preset.meta?.name || preset.name` fallback pattern is safe: if a future preset isn't in CAMPAIGN_PRESETS constants, DB name is shown instead of nothing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- During final verification, `pnpm typecheck` surfaced a pre-existing error (`campaignCount` undeclared) from Phase 38-01 changes that weren't committed yet. The working tree already had the fix applied by 38-01 execution — confirmed by re-running typecheck which passed. The stash temporarily revealed the committed-but-unfixed state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Services and campaign preset steps are UI-polished and ready for Phase 38-03 styling pass
- No blockers

---
*Phase: 38-onboarding-consolidation*
*Completed: 2026-02-19*
