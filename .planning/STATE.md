# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** Phase 70 -- Reputation Audit Lead-Gen Tool (in progress)

## Current Position

Phase: 70 of 70 (Reputation Audit Lead-Gen Tool)
Plan: 1 of 3 COMPLETE
Milestone: **Phase 70: Reputation Audit Lead-Gen Tool -- In Progress**
Status: Plan 70-01 complete -- foundation layer done

Progress: [░░░░░░░░░░] ~33% of phase 70 (plan 1 of 3)

Last activity: 2026-03-04 -- Phase 70 Plan 01 executed (5 files, 2 commits)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 262
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 2/2 (COMPLETE)
- Phase 70 plans completed: 1/3

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for Phase 70 (Reputation Audit Lead-Gen)

| Decision | Rationale |
|----------|-----------|
| Migration date 20260306 (not 20260303) | 20260303 taken by frozen_enrollment_status, 20260305 taken by add_brand_voice |
| Continuous rating formula (rating - 2.0) / 3.0 * 60 | Smoother scoring curve vs arbitrary tiers; 5.0 = 60pts, 4.8 = 56pts |
| fixedWindow for audit rate limit | Daily budget resets at midnight UTC (vs slidingWindow inconsistent resets) |
| Gap priority: critical/low-visibility before general gaps | Most severe issues should appear first in gaps array |
| Idempotent policies with DO $$ IF NOT EXISTS guards | Migration safe to run multiple times without error |

### Key Decisions for v3.1.1

- Phase 68 (campaigns) complete -- code fixes applied, database migration still needs manual application
- Phase 69 (dashboard/history/misc) complete -- all 6 bugs fixed, pnpm lint + typecheck pass clean
- v3.1.1 QA bug fix milestone fully complete

### Key Context from v3.1 QA -- RESOLVED

- **BUG-CAMP-04 (CRITICAL) -- FIXED (code):** toggleCampaignStatus error handling added. DB migration pending manual application.
- **BUG-HIST-01 -- FIXED:** UTC-explicit end-of-day construction (`dateTo + 'T23:59:59.999Z'`)
- **BUG-ONB-01 -- FIXED (code):** Idempotent migration file created for Supabase Dashboard SQL Editor
- **BUG-DASH-06 -- FIXED:** Conversion Rate KPI card now links to /analytics
- **BUG-DASH-10 -- FIXED:** View Campaigns button hidden on mobile (hidden sm:inline-flex)
- **BUG-JOBS-01 -- FIXED:** Job table headers now sortable (getToggleSortingHandler, ↑/↓ indicators)
- **BUG-FORM-01 -- FIXED:** ServiceTypeSelect trigger h-11 (44px WCAG minimum)

### Key Decisions Made in Phase 69

| Decision | Rationale |
|----------|-----------|
| Only Conversion Rate card links to /analytics (not all 3 KPI cards) | Reviews->history and rating->feedback are semantically appropriate; conversion rate IS an analytics metric |
| dateTo + 'T23:59:59.999Z' string concatenation for UTC end-of-day | Avoids setHours() local timezone dependency, cleaner pattern |
| h-11 scoped to service-type-select.tsx only | Avoids cascade risk to all other SelectTrigger uses across the app |
| enableSorting: false on Customer column | Nested accessor 'customers.name' requires custom sort function; flat accessorKeys sort automatically |
| software_used migration requires manual Supabase Dashboard application | Same pattern as Phase 68 -- no local postgres credentials |

### Key Decisions Made in Phase 68

| Decision | Rationale |
|----------|-----------|
| Migration requires manual DB application | Supabase CLI needs Docker (not installed) or postgres password (not stored). Created idempotent 20260303 migration file for Supabase Dashboard SQL Editor. |
| Campaign pause rollback on freeze error | If enrollment freeze fails, revert campaign.status to 'active' to maintain UI/DB consistency |
| ESLint ignore for qa-scripts/ | QA helper files had 95 pre-existing errors; not production code, added to ignores |
| Stripe `as any` for API version | Installed stripe@20.2.0 knows only 2025-12-15.clover; code uses 2026-01-28.clover. as any preserves intent without package upgrade |

### Cross-Cutting Concerns

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline

### Pending Todos (MANUAL - DB MIGRATIONS)

Three idempotent migrations must be applied via Supabase Dashboard SQL Editor before production:

1. **Phase 68:** `supabase/migrations/20260303_apply_frozen_enrollment_status.sql`
   - Adds 'frozen' to campaign_enrollments status check constraint
   - Required for campaign pause/resume to work correctly

2. **Phase 69:** `supabase/migrations/20260304_add_software_used_column.sql`
   - Adds software_used column to businesses table
   - Required for onboarding CRM platform step to save

3. **Phase 70:** `supabase/migrations/20260306_audit_tables.sql`
   - Creates audit_reports and audit_leads tables with RLS + anon GRANTs
   - Required before Phase 70 audit API routes can store lead data

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)
- 3 DB migrations pending manual Supabase Dashboard SQL Editor application (see above)
- Phase 70 Plan 01 user setup: GOOGLE_PLACES_API_KEY must be configured before Plan 02 API routes can be tested

## Session Continuity

Last session: 2026-03-04
Stopped at: Phase 70 Plan 01 complete (foundation layer: types, scoring, places-client, rate-limit, migration).
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
Active business: Audit Test HVAC (businessId: 6ed94b54-6f35-4ede-8dcb-28f562052042)
Next action: Execute Phase 70 Plan 02 (API routes: /api/audit/search and /api/audit/report)
