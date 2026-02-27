---
phase: 51-audit-remediation
plan: "03"
subsystem: ui
tags: [typescript, history, send-logs, type-migration, dead-code, supabase]

# Dependency graph
requires:
  - phase: 51-audit-remediation/51-01
    provides: page spacing, skeleton patterns, accessibility fixes across dashboard pages
  - phase: 51-audit-remediation/51-02
    provides: security, validation, type correctness for settings/campaigns/jobs modules
provides:
  - Complete type migration: SendLogWithContact removed, SendLogWithCustomer is the canonical type
  - Cooldown anchor fixed to use customers.last_sent_at (accurate) instead of request.created_at
  - No-op Cancel Message section removed from RequestDetailDrawer
  - Send History heading upgraded to text-3xl font-bold (page-level consistency)
  - EmptyState backward-compat alias removed; HistoryEmptyState is canonical export
  - custom_service_names typed as string[] | null (matches real DB nullable)
affects:
  - any future plan touching history module or send-logs data layer
  - any component consuming SendLogWithCustomer type (now includes last_sent_at)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SendLogWithCustomer: the canonical joined type — includes name, email, last_sent_at from customers"
    - "Customers Pick in joined types: extend to include last_sent_at for cooldown calculations"
    - "Stub UI pattern: remove no-op buttons, replace with TODO comment until server-side implemented"

key-files:
  created: []
  modified:
    - lib/types/database.ts
    - lib/data/send-logs.ts
    - components/history/history-client.tsx
    - components/history/history-table.tsx
    - components/history/request-detail-drawer.tsx
    - components/history/empty-state.tsx

key-decisions:
  - "Extend SendLogWithCustomer to include last_sent_at rather than a separate type — keeps the interface minimal"
  - "Remove stub Cancel button (F-04) entirely rather than disable — misleading UI is worse than missing feature"
  - "custom_service_names typed string[] | null — all consumers already use || [] defensively, no cascading changes needed"
  - "F-08 deferred: RESENDABLE_STATUSES export is used by history-table.tsx — not dead code, finding was incorrect"

patterns-established:
  - "Dead export cleanup: always grep consumers before removing an export"
  - "Cooldown calculation: anchor to customers.last_sent_at with fallback to created_at if null"

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 51 Plan 03: History Type Migration, UI Correctness, and Dead Code Cleanup Summary

**Coordinated migration retiring SendLogWithContact across 6 files, cooldown now anchored to customers.last_sent_at, and no-op Cancel button removed with TODO comment**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-27T00:57:49Z
- **Completed:** 2026-02-27T01:00:35Z
- **Tasks:** 2 (committed together as one coordinated migration)
- **Files modified:** 6

## Accomplishments
- Zero `SendLogWithContact` references remain in the codebase — fully migrated to `SendLogWithCustomer`
- Cooldown calculation in request detail drawer now uses `customers.last_sent_at` (accurate) with fallback to `created_at` instead of always using `created_at` (wrong anchor)
- Removed the entire stub Cancel Message section — it rendered a destructive button that silently just closed the drawer, replaced with a TODO comment for future server-side implementation
- Cleaned up all related dead code: `isCanceling` state, `handleCancel` function, `canCancel` const, `onCancel` prop from interface and all callers
- `SendLogWithCustomer` type now includes `last_sent_at` in its customers Pick; queries updated to select it
- `custom_service_names` typed `string[] | null` to match actual DB nullable — consumers already used `|| []` defensively

## Task Commits

Both tasks executed as one atomic coordinated migration (all files changed together to allow deprecated alias removal):

1. **Tasks 1+2: Type migration + UI correctness + dead code cleanup** - `4c3c22f` (refactor)

## Files Created/Modified
- `lib/types/database.ts` - Removed deprecated SendLogWithContact alias; extended SendLogWithCustomer to include last_sent_at; fixed custom_service_names to string[] | null
- `lib/data/send-logs.ts` - Migrated to SendLogWithCustomer; updated both query selects to include last_sent_at from customers join
- `components/history/history-client.tsx` - Migrated to SendLogWithCustomer; updated import to HistoryEmptyState; upgraded heading to text-3xl font-bold; removed onCancel prop usage
- `components/history/history-table.tsx` - Migrated to SendLogWithCustomer in type import and all prop types
- `components/history/request-detail-drawer.tsx` - Migrated to SendLogWithCustomer; fixed cooldown to use last_sent_at; removed stub Cancel section + all related dead code; removed X icon import (was only used by cancel button)
- `components/history/empty-state.tsx` - Removed backward-compat EmptyState alias export

## Decisions Made
- Removed the `onCancel` prop entirely rather than keeping it as a no-op — the drawer doesn't need to accept callbacks for unimplemented functionality. Future implementation will add the prop back when server-side cancellation exists.
- F-08 (RESENDABLE_STATUSES export) confirmed deferred: `history-table.tsx` imports the constant from `history-columns.tsx` — removing the export would break the build. The finding's suggestion to make it "module-private" was incorrect since they are separate TS modules.
- Committed Tasks 1 and 2 together as one atomic commit because they form a single coordinated migration — Task 2's type changes in the drawer required Task 1's type changes to be in place simultaneously.

## Deviations from Plan

None — plan executed exactly as written. F-08 deferral was pre-documented in the plan frontmatter.

## Issues Encountered

None. All 9 targeted findings resolved cleanly. `pnpm typecheck` and `pnpm lint` both pass with zero errors.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 51 is now complete (3/3 plans done). All 44+ findings from the code review audit (phases 50-51) have been resolved or intentionally deferred with documented rationale:

**Deferred (documented):**
- F-08: RESENDABLE_STATUSES export IS used — finding was incorrect, no action needed
- F-14: Brand logo needs custom SVG design decision, not a code fix
- F-44-05: Sequential conflict queries — acceptable at current volume
- F-44-08: CRM brand colors are acceptable exceptions to semantic tokens
- F-44-09: saveSoftwareUsed V1-era naming — rename in future cleanup phase

**Ready for next milestone:** v3.0 Agency Mode (Phase 52+)

---
*Phase: 51-audit-remediation*
*Completed: 2026-02-27*
