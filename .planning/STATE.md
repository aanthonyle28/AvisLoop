# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.0 Agency Mode (Phases 52-58) — Phase 53 in progress

## Current Position

Phase: 53 of 58 (Data Function Refactor) — In Progress
Plan: 1/2 in current phase
Milestone: v3.0 Agency Mode (Phases 52-58) — Phase 52 complete, Phase 53-01 complete
Status: In progress — 53-01 done, 53-02 next (update call sites)

Progress: [███░░░░░░░] ~21% (Phase 53-01 of 7 phases)

Last activity: 2026-02-27 — Completed 53-01-PLAN.md (data layer refactor)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 233
- v3.0 plans completed: 3/TBD

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

### Decisions from Phase 53-01

- All lib/data/ functions accept `businessId: string` as first param — callers (layout, server actions) are responsible for passing a verified businessId from `getActiveBusiness()`
- `getJobs` return type drops `businessId: string | null` field — callers already have it from `getActiveBusiness()`
- `getDashboardCounts` removes intermediate business query entirely — `service_type_timing` was selected but never used in count queries
- `getSetupProgress` simplified to a single `getChecklistState(businessId)` call — no intermediate business query needed
- `getLLMUsageStats` no longer creates supabase client — passes `businessId` directly to `getLLMUsage(businessId)` (Redis-based)
- `lib/data/customer.ts` deleted — zero importers confirmed; would have broken after `getBusiness()` signature change anyway
- Pattern established: all remaining `.single()` in lib/data/ are safe PK-based queries; no `.eq('user_id', ...).single()` remains outside active-business.ts

### Critical Pitfall Reminders (Phase 53-02)

- ~25 call sites in pages/actions/layout still use old 0-arg signatures — they must all be updated to pass `businessId` from `getActiveBusiness()`
- `app/(dashboard)/jobs/page.tsx` references `result.businessId` from `getJobs()` — this field no longer exists in return type; caller already has businessId
- Some pages call multiple data functions — use `Promise.all` for parallel fetching efficiency
- After 53-02, `pnpm typecheck` must pass with zero errors (not just call-site fixes)

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

Last session: 2026-02-27
Stopped at: Completed 53-01-PLAN.md — data layer refactored, 53-02 (call site updates) is next
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
