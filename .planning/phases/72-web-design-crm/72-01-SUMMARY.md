---
phase: 72-web-design-crm
plan: 01
subsystem: database
tags: [supabase, typescript, zod, server-actions, data-layer, web-design-crm]

# Dependency graph
requires:
  - phase: 71-bug-fix-data-model
    provides: web_projects, project_tickets tables + WebProject/ProjectTicket TypeScript types + client_type on businesses
provides:
  - getWebDesignClients() — businesses filtered to web_design/both with web_projects join and monthly revision count
  - getClientMrrSummary() — sum of monthly_fee for active web design clients
  - updateClientDetails() — server action with Zod validation persisting CRM editable fields to businesses table
  - /clients added to middleware APP_ROUTES (auth-protected)
affects: [72-02, 73-client-portal, 74-ticket-system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "server-only import at top of all lib/data/ modules"
    - "Two-query join pattern: main query + separate ticket count query with businessId IN (...)"
    - "Build Map of businessId -> count after second query, attach to results"
    - "clientUpdateSchema with .or(z.literal('')) for URL/email fields to allow clearing"

key-files:
  created:
    - lib/data/clients.ts
    - lib/actions/client.ts
    - lib/validations/client.ts
  modified:
    - middleware.ts

key-decisions:
  - "Revision count fetched in a separate query (not nested select) to avoid Supabase PostgREST aggregation complexity"
  - "web_projects array from nested select: take index [0] or null — one project per business in v4.0"
  - "WebDesignClient extends Business (not a separate type) to reuse all existing Business fields without duplication"
  - "status field in web_project cast to WebProjectStatus to satisfy Pick<WebProject, 'status'> constraint"

patterns-established:
  - "CRM data layer pattern: getWebDesignClients returns Business + nested join + computed count in one call"
  - "Parallel fetch pattern: getWebDesignClients() and getClientMrrSummary() are separate exports so /clients page can Promise.all them"

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 72 Plan 01: Web Design CRM Data Layer Summary

**Server-only data layer for /clients page: getWebDesignClients() with web_projects join and monthly revision counts, getClientMrrSummary() for MRR, updateClientDetails() server action with Zod, and /clients added to middleware auth protection**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-19T05:20:26Z
- **Completed:** 2026-03-19T05:21:57Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `getWebDesignClients()` — queries businesses filtered to `client_type IN ('web_design', 'both')`, joins `web_projects(*)`, fetches monthly revision ticket counts in a second query, and assembles typed `WebDesignClient[]`
- `getClientMrrSummary()` — aggregates `monthly_fee` across active web design clients; exported separately for parallel fetching
- `updateClientDetails()` — server action with auth check, businessId validation, Zod safeParse (9 editable fields), Supabase `.update()`, and `revalidatePath('/clients')`
- `/clients` added to `APP_ROUTES` in middleware, making it auth-protected with unauthenticated redirect to `/login`

## Task Commits

Each task was committed atomically:

1. **Tasks 1 + 2: Data layer + validation + action + middleware** - `23f1ddf` (feat)

**Plan metadata:** (included in same commit per plan spec)

## Files Created/Modified
- `lib/data/clients.ts` — `WebDesignClient` type, `getWebDesignClients()`, `getClientMrrSummary()`; `import 'server-only'`
- `lib/validations/client.ts` — `clientUpdateSchema` (9 fields), `ClientUpdateInput` type
- `lib/actions/client.ts` — `updateClientDetails()` with `'use server'`, Zod validation, `revalidatePath('/clients')`
- `middleware.ts` — `"/clients"` added to `APP_ROUTES` array

## Decisions Made
- Used two-query pattern (businesses then project_tickets) instead of nested aggregation — PostgREST doesn't support COUNT in nested selects cleanly
- `WebDesignClient extends Business` avoids duplicating 30+ Business fields in a parallel interface
- `web_project` typed as `Pick<WebProject, ...>` to ensure only the fields consumed by the UI are present, reducing accidental coupling
- Cast `rawProject.status as WebProjectStatus` to satisfy TypeScript's structural check against the Pick type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error: `status: string` not assignable to `WebProjectStatus`**
- **Found during:** Task 1 — typecheck after file creation
- **Issue:** Raw Supabase result types `status` as `string`; the `Pick<WebProject, 'status'>` constraint requires the `WebProjectStatus` union type
- **Fix:** Imported `WebProjectStatus` from `@/lib/types/database` and cast `rawProject.status as WebProjectStatus`
- **Files modified:** `lib/data/clients.ts`
- **Verification:** `pnpm typecheck` passed with zero errors
- **Committed in:** `23f1ddf`

---

**Total deviations:** 1 auto-fixed (type cast required by TypeScript's structural narrowing)
**Impact on plan:** Necessary fix for correctness, no scope change.

## Issues Encountered
- Pre-existing lint errors in `e2e/tests/` files (unused vars, explicit any) — not introduced by this plan, confirmed via `git status`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer complete; 72-02 (UI plan) can import `getWebDesignClients`, `getClientMrrSummary`, `updateClientDetails`, and `WebDesignClient` type
- DB migrations for web_projects and project_tickets tables still require manual Supabase Dashboard application (tracked in STATE.md)

---
*Phase: 72-web-design-crm*
*Completed: 2026-03-19*
