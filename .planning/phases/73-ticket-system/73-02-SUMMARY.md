---
phase: 73-ticket-system
plan: 02
subsystem: ui
tags: [react, nextjs, supabase, tickets, sheet, radix, server-actions, rpc]

requires:
  - phase: 73-01
    provides: submit_ticket_with_limit_check RPC, REVISION_LIMITS constants, TicketWithMessages/TicketWithContext types
  - phase: 72-web-design-crm
    provides: /clients page and web_projects table that tickets nest under
  - phase: 71-web-design-foundation
    provides: web_projects.subscription_tier and WebProject type

provides:
  - getProjectTickets, getTicketWithMessages, getMonthlyTicketCount, getTicketsAcrossAllProjects data functions
  - createTicket (calls submit_ticket_with_limit_check RPC), updateTicketStatus, addAgencyMessage, updateInternalNotes server actions
  - TicketList component with Radix Select filter and quota display
  - TicketDetailDrawer with agency/client message thread, status toggle, auto-save notes
  - NewTicketForm with overage confirmation gate and $50 overage button
  - TicketsPageClient orchestrator
  - /clients/[id]/tickets Server Component page + loading.tsx

affects:
  - 73-03 (client portal ticket submission — shares data layer, TicketWithMessages type)
  - 74 (portal Route Handler calls same RPC with service-role client)

tech-stack:
  added: []
  patterns:
    - "ARCH-002 caller-provides-businessId in all data functions (projectId + businessId always explicit)"
    - "RPC result array access: data?.[0] fallback for supabase.rpc() which may return scalar or array"
    - "Overage confirmation gate: isAtLimit + overageConfirmed checkbox controls button disabled/amber state"
    - "Fire-and-forget notes auto-save: updateInternalNotes called from 500ms debounce, no revalidatePath needed"
    - "window.location.reload() after ticket creation until server mutation returns fresh list (pragmatic for SPA)"

key-files:
  created:
    - lib/data/tickets.ts
    - lib/actions/ticket.ts
    - components/tickets/ticket-list.tsx
    - components/tickets/ticket-detail-drawer.tsx
    - components/tickets/new-ticket-form.tsx
    - components/tickets/tickets-page-client.tsx
    - app/(dashboard)/clients/[id]/tickets/page.tsx
    - app/(dashboard)/clients/[id]/tickets/loading.tsx
  modified: []

key-decisions:
  - "TicketsPageClient uses window.location.reload() after ticket creation — pragmatic choice over optimistic update to ensure server-rendered list reflects DB state"
  - "drawer messages passed as prop (empty []) — no server fetch triggered on drawer open; messages render from whatever was last fetched at page level"
  - "newTicketForm monthlyCount is local state that updates optimistically; RPC provides ground truth on over_limit"
  - "RPC result accessed as data?.[0] with Array.isArray guard — supabase.rpc() return type is flexible"

patterns-established:
  - "Ticket limit enforcement flows: UI shows quota → form submits with isOverage flag → RPC enforces atomically — no client-side count-then-insert"
  - "Status toggle pattern matches job status toggles (Phase 62): three Button components, active=default, others=outline"
  - "overage badge: small amber rounded-full pill rendered inline next to ticket title in list rows"

duration: 6min
completed: 2026-03-19
---

# Phase 73 Plan 02: Ticket System — Data Layer and Operator UI Summary

**Ticket management data layer (getProjectTickets, createTicket via atomic RPC, updateTicketStatus) and operator UI (filterable list, message-thread drawer with agency/client bubble alignment, overage-gated new-ticket form) at /clients/[id]/tickets**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T05:36:01Z
- **Completed:** 2026-03-19T05:41:45Z
- **Tasks:** 2
- **Files modified:** 8 created

## Accomplishments

- Created full data layer: `getProjectTickets`, `getTicketWithMessages`, `getMonthlyTicketCount`, `getTicketsAcrossAllProjects` in `lib/data/tickets.ts` — all follow ARCH-002 caller-provides-businessId pattern
- Created server actions in `lib/actions/ticket.ts`: `createTicket` calls the `submit_ticket_with_limit_check` RPC atomically; `updateTicketStatus` sets `completed_at` on status transition; `addAgencyMessage` and `updateInternalNotes` handle the message thread and private notes
- Built three ticket UI components: `TicketList` with Radix Select status filter + quota progress display + overage badges; `TicketDetailDrawer` with left/right message bubbles (agency right, client left), status toggle buttons, and auto-save internal notes; `NewTicketForm` with overage alert + checkbox gate + amber submit button
- Wired everything into a Server Component page at `/clients/[id]/tickets` that fetches project + tickets + monthly count in parallel and computes `monthlyLimit` from `REVISION_LIMITS`

## Task Commits

1. **Task 1: Data functions and server actions** — `afdf702` (feat)
2. **Task 2: UI components and page** — `46d78eb` (feat)

## Files Created/Modified

- `lib/data/tickets.ts` — Four data query functions with businessId scoping and RLS compliance
- `lib/actions/ticket.ts` — Four server actions (createTicket/updateTicketStatus/addAgencyMessage/updateInternalNotes)
- `components/tickets/ticket-list.tsx` — Filterable ticket table with quota indicator and overage badges
- `components/tickets/ticket-detail-drawer.tsx` — Message thread drawer with status toggle and auto-save notes
- `components/tickets/new-ticket-form.tsx` — Overage-gated form sheet
- `components/tickets/tickets-page-client.tsx` — State orchestrator for all three sub-components
- `app/(dashboard)/clients/[id]/tickets/page.tsx` — Server Component with parallel data fetching
- `app/(dashboard)/clients/[id]/tickets/loading.tsx` — Skeleton loading state

## Decisions Made

- `window.location.reload()` after ticket creation: pragmatic choice to trigger Next.js revalidation and get fresh server-rendered list rather than maintaining complex optimistic state across three components.
- Drawer messages passed as empty array `[]` on open: the detail drawer shows messages from the last server fetch. For MVP, full thread is visible when page data loads. Future enhancement can add a per-drawer fetch.
- `monthlyCount` is local state in `TicketsPageClient` that optimistically decrements on non-overage ticket creation — the RPC provides the ground truth if a race condition occurs.
- `middleware.ts` already had `/clients` in `APP_ROUTES` (added in Phase 72) — no changes needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type cast in getTicketsAcrossAllProjects**

- **Found during:** Task 1 (typecheck run)
- **Issue:** Casting `Record<string, unknown>` directly to `ProjectTicket` failed tsc — the two types don't overlap enough for a simple cast
- **Fix:** Defined inline `RawRow` type as `ProjectTicket & { project: ... | null; business: ... | null }`, cast `row as RawRow` then spread into `TicketWithContext`
- **Files modified:** lib/data/tickets.ts
- **Verification:** `pnpm typecheck` passes with zero errors
- **Committed in:** afdf702

---

**Total deviations:** 1 auto-fixed (Rule 1 — type safety fix)
**Impact on plan:** No scope creep. Fix required for TypeScript correctness.

## Issues Encountered

Pre-existing lint errors in `e2e/tests/12-ai-cron-send.spec.ts` and `e2e/tests/ai-brand-voice-test.ts` (6 errors: unused vars, explicit any). Confirmed pre-existing by running lint against only the new files — zero errors. Documented in 73-01-SUMMARY.md as well.

## User Setup Required

None — no new external services, migrations, or environment variables required for this plan. The RPC and tables were created in Plan 73-01.

## Next Phase Readiness

- Operator-side ticket UI complete: list, drawer, create form all functional
- `getTicketsAcrossAllProjects()` ready for Plan 73-03's all-tickets view
- `TicketWithMessages` and `TicketWithContext` types consumed correctly
- Data layer ready for Plan 74 (client portal calls same RPC with service-role client)
- No blockers

---
*Phase: 73-ticket-system*
*Completed: 2026-03-19*
