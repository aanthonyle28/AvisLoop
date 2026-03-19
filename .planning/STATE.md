# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Provide home service businesses with professional websites and optional automated review management -- all managed through a single agency dashboard.
**Current focus:** v4.0 Web Design Agency Pivot -- Phase 73 (Ticket System)

## Current Position

Phase: 73 — Ticket System
Plan: 02 of 3 complete
Milestone: v4.0 Web Design Agency Pivot
Status: In progress

Last activity: 2026-03-19 — Completed 73-02-PLAN.md (Ticket UI: data layer, server actions, operator ticket management UI, /clients/[id]/tickets page)

```
[Phase 71] [Phase 72] [Phase 73] [Phase 74] [Phase 75]
    |           |           |           |           |
 COMPLETE   COMPLETE   In prog    Planned     Planned
```

## Performance Metrics

**Velocity:**
- Total plans completed (project): 264
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 2/2 (COMPLETE)
- Phase 70 plans completed: 0/3 (in progress)
- v4.0 plans completed: 6 (Phase 71-01, 71-02, 72-01, 72-02, 73-01, 73-02)

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

5. **Phase 72 (DATA-02):** `supabase/migrations/20260319000500_add_web_design_business_fields.sql`
   - Adds nullable web design columns to businesses table: owner_name, owner_email, owner_phone, web_design_tier, domain, vercel_project_url, live_website_url, status
   - Required for /clients CRM edit flow to persist changes

### Key Architecture Decisions for v4.0

- **Extend, don't replace**: businesses table gets only a client_type discriminator column; web-design-specific data lives in the new web_projects table
- **Table boundaries (revised 72-02)**: web design client contact/billing fields (owner_name, web_design_tier, domain, etc.) live on the businesses table for simpler single-row updates; web_projects holds project-specific data (project_name, page_count, project status, portal_token)
- **Atomic ticket limits**: monthly revision limit enforcement via Postgres RPC (check + insert in one transaction) -- identical pattern to campaign enrollment RPCs
- **Portal token**: 192-bit randomBytes base64url token, same pattern as /complete/[token] and /intake/[token]
- **Zero new npm packages**: react-dropzone, supabase storage, stripe all already installed

### Key Decisions (73-01)

- **Additive-only migration pattern**: Use `ADD COLUMN IF NOT EXISTS` + `CREATE OR REPLACE FUNCTION` when extending tables created in earlier migrations — never recreate
- **TicketStatus union extension**: Extended rather than replaced to maintain backwards compatibility with existing code using old status values
- **RPC author_type mapping**: `submit_ticket_with_limit_check` maps `'client_portal'` → `'client'` author_type internally to satisfy ticket_messages CHECK constraint

### Key Decisions (73-02)

- **window.location.reload() after ticket creation**: pragmatic over optimistic update — ensures server-rendered list reflects DB state without complex state management across 3 components
- **Drawer messages as prop []**: No per-drawer fetch triggered on open; messages render from page-level fetch. Sufficient for MVP, can be enhanced later
- **RPC result as data?.[0]**: supabase.rpc() return type is flexible (scalar or array); safe access pattern used in createTicket action
- **ticket-list unused props via eslint-disable**: projectDomain and subscriptionTier forwarded to TicketList for future use; linter suppressed cleanly

### Blockers/Concerns

- 4 DB migrations pending manual Supabase Dashboard SQL Editor application (see above -- Phase 71 will create additional migrations)
- 73-01 migration (20260319000600) also needs manual application
- Phase 21-08: Twilio A2P campaign approval required for production SMS testing

### Cross-Cutting Concerns

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline
- v4.0 specific: private Supabase Storage bucket for ticket attachments (signed read URLs, not public)

## Session Continuity

Last session: 2026-03-19
Stopped at: Completed 73-02-PLAN.md — ticket data layer + operator UI (TicketList, TicketDetailDrawer, NewTicketForm, /clients/[id]/tickets page)
Resume file: None
Next action: Phase 73-03 (client portal ticket view / all-tickets operator view)
