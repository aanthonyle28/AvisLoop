---
phase: 53-data-function-refactor
plan: 01
subsystem: database
tags: [supabase, rls, multi-tenancy, business-id, typescript, data-layer]

# Dependency graph
requires:
  - phase: 52-multi-business-foundation
    provides: getActiveBusiness() resolver that returns verified businessId from httpOnly cookie
provides:
  - All lib/data/ functions accept explicit businessId: string as first parameter
  - Zero functions in lib/data/ perform user auth or .eq('user_id', user.id).single() business lookup
  - lib/data/customer.ts deleted (dead code, zero importers)
  - getJobs return type simplified (no longer includes businessId field — callers already have it)
  - getMonthlyUsage(businessId) queries tier by PK, returns {count, limit, tier}
  - getBusinessBillingInfo(businessId) threads businessId to internal getMonthlyUsage call
  - getPersonalizationSummary(businessId) threads to both getPersonalizationStats and getLLMUsageStats
  - getDashboardCounts(businessId) uses businessId directly without intermediate user/business query
  - getSetupProgress(businessId) calls getChecklistState(businessId) directly without intermediate query
affects: [53-02-server-actions-update, app/(dashboard)/layout.tsx, all server components that call these data functions]

# Tech tracking
tech-stack:
  added: []
  patterns: [caller-provides-businessId, no-auth-in-data-layer, explicit-business-scoping]

key-files:
  created: []
  modified:
    - lib/data/business.ts
    - lib/data/jobs.ts
    - lib/data/campaign.ts
    - lib/data/message-template.ts
    - lib/data/send-logs.ts
    - lib/data/onboarding.ts
    - lib/data/personalization.ts
    - lib/data/subscription.ts
    - lib/data/dashboard.ts
  deleted:
    - lib/data/customer.ts

key-decisions:
  - "All lib/data/ functions now accept businessId: string as first param — callers (server actions and page components) are responsible for passing a verified businessId from getActiveBusiness()"
  - "lib/data/customer.ts deleted — zero importers confirmed, getCustomersForAutocomplete() would have broken after getBusiness() signature change anyway"
  - "getJobs return type no longer includes businessId field — callers already have it, redundant to return it"
  - "getLLMUsageStats(businessId) no longer creates its own supabase client — passes businessId directly to getLLMUsage()"
  - "getDashboardCounts removes service_type_timing business query entirely — the field was selected but never used in count queries"
  - "getSetupProgress simplifies from 3 queries to 1 call — no intermediate business query needed since getChecklistState handles its own query"

patterns-established:
  - "caller-provides-businessId: Every lib/data/ function receives businessId as first param from the caller — no internal auth resolution"
  - "pk-based-single: All remaining .single() calls in lib/data/ are safe PK-based queries (.eq('id', businessId/campaignId/etc)) — no .eq('user_id', ...).single() patterns"
  - "internal-threading: When a data function calls another (e.g. getBusinessBillingInfo -> getMonthlyUsage), it passes businessId through explicitly"

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 53 Plan 01: Data Function Refactor Summary

**22 lib/data/ functions across 9 files refactored from internal user_id-based business lookup to explicit businessId parameter, eliminating the PGRST116 multi-business crash vector**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T05:06:50Z
- **Completed:** 2026-02-27T05:11:32Z
- **Tasks:** 2
- **Files modified:** 9 modified, 1 deleted

## Accomplishments
- Removed 22 instances of `.eq('user_id', user.id).single()` across all targeted lib/data/ files — the root cause of PGRST116 crashes when a user has more than one business
- All 9 lib/data/ files now compile internally with zero type errors; type errors appear only at call sites (pages, actions) as expected — these will be fixed in Plan 53-02
- Deleted lib/data/customer.ts (dead code with zero importers) to prevent future confusion

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor business.ts, jobs.ts, campaign.ts, message-template.ts** - `3652a8b` (refactor)
2. **Task 2: Refactor send-logs.ts, onboarding.ts, personalization.ts, subscription.ts, dashboard.ts; delete customer.ts** - `087c8ad` (refactor)

**Plan metadata:** (see next commit after SUMMARY.md creation)

## Files Created/Modified
- `lib/data/business.ts` - getBusiness(businessId), getEmailTemplates(businessId), getServiceTypeSettings(businessId)
- `lib/data/jobs.ts` - getJobs(businessId, options) with simplified return type, getJobCounts(businessId)
- `lib/data/campaign.ts` - getCampaigns(businessId, options)
- `lib/data/message-template.ts` - getMessageTemplates(businessId, channel), getAvailableTemplates(businessId, channel)
- `lib/data/send-logs.ts` - getSendLogs(businessId, options), getMonthlyUsage(businessId), getResponseRate(businessId), getNeedsAttentionCount(businessId), getRecentActivity(businessId, limit), getRecentActivityFull(businessId, limit)
- `lib/data/onboarding.ts` - getOnboardingStatus(businessId), getOnboardingCardStatus(businessId), getSetupProgress(businessId)
- `lib/data/personalization.ts` - getPersonalizationStats(businessId), getLLMUsageStats(businessId), getPersonalizationSummary(businessId)
- `lib/data/subscription.ts` - getSubscription(businessId), getBusinessBillingInfo(businessId) with threaded getMonthlyUsage(businessId)
- `lib/data/dashboard.ts` - getDashboardCounts(businessId) uses businessId directly, no intermediate business query
- `lib/data/customer.ts` - DELETED (dead code, zero importers)

## Decisions Made
- `getJobs` return type drops `businessId: string | null` field — callers already have it from `getActiveBusiness()`, redundant to return
- `getDashboardCounts` removes the `service_type_timing` business query entirely — that field was selected but never actually used in count queries
- `getSetupProgress` simplified from a 3-step function (auth + business query + getChecklistState) to a single `getChecklistState(businessId)` call — the intermediate business query was only needed to extract `business.id` which is now the passed parameter
- `getLLMUsageStats` no longer creates a supabase client — it passes `businessId` directly to `getLLMUsage(businessId)` which handles its own Redis lookup
- `lib/data/customer.ts` deleted rather than refactored — zero importers confirmed, and the file called `getBusiness()` with zero args (would have broken immediately)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all 22 function signatures updated cleanly with the expected call-site type errors appearing exactly where predicted.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All lib/data/ functions have the correct `(businessId: string, ...)` signatures
- Plan 53-02 can now update all call sites (server actions, layout, page components) to pass `businessId` from `getActiveBusiness()`
- Typecheck will pass once Plan 53-02 updates the ~25 call sites that currently show "Expected N arguments, but got 0" errors
- No blockers

---
*Phase: 53-data-function-refactor*
*Completed: 2026-02-27*
