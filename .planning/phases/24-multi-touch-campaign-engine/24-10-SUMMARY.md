---
phase: 24-multi-touch-campaign-engine
plan: 10
subsystem: stop-conditions
tags: [webhooks, enrollment, opt-out, click-tracking]
status: complete

requires:
  - 24-04-campaign-crud
  - 24-06-cron-processor

provides:
  - Email click stops campaign enrollment
  - Email opt-out (bounce/complaint) stops enrollment
  - Stop reason tracking

affects:
  - Campaign completion metrics
  - Customer communication preferences

tech-stack:
  added: []
  patterns:
    - Webhook-driven enrollment state changes
    - Idempotent updates (WHERE status='active')
    - Stop reason enumeration

key-files:
  modified:
    - app/api/webhooks/resend/route.ts

metrics:
  completed: 2026-02-04
---

# Phase 24 Plan 10: Campaign Stop Conditions Summary

**One-liner:** Resend webhook stops campaign enrollments on link click, bounce, or complaint

## What Was Built

### Email Click Stop Condition

When customer clicks review link, their active enrollment stops:

```typescript
// app/api/webhooks/resend/route.ts lines 159-197
if (event.type === 'email.clicked') {
  const enrollmentId = event.data.tags?.find(t => t.name === 'enrollment_id')?.value

  if (enrollmentId) {
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'review_clicked',
        stopped_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('status', 'active')
  } else {
    // Fallback: lookup via send_log
    const { data: sendLog } = await supabase
      .from('send_logs')
      .select('campaign_enrollment_id')
      .eq('id', sendLogId)
      .single()

    if (sendLog?.campaign_enrollment_id) {
      // Same update logic
    }
  }
}
```

### Email Opt-Out Stop Condition

Bounce or complaint events trigger opt-out and enrollment stop:

```typescript
// app/api/webhooks/resend/route.ts lines 124-156
if (OPT_OUT_EVENTS.includes(event.type)) {
  // Get contact_id from send_log
  const { data: sendLog } = await supabase
    .from('send_logs')
    .select('contact_id')
    .eq('id', sendLogId)
    .single()

  if (sendLog?.contact_id) {
    // Mark customer as opted out
    await supabase
      .from('customers')
      .update({ opted_out: true })
      .eq('id', sendLog.contact_id)

    // Stop active enrollments
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'opted_out_email',
        stopped_at: new Date().toISOString(),
      })
      .eq('customer_id', sendLog.contact_id)
      .eq('status', 'active')
  }
}
```

## Stop Reasons Implemented

| Event | Stop Reason | Behavior |
|-------|-------------|----------|
| email.clicked | review_clicked | Stop single enrollment |
| email.bounced | opted_out_email | Opt out customer + stop all enrollments |
| email.complained | opted_out_email | Opt out customer + stop all enrollments |

## Technical Implementation

### Idempotent Updates

All updates include `WHERE status='active'` to ensure:
- Already stopped enrollments aren't updated
- Multiple webhook deliveries don't cause issues
- Stop timestamps remain accurate

### Enrollment ID Resolution

Two-step resolution:
1. Try `enrollment_id` from email tags (added by cron)
2. Fallback to `campaign_enrollment_id` via send_log lookup

### Logging

Console logging for debugging:
- `Stopped enrollment {id} - review clicked`
- `Stopped enrollment {id} - review clicked (via send_log)`
- `Stopped active enrollments for customer {id} - opted out of email`

## SMS Opt-Out Behavior

Per CONTEXT.md, SMS opt-out does NOT stop the entire enrollment:
- SMS touches are skipped (handled in cron processor)
- Email touches continue
- "Channel-specific skip - opted out of SMS sends email touches only"

## Deviations from Plan

None - plan executed as written.

## Verification Passed

- [x] Resend webhook handles email.clicked by stopping enrollment
- [x] Stop uses enrollment_id from tags or falls back to send_log lookup
- [x] Bounce/complaint triggers customer opt-out
- [x] Customer opt-out stops active enrollments
- [x] Stop reason recorded as 'review_clicked' or 'opted_out_email'
- [x] SMS opt-out does NOT stop enrollment (handled in cron)
- [x] Updates are idempotent (WHERE status='active')
- [x] `pnpm typecheck` passes

## Files Modified

- `app/api/webhooks/resend/route.ts` - Added click handling (lines 159-197) and enrollment stop on opt-out (lines 143-154)

---

*Phase: 24-multi-touch-campaign-engine*
*Completed: 2026-02-04*
*Note: Summary created retroactively during milestone audit cleanup*
