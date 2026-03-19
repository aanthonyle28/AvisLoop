# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Provide home service businesses with professional websites and optional automated review management -- all managed through a single agency dashboard.
**Current focus:** v4.0 Web Design Agency Pivot -- Phase 72 (Web Design CRM)

## Current Position

Phase: 72 — Web Design CRM
Plan: 01 of 2 complete
Milestone: v4.0 Web Design Agency Pivot
Status: In progress — 72-01 complete, 72-02 (UI) next

Last activity: 2026-03-19 — Completed 72-01-PLAN.md (data layer: getWebDesignClients, getClientMrrSummary, updateClientDetails, /clients middleware)

```
[Phase 71] [Phase 72] [Phase 73] [Phase 74] [Phase 75]
    |           |           |           |           |
 COMPLETE   In prog    Planned     Planned     Planned
```

## Performance Metrics

**Velocity:**
- Total plans completed (project): 263
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 2/2 (COMPLETE)
- Phase 70 plans completed: 0/3 (in progress)
- v4.0 plans completed: 3 (Phase 71-01, 71-02, 72-01)

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

4. **Phase 71 (BUG-01):** `supabase/migrations/20260319000100_apply_brand_voice.sql`
   - Idempotent re-application of brand_voice column (IF NOT EXISTS)
   - Fixes onboarding error: "Could not find the 'brand_voice' column"
   - Also apply: 20260319000200_add_client_type.sql, 20260319000300_create_web_projects.sql, 20260319000400_create_ticket_tables.sql

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

Last session: 2026-03-19
Stopped at: Completed 72-01-PLAN.md — data layer for /clients (getWebDesignClients, getClientMrrSummary, updateClientDetails, middleware)
Resume file: None
Next action: Run /gsd:execute-phase 72 plan 02 (UI for /clients page)
