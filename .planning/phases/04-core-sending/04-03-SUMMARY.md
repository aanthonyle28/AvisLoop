---
phase: 04-core-sending
plan: 03
subsystem: server-actions
tags: [server-action, send-email, rate-limiting, validation, cooldown]

# Dependency graph
requires:
  - phase: 04-01
    provides: send_logs schema, SendLog types, sendRequestSchema validation
  - phase: 04-02
    provides: Resend email client, React Email template, rate limiter
provides:
  - sendReviewRequest Server Action with comprehensive validation
  - Data fetching functions for send history and usage tracking
affects: [04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-action-validation, audit-log-before-api, idempotency-keys]

key-files:
  created:
    - lib/actions/send.ts
    - lib/data/send-logs.ts
  modified: []

key-decisions:
  - "Create send_log BEFORE calling email API for audit trail even on failures"
  - "Use idempotency key (send-{sendLogId}) to prevent duplicate sends"
  - "Tag emails with send_log_id and business_id for webhook correlation"
  - "14-day cooldown per contact enforced before send"
  - "Monthly tier limits: trial (25), basic (200), pro (500)"
  - "Check contact status (active), opt-out, and cooldown before sending"
  - "Update contact.last_sent_at and send_count after successful send"

patterns-established:
  - "10-step validation flow for send Server Action (auth, rate limit, business, contact, cooldown, opt-out, monthly limit, log, send, update)"
  - "Comprehensive error messages for each failure mode"
  - "Data fetching functions handle auth internally for Server Components"

# Metrics
duration: 2min
completed: 2026-01-27
---

# Phase 04 Plan 03: Send Server Action Summary

**Complete send flow with 10-step validation (auth, rate limit, cooldown, opt-out, monthly limits), audit logging, and contact tracking**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-27T21:53:24Z
- **Completed:** 2026-01-27T21:55:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Implemented sendReviewRequest Server Action with comprehensive business rule validation
- Created send_log BEFORE API call for complete audit trail
- Built data fetching functions for send history, usage stats, and contact eligibility
- Integrated rate limiting, cooldown checks, opt-out status, and monthly tier limits

## Task Commits

Each task was committed atomically:

1. **Task 1: Create send Server Action with all validations** - `a212259` (feat)
2. **Task 2: Create send log data fetching functions** - `b5e46fb` (feat)

## Files Created/Modified
- `lib/actions/send.ts` - sendReviewRequest Server Action with 10-step validation flow
- `lib/data/send-logs.ts` - getSendLogs, getMonthlyUsage, getContactSendStats data functions

## Decisions Made

**1. Audit log before API call**
Created send_log with status 'pending' BEFORE calling Resend API. This ensures complete audit trail even if API call fails or times out.

**2. Idempotency key pattern**
Used `idempotencyKey: send-${sendLog.id}` to prevent duplicate sends if Server Action is retried (network issues, double-clicks).

**3. Email tagging for webhooks**
Tagged emails with send_log_id and business_id to enable webhook correlation when delivery status updates arrive.

**4. Comprehensive validation flow**
Implemented 10-step validation flow:
1. Authenticate user
2. Rate limit check (10/min per user)
3. Get business + contact + template
4. Check 14-day cooldown
5. Check opt-out status
6. Check monthly tier limit
7. Create send_log (pending)
8. Send via Resend
9. Update send_log (sent/failed)
10. Update contact tracking

**5. Error messages for each failure mode**
- Auth: "You must be logged in"
- Rate limit: "Rate limit exceeded"
- Business: "Please create a business profile first"
- Google link: "Please add your Google review link"
- Contact: "Contact not found"
- Cooldown: "Please wait X more days"
- Opt-out: "This contact has opted out"
- Archived: "Cannot send to archived contacts"
- Monthly limit: "Monthly send limit reached (N). Upgrade your plan."
- API failure: "Failed to send email: {error message}"

**6. Monthly limit logic**
Only counts successful sends (status: sent, delivered, opened) from first of current month. This ensures failed sends don't count against limit.

**7. Contact tracking updates**
After successful send, updates contact.last_sent_at and increments send_count for analytics and cooldown enforcement.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required (Resend already configured in 04-02).

## Next Phase Readiness

**Ready for 04-04 (Send Flow UI)**
- sendReviewRequest Server Action ready for form submission
- getMonthlyUsage ready for usage display
- getContactSendStats ready for contact send eligibility UI
- Comprehensive validation errors ready for user feedback

**Ready for 04-05 (Send History)**
- getSendLogs ready with pagination and filtering
- SendLogWithContact type includes contact name/email
- RLS policies ensure business isolation

**No blockers**
- All business rules implemented
- Error handling complete
- Type-safe interfaces exported

---
*Phase: 04-core-sending*
*Completed: 2026-01-27*
