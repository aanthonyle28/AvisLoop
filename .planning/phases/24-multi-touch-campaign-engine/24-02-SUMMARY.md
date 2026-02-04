---
phase: 24-multi-touch-campaign-engine
plan: 02
subsystem: database
tags: [postgres, rpc, campaign-presets, atomic-claiming, cron]

# Dependency graph
requires:
  - phase: 24-01
    provides: campaigns, campaign_touches, campaign_enrollments tables
provides:
  - claim_due_campaign_touches() RPC with FOR UPDATE SKIP LOCKED
  - 3 system campaign presets (conservative, standard, aggressive)
  - Preset touch configurations with timing and channels
affects: [24-03-cron-processor, 24-04-campaign-crud]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FOR UPDATE SKIP LOCKED for race-safe claiming"
    - "UNION ALL for multi-touch queries"
    - "System presets with business_id = NULL and is_preset = true"

key-files:
  created:
    - supabase/migrations/20260204_claim_due_campaign_touches.sql
    - supabase/migrations/20260204_seed_campaign_presets.sql
  modified: []

key-decisions:
  - "Skip recovery function - FOR UPDATE SKIP LOCKED handles crashed workers"
  - "Template_id NULL for presets - users configure after duplication"
  - "Conservative timing: 24h + 72h delays"
  - "Standard timing: 24h + 72h + 168h delays"
  - "Aggressive timing: 4h + 24h + 72h + 168h delays (SMS-first)"

patterns-established:
  - "Atomic claiming pattern: SELECT FOR UPDATE SKIP LOCKED prevents race conditions"
  - "System preset pattern: NULL business_id with is_preset=true for read-only templates"
  - "Touch guardrails: Touches 2-4 require previous touch sent before claiming"

# Metrics
duration: 1.5min
completed: 2026-02-04
---

# Phase 24 Plan 02: Campaign Touch Claiming & Presets Summary

**Atomic RPC claims due campaign touches with race-safe locking, 3 system presets provide Conservative/Standard/Aggressive templates**

## Performance

- **Duration:** 1.5 min
- **Started:** 2026-02-04T07:05:59Z
- **Completed:** 2026-02-04T07:07:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- claim_due_campaign_touches() RPC handles all 4 touch positions atomically
- FOR UPDATE SKIP LOCKED prevents race conditions between concurrent cron workers
- 3 system presets seeded: Conservative (2 email), Standard (2 email + 1 SMS), Aggressive (2 SMS + 2 emails)
- SMS-first for aggressive preset per CONTEXT.md requirements
- Guardrails enforce previous touch completion before next touch claims

## Task Commits

Each task was committed atomically:

1. **Task 1: Create claim_due_campaign_touches RPC** - `4a8f4f9` (feat)
2. **Task 2: Seed 3 campaign presets with touches** - `50f3b1f` (feat)

## Files Created/Modified
- `supabase/migrations/20260204_claim_due_campaign_touches.sql` - Atomic touch claiming RPC with UNION ALL for 4 touches, FOR UPDATE SKIP LOCKED per touch query
- `supabase/migrations/20260204_seed_campaign_presets.sql` - Conservative (2 touches), Standard (3 touches), Aggressive (4 touches) preset campaigns

## Decisions Made

**Skip recovery function**
- Rationale: FOR UPDATE SKIP LOCKED + enrollment state machine handles crashed workers automatically. If cron crashes after claiming but before updating, touch remains claimable (scheduled_at still past, sent_at still NULL). No need for explicit recovery function.

**Template_id NULL for presets**
- Rationale: System presets apply to all service types, but system templates are per-service-type. Setting NULL forces users to configure templates when duplicating presets, ensuring appropriate template selection.

**Timing choices**
- Conservative: 24h + 72h (safe, proven email cadence)
- Standard: 24h + 72h + 168h (balanced multi-channel)
- Aggressive: 4h + 24h + 72h + 168h (SMS-first for immediacy per CONTEXT.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for:**
- Phase 24-03: Cron processor can call claim_due_campaign_touches()
- Phase 24-04: Campaign CRUD can list/duplicate presets

**Notes:**
- Presets require campaign_enrollments and campaign_touches tables from 24-01
- RPC joins campaign_touches to get channel and template_id for each due touch
- Guardrails prevent out-of-order sending: touch N+1 only claims after touch N sent

---
*Phase: 24-multi-touch-campaign-engine*
*Completed: 2026-02-04*
