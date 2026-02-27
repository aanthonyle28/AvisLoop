---
phase: 52-multi-business-foundation
plan: "01"
subsystem: api
tags: [supabase, cookies, next-server-actions, multi-business, business-switcher]

# Dependency graph
requires: []
provides:
  - "getActiveBusiness() — cookie-based business resolver, falls back to first business by created_at"
  - "getUserBusinesses() — array of {id, name} for all businesses the user owns"
  - "switchBusiness() — server action that sets httpOnly cookie and triggers revalidatePath"
  - "ACTIVE_BUSINESS_COOKIE — shared constant for cookie name, prevents duplication"
affects:
  - 52-multi-business-foundation (plans 02+)
  - 53-business-resolver-migration
  - phase-52-layout
  - BusinessSettingsProvider

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cookie-based active business resolution with ownership verification and fallback"
    - ".limit(1) with data?.[0] array access for safe zero-row Supabase queries (avoids PGRST116)"
    - "ACTIVE_BUSINESS_COOKIE constant exported from data module, imported by action module"

key-files:
  created:
    - lib/data/active-business.ts
    - lib/actions/active-business.ts
  modified: []

key-decisions:
  - "Use .limit(1) with array access in fallback query (NOT .single()) — .single() throws PGRST116 on zero rows AND multiple rows"
  - "Do NOT set cookie in getActiveBusiness() — server components cannot set cookies, only server actions can"
  - "No domain attribute on business cookie — scoped to current host only (unlike Supabase auth cookie which uses .avisloop.com for cross-subdomain SSO)"
  - "switchBusiness() verifies ownership before setting cookie — security guard against cookie stuffing"
  - "revalidatePath('/', 'layout') called after cookie set — triggers full layout re-render so all pages see new business context immediately"
  - "ACTIVE_BUSINESS_COOKIE exported from data module so actions module imports it rather than duplicating the string"

patterns-established:
  - "Safe multi-row Supabase query pattern: .limit(1) + data?.[0] ?? null instead of .single()"
  - "Server action ownership verification pattern: auth check → ownership check → mutation"

# Metrics
duration: 2min
completed: "2026-02-27"
---

# Phase 52 Plan 01: Active Business Resolver Summary

**Cookie-based active-business resolution via getActiveBusiness() with .limit(1) fallback, switchBusiness() server action with ownership verification, and getUserBusinesses() multi-business query**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-27T04:18:24Z
- **Completed:** 2026-02-27T04:19:37Z
- **Tasks:** 2
- **Files modified:** 2 (both new)

## Accomplishments

- Created the single canonical resolution point for "which business is active" — all v3.0 phases will consume this instead of `.single()` calls that crash with multiple businesses
- `getActiveBusiness()` handles all four cases: valid cookie, invalid/stale cookie (falls through to fallback), missing cookie (fallback), zero businesses (returns null)
- `switchBusiness()` validates auth and ownership before setting the httpOnly cookie, preventing unauthorized business access

## Task Commits

Each task was committed atomically:

1. **Task 1: Create getActiveBusiness() resolver and getUserBusinesses() query** - `e174c82` (feat)
2. **Task 2: Create switchBusiness() server action** - `332b12a` (feat)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified

- `lib/data/active-business.ts` — Exports `getActiveBusiness()`, `getUserBusinesses()`, `ACTIVE_BUSINESS_COOKIE`; reads cookie, verifies ownership, falls back to `.limit(1)` query
- `lib/actions/active-business.ts` — Exports `switchBusiness()`; validates auth + ownership, sets httpOnly cookie, calls `revalidatePath('/', 'layout')`

## Decisions Made

- `.limit(1)` with `data?.[0] ?? null` used in fallback query (not `.single()`) — `.single()` throws PGRST116 on 0 rows AND on 2+ rows; `.limit(1)` returns empty array gracefully for zero-business users
- Server components cannot set cookies, so `getActiveBusiness()` has no `cookieStore.set()` — only the `switchBusiness()` server action sets cookies
- No `domain` attribute on the business cookie — scoped to current host only; differs from Supabase auth cookie which uses `.avisloop.com` cross-subdomain domain
- `.single()` is correct in `switchBusiness()` ownership check — querying by PK with user filter always returns 0 or 1 rows, and PGRST116 on 0 rows is the desired "not found" behavior
- `ACTIVE_BUSINESS_COOKIE` exported from the data module and imported by the action module — single source of truth for the cookie name

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `getActiveBusiness()` and `switchBusiness()` are ready for consumption by Phase 52 plan 02+ and Phase 53
- Downstream plans should import from `@/lib/data/active-business` (data) and `@/lib/actions/active-business` (action)
- Phase 53 migration (replacing `.eq('user_id', ...).single()` with `getActiveBusiness()`) can proceed immediately
- No blockers

---
*Phase: 52-multi-business-foundation*
*Completed: 2026-02-27*
