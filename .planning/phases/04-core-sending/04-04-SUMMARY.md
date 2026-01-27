---
phase: 04-core-sending
plan: 04
subsystem: webhooks
status: complete
tags: [resend, webhooks, signature-verification, delivery-tracking, opt-out]

dependencies:
  requires: [04-01, 04-02]
  provides: [webhook_handler, delivery_status_tracking, auto_opt_out]
  affects: [04-05]

tech-stack:
  added: []
  patterns: [webhook-signature-verification, service-role-pattern, graceful-error-handling]

key-files:
  created:
    - app/api/webhooks/resend/route.ts
  modified: []

decisions:
  - id: webhook-service-role
    decision: "Use Supabase service role key in webhook handler"
    rationale: "Webhooks have no user context - service role enables database updates without auth"
    alternatives: "Create service account user (unnecessary complexity)"

  - id: webhook-error-handling
    decision: "Always return 200 even on processing errors"
    rationale: "Prevents Resend from retrying on our internal errors, avoiding retry storms"
    alternatives: "Return 500 on DB errors (causes retry loops)"

  - id: auto-opt-out-events
    decision: "Auto opt-out contacts on bounced and complained events"
    rationale: "GDPR/CAN-SPAM compliance - must honor delivery failures and complaints"
    alternatives: "Manual opt-out (violates compliance, risks reputation)"

metrics:
  duration: 2 min
  completed: 2026-01-27
---

# Phase 04 Plan 04: Resend Webhook Handler Summary

**One-liner:** Webhook endpoint that verifies Resend signatures, updates send_log delivery status, and auto-opts-out contacts on bounces/complaints.

## What Was Built

### API Route: app/api/webhooks/resend/route.ts

**Core functionality:**
1. **Webhook signature verification** using Resend SDK
   - Validates svix-id, svix-timestamp, svix-signature headers
   - Uses RESEND_WEBHOOK_SECRET for verification
   - Rejects invalid signatures with 400 status

2. **Event type mapping** to send_log status
   - `email.delivered` → `delivered`
   - `email.bounced` → `bounced`
   - `email.complained` → `complained`
   - `email.opened` → `opened`

3. **Send log status updates**
   - Extracts send_log_id from email tags
   - Updates send_logs.status and updated_at
   - Logs unknown event types for debugging

4. **Auto opt-out on delivery failures**
   - Bounced emails → contact.opted_out = true
   - Complained emails → contact.opted_out = true
   - Fetches contact_id from send_log for update

5. **Graceful error handling**
   - Returns 200 on all scenarios (success, unknown events, processing errors)
   - Prevents Resend retry loops on DB errors
   - Logs errors for debugging without failing webhook

**Security features:**
- Service role key (server-only database access)
- Signature verification prevents unauthorized requests
- No user context required (webhook-initiated updates)

## Commits

| Task | Commit  | Description                           |
|------|---------|---------------------------------------|
| 1    | 34a131a | Create Resend webhook handler         |

## Key Technical Decisions

### Service Role Pattern
Webhook handlers have no user session context - they're called by external services (Resend). Using the service role key allows database updates without auth.uid() context. This is safe because signature verification ensures only Resend can trigger updates.

### Always Return 200
Returning 200 even on processing errors prevents Resend from retrying failed webhooks. Retrying on our DB errors would create retry storms without fixing the underlying issue. We log errors for debugging instead.

### Auto Opt-Out Compliance
Automatically opting out contacts on bounces and complaints is required for:
- **GDPR compliance:** Must honor user preferences (complaints)
- **CAN-SPAM compliance:** Must stop sending to invalid addresses (bounces)
- **Sender reputation:** Continued sending to bounced emails damages domain reputation

### Event Type to Status Mapping
Webhook events map directly to send_log status values:
- **delivered:** Email reached inbox
- **bounced:** Invalid/inactive email address
- **complained:** User marked as spam
- **opened:** User opened email (optional tracking)

Unopened emails remain in "sent" status - we only update on explicit events.

## Verification Results

✅ `npx tsc --noEmit` - no type errors
✅ `npm run build` - compiles successfully
✅ Route exports POST handler
✅ GET handler returns 405 Method Not Allowed
✅ Signature verification uses RESEND_WEBHOOK_SECRET
✅ Status mapping covers all required event types
✅ Auto opt-out triggers on bounced and complained events
✅ Returns 200 on all scenarios (prevents retry storms)
✅ Service role client initialized at module scope

## Deviations from Plan

### Auto-fix Applied (Deviation Rule 3)
**Issue:** Build failed with "Missing API key" error during Next.js build
**Root cause:** Resend SDK requires API key at construction, but .env.local not loaded during build
**Fix:** Pass 'placeholder' fallback value to Resend constructor
**Rationale:** Build-time initialization doesn't need real API key - only runtime execution does
**Files modified:** app/api/webhooks/resend/route.ts
**Classification:** Rule 3 (Blocking issue - prevents build completion)

## Next Phase Readiness

### Ready for 04-05 (Send History UI)
- ✅ Webhook handler updates send_log status in real-time
- ✅ Status values match database schema (delivered, bounced, complained, opened)
- ✅ Send history will show accurate delivery status

### No blockers identified

## User Setup Required

**Resend webhook configuration needed after deployment:**

1. **Deploy application** to get webhook URL
   - Example: `https://your-domain.com/api/webhooks/resend`

2. **Add webhook in Resend Dashboard:**
   - Navigate to: Dashboard → Webhooks → Add Webhook
   - URL: `https://your-domain.com/api/webhooks/resend`
   - Events to subscribe:
     - `email.delivered`
     - `email.bounced`
     - `email.complained`
     - `email.opened` (optional)

3. **Copy webhook signing secret:**
   - Resend Dashboard → Webhooks → Select webhook → Signing Secret
   - Add to `.env.local` or deployment environment:
     ```
     RESEND_WEBHOOK_SECRET=whsec_...
     ```

4. **Test webhook delivery:**
   - Send test email through app (after 04-03 complete)
   - Check Resend Dashboard → Webhooks → Recent Deliveries
   - Verify send_log status updates in database

**Note:** Webhook will return 500 if RESEND_WEBHOOK_SECRET not configured. This is intentional - prevents accepting unverified webhooks.

## Files Reference

**Webhook Handler:**
- `app/api/webhooks/resend/route.ts` - POST endpoint for Resend delivery events

## Performance Considerations

- **Module-scope initialization:** Resend client and Supabase client initialized once, reused across requests
- **Graceful 200 responses:** Prevents webhook retry overhead
- **Index usage:** Updates use send_logs.id primary key (instant lookup)
- **Opt-out updates:** Uses contacts.id primary key (instant lookup)

## Security Considerations

- **Signature verification:** Prevents unauthorized webhook calls
- **Service role isolation:** Only webhook handler has service role access
- **No client exposure:** Webhook handler is server-only (Route Handler)
- **Error logging:** Errors logged without exposing sensitive data
- **Compliance:** Auto opt-out ensures GDPR/CAN-SPAM compliance

## Documentation Updates Needed

- Update docs/PROJECT_STATE.md "User Setup Required" section with webhook configuration steps
- Update docs/DATA_MODEL.md with webhook event flow diagram
