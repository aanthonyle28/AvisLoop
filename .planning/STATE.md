# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.0 Agency Mode (Phases 52-58) — Phase 53 complete, Phase 54 next

## Current Position

Phase: 53 of 58 (Data Function Refactor) — COMPLETE
Plan: 2/2 in current phase
Milestone: v3.0 Agency Mode (Phases 52-58) — Phase 53 verified
Status: Phase 53 complete — ready to plan Phase 54

Progress: [███░░░░░░░] ~29% (Phase 53 of 7 phases)

Last activity: 2026-02-27 — Phase 53 verified, all must-haves passed

## Performance Metrics

**Velocity:**
- Total plans completed (project): 234
- v3.0 plans completed: 4/TBD

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
- **Phase 53 complete:** All data functions and server actions use explicit `businessId` parameter — zero PGRST116 crash risk

### Decisions from Phase 52-01

- `.limit(1)` with `data?.[0] ?? null` used in fallback query (not `.single()`) — `.single()` throws PGRST116 on 0 rows AND 2+ rows; `.limit(1)` returns empty array gracefully
- `getActiveBusiness()` MUST NOT call `cookieStore.set()` — server components cannot set cookies; only server actions can
- No `domain` attribute on business cookie — scoped to current host only (differs from Supabase auth cookie which uses `.avisloop.com`)
- `ACTIVE_BUSINESS_COOKIE` exported from `lib/data/active-business.ts` — single source of truth, imported by action module

### Decisions from Phase 52-02

- New `BusinessSettingsProvider` props (businessId, businessName, businesses) are required (not optional) — fails at compile time rather than silently passing wrong business ID at runtime
- Empty-string fallback (`businessId = business?.id ?? ''`) in layout is safe: zero-business users redirect before any code uses the ID
- `BusinessIdentity` type exported from provider — Phase 54 switcher imports from there, not redefined

### Decisions from Phase 53

- All lib/data/ functions accept `businessId: string` as first param — callers responsible for passing verified businessId
- All lib/actions/ functions call `getActiveBusiness()` at top — no manual `.eq('user_id', ...).single()` business lookup
- All page Server Components call `getActiveBusiness()` once and thread `business.id` to data functions
- `getJobs` return type drops `businessId` field — callers already have it
- `getDashboardCounts` uses businessId directly without intermediate query
- `getSetupProgress` simplified to single `getChecklistState(businessId)` call
- `lib/data/customer.ts` deleted — dead code with zero importers
- Onboarding page handles null business: `getActiveBusiness()` may return null for new users
- Billing actions keep `getUser()` for email (Stripe) but use `getActiveBusiness()` for business
- Safe patterns left unchanged: `retrySend`, `acknowledgeAlert`, `dismissFeedbackAlert` (ownership via entity PK)

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
Stopped at: Phase 53 complete and verified — ready to plan Phase 54 (Business Switcher UI)
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
