---
phase: 12
plan: 01
type: execute
subsystem: cron-processing
status: complete
tags: [cron, scheduled-sends, vercel, postgres, race-condition-prevention]

requires:
  - scheduled_sends table (manual migration)
  - lib/supabase/service-role.ts
  - lib/email/resend.ts
  - lib/email/templates/review-request.tsx
  - lib/constants/billing.ts

provides:
  - Atomic scheduled send claiming via Postgres RPC
  - Cron endpoint for background processing
  - Race-safe concurrent execution
  - Re-validation at send time
  - Vercel cron configuration

affects:
  - Phase 13 (Scheduling & Navigation) - can now schedule and sends will process automatically
  - Phase 14 (Scheduled Send Management) - UI will display cron-processed sends

dependencies:
  requires: [lib/supabase/service-role, lib/email/resend, lib/email/templates/review-request]
  provides: [cron-processing-engine]
  affects: [Phase 13, Phase 14]

tech-stack:
  added: [vercel-cron, postgres-rpc, FOR UPDATE SKIP LOCKED]
  patterns: [atomic-claim, service-role-pattern, cron-idempotency]

key-files:
  created:
    - supabase/migrations/00010_claim_due_scheduled_sends.sql
    - app/api/cron/process-scheduled-sends/route.ts
    - vercel.json
  modified: []

decisions:
  - id: D12-01-01
    title: Use FOR UPDATE SKIP LOCKED for race-safe claiming
    rationale: Prevents duplicate processing when multiple cron invocations overlap
    date: 2026-01-29
    impact: high

  - id: D12-01-02
    title: Service role client for cron context
    rationale: Cron runs without user session, needs RLS bypass
    date: 2026-01-29
    impact: high

  - id: D12-01-03
    title: Re-validate all rules at send time
    rationale: Contact status may change between schedule and execution
    date: 2026-01-29
    impact: medium

  - id: D12-01-04
    title: Return 200 for partial failures
    rationale: Vercel Cron expects 200 for success; individual failures logged in scheduled_send records
    date: 2026-01-29
    impact: low

commits:
  - d3e972a: "feat(12-01): add atomic claim function for scheduled sends"
  - 1109a53: "feat(12-01): add cron route handler for scheduled send processing"
  - f1f8b18: "feat(12-01): add Vercel cron configuration"

metrics:
  duration: "4 minutes"
  completed: 2026-01-29
---

# Phase 12 Plan 01: Cron Processing Engine Summary

**One-liner:** Atomic scheduled send processing via Postgres RPC with FOR UPDATE SKIP LOCKED, service role client, and Vercel Cron running every minute.

## What Was Built

### Core Infrastructure
1. **Postgres atomic claim function** (`claim_due_scheduled_sends`)
   - Uses `FOR UPDATE SKIP LOCKED` for race-safe claiming
   - Atomically updates status from `pending` to `processing`
   - Returns claimed rows for processing
   - Prevents duplicate sends when cron invocations overlap

2. **Cron route handler** (`/api/cron/process-scheduled-sends`)
   - GET endpoint with CRON_SECRET authentication
   - Uses service role client (bypasses RLS for cron context)
   - Claims due sends atomically via RPC
   - Re-validates all contacts at send time:
     - Cooldown check (14 days)
     - Opt-out status
     - Archived status
     - Monthly quota
   - Sends emails via Resend
   - Updates `scheduled_send` records with final status
   - Returns structured JSON with counts

3. **Vercel Cron configuration** (`vercel.json`)
   - Runs every minute (`* * * * *`)
   - Automatically includes Authorization header

### Business Logic Flows

**Claim Flow (Race-Safe):**
1. Multiple cron invocations can run simultaneously
2. Each calls `claim_due_scheduled_sends(limit: 50)`
3. Postgres locks rows with `FOR UPDATE SKIP LOCKED`
4. Each invocation gets different rows (no overlap)
5. Status atomically updated to `processing`

**Processing Flow (Re-Validation):**
1. For each claimed scheduled send:
   - Fetch business data (validate google_review_link exists)
   - Check monthly quota (may have changed since scheduling)
   - Fetch all contacts in one query
   - Re-validate each contact:
     - Not archived
     - Not opted out
     - Cooldown expired (14 days since last send)
   - Send emails to eligible contacts
   - Track sent/skipped/failed counts
   - Update scheduled_send with final status

**Error Handling:**
- One failed scheduled send doesn't block others
- Each scheduled send wrapped in try/catch
- Partial failures tracked in `error_message` field
- Always returns 200 (Vercel expects 200 for successful cron run)

## Key Implementation Details

### Race Condition Prevention
```sql
-- Atomic claim with row-level locking
FOR UPDATE SKIP LOCKED
```
This ensures:
- Two cron runs can't claim the same scheduled send
- No deadlocks (SKIP LOCKED continues if row is locked)
- No duplicate emails sent

### Service Role Pattern
```typescript
const supabase = createServiceRoleClient()
```
- Bypasses RLS (cron has no user session)
- Only used server-side (never exposed to client)
- Required for background processing

### Re-Validation at Send Time
Don't trust schedule-time validation:
- Contact may have been archived
- Contact may have opted out
- Cooldown may have been triggered by another send
- Monthly quota may have been exhausted

Always re-check all rules before sending.

### Idempotency
```typescript
idempotencyKey: `scheduled-send-${scheduledSend.id}-${sendLog.id}`
```
Prevents duplicate sends if Resend API is called multiple times.

## Technical Decisions

### Why Postgres RPC vs Two-Step Select-Then-Update?
- **Problem:** Two queries create race condition window
- **Solution:** RPC wraps SELECT + UPDATE in single transaction
- **Benefit:** Atomic operation, no race conditions

### Why Service Role vs User Client?
- **Problem:** Cron runs without user session
- **Solution:** Service role has superuser permissions
- **Benefit:** Can query/update any business's scheduled sends

### Why Re-Validate vs Trust Schedule Data?
- **Problem:** Contact status changes between schedule and execution
- **Solution:** Re-run all validation rules at send time
- **Benefit:** Never send to archived/opted-out contacts

### Why Return 200 for Partial Failures?
- **Problem:** Vercel Cron retries on non-200 responses
- **Solution:** Return 200 with structured JSON
- **Benefit:** Individual failures logged, no infinite retries

## Files Created

| File | Purpose | Key Features |
|------|---------|--------------|
| `supabase/migrations/00010_claim_due_scheduled_sends.sql` | Postgres function | FOR UPDATE SKIP LOCKED, RETURNING * |
| `app/api/cron/process-scheduled-sends/route.ts` | Cron handler | Service role, RPC call, re-validation |
| `vercel.json` | Cron config | Every-minute schedule |

## Integration Points

### Dependencies (What This Uses)
- `lib/supabase/service-role.ts` - Service role client factory
- `lib/email/resend.ts` - Resend client and FROM email
- `lib/email/templates/review-request.tsx` - Email template
- `lib/constants/billing.ts` - COOLDOWN_DAYS, MONTHLY_SEND_LIMITS

### Dependents (What Uses This)
- Phase 13: Scheduling UI will trigger scheduled sends that this processes
- Phase 14: Management UI will display results of cron processing

## Testing Strategy

### Local Testing
```bash
# Set CRON_SECRET environment variable
export CRON_SECRET="your-secret-here"

# Call the endpoint directly
curl http://localhost:3000/api/cron/process-scheduled-sends \
  -H "Authorization: Bearer your-secret-here"
```

### Production Testing
1. Deploy to Vercel
2. Set CRON_SECRET in Vercel project settings
3. Create a scheduled send via UI (Phase 13)
4. Wait for cron to run (next minute)
5. Check scheduled_send record status updated
6. Verify email sent in Resend dashboard

## Known Limitations

1. **Vercel Cron only runs in production**
   - Local testing requires manual curl
   - No local cron simulation

2. **CRON_SECRET must be set before first deployment**
   - Vercel auto-generates if missing
   - Must match what route handler checks

3. **No dead-letter queue for failed sends**
   - Failed scheduled sends stay in `failed` status
   - No automatic retry mechanism
   - Manual intervention required

4. **Batch size capped at 50**
   - Prevents timeout on large backlogs
   - Multiple cron runs will process remaining

## Next Phase Readiness

### Ready for Phase 13 (Scheduling & Navigation)
- ✅ Cron engine ready to process scheduled sends
- ✅ Service role client available
- ✅ Re-validation logic implemented
- ✅ Structured response format for monitoring

### Prerequisites for Phase 13
- UI to create scheduled sends (schedule-selector.tsx already exists)
- Navigation to scheduled sends list
- Date/time picker integration

### Prerequisites for Phase 14 (Management UI)
- List view of scheduled sends
- Status badges (pending/completed/failed)
- Cancel functionality
- Error message display

## Deviations from Plan

None - plan executed exactly as written.

## Metrics

- **Tasks completed:** 3/3
- **Commits:** 3
- **Files created:** 3
- **Duration:** ~4 minutes
- **TypeScript errors:** 0
- **Lint warnings:** 0 (pre-existing warning in send-form.tsx unrelated)

## Rollout Notes

### Environment Variables Required
```bash
# Vercel Project Settings → Environment Variables
CRON_SECRET=<auto-generated-or-custom>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
NEXT_PUBLIC_SUPABASE_URL=<from-supabase-dashboard>
RESEND_API_KEY=<from-resend-dashboard>
RESEND_FROM_EMAIL=<verified-sender-email>
```

### Database Migration
Apply migration before first cron run:
```bash
# Local
supabase migration up

# Production (via Supabase dashboard or CLI)
supabase db push
```

### Monitoring
Check cron execution logs:
```bash
# Vercel dashboard → Deployments → [deployment] → Functions
# Filter by /api/cron/process-scheduled-sends
```

## Success Criteria Met

- ✅ Postgres function uses FOR UPDATE SKIP LOCKED
- ✅ Cron endpoint uses createServiceRoleClient (not createClient)
- ✅ CRON_SECRET authentication implemented
- ✅ Atomic claim via RPC (not two-step select-then-update)
- ✅ Re-validation at send time (cooldown, opt-out, archived, quota)
- ✅ Emails sent via Resend with ReviewRequestEmail
- ✅ scheduled_send records updated with final status
- ✅ Structured JSON response with counts
- ✅ vercel.json with every-minute schedule
- ✅ TypeScript compiles without errors
- ✅ Lint passes

---

**Status:** Complete and ready for Phase 13 (Scheduling & Navigation)
