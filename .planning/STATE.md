# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-26)

**Core value:** Turn job completions into Google reviews automatically — multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.0 Agency Mode (Phases 52-58) — Phase 52 ready to plan

## Current Position

Phase: 52 of 58 (Multi-Business Foundation) — NOT STARTED
Plan: 0/TBD in current phase
Milestone: v3.0 Agency Mode (Phases 52-58) — roadmap created, ready to plan
Status: Ready to plan

Progress: [░░░░░░░░░░] 0% (Phase 52)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 230
- v3.0 plans completed: 0/TBD

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

### Critical Pitfall Reminders (Phase 53)

- 86 instances of `.eq('user_id', ...).single()` crash with PGRST116 when 2nd business exists — must enumerate exhaustively at plan time
- Dashboard redirect: "zero businesses" goes to onboarding; "no cookie but has businesses" auto-selects first (stays on dashboard)
- Onboarding upsert silently destroys first business if reused — Phase 56 must use insert-only path

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

Last session: 2026-02-26
Stopped at: v3.0 roadmap created — Phase 52 ready to plan
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
