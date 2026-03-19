---
phase: 71
plan: 01
subsystem: database-schema
tags: [sql, migrations, rls, postgres, web-design, v4.0]

dependency-graph:
  requires: []
  provides:
    - brand_voice column on businesses (idempotent fix)
    - client_type discriminator on businesses
    - web_projects table with portal_token + RLS
    - project_tickets table with RLS + revision tracking
    - ticket_messages table with RLS (append-only)
  affects:
    - Phase 72 (CRM UI) — reads web_projects, client_type
    - Phase 73 (Ticket System) — reads/writes project_tickets, ticket_messages
    - Phase 74 (Client Portal) — looks up web_projects by portal_token

tech-stack:
  added: []
  patterns:
    - single-hop RLS (business_id IN subquery — established pattern)
    - unique partial index for nullable token columns
    - denormalized business_id on child tables (same as campaign_enrollments)
    - COUNT-based revision limits (not stored counter)

key-files:
  created:
    - supabase/migrations/20260319000100_apply_brand_voice.sql
    - supabase/migrations/20260319000200_add_client_type.sql
    - supabase/migrations/20260319000300_create_web_projects.sql
    - supabase/migrations/20260319000400_create_ticket_tables.sql
  modified: []

decisions:
  - id: D1
    summary: is_revision/is_overage booleans over stored counter
    detail: Monthly revision counts are derived via COUNT(WHERE is_revision=true AND created_at >= period) rather than a mutable counter column. Avoids TOCTOU race condition on concurrent ticket submissions.
  - id: D2
    summary: business_id denormalized onto project_tickets and ticket_messages
    detail: Single-hop RLS pattern — same as campaign_enrollments.business_id. Avoids per-row nested subquery evaluation that a two-hop join would require.
  - id: D3
    summary: portal_token nullable with UNIQUE partial index
    detail: Token is not generated at project creation — agency generates on demand. Partial index (WHERE portal_token IS NOT NULL) achieves O(1) lookup while not indexing NULLs, matching the intake_token pattern.
  - id: D4
    summary: Web design subscription fields on web_projects, not businesses
    detail: Avoids god-object pitfall (PITFALLS.md Pitfall 1). businesses table stays a lean identity record; project-specific billing and status live on web_projects.
  - id: D5
    summary: ticket_messages has no updated_at
    detail: Messages are append-only (audit trail intent). No updated_at column enforces immutability at the schema level.

metrics:
  duration: ~5 minutes
  completed: 2026-03-19
---

# Phase 71 Plan 01: Bug Fix + Data Model Migrations Summary

**One-liner:** Four idempotent SQL migrations establishing the v4.0 web design data model — brand_voice fix, client_type discriminator, web_projects table, and project_tickets/ticket_messages tables with RLS.

## What Was Created

### Migration 1: 20260319000100_apply_brand_voice.sql (BUG-01)

Idempotent re-application of the `brand_voice` column using `ADD COLUMN IF NOT EXISTS`. The original migration (`20260305000100_add_brand_voice.sql`) used plain `ALTER TABLE` without `IF NOT EXISTS`, causing a Postgres error when applied to a database where the column already existed — or leaving the column missing in production where the migration was never run. This migration is safe in both scenarios.

**Root cause:** `20260305000100_add_brand_voice.sql` was never applied to production. The column is referenced in `lib/actions/onboarding.ts` and `lib/actions/personalize.ts`, causing the "Could not find the 'brand_voice' column" error on save.

### Migration 2: 20260319000200_add_client_type.sql (DATA-01)

Adds `client_type TEXT NOT NULL DEFAULT 'reputation'` to the `businesses` table with a CHECK constraint enforcing `('reputation', 'web_design', 'both')`. All existing rows get `'reputation'` automatically — no data migration needed. The NOT NULL + DEFAULT is a metadata-only operation in Postgres 11+ (no table rewrite, no lock contention).

### Migration 3: 20260319000300_create_web_projects.sql (DATA-03)

Creates the `web_projects` table with:
- Full project lifecycle status (`discovery` → `live` → `maintenance`)
- Subscription fields (`subscription_tier`, `subscription_monthly_fee`, `has_review_addon`) stored here, NOT on businesses
- `portal_token TEXT` nullable, with `UNIQUE INDEX WHERE portal_token IS NOT NULL` for O(1) lookup
- RLS via single-hop `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`
- Index on `business_id` + unique partial index on `portal_token`

### Migration 4: 20260319000400_create_ticket_tables.sql (TICK-01/02)

Creates two tables:

**project_tickets:** Revision requests and support tickets. Key design choices:
- `is_revision BOOLEAN NOT NULL DEFAULT true` — whether this counts toward monthly limit
- `is_overage BOOLEAN NOT NULL DEFAULT false` — flagged for $50 overage billing
- Monthly revision count enforced via COUNT query, not stored counter (avoids TOCTOU race)
- `business_id` denormalized for single-hop RLS (same pattern as `campaign_enrollments`)
- Partial indexes for open ticket queries and monthly revision count queries

**ticket_messages:** Append-only reply thread per ticket:
- No `updated_at` column — enforces immutability at schema level
- `attachment_urls TEXT[]` — Supabase Storage paths; signed URLs generated server-side
- `business_id` denormalized for single-hop RLS
- `author_type IN ('agency', 'client')` CHECK constraint

## Key Schema Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Revision limit enforcement | COUNT rows WHERE is_revision | Avoids TOCTOU race on concurrent submits |
| business_id on child tables | Denormalized | Single-hop RLS, matches campaign_enrollments pattern |
| portal_token indexing | Unique partial (WHERE NOT NULL) | O(1) lookup, no wasted index space on NULLs |
| Subscription fields location | web_projects, not businesses | Avoids god-object (PITFALLS.md Pitfall 1) |
| ticket_messages immutability | No updated_at | Schema enforces append-only intent |

## Migration Status

**IMPORTANT:** These migrations are authored but NOT yet applied. To apply:

- **Local dev:** `supabase db reset` (applies all migrations from scratch)
- **Production:** `supabase db push` (applies only new migrations)

The brand_voice migration (000100) is idempotent — safe to apply even if the column already exists from the original migration.

## Deviations from Plan

None — all four files created exactly as specified in the plan.

## Verification Results

All 8 checks from the plan's `<verification>` section passed:

1. All four `.sql` files exist in `supabase/migrations/`
2. `IF NOT EXISTS` pattern used in all migrations
3. RLS enabled on `web_projects`, `project_tickets`, `ticket_messages`
4. All RLS policies use single-hop `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())`
5. `portal_token` has `UNIQUE INDEX WHERE portal_token IS NOT NULL`
6. `is_revision` and `is_overage` boolean columns exist on `project_tickets`
7. `ticket_messages` has no `updated_at` column
8. `client_type` CHECK covers exactly `'reputation'`, `'web_design'`, `'both'`
