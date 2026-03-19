---
phase: 73-ticket-system
plan: 01
subsystem: database
tags: [postgres, supabase, rpc, rls, typescript, tickets]

requires:
  - phase: 71-web-design-foundation
    provides: web_projects table and WebProject type that tickets FK into
  - phase: 72-web-design-crm
    provides: web design client management context and businesses.web_design_tier

provides:
  - Additive migration (20260319000600) adding overage_fee + completed_at columns, status index, and atomic submit_ticket_with_limit_check RPC
  - REVISION_LIMITS constants (basic: 2, advanced: 4) in lib/constants/tickets.ts
  - TicketWithMessages and TicketWithContext composite TypeScript types
  - overage_fee field on ProjectTicket type

affects:
  - 73-02 (data functions calling submit_ticket_with_limit_check)
  - 73-03 (UI consuming TicketWithMessages, TicketWithContext)
  - 74 (client portal Route Handler calling the RPC with service-role client)

tech-stack:
  added: []
  patterns:
    - "Atomic RPC with FOR UPDATE row lock for concurrent limit enforcement (same pattern as claim_due_campaign_touches)"
    - "SECURITY DEFINER + SET search_path = public to prevent search_path injection in RPCs"
    - "p_source → author_type mapping inside RPC ('client_portal' → 'client') to match ticket_messages CHECK constraint"

key-files:
  created:
    - supabase/migrations/20260319000600_add_ticket_rpc.sql
    - lib/constants/tickets.ts
  modified:
    - lib/types/database.ts

key-decisions:
  - "Additive-only migration: existing tables from 20260319000400 preserved; only ADD COLUMN IF NOT EXISTS and CREATE OR REPLACE FUNCTION used"
  - "TicketStatus union extended to include both legacy ('open','waiting_client','resolved','closed') and new ('submitted','completed') values for backwards compatibility during migration window"
  - "REVISION_LIMITS uses Record<string,number> (not Record<WebDesignTier,number>) to avoid import dependency; DEFAULT_REVISION_LIMIT set to basic value"
  - "RPC maps 'client_portal' source to 'client' author_type internally to satisfy ticket_messages CHECK constraint"

patterns-established:
  - "Ticket limit enforcement: always call submit_ticket_with_limit_check RPC rather than app-level count+insert — ensures atomicity"
  - "REVISION_LIMITS is the single source of truth — never hardcode 2 or 4 in components"

duration: 12min
completed: 2026-03-19
---

# Phase 73 Plan 01: Ticket System — Data Layer Summary

**Atomic submit_ticket_with_limit_check Postgres RPC with FOR UPDATE lock, REVISION_LIMITS constants, and composite ticket TypeScript types**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-19T00:00:00Z
- **Completed:** 2026-03-19T00:12:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created additive migration (20260319000600) that adds `overage_fee` + `completed_at` columns to project_tickets, a status index for the operator CRM view, and the `submit_ticket_with_limit_check` SECURITY DEFINER RPC
- Created `lib/constants/tickets.ts` with REVISION_LIMITS (basic: 2, advanced: 4), OVERAGE_FEE_USD, and DEFAULT_REVISION_LIMIT as the single source of truth
- Extended TypeScript types: added `overage_fee` and `completed_at` to ProjectTicket, extended TicketStatus union for both legacy and new values, added TicketWithMessages and TicketWithContext composite types

## Task Commits

Both tasks combined into one atomic commit:

1. **Task 1: Migration + RPC** — `934bc3f` (feat)
2. **Task 2: Types + constants** — `934bc3f` (feat, combined)

**Note:** Tasks 1 and 2 were committed together as they are tightly coupled (RPC SQL and TypeScript types must be consistent).

## Files Created/Modified

- `supabase/migrations/20260319000600_add_ticket_rpc.sql` — Adds overage_fee/completed_at columns, status index, and atomic submit_ticket_with_limit_check RPC
- `lib/constants/tickets.ts` — REVISION_LIMITS, OVERAGE_FEE_USD, DEFAULT_REVISION_LIMIT constants
- `lib/types/database.ts` — Added overage_fee/completed_at to ProjectTicket, extended TicketStatus, added TicketWithMessages/TicketWithContext composite types

## Decisions Made

- **Additive-only migration**: Did not recreate existing tables from 20260319000400. Used `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` to avoid conflicts with already-deployed schema.
- **TicketStatus union extended**: Added `'submitted'` and `'completed'` to the existing union (which had `'open'`, `'waiting_client'`, `'resolved'`, `'closed'`) rather than replacing it. This ensures no type errors in any existing code that uses the old values, while enabling new code to use the simplified status model.
- **RPC handles author_type mapping internally**: The `p_source` parameter (`'agency'` | `'client_portal'`) is mapped to `author_type` (`'agency'` | `'client'`) inside the RPC to satisfy the `ticket_messages` CHECK constraint. Caller passes source, RPC handles the detail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Extended TicketStatus union instead of replacing it**

- **Found during:** Task 2 (types update)
- **Issue:** Plan specified `TicketStatus = 'submitted' | 'in_progress' | 'completed'` but existing type was `'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed'`. Replacing would break any existing code using those values.
- **Fix:** Extended the union to include both sets: `'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed' | 'submitted' | 'completed'`
- **Files modified:** lib/types/database.ts
- **Verification:** pnpm typecheck passes with zero errors
- **Committed in:** 934bc3f

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug prevention via backwards-compatible union extension)
**Impact on plan:** No scope creep. Fix required to prevent TypeScript errors in existing code.

## Issues Encountered

Pre-existing lint errors exist in `e2e/tests/12-ai-cron-send.spec.ts` and `e2e/tests/ai-brand-voice-test.ts` (6 errors total: unused vars and explicit `any`). These are not caused by this plan — confirmed by stashing changes and verifying errors exist in baseline. No new lint errors introduced.

## User Setup Required

Apply migration via Supabase Dashboard SQL Editor:

```sql
-- Apply: supabase/migrations/20260319000600_add_ticket_rpc.sql
```

This migration is idempotent: `ADD COLUMN IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` are safe to re-run.

## Next Phase Readiness

- Atomic RPC ready for Plan 02 (data functions: createTicket, getTickets, updateTicketStatus)
- REVISION_LIMITS constant ready for import in data functions and UI components
- TicketWithMessages and TicketWithContext types ready for Plan 03 UI components
- No blockers

---
*Phase: 73-ticket-system*
*Completed: 2026-03-19*
