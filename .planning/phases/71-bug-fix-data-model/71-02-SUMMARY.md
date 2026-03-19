---
phase: 71
plan: "02"
subsystem: types-and-ui
tags: [typescript, web-design, business-card, client-type, v4]

dependency-graph:
  requires:
    - "71-01 (data model migrations)"
  provides:
    - "TypeScript types for all v4.0 web design tables"
    - "BusinessCard client_type conditional rendering"
  affects:
    - "72+ (all phases that build on WebProject, ProjectTicket, TicketMessage types)"

tech-stack:
  added: []
  patterns:
    - "client_type discriminator on Business for feature-flag-style conditional rendering"
    - "optional webProject prop with null-safe graceful fallback"

key-files:
  created: []
  modified:
    - lib/types/database.ts
    - components/businesses/business-card.tsx

decisions:
  - "client_type has no | null — NOT NULL with DEFAULT in SQL means it always has a value"
  - "webProject prop is optional (undefined/null) — Phase 72 will wire it from page.tsx; card shows graceful fallback"
  - "Service type badge hidden for web_design clients (they don't use HVAC/plumbing service types)"
  - "Pre-existing e2e/ lint errors are unrelated to this plan — confirmed present before changes"

metrics:
  duration: "~2 minutes"
  completed: "2026-03-19"
---

# Phase 71 Plan 02: TypeScript Types + BusinessCard client_type Summary

**One-liner:** Added `client_type` to Business, WebProject/ProjectTicket/TicketMessage types to lib/types/database.ts, and rewrote BusinessCard to conditionally render web design fields (domain, status, tier) vs reputation fields (Google rating, reviews gained, competitive gap) based on `client_type`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update TypeScript types for new schema | c81ce3a | lib/types/database.ts |
| 2 | Update BusinessCard for client_type conditional rendering | e155217 | components/businesses/business-card.tsx |

## TypeScript Types Added

### Business interface
- `client_type: 'reputation' | 'web_design' | 'both'` — discriminator field (non-nullable)

### New type aliases
- `WebProjectStatus` — union of 8 project lifecycle statuses
- `WebDesignTier` — `'basic' | 'advanced'`
- `TicketStatus` — 5-state union
- `TicketPriority` — 4-level union
- `TicketSource` — `'agency' | 'client_portal'`
- `TicketAuthorType` — `'agency' | 'client'`

### New interfaces
- `WebProject` — 20 fields; tracks domain, vercel_project_id, subscription_tier/fee, portal_token, dates, page_count, etc.
- `ProjectTicket` — 14 fields; tracks title, status, priority, source, is_revision, is_overage, resolution
- `TicketMessage` — 8 fields; append-only (no updated_at), supports attachment_urls

## BusinessCard Changes

### Props interface
- Added `webProject?: WebProject | null` (optional — Phase 72 will wire it)

### Client type badge logic
- `reputation` → no badge (keeps existing clean appearance)
- `web_design` → blue `Web Design` badge
- `both` → amber `Web + Review` badge

### Conditional section rendering
- **web_design or both:** Domain (Globe icon), project status badge (color-mapped), tier chip; competitive analysis section removed
- **reputation:** Google rating (Star icon), reviews gained, competitive gap — unchanged

### Service type badge
- Hidden for `web_design` clients (no HVAC/plumbing service types apply)
- Shown for `reputation` and `both` clients

### Status color mapping
- `live` → green
- `discovery`, `design`, `development`, `review` → blue
- `maintenance` → amber
- `paused`, `cancelled` → muted

### Null safety
- All `webProject` access is optional-chained (`webProject?.domain ?? null`)
- Card renders correctly when `webProject` is undefined or null

## Verification Results

- `pnpm typecheck`: PASS (zero errors)
- `pnpm lint`: 6 pre-existing errors in `e2e/tests/` (unrelated to this plan, confirmed present before changes — untracked QA scripts not part of main app)
- Lint on modified files: clean

## Deviations from Plan

None — plan executed exactly as written.

## Note: businesses/page.tsx not yet passing webProject prop

As planned, `businesses-client.tsx` calls `<BusinessCard business={business} isActive={...} />` without `webProject`. This is intentional — Phase 72 will add the `getUserWebProjects()` data function and pass `webProject` from `page.tsx`. Until then, `web_design` and `both` clients show "No domain set" / "No project" gracefully.
