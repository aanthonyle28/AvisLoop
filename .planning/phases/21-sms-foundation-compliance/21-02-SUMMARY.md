---
phase: 21-sms-foundation-compliance
plan: 02
subsystem: sms
tags: [twilio, date-fns-tz, tcpa, quiet-hours, timezone]

# Dependency graph
requires:
  - phase: 21-01
    provides: Twilio client singleton, SMS types (SendSmsParams, SendSmsResult, QuietHoursResult)
provides:
  - checkQuietHours() function for TCPA 8am-9pm enforcement with timezone conversion
  - sendSms() function for core Twilio SMS sending with error handling
  - TWILIO_ERROR_CODES constants for error categorization
  - isRetryableError() helper for retry logic
affects: [21-03, 21-04, 21-05, 21-06, 24-campaign-engine]

# Tech tracking
tech-stack:
  added: []
  patterns: [quiet-hours-enforcement, structured-sms-result, error-categorization]

key-files:
  created:
    - lib/sms/quiet-hours.ts
    - lib/sms/send-sms.ts
  modified: []

key-decisions:
  - "toZonedTime/fromZonedTime from date-fns-tz v3 for timezone conversion"
  - "Invalid timezone falls back to America/New_York with console warning"
  - "Opt-out footer skipped if message already contains STOP keyword"
  - "Status callback URL only set when NEXT_PUBLIC_SITE_URL is configured"

patterns-established:
  - "Quiet hours check: Use checkQuietHours() before any SMS send, queue for nextSendTime if blocked"
  - "SMS result handling: sendSms() never throws - always returns { success, error?, errorCode? }"
  - "Error categorization: Use isRetryableError() to decide retry vs permanent failure"

# Metrics
duration: 7min
completed: 2026-02-04
---

# Phase 21 Plan 02: Quiet Hours & SMS Sending Summary

**TCPA-compliant quiet hours enforcement (8am-9pm local) with date-fns-tz timezone conversion, plus core sendSms function with Twilio integration and error categorization**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-04T07:11:54Z
- **Completed:** 2026-02-04T07:18:31Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Built checkQuietHours() with accurate timezone handling via date-fns-tz v3
- Created sendSms() with automatic opt-out footer appending for TCPA compliance
- Added error code categorization for retry vs permanent failure decisions
- Added getHoursUntilQuietHours() helper for UI display

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement quiet hours enforcement with timezone conversion** - `0491422` (feat)
2. **Task 2: Implement core SMS sending function** - `0118dae` (feat)

## Files Created/Modified

- `lib/sms/quiet-hours.ts` - TCPA-compliant quiet hours check with timezone conversion
- `lib/sms/send-sms.ts` - Core SMS sending function via Twilio with error handling

## Decisions Made

1. **date-fns-tz v3 function names**: Used `toZonedTime`/`fromZonedTime` (v3 API renamed from `utcToZonedTime`/`zonedTimeToUtc`).

2. **Invalid timezone fallback**: When invalid timezone is provided, fall back to `America/New_York` with console warning rather than throwing error.

3. **STOP keyword detection**: Skip appending opt-out footer if message body already contains "STOP" (case-insensitive).

4. **Conditional status callback**: Only include `statusCallback` URL in Twilio message if `NEXT_PUBLIC_SITE_URL` is configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed type errors in lib/data/campaign.ts and lib/actions/campaign.ts**
- **Found during:** Task 2 verification (typecheck)
- **Issue:** Pre-existing type errors from Phase 24-03 parallel development: `any` types in sort callbacks, unused imports, placeholder file
- **Fix:** Added CampaignTouch type imports, typed sort callbacks, removed unused imports, fixed placeholder export
- **Files modified:** lib/data/campaign.ts, lib/actions/campaign.ts
- **Verification:** `pnpm typecheck` and `pnpm lint` pass
- **Committed in:** `d559def` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Fix was necessary to unblock typecheck verification. No scope creep - parallel Phase 24 work introduced the issue.

## Issues Encountered

None - all code created without issues. Blocking type errors from parallel Phase 24 development were fixed as part of verification.

## User Setup Required

Twilio environment variables must be configured (from 21-01):

| Variable | Source |
|----------|--------|
| `TWILIO_ACCOUNT_SID` | Twilio Console -> Account Info |
| `TWILIO_AUTH_TOKEN` | Twilio Console -> Account Info |
| `TWILIO_PHONE_NUMBER` | Twilio Console -> Phone Numbers (A2P registered) |
| `NEXT_PUBLIC_SITE_URL` | Your deployment URL (for status callback webhook) |

## Next Phase Readiness

**Ready for Phase 21-03:**
- checkQuietHours() available for SMS scheduling logic
- sendSms() available for actual message delivery
- Error categorization ready for retry queue handling

**Blockers:**
- Twilio A2P 10DLC campaign approval still pending
- Env vars must be configured before runtime SMS tests

---
*Phase: 21-sms-foundation-compliance*
*Completed: 2026-02-04*
