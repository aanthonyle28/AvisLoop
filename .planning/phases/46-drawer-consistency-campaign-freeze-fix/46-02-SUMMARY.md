# Phase 46 Plan 02: Fix toggleCampaignStatus to freeze/unfreeze enrollments + audit frozen-aware queries Summary

**One-liner:** Campaign pause now freezes enrollments (preserving touch position) instead of permanently destroying them; resume unfreezes with stale-time adjustment; all enrollment-status queries across the codebase updated to treat frozen as in-progress.

## What Was Done

### Task 1: Rewrite toggleCampaignStatus freeze/unfreeze logic
- **Pause behavior:** Changed from `status='stopped' + stop_reason='campaign_paused' + stopped_at=now` (permanent destruction) to `status='frozen'` (preserves touch position, no terminal fields set)
- **Resume behavior:** Added new block that queries frozen enrollments, sets them back to `active`, and bumps any stale scheduled times to NOW so the cron processor picks them up immediately
- **JSDoc updated** to reflect new freeze/unfreeze semantics
- **Commit:** `224a302`

### Task 2: Update enrollment conflict and cancellation queries
- `checkEnrollmentConflict`: `.eq('status', 'active')` -> `.in('status', ['active', 'frozen'])` -- frozen enrollment counts as active sequence conflict
- `cancelActiveEnrollments`: Same change -- repeat job replaces frozen enrollments too
- `stopEnrollmentsForJob`: Same change -- editing job campaign stops frozen enrollments
- `optOutCustomerEmail` (customer.ts): Same change -- email opt-out stops frozen enrollments
- **Commit:** `e006f49`

### Task 3: Update dashboard, campaign data, and cron queries
- `getCampaignEnrollmentCounts`: Added `frozen: number` to return type with parallel query
- Dashboard active sequences KPI: includes frozen in current + 7-days-ago count
- Conflict detection (batch): frozen enrollments surfaced for conflict customers
- Preflight conflict detection: frozen enrollments detected for scheduled jobs
- Job detail enrichment: `enrollments.find()` checks for frozen as well as active
- Job detail preflight: uses `.in('status', ['active', 'frozen'])`
- Cron Task B (queue_after): frozen enrollment blocks re-enrollment of queued jobs
- **Commit:** `c2fd6f8`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Frozen is non-terminal (no stop_reason/stopped_at) | Frozen enrollments resume from same position -- they are not stopped |
| stopEnrollment (single by ID) keeps `.eq('status', 'active')` | Individual enrollment stop is explicit owner action; frozen enrollments are unfrozen via campaign resume, not individually stopped |
| Stale scheduled times bumped to NOW on resume | Prevents cron from missing touches that were scheduled during the frozen period |
| getCampaignEnrollmentCounts returns frozen count | Enables future UI to display paused enrollment count on campaign detail page |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | PASS (0 errors) |
| `pnpm lint` (modified files) | PASS |
| toggleCampaignStatus pause sets `frozen` (not `stopped`) | Confirmed (line 467) |
| toggleCampaignStatus resume queries `frozen`, sets `active` | Confirmed (lines 473-497) |
| checkEnrollmentConflict uses `['active', 'frozen']` | Confirmed |
| cancelActiveEnrollments uses `['active', 'frozen']` | Confirmed |
| stopEnrollmentsForJob uses `['active', 'frozen']` | Confirmed |
| optOutCustomerEmail uses `['active', 'frozen']` | Confirmed |
| getCampaignEnrollmentCounts returns frozen count | Confirmed |
| Dashboard KPI includes frozen | Confirmed |
| Cron Task B includes frozen | Confirmed |
| No stale `.eq('status', 'active')` on enrollment queries | Confirmed (remaining are campaign table queries or single-enrollment stop) |

## Files Modified

| File | Changes |
|------|---------|
| `lib/actions/campaign.ts` | toggleCampaignStatus rewritten: freeze on pause, unfreeze+adjust on resume |
| `lib/actions/enrollment.ts` | checkEnrollmentConflict, cancelActiveEnrollments, stopEnrollmentsForJob: include frozen |
| `lib/actions/customer.ts` | optOutCustomerEmail: include frozen enrollments in stop |
| `lib/data/campaign.ts` | getCampaignEnrollmentCounts: add frozen count |
| `lib/data/dashboard.ts` | 6 queries updated to include frozen status |
| `app/api/cron/resolve-enrollment-conflicts/route.ts` | Task B active enrollment check includes frozen |

## Commits

| Hash | Message |
|------|---------|
| `224a302` | fix(46-02): rewrite toggleCampaignStatus to freeze/unfreeze enrollments |
| `e006f49` | fix(46-02): include frozen status in enrollment conflict and cancellation queries |
| `c2fd6f8` | fix(46-02): update dashboard/campaign/cron queries to include frozen enrollments |

## Performance

- **Duration:** ~6 minutes
- **Completed:** 2026-02-26
