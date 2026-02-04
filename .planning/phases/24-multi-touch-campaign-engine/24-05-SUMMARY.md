---
phase: 24-multi-touch-campaign-engine
plan: 05
subsystem: server-actions
tags: [enrollment, job-completion, campaign-automation, cooldown, service-timing]

# Dependency graph
requires:
  - phase: 24-01
    provides: campaign_enrollments table, campaign schema
  - phase: 24-02
    provides: campaign presets and touch claiming RPC
provides:
  - enrollJobInCampaign action with cooldown and repeat job handling
  - Job completion triggers campaign enrollment automatically
  - Service type timing integration (SVCT-03)
affects: [24-06-cron-processor, 24-07-campaign-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cooldown-based enrollment gating"
    - "Repeat job handling with active enrollment cancellation"
    - "Non-blocking enrollment (job succeeds even if enrollment fails)"
    - "Service-type timing override from business settings"

key-files:
  created:
    - lib/actions/enrollment.ts
    - lib/constants/campaigns.ts (expanded with presets and labels)
  modified:
    - lib/validations/job.ts
    - lib/actions/job.ts

key-decisions:
  - "30-day default cooldown prevents over-messaging repeat customers"
  - "enrollInCampaign defaults to true (checkbox on by default)"
  - "Enrollment is non-blocking - job creation/update succeeds even if enrollment fails"
  - "Service type timing from business settings overrides campaign touch delay"
  - "Repeat job cancels old enrollment with stop_reason='repeat_job'"

patterns-established:
  - "Enrollment result pattern: {success, enrollmentId?, error?, skipped?, skipReason?}"
  - "Manual enrollment bypasses cooldown (forceCooldownOverride flag)"
  - "Campaign matching: service-type specific first, then 'all services' fallback"

# Metrics
duration: 6 minutes
completed: 2026-02-04
---

# Phase 24 Plan 05: Enrollment Server Actions & Job Integration Summary

**Job completion automatically enrolls customers in matching campaigns with cooldown protection and repeat job handling**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-02-04T07:12:07Z
- **Completed:** 2026-02-04T07:18:18Z
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 2

## Accomplishments

- enrollJobInCampaign action handles complete enrollment flow
- 30-day cooldown prevents over-messaging (configurable)
- Repeat job handling cancels old enrollment before creating new one
- Service type timing from business settings overrides campaign defaults (SVCT-03)
- Job create/update/markCompleted actions trigger enrollment automatically
- enrollInCampaign checkbox defaults to true (users can opt out)
- Non-blocking enrollment (job succeeds even if enrollment fails)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create enrollment server actions** - `b11f305` (feat)
2. **Task 2: Update job validation schema and actions** - `22d56c2` (feat)

## Files Created/Modified

### Created
- `lib/actions/enrollment.ts` - enrollJobInCampaign, checkEnrollmentCooldown, manuallyEnrollJob with full enrollment flow

### Modified
- `lib/validations/job.ts` - Added enrollInCampaign: z.boolean().optional().default(true)
- `lib/actions/job.ts` - createJob, updateJob, markJobCompleted trigger enrollment when status='completed'

## Decisions Made

### 30-day default cooldown
**Rationale:** Prevents over-messaging repeat customers who might have multiple jobs in short timeframe. Configurable via DEFAULT_ENROLLMENT_COOLDOWN_DAYS constant.

**Alternatives:** No cooldown (risk of spam), shorter/longer defaults

### enrollInCampaign defaults to true
**Rationale:** Most jobs should trigger review requests. Default on with opt-out UX is better than requiring explicit enrollment.

**Alternatives:** Default off (requires users to remember to check box)

### Non-blocking enrollment
**Rationale:** Job creation/update should succeed even if enrollment fails (campaign missing, cooldown active, etc.). Enrollment failures are logged but don't block core workflow.

**Alternatives:** Fail job creation if enrollment fails (bad UX)

### Service type timing override (SVCT-03)
**Rationale:** Business settings can override campaign touch delays per service type. Fetched via job query join to businesses.service_type_timing. Falls back to campaign touch delay if not configured.

**Alternatives:** Campaign timing only (less flexible)

### Repeat job handling
**Rationale:** When customer has new job completed, cancel old active enrollment with stop_reason='repeat_job' before creating new enrollment. Prevents duplicate campaigns to same customer.

**Alternatives:** Error on duplicate (bad UX), allow duplicates (spam risk)

## Enrollment Flow Details

### enrollJobInCampaign
```typescript
1. Fetch job with business.service_type_timing
2. Find active campaign (service-type specific or "all services")
3. Check 30-day cooldown (skip if forceCooldownOverride)
4. Cancel any active enrollments for customer (repeat job)
5. Get touch 1 from campaign
6. Calculate delay: business.service_type_timing[service_type] || touch1.delay_hours
7. Calculate touch_1_scheduled_at = now + delay
8. Insert enrollment with status='active', current_touch=1
9. Revalidate /campaigns and /jobs paths
```

### Campaign Matching Strategy
1. Try to find campaign with exact service_type match
2. If not found, fall back to campaign with service_type=NULL ("all services")
3. If neither found, skip enrollment with reason

### Cooldown Check
- Query campaign_enrollments for customer_id where enrolled_at >= (now - 30 days)
- If found, return {inCooldown: true, lastEnrolledAt}
- Skip enrollment with reason
- manuallyEnrollJob bypasses cooldown

### Repeat Job Handling
- Before creating new enrollment, find all enrollments with customer_id and status='active'
- Update them to status='stopped', stop_reason='repeat_job', stopped_at=now
- Prevents multiple active enrollments for same customer

## Integration Points

### Job Creation Flow
```typescript
createJob(formData) {
  // ... validation, insert job ...

  if (status === 'completed' && enrollInCampaign !== false) {
    await enrollJobInCampaign(newJob.id)
    // Don't fail if enrollment fails - just log
  }
}
```

### Job Update Flow
```typescript
updateJob(formData) {
  // ... validation, update job ...

  if (status === 'completed' && currentJob.status !== 'completed' && enrollInCampaign !== false) {
    await enrollJobInCampaign(jobId)
    // Don't fail if enrollment fails - just log
  }
}
```

### markJobCompleted Helper
```typescript
markJobCompleted(jobId, enrollInCampaign = true) {
  // ... update job ...

  if (enrollInCampaign) {
    await enrollJobInCampaign(jobId)
    // Don't fail if enrollment fails - just log
  }
}
```

## Service Type Timing (SVCT-03)

### Requirement
Business owners can configure per-service-type timing in business settings (e.g., "HVAC jobs wait 24h, Cleaning jobs wait 4h").

### Implementation
1. Job query joins to businesses table and fetches service_type_timing column
2. service_type_timing is JSONB map: `{ hvac: 24, cleaning: 4, ... }`
3. enrollJobInCampaign reads: `businessTiming?.[job.service_type] || touch1.delay_hours`
4. If business configured timing for service type, use it; otherwise use campaign default

### Example
```typescript
// Job: service_type='cleaning', campaign touch 1 delay_hours=24
// Business settings: service_type_timing = { cleaning: 4 }
// Result: Touch 1 scheduled 4 hours from now (business override)

// Job: service_type='hvac', campaign touch 1 delay_hours=24
// Business settings: service_type_timing = { cleaning: 4 }
// Result: Touch 1 scheduled 24 hours from now (no override, use campaign default)
```

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - automatic enrollment on job completion. Users can opt out via enrollInCampaign checkbox in job forms.

## Next Phase Readiness

**Ready for:**
- Phase 24-06: Cron processor can claim and send due touches (enrollments are created)
- Phase 24-07: Campaign UI can show enrollment counts and status
- Phase 24-08: Job detail page can display enrollment status

**Notes:**
- Enrollments created with touch_1_scheduled_at calculated from service_type_timing
- Campaign matching prefers service-type specific, falls back to "all services"
- Cooldown prevents over-messaging repeat customers
- Repeat job handling ensures only one active enrollment per customer

## Verification Passed

- [x] enrollJobInCampaign finds matching campaign (service-type specific or "all")
- [x] Cooldown check prevents over-messaging repeat customers
- [x] Repeat job handling cancels old enrollment with 'repeat_job' reason
- [x] Touch 1 scheduled time uses business's service_type_timing defaults (SVCT-03)
- [x] Job update action triggers enrollment when status becomes 'completed'
- [x] enrollInCampaign checkbox defaults to true
- [x] manuallyEnrollJob bypasses cooldown for explicit user action
- [x] lib/validations/job.ts includes enrollInCampaign field
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes

## Testing Recommendations

### Manual Testing (Phase 24-07)
1. Create job with status='completed' (enrollInCampaign checkbox on)
2. Verify enrollment created in campaign_enrollments table
3. Verify touch_1_scheduled_at matches business.service_type_timing
4. Create second job for same customer within 30 days
5. Verify enrollment skipped with cooldown reason
6. Update job status from 'do_not_send' to 'completed'
7. Verify enrollment created on status change

### Edge Cases
- No active campaign for service type → skipped with reason
- Customer already enrolled in campaign → skipped (unique constraint)
- Cooldown active → skipped with reason + lastEnrolledAt
- Repeat job → old enrollment stopped with 'repeat_job' reason
- Business has no service_type_timing → uses campaign touch delay

### Integration Testing (Phase 24-06)
- Create enrollment via job completion
- Verify cron can claim touch 1 when scheduled_at passes
- Verify touch sent_at updated after send
- Verify enrollment progresses to touch 2

## Known Limitations

### Phase 24-05 Scope
This plan only creates enrollment logic. No UI for:
- Viewing enrollments (24-07)
- Manually enrolling jobs (24-08)
- Configuring cooldown period (future)
- Configuring service_type_timing (future)

### Assumptions
- Business has service_type_timing JSONB column (added in Phase 22)
- Campaign has at least touch 1 configured (enforced by campaign create UI)
- Jobs table has service_type column (added in Phase 22)

## References

- Phase 24-01: Campaign schema with enrollments table
- Phase 24-02: Preset campaigns and touch claiming RPC
- Phase 22: Jobs table and service_type_timing in businesses
- Data model: `docs/DATA_MODEL.md`

---

**Enrollment automation complete.** Job completion triggers campaign enrollment with cooldown protection and service timing override. Ready for cron processor (Plan 24-06).
