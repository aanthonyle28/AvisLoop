---
phase: 70-reputation-audit-lead-gen
plan: 01
subsystem: api
tags: [google-places, reputation-audit, rate-limiting, postgres, rls, lead-gen]

# Dependency graph
requires:
  - phase: lib/rate-limit.ts
    provides: existing Ratelimit/Redis pattern to follow for new auditRatelimit

provides:
  - lib/audit/types.ts — PlacesResult, ReputationScore, GapAnalysis, AuditReport, AuditSearchPreview interfaces
  - lib/audit/scoring.ts — pure computeReputationScore function (0-100 score + A-F grade + gap analysis)
  - lib/audit/places-client.ts — server-only Google Places API (New) searchText client
  - lib/rate-limit.ts — auditRatelimit (fixedWindow 5/day) + checkAuditRateLimit
  - supabase/migrations/20260306_audit_tables.sql — audit_reports + audit_leads tables with RLS

affects:
  - 70-02 (API routes — imports scoring, places-client, rate-limit)
  - 70-03 (UI form component — imports AuditSearchPreview type)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Audit module pattern: types.ts → scoring.ts → places-client.ts (one-directional imports)"
    - "server-only at top of places-client.ts prevents accidental client bundle inclusion"
    - "fixedWindow (not slidingWindow) for daily budget reset at midnight UTC"
    - "Idempotent SQL migration with DO $$ IF NOT EXISTS guards for policies"

key-files:
  created:
    - lib/audit/types.ts
    - lib/audit/scoring.ts
    - lib/audit/places-client.ts
    - supabase/migrations/20260306_audit_tables.sql
  modified:
    - lib/rate-limit.ts

key-decisions:
  - "Migration uses 20260306 prefix (20260303 taken by frozen_enrollment_status, 20260305 taken by add_brand_voice)"
  - "scoreRating uses continuous formula (rating - 2.0) / 3.0 * 60 — not tiered — for smoother scoring curve"
  - "Gap analysis checks critical rating (<4.0) separately from general gap (<4.5) for stronger recommendation"
  - "Low visibility check (<10 reviews) added before general volume gap (<50) for correct priority ordering"
  - "auditRatelimit uses fixedWindow (not slidingWindow) so daily budget resets at midnight UTC"

patterns-established:
  - "Audit module: types imported by scoring.ts and places-client.ts, never the reverse"
  - "Places API (New): POST to /v1/places:searchText with X-Goog-FieldMask header for cost control"
  - "Rate limit pattern: export const + export async function following existing lib/rate-limit.ts convention"

# Metrics
duration: 3min
completed: 2026-03-04
---

# Phase 70 Plan 01: Reputation Audit Foundation Summary

**Pure scoring engine (0-100/A-F) + server-only Google Places API (New) client + audit_reports/audit_leads DB tables with anon RLS + fixedWindow rate limiter (5/day per IP)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-04T05:55:07Z
- **Completed:** 2026-03-04T05:58:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `lib/audit/types.ts` with 5 interfaces: PlacesResult, ReputationScore, GapAnalysis, AuditReport, AuditSearchPreview
- Created `lib/audit/scoring.ts` with pure `computeReputationScore` function (no DB/API calls) using continuous rating formula and tiered volume lookup
- Created `lib/audit/places-client.ts` (server-only) calling Google Places API (New) with field masking to minimize costs
- Added `auditRatelimit` + `checkAuditRateLimit` to existing rate-limit.ts following established pattern
- Created idempotent SQL migration `20260306_audit_tables.sql` with audit_reports + audit_leads tables, RLS policies, anon GRANTs, and indexes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create type definitions, scoring algorithm, and Places API client** - `97c4e9e` (feat)
2. **Task 2: Add audit rate limiter and create DB migration** - `d30215a` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `lib/audit/types.ts` — PlacesResult, ReputationScore (score/grade/ratingScore/volumeScore/gaps), GapAnalysis, AuditReport, AuditSearchPreview
- `lib/audit/scoring.ts` — scoreRating (0-60), scoreVolume (tiered 0-40), scoreToGrade (A-F), computeReputationScore (combines all + gap analysis)
- `lib/audit/places-client.ts` — server-only Google Places API (New) searchText client with field masking, returns PlacesResult | null
- `lib/rate-limit.ts` — added auditRatelimit (fixedWindow 5 per day) and checkAuditRateLimit(ip) function
- `supabase/migrations/20260306_audit_tables.sql` — idempotent migration: 2 tables, 4 RLS policies (with DO $$ guards), 3 anon GRANTs, 3 indexes

## Decisions Made

- **Migration date prefix 20260306**: Both 20260303 (frozen_enrollment_status) and 20260305 (add_brand_voice) were already taken. Used 20260306 to avoid conflicts.
- **Continuous rating formula over tiered**: `(rating - 2.0) / 3.0 * 60` gives smoother distribution than arbitrary tiers. A 4.8 star business scores 56 points (not 60 — only 5.0 stars achieves full points).
- **fixedWindow for audit rate limit**: Daily budget resets at midnight UTC, which is the expected UX behavior for a "5 audits per day" limit. slidingWindow would produce inconsistent resets.
- **Gap priority ordering**: Critical rating (<4.0) and low visibility (<10) checks run before their broader equivalents so the most severe issue appears first in the gaps array.
- **Idempotent policy creation**: Used `DO $$ IF NOT EXISTS (SELECT FROM pg_policies ...)` guards to make the migration safe to run multiple times without error.

## Deviations from Plan

None — plan executed exactly as written. The migration filename was adjusted from `20260303_audit_tables.sql` to `20260306_audit_tables.sql` as noted in the plan context (both 20260303 and 20260305 were taken).

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before Plan 02 (API routes) can be tested:**

1. **Google Places API key** — Create at [Google Cloud Console](https://console.cloud.google.com/):
   - Enable billing on project
   - Enable "Places API (New)" (not the legacy Places API)
   - Create API key, restrict to Places API (New)
   - Add to `.env.local`: `GOOGLE_PLACES_API_KEY=your_key_here`

2. **Supabase migration** — Apply `supabase/migrations/20260306_audit_tables.sql` via:
   - Supabase Dashboard > SQL Editor
   - Paste and run the migration (idempotent — safe to run multiple times)

## Next Phase Readiness

- Foundation complete — Plan 02 (API routes) can import from `lib/audit/types.ts`, `lib/audit/scoring.ts`, `lib/audit/places-client.ts`, and `lib/rate-limit.ts`
- `AuditSearchPreview` type ready for the search response before email gate
- `AuditReport` type matches DB table shape for direct insert
- No blockers for Plan 02

---
*Phase: 70-reputation-audit-lead-gen*
*Completed: 2026-03-04*
