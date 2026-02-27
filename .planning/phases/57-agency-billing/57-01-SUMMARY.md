---
phase: 57-agency-billing
plan: 01
subsystem: billing
tags: [billing, send-limits, agency, multi-business, pooled-usage]

# Dependency graph
requires:
  - phase: 52-active-business
    provides: getActiveBusiness() for resolving business context
  - phase: 55-clients-page
    provides: agency multi-business infrastructure (businesses table with user_id FK)
provides:
  - getPooledMonthlyUsage(userId) in lib/data/send-logs.ts
  - All 3 send enforcement points use cross-business pooled counting
  - Billing page displays pooled send usage with "(all businesses)" label
  - Effective tier = best tier across all user-owned businesses
affects:
  - phase: 57-02 (billing page UI, if any)
  - Future billing enforcement work

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pooled usage pattern: aggregate across all user's businesses via .in('business_id', businessIds)"
    - "Effective tier: TIER_PRIORITY map + reduce to find best tier (trial < basic < pro)"
    - "User-scoped billing enforcement: getUser() in send actions passes userId to pooled query"

key-files:
  created: []
  modified:
    - lib/data/send-logs.ts
    - lib/actions/send.ts
    - lib/actions/send-sms.action.ts
    - lib/data/subscription.ts
    - components/billing/usage-display.tsx

key-decisions:
  - "Pooled usage at user level (not business level) — all businesses owned by user share one limit"
  - "Effective tier = BEST tier across all businesses — user always gets the tier they paid for"
  - "getMonthlyUsage(businessId) preserved unchanged — still used for per-business warning banners on campaigns/customers/settings"
  - "Cron processor left unchanged — it does not check monthly limits (confirmed in research)"
  - "send-one-off-data.ts left unchanged — shows per-business context appropriately"
  - "bizData.tier field removed from select in send.ts and send-sms.action.ts — no longer needed after pooled migration"

patterns-established:
  - "TIER_PRIORITY: Record<string, number> = { trial: 0, basic: 1, pro: 2 } — canonical tier ordering for comparisons"
  - "send actions: getUser() is always called first for auth, user.id passed to getPooledMonthlyUsage()"

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 57 Plan 01: Agency Billing — Pooled Usage Enforcement Summary

**Cross-business send pooling via getPooledMonthlyUsage(userId): closes agency loophole where N businesses gave N x plan limit, enforces single pool with best-tier-wins logic**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T19:54:53Z
- **Completed:** 2026-02-27T19:59:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `getPooledMonthlyUsage(userId)` to `lib/data/send-logs.ts` — queries all user-owned businesses, derives effective tier as best tier (trial < basic < pro), counts sends pooled via `.in('business_id', businessIds)`
- Updated all 3 send enforcement points (`sendReviewRequest`, `batchSendReviewRequest`, `sendSmsRequest`) to call `getPooledMonthlyUsage(user.id)` — deleted private `getMonthlyCount()` helpers from both action files
- Updated billing page data layer (`getBusinessBillingInfo`) to call `getPooledMonthlyUsage(user.id)` and return effective tier from pooled result
- Updated `UsageDisplay` label from "Sends this month" to "Sends this month (all businesses)"

## Task Commits

Each task was committed atomically:

1. **Task 1: Create getPooledMonthlyUsage and update enforcement** - `7ca6db4` (feat)
2. **Task 2: Update billing page data layer and display label** - `31f5b09` (feat)

**Plan metadata:** See docs commit below

## Files Created/Modified
- `lib/data/send-logs.ts` — Added `getPooledMonthlyUsage(userId)` after existing `getMonthlyUsage(businessId)` (preserved)
- `lib/actions/send.ts` — Replaced per-business monthly limit check (x2) with pooled, deleted `getMonthlyCount()`, removed `MONTHLY_SEND_LIMITS` import
- `lib/actions/send-sms.action.ts` — Replaced per-business monthly limit check with pooled, deleted `getMonthlyCount()`, removed `MONTHLY_SEND_LIMITS` import, removed `tier` from bizData select
- `lib/data/subscription.ts` — Replaced `getMonthlyUsage(businessId)` with `getPooledMonthlyUsage(user.id)`, added `getUser()` call, effective tier from pooled result
- `components/billing/usage-display.tsx` — Label updated to "Sends this month (all businesses)"

## Decisions Made
- **Effective tier = best tier:** If user has one `trial` business and one `pro` business, effective tier is `pro`. They paid for pro, so the pooled limit uses pro's limit. This is fair and correct.
- **TIER_PRIORITY map approach:** `{ trial: 0, basic: 1, pro: 2 }` with reduce gives clean max-tier selection. No hardcoded string comparisons.
- **Preserved getMonthlyUsage(businessId):** Per-business counting still needed for campaigns/customers/settings warning banners — these show context for a single business, so per-business is correct there.
- **bizData.tier removed from select in action files:** Now that enforcement uses pooled, the per-business tier is no longer needed in the send actions.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- ESLint/linter auto-reverted inline edits twice during execution (likely an auto-formatter). Resolved by writing full file content via Write tool instead of targeted edits for the action files.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- BILL-01 (pooled enforcement) and BILL-02 (billing page display) are complete
- Phase 57-02 can proceed with any remaining agency billing work
- No blockers

---
*Phase: 57-agency-billing*
*Completed: 2026-02-27*
