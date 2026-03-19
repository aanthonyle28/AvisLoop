---
phase: 74
plan: 02
subsystem: client-portal
tags: [portal, rate-limiting, zod, validation, upstash]
requires: [74-01]
provides: [portal-rate-limiting, portal-zod-validation]
affects: [75]
tech-stack:
  added: []
  patterns: [zod-validation, upstash-rate-limiting, ip-based-rate-limit]
key-files:
  created:
    - lib/validations/portal-ticket.ts
  modified:
    - app/api/portal/tickets/route.ts
    - lib/rate-limit.ts
decisions:
  - "Plan 01 already created app/api/portal/tickets/route.ts with manual string validation. Plan 02 replaced that with Zod (portalTicketSchema) and added Upstash rate limiting via checkPortalRateLimit."
  - "Over-limit response changed from 422 to 429: the plan spec says 429 for quota exceeded; 422 was Plan 01 deviation. Unified to 429 for both rate limit and quota exceeded."
  - "lib/rate-limit.ts: appended portalRatelimit + checkPortalRateLimit without modifying any existing exports (sendRatelimit, webhookRatelimit, authRatelimit, publicRatelimit, auditRatelimit all preserved)."
metrics:
  duration: "~10 minutes"
  completed: "2026-03-19"
---

# Phase 74 Plan 02: Portal Rate Limiting and Validation Summary

**One-liner:** Zod schema for portal ticket submission + Upstash fixedWindow rate limiting (10/min per IP) added to the POST /api/portal/tickets route.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | lib/validations/portal-ticket.ts + lib/rate-limit.ts extension | 6756c45 |
| 2 | app/api/portal/tickets/route.ts refactored to use Zod + rate limiting | 6756c45 |

## Files Created

- **`lib/validations/portal-ticket.ts`** — Zod schema `portalTicketSchema` with: token (string, min 1), title (string, min 3, max 200, trimmed), description (string, max 5000, trimmed, optional). Exports `PortalTicketInput` type.

## Files Modified

- **`lib/rate-limit.ts`** — Appended `portalRatelimit` (fixedWindow 10/min, prefix `ratelimit:portal`) and `checkPortalRateLimit(ip)`. All existing exports (sendRatelimit, webhookRatelimit, authRatelimit, publicRatelimit, auditRatelimit and their check functions) unchanged.
- **`app/api/portal/tickets/route.ts`** — Refactored validation pipeline:
  - Step 1: IP-based rate limit via `checkPortalRateLimit` → 429 if exceeded
  - Step 2: Zod parse via `portalTicketSchema.safeParse` → 400 with field message if invalid
  - Step 3: Project resolution (unchanged — service-role, .eq('portal_token', token).single())
  - Step 4: RPC `submit_ticket_with_limit_check` (unchanged)
  - Over-limit response unified to 429 (was 422 in Plan 01)

## What Plan 01 Had Already Covered

Plan 01 created the route handler with:
- Manual string validation (token non-empty, title min 3 chars)
- Project resolution via service-role
- RPC-based atomic quota enforcement
- client-portal.tsx form wiring (fetch, toast, router.refresh())
- page.tsx notFound() for invalid tokens

Plan 02 added the missing pieces:
- Zod schema (replaces manual string checks)
- Upstash rate limiting (new — not in Plan 01)
- Unified over-limit status to 429

## Rate Limit Behavior

- **Dev (no Upstash configured):** `checkPortalRateLimit` returns `{ success: true, remaining: 999 }` — graceful bypass
- **Production:** fixedWindow 10 requests per minute per IP; budget resets at the top of each minute
- **IP extraction:** `x-forwarded-for` header, first value, falls back to `'unknown'`

## Deviations from Plan

None — Plan 02 executed exactly as written.

## Next Phase Readiness

Phase 75 can proceed. The portal write path is now fully validated and rate-limited:
- Invalid tokens → 404
- Rate limit exceeded → 429 with human-readable message
- Quota exceeded → 429 with limit count in message
- Valid submission → 201 with ticketId
