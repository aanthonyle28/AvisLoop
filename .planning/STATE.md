# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Provide home service businesses with professional websites and optional automated review management -- all managed through a single agency dashboard.
**Current focus:** v4.0 Web Design Agency Pivot -- Phase 71 (Bug Fix + Data Model)

## Current Position

Phase: 71 — Bug Fix + Data Model
Plan: Not started
Milestone: v4.0 Web Design Agency Pivot
Status: Roadmap defined, ready to plan Phase 71

Last activity: 2026-03-18 — Roadmap created for v4.0

```
[Phase 71] [Phase 72] [Phase 73] [Phase 74] [Phase 75]
    |           |           |           |           |
 Next up    Planned    Planned     Planned     Planned
```

## Performance Metrics

**Velocity:**
- Total plans completed (project): 261
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 2/2 (COMPLETE)
- Phase 70 plans completed: 0/3 (in progress)
- v4.0 plans completed: 0

*Updated after each plan completion*

## Accumulated Context

### Pending Todos (MANUAL - DB MIGRATIONS)

Four idempotent migrations must be applied via Supabase Dashboard SQL Editor:

1. **Phase 68:** `supabase/migrations/20260303_apply_frozen_enrollment_status.sql`
   - Adds 'frozen' to campaign_enrollments status check constraint

2. **Phase 69:** `supabase/migrations/20260304_add_software_used_column.sql`
   - Adds software_used column to businesses table

3. **Phase 70:** `supabase/migrations/20260306_audit_tables.sql`
   - Creates audit_reports and audit_leads tables with RLS + anon GRANTs

4. **Pre-v4.0 (Phase 71 includes this):** `supabase/migrations/20260305000100_add_brand_voice.sql`
   - Adds brand_voice column to businesses table
   - Required to fix onboarding error: "Could not find the 'brand_voice' column"
   - BUG-01 in Phase 71 covers this

### Key Architecture Decisions for v4.0

- **Extend, don't replace**: businesses table gets only a client_type discriminator column; web-design-specific data lives in the new web_projects table
- **Table boundaries (hold the line)**: web_projects holds domain, tier, billing, portal_token; businesses table gets only client_type
- **Atomic ticket limits**: monthly revision limit enforcement via Postgres RPC (check + insert in one transaction) -- identical pattern to campaign enrollment RPCs
- **Portal token**: 192-bit randomBytes base64url token, same pattern as /complete/[token] and /intake/[token]
- **Zero new npm packages**: react-dropzone, supabase storage, stripe all already installed

### Blockers/Concerns

- 4 DB migrations pending manual Supabase Dashboard SQL Editor application (see above -- Phase 71 will create additional migrations)
- Phase 21-08: Twilio A2P campaign approval required for production SMS testing

### Cross-Cutting Concerns

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline
- v4.0 specific: private Supabase Storage bucket for ticket attachments (signed read URLs, not public)

## Session Continuity

Last session: 2026-03-18
Stopped at: Roadmap created for v4.0 -- ready to plan Phase 71
Resume file: None
Next action: Run /gsd:plan-phase 71
