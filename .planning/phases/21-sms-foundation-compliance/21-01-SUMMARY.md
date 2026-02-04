---
phase: 21-sms-foundation-compliance
plan: 01
subsystem: database, sms
tags: [twilio, sms, postgres, jsonb, rls, retry-queue, zod]

# Dependency graph
requires:
  - phase: 20
    provides: customers table with phone_status and sms_consent_status fields
provides:
  - send_logs channel column for email/sms discrimination
  - send_logs provider_message_id JSONB for multi-provider ID storage
  - sms_retry_queue table with atomic claim pattern
  - Twilio client singleton with graceful env handling
  - SMS types and Zod validation schemas
affects: [21-02, 21-03, 21-04, 21-05, 21-06, 24-campaign-engine]

# Tech tracking
tech-stack:
  added: [twilio, date-fns-tz]
  patterns: [atomic-claim-rpc, provider-message-jsonb, graceful-null-client]

key-files:
  created:
    - supabase/migrations/20260204_extend_send_logs_sms.sql
    - supabase/migrations/20260204_create_sms_retry_queue.sql
    - lib/sms/twilio.ts
    - lib/sms/types.ts
    - lib/validations/sms.ts
  modified:
    - package.json
    - pnpm-lock.yaml

key-decisions:
  - "JSONB for provider_message_id to support multiple providers in single column"
  - "Parallel customer_id column alongside contact_id during migration window"
  - "Null client pattern for Twilio when env vars not configured"
  - "SMS soft limit at 320 chars (2 segments) with GSM-7/UCS-2 detection"

patterns-established:
  - "Multi-channel send_logs: Use channel column to discriminate email vs sms"
  - "Provider-agnostic IDs: Store all provider message IDs in provider_message_id JSONB"
  - "Graceful SMS degradation: twilioClient is null when not configured, isSmsEnabled() checks availability"
  - "Atomic claim RPCs: claim_due_sms_retries() matches scheduled_sends pattern with FOR UPDATE SKIP LOCKED"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 21 Plan 01: Database & Twilio Foundation Summary

**Multi-channel send_logs extension with JSONB provider IDs, SMS retry queue with atomic claim pattern, and Twilio client singleton with graceful null handling**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-04T07:06:25Z
- **Completed:** 2026-02-04T07:09:03Z
- **Tasks:** 3
- **Files created:** 5
- **Files modified:** 2

## Accomplishments

- Extended send_logs table with channel discriminator (email/sms) and provider_message_id JSONB
- Created sms_retry_queue table with RLS policies and atomic claim RPCs matching scheduled_sends pattern
- Built Twilio client singleton that gracefully handles missing credentials
- Created comprehensive SMS types and Zod validation with segment estimation helpers

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend send_logs table for multi-channel support** - `e897bee` (feat)
2. **Task 2: Create SMS retry queue table with atomic claim RPC** - `f6b0a1f` (feat)
3. **Task 3: Create Twilio client, types, and validation** - `46a9d6f` (feat)

## Files Created/Modified

- `supabase/migrations/20260204_extend_send_logs_sms.sql` - Adds channel, provider_message_id, customer_id columns to send_logs
- `supabase/migrations/20260204_create_sms_retry_queue.sql` - SMS retry queue with claim RPCs and RLS
- `lib/sms/twilio.ts` - Twilio client singleton with env validation
- `lib/sms/types.ts` - SendSmsParams, SendSmsResult, QuietHoursResult, SmsRetryQueueItem types
- `lib/validations/sms.ts` - smsMessageSchema, segment estimation, GSM-7/UCS-2 detection
- `package.json` - Added twilio and date-fns-tz dependencies
- `pnpm-lock.yaml` - Lock file updated

## Decisions Made

1. **JSONB for provider_message_id**: Stores multi-provider IDs (`{ resend_id: "...", twilio_sid: "..." }`) in single column rather than separate columns per provider. Enables easy extension for future providers.

2. **Parallel customer_id column**: Added customer_id alongside existing contact_id to support migration window. Both columns reference same data via customers table and contacts view.

3. **Null client pattern**: twilioClient exports as null when env vars missing rather than throwing. `isSmsEnabled()` helper lets code check availability before attempting sends.

4. **SMS soft limit at 320 chars**: Matches Phase 23 decision. Allows 2 SMS segments while preventing excessive costs. Added GSM-7/UCS-2 detection for accurate segment counting.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all migrations and code created without issues. TypeScript typecheck and ESLint pass cleanly.

## User Setup Required

**External services require manual configuration.** The following Twilio environment variables must be set before SMS sending will work:

| Variable | Source |
|----------|--------|
| `TWILIO_ACCOUNT_SID` | Twilio Console -> Account Info -> Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Console -> Account Info -> Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio Console -> Phone Numbers (must be A2P 10DLC registered) |

**Note:** A2P 10DLC campaign must be approved before production SMS sending. Brand approval complete (2026-02-03), campaign approval pending.

## Next Phase Readiness

**Ready for Phase 21-02:**
- send_logs table has channel column for SMS entries
- sms_retry_queue table ready for quiet hours deferrals
- Twilio client available for SMS sending (once env vars configured)
- Types and validation ready for API handlers

**Blockers:**
- Twilio A2P 10DLC campaign approval still pending (1-3 business days from 2026-02-03)
- Env vars must be configured before runtime SMS tests

---
*Phase: 21-sms-foundation-compliance*
*Completed: 2026-02-04*
