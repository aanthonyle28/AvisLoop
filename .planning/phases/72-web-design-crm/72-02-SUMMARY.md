---
phase: 72
plan: 02
subsystem: web-design-crm-ui
tags: [clients, crm, tanstack-table, sheet-drawer, sidebar, mrr]

dependency-graph:
  requires: ["72-01"]
  provides: ["/clients page UI", "ClientsClient", "ClientTable", "ClientDetailDrawer", "MrrSummaryBar", "Clients sidebar nav"]
  affects: ["73-ticket-system", "74-client-portal"]

tech-stack:
  added: []
  patterns: ["TanStack React Table with click-to-drawer", "Read/edit drawer with Partial<ClientUpdateInput> form state", "useMemo filter derivation", "localClients optimistic update pattern"]

key-files:
  created:
    - app/(dashboard)/clients/page.tsx
    - app/(dashboard)/clients/loading.tsx
    - components/clients/mrr-summary-bar.tsx
    - components/clients/client-columns.tsx
    - components/clients/client-table.tsx
    - components/clients/clients-client.tsx
    - components/clients/client-detail-drawer.tsx
    - supabase/migrations/20260319000500_add_web_design_business_fields.sql
  modified:
    - components/layout/sidebar.tsx
    - lib/types/database.ts

decisions:
  - "Added web design fields (owner_name, owner_email, owner_phone, web_design_tier, domain, vercel_project_url, live_website_url, status) to Business interface and a new migration — these fields were referenced in 72-01 clientUpdateSchema but missing from the type and DB schema"
  - "Migration 20260319000500 adds these nullable columns to businesses table with proper CHECK constraints"
  - "Revision quota section is always read-only (derived from ticket count + tier, not user-editable)"
  - "Project Details section only renders when client.web_project is non-null"

metrics:
  duration: "~25 minutes"
  completed: "2026-03-19"
---

# Phase 72 Plan 02: Web Design CRM UI Summary

**One-liner:** Full /clients CRM page — MRR bar, 7-column TanStack table with status/tier filters, detail drawer with read/edit mode and revision quota progress bar.

## What Was Built

The /clients route is now fully functional as a web design CRM dashboard:

- **`app/(dashboard)/clients/page.tsx`** — Server component, fetches `getWebDesignClients()` and `getClientMrrSummary()` in parallel, renders `MrrSummaryBar` + `ClientsClient`
- **`app/(dashboard)/clients/loading.tsx`** — Skeleton loading state (MRR bar skeleton + 7-column table skeleton)
- **`components/clients/mrr-summary-bar.tsx`** — Summary bar showing total MRR and active client count with Phosphor icons
- **`components/clients/client-columns.tsx`** — 7 `ColumnDef<WebDesignClient>` columns: Business, Owner, Tier, Status, Domain, MRR, Revisions
- **`components/clients/client-table.tsx`** — TanStack React Table with click-to-open-drawer behavior, empty state, loading skeleton
- **`components/clients/clients-client.tsx`** — Client component orchestrating filters (status + tier), local state sync, row click handler, and drawer
- **`components/clients/client-detail-drawer.tsx`** — Sheet with 5 sections: Contact Info, Project Details (read-only), Plan & Billing, Tech Details, Revision Quota (read-only with progress bar). Edit mode via `updateClientDetails()` server action.
- **`components/layout/sidebar.tsx`** — Added `Buildings` icon import + Clients nav item after Feedback

## Deviations from Plan

### [Rule 1 - Bug] Missing web design fields on Business type and businesses table

**Found during:** Task 1 — TypeScript compilation would fail because `clientUpdateSchema` references fields (`owner_name`, `web_design_tier`, `domain`, `vercel_project_url`, `status`) that didn't exist on the `Business` interface or in any migration.

**Issue:** The 72-01 plan referenced "businesses new web design fields" as if they existed from Phase 71, but no migration added them to the businesses table, and the `Business` TypeScript interface didn't include them.

**Fix:**
1. Added 8 nullable columns to `Business` interface: `owner_name`, `owner_email`, `owner_phone`, `web_design_tier`, `domain`, `vercel_project_url`, `live_website_url`, `status`
2. Created `supabase/migrations/20260319000500_add_web_design_business_fields.sql` to add these columns to the `businesses` table with proper CHECK constraints

**Files modified:** `lib/types/database.ts`, new migration file
**Note:** Migration must be applied via Supabase Dashboard SQL Editor (same as other pending migrations)

## Pending Manual DB Migration

Migration `20260319000500_add_web_design_business_fields.sql` adds nullable web design columns to the `businesses` table. Apply via Supabase Dashboard > SQL Editor.

## Next Phase Readiness

Phase 73 (Ticket System) can proceed — it builds on the `/clients` page and web_projects data model. The detail drawer revision quota section will become more meaningful once tickets are tracked.
