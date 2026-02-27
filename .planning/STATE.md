# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.0 Agency Mode (Phases 52-58) — Phase 52 in progress

## Current Position

Phase: 52 of 58 (Multi-Business Foundation) — In progress
Plan: 2/2 in current phase (52-02 complete — phase 52 complete)
Milestone: v3.0 Agency Mode (Phases 52-58) — Phase 52 complete
Status: In progress

Progress: [█░░░░░░░░░] ~3% (2 plans done)

Last activity: 2026-02-27 — Completed 52-02-PLAN.md

## Performance Metrics

**Velocity:**
- Total plans completed (project): 232
- v3.0 plans completed: 2/TBD

*Updated after each plan completion*

## Accumulated Context

### Key Architecture Decisions for v3.0

- Active business resolved via httpOnly cookie (`active_business_id`) — no URL restructuring
- `getActiveBusiness()` is the single resolution point: reads cookie, verifies ownership, falls back to first business
- Agency metadata (10 columns) added to existing `businesses` table — no new table, inherits existing RLS
- `BusinessSettingsProvider` extended with businessId, businessName, businesses[] — no prop drilling
- First-business onboarding: existing upsert path (unchanged). Additional businesses: new `createAdditionalBusiness()` insert-only path
- Cron endpoints unaffected — they use service role and query by business_id directly
- `reviews_gained` computed at read time (current - start), never stored

### Decisions from Phase 52-01

- `.limit(1)` with `data?.[0] ?? null` used in fallback query (not `.single()`) — `.single()` throws PGRST116 on 0 rows AND 2+ rows; `.limit(1)` returns empty array gracefully
- `getActiveBusiness()` MUST NOT call `cookieStore.set()` — server components cannot set cookies; only server actions can
- No `domain` attribute on business cookie — scoped to current host only (differs from Supabase auth cookie which uses `.avisloop.com`)
- `ACTIVE_BUSINESS_COOKIE` exported from `lib/data/active-business.ts` — single source of truth, imported by action module

### Decisions from Phase 52-02

- New `BusinessSettingsProvider` props (businessId, businessName, businesses) are required (not optional) — fails at compile time rather than silently passing wrong business ID at runtime
- Empty-string fallback (`businessId = business?.id ?? ''`) in layout is safe: zero-business users redirect before any code uses the ID
- `BusinessIdentity` type exported from provider — Phase 54 switcher imports from there, not redefined
- Tasks 1+2 committed together: required props in provider + layout passing them must be atomic for always-green typecheck

### Critical Pitfall Reminders (Phase 53)

- 86 instances of `.eq('user_id', ...).single()` crash with PGRST116 when 2nd business exists — must enumerate exhaustively at plan time
- Dashboard redirect: "zero businesses" goes to onboarding; "no cookie but has businesses" auto-selects first (stays on dashboard)
- Onboarding upsert silently destroys first business if reused — Phase 56 must use insert-only path
- Phase 53 template: use `getActiveBusiness()` + `Promise.all` pattern from layout.tsx as the reference

### Cross-Cutting Concerns (apply to every plan)

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

## Session Continuity

Last session: 2026-02-27T04:24:17Z
Stopped at: Completed 52-02-PLAN.md — provider extended with business identity, layout and dashboard page updated
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
