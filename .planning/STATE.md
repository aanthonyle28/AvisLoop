# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-03)

**Core value:** Turn job completions into Google reviews automatically -- multi-touch follow-up sequences that send the right message at the right time without the business owner thinking about it.
**Current focus:** v3.1.1 QA Bug Fixes -- fix all 10 bugs from QA audit before production deployment.

## Current Position

Phase: 68 of 69 (Campaign Bug Fixes)
Plan: Not started
Milestone: **v3.1.1 QA Bug Fixes**
Status: Ready to plan

Progress: [░░░░░░░░░░] 0%

Last activity: 2026-03-03 -- Roadmap created for v3.1.1 QA Bug Fixes (2 phases, 10 requirements mapped)

## Performance Metrics

**Velocity:**
- Total plans completed (project): 259
- v3.0 plans completed: 15/15
- v3.1 plans completed: 17/17
- v3.1.1 plans completed: 0/TBD

*Updated after each plan completion*

## Accumulated Context

### Key Decisions for v3.1.1

- Phase 68 (campaigns) must execute first -- CAMP-FIX-02/03 depend on CAMP-FIX-01 migration being applied
- Phase 69 groups 6 independent fixes across dashboard, history, onboarding, jobs, and public form
- All fixes have known solutions documented in QA findings (docs/qa-v3.1/)

### Key Context from v3.1 QA

- **BUG-CAMP-04 (CRITICAL):** Migration `20260226_add_frozen_enrollment_status.sql` never applied -- CHECK constraint blocks 'frozen' status; `toggleCampaignStatus()` silently swallows error
- **BUG-HIST-01:** `setHours(23,59,59,999)` uses local time not UTC -- breaks date filter on non-UTC machines
- **BUG-ONB-01:** `software_used` column missing from businesses table -- `saveSoftwareUsed()` silently fails
- **BUG-DASH-06:** KPIWidgets removed from dashboard -- no navigation path to /analytics
- **BUG-DASH-10:** Mobile header overflow 17px at 375px -- "View Campaigns" button extends beyond viewport
- **BUG-JOBS-01:** Sort handlers not wired -- column headers are inert strings
- **BUG-FORM-01:** ServiceTypeSelect trigger h-10 (40px) below 44px touch target

### Cross-Cutting Concerns

- Design system: use existing semantic tokens and design system patterns
- Code scalability: consolidate, don't duplicate
- Dead code removal: audit for unused imports after each change
- Security: validate all user inputs server-side, maintain RLS discipline

### Pending Todos

None.

### Blockers/Concerns

- Phase 21-08: Twilio A2P campaign approval required for production SMS testing (brand approved, campaign pending)

## Session Continuity

Last session: 2026-03-03
Stopped at: Roadmap created for v3.1.1 -- 2 phases (68-69), 10 requirements mapped, ready to plan Phase 68
Resume file: None
QA test account: audit-test@avisloop.com / AuditTest123!
Active business: Audit Test HVAC (businessId: 6ed94b54-6f35-4ede-8dcb-28f562052042)
Next action: Plan Phase 68 (Campaign Bug Fixes) -- start with /gsd:plan-phase 68
