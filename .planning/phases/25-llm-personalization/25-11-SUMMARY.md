---
phase: 25-llm-personalization
plan: 11
subsystem: ui
tags: [llm, cost-tracking, settings, transparency]

# Dependency graph
requires:
  - phase: 25-10
    provides: MODEL_COSTS export with per-model pricing
provides:
  - Cost estimation logic using weighted model distribution
  - Monthly cost projection based on weekly volume
  - Settings UI displaying estimated monthly LLM cost
affects: [billing, analytics, cost-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns: [cost-transparency-without-billing]

key-files:
  created: []
  modified:
    - lib/data/personalization.ts
    - components/settings/personalization-section.tsx

key-decisions:
  - "350 input tokens + 150 output tokens per personalization call average"
  - "4.3 weeks per month for monthly projection multiplier"
  - "Cost display shows '--' when no sends exist (no misleading $0.00)"
  - "Per-1K-message cost shown for transparency alongside monthly estimate"

patterns-established:
  - "Cost transparency pattern: show estimates for internal transparency without surfacing to billing"

# Metrics
duration: 8min
completed: 2026-02-04
---

# Phase 25 Plan 11: Cost Tracking Summary

**LLM cost estimation with weighted model distribution showing projected monthly cost in settings**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-04T23:57:00Z
- **Completed:** 2026-02-04T00:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Cost calculation using weighted model distribution (70% Gemini Flash, 25% GPT-4o-mini, 5% DeepSeek)
- Monthly cost projection based on weekly send volume
- Settings UI displays estimated monthly cost and per-1K-message rate
- Transparency note clarifying costs are included in plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cost calculation to personalization data functions** - `71c8d5e` (feat)
2. **Task 2: Add cost display to PersonalizationSection UI** - `f5dbe63` (feat)

## Files Created/Modified
- `lib/data/personalization.ts` - Added cost calculation functions, CostEstimate interface, weighted model distribution constants
- `components/settings/personalization-section.tsx` - Added Est. Monthly Cost card, formatCost helper, transparency note

## Decisions Made

**1. Token estimates per call**
- AVG_INPUT_TOKENS = 350 (system prompt ~200 + user prompt ~150)
- AVG_OUTPUT_TOKENS = 150 (personalized message body)
- Based on typical review request message length

**2. Monthly projection multiplier**
- 4.3 weeks per month standard business metric
- Projects weekly send volume to monthly cost estimate

**3. Zero-send display**
- Shows '--' instead of '$0.00' when weeklyVolume = 0
- Prevents misleading zero-cost display when no data exists

**4. Transparency messaging**
- "AI personalization cost is included in your plan — no additional charges"
- Per-1K-message cost shown for business owner awareness
- Not a billing feature - internal transparency only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

Phase 25 complete (11/11 plans). All success criteria met:
- [x] Model routing with multi-provider support (25-10)
- [x] Cost tracking with monthly projection (25-11)
- [x] Preview with personalization samples (25-05)
- [x] Per-campaign toggle with DB persistence (25-07)
- [x] Cron processor integration (25-08)
- [x] Profanity filtering (25-09)

Ready for Phase 26 (Review Funnel) completion or Phase 27 (Dashboard Redesign).

---
*Phase: 25-llm-personalization*
*Completed: 2026-02-04*
