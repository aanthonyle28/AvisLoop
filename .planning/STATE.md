# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** Provide home service businesses with professional websites and optional automated review management -- all managed through a single agency dashboard.
**Current focus:** v4.0 Web Design Agency Pivot -- Phase 76 (V4 Design System Rollout)

## Current Position

Phase: 76 — V4 Design System Rollout
Plan: 03 of 6 complete
Milestone: v4.0 Web Design Agency Pivot
Status: In progress

Last activity: 2026-03-19 — Completed 76-03-PLAN.md (redesigned /reputation with V4 design language, preserved all SEO)

```
[Phase 71] [Phase 72] [Phase 73] [Phase 74] [Phase 75] [Phase 76]
    |           |           |           |           |       |
 COMPLETE   COMPLETE   COMPLETE   COMPLETE   COMPLETE   01-02-03 done
```

## Performance Metrics

**Velocity:**
- Total plans completed (project): 265
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 2/2 (COMPLETE)
- Phase 70 plans completed: 0/3 (in progress)
- v4.0 plans completed: 14 (Phase 71-01, 71-02, 72-01, 72-02, 73-01, 73-02, 73-03, 74-01, 74-02, 75-01, 75-02, 76-01, 76-02, 76-03)

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

### Key Decisions (73-03)

- **Signed URL upload pattern**: `POST /api/tickets/upload-url` issues a 60s signed upload URL; browser PUTs file directly to Supabase Storage — bypasses Next.js 1MB body limit
- **Pre-generate 1-year read URL**: stored in `ticket_messages.attachment_urls` at upload time, no re-signing needed on view
- **All-tickets client-side filtering**: capped at 200 results, instant client filter changes without server round-trips
- **Supabase Storage bucket `revision-attachments` requires manual creation**: private bucket, 10MB limit, allowed MIME types — must be created in Supabase Dashboard before attachments work

### Key Decisions (74-01)

- **Route Handler for portal ticket submission**: `POST /api/portal/tickets` uses service-role — server actions require authenticated React context; Route Handler is correct for unauthenticated writes
- **e2e/** added to ESLint ignores**: pre-existing lint errors in untracked e2e test files blocked pnpm lint; e2e/** excluded consistently with qa-scripts/**
- **PortalQuota counts all tickets (not just non-overage)**: portal shows total usage for full client visibility, unlike operator getMonthlyTicketCount which excludes overage tickets
- **`any` casts for ungenerated Supabase types**: web_projects and project_tickets not yet in db.types.ts; will resolve after migrations applied

### Key Decisions (76-01)

- **Named exports only**: All v4 shared components use named exports (`export function V4Nav`) — enables tree-shaking and matches App Router conventions
- **Data stays in page**: Content data (stats values, testimonials, FAQ text) remains as page-local constants — section components accept data via props
- **AccentBar uses whileInView**: Fires on scroll for all interior sections; Hero overrides with explicit animate + delay since it's above-the-fold
- **V4 component paths**: `components/marketing/v4/{nav,footer,shared,sections}.tsx` — all subsequent marketing pages import from here

### Key Decisions (76-02)

- **(home) route group for homepage**: Homepage lives in `app/(home)/` with its own minimal layout, cleanly opting out of the shared marketing layout's nav/footer
- **Delete (marketing)/page.tsx**: Required to avoid Next.js route conflict — two route groups cannot both define `/`
- **Client Portal in V4Nav**: Added as outline-style button in both desktop and mobile nav; mirrors old marketing layout behavior

### Key Decisions (76-03)

- **Client component in _components/**: `page.tsx` stays as Server Component for metadata export; `ReputationContent` in `_components/reputation-content.tsx` is the 'use client' Framer Motion component
- **No V4Nav/V4Footer on /reputation**: The `(marketing)` layout already wraps the route with nav + footer — adding V4Nav would duplicate it
- **Single pricing card**: /reputation sells one product ($99/mo add-on); the 3-col grid from homepage is unnecessary and confusing here
- **FAQ content duplicated in data and JSON-LD**: Intentional — the V4FAQ component and JSON-LD schema must both contain all 8 Q&As for correct structured data and visible UX

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
Stopped at: Completed 76-03-PLAN.md — redesigned /reputation with V4 design language
Resume file: None
Next action: Phase 76-04 — next plan in V4 Design System Rollout phase
