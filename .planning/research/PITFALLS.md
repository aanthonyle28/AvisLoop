# Pitfalls Research: Scheduled Email Sending

**Domain:** Adding scheduled/deferred sending to existing Review SaaS
**Researched:** 2026-01-28
**Confidence:** HIGH (based on official docs, community patterns, and existing codebase analysis)

---

## Critical Pitfalls

These mistakes will break the system or create security vulnerabilities if not handled.

### Pitfall 1: Duplicate Sends Due to Race Conditions

**What goes wrong:**
When a cron job runs every minute, the same scheduled email can be processed multiple times if:
- Previous cron execution hasn't finished when next one starts
- Database transaction isolation is insufficient
- Status updates aren't atomic

With Vercel Cron running every minute and batch sends potentially taking >60 seconds to complete, this creates a race condition window where the same scheduled send could be picked up twice.

**Why it happens:**
- Cron doesn't wait for previous execution to complete
- Query like `WHERE scheduled_for <= NOW() AND status = 'pending'` will return same rows if status isn't updated before next cron tick
- Network delays between read and status update create race window

**Consequences:**
- Contacts receive duplicate emails (violates CAN-SPAM, burns quota, damages reputation)
- Monthly quota counted incorrectly (double/triple counting)
- Cooldown period calculations become incorrect
- Provider rate limits hit faster than expected

**Prevention:**
```sql
-- ATOMIC: Use UPDATE...RETURNING to claim and fetch in one query
UPDATE scheduled_sends
SET status = 'processing',
    processing_started_at = NOW()
WHERE id IN (
  SELECT id FROM scheduled_sends
  WHERE scheduled_for <= NOW()
    AND status = 'pending'
  ORDER BY scheduled_for ASC
  LIMIT 25  -- Batch size
  FOR UPDATE SKIP LOCKED  -- PostgreSQL row-level locking
)
RETURNING *;
```

**Detection:**
- Monitor for `provider_id` duplicates with same `contact_id` + `template_id` within short time windows
- Track cron execution overlaps (start time of job N+1 < end time of job N)
- Alert if same `scheduled_send.id` appears in logs from multiple cron executions

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 2: Service Role Key Exposure in Vercel Cron

**What goes wrong:**
Vercel Cron endpoints are publicly accessible URLs. Using service role key without validation means:
- Anyone who discovers the cron endpoint URL can trigger it with forged requests
- Service role key bypasses RLS, granting full database access
- Malicious actor could exhaust quota, send spam, or access all business data

**Why it happens:**
- Cron jobs have no user session (need service role for RLS bypass)
- Developers expose service role key in route handler without secondary authentication
- Vercel Cron doesn't provide built-in authentication beyond optional cron secret

**Consequences:**
- Unauthorized email sends → quota exhaustion, spam complaints, account suspension
- Data breach if endpoint allows arbitrary queries
- Compliance violations (GDPR, CAN-SPAM)

**Prevention:**
```typescript
// app/api/cron/process-scheduled-sends/route.ts
import { headers } from 'next/headers'

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Secret
  const authHeader = (await headers()).get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Use service role ONLY after validation
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ... process scheduled sends
}
```

**Additional layers:**
- Set `CRON_SECRET` in Vercel environment variables
- Configure Vercel Cron with `headers: { "Authorization": "Bearer ${CRON_SECRET}" }`
- Rotate `CRON_SECRET` periodically
- Log all cron invocations with timestamp and result

**Detection:**
- Monitor for unexpected cron endpoint hits (frequency > 1/minute)
- Alert on 401 responses to cron endpoint
- Track cron invocations without matching Vercel deployment IDs

**Source:** [Supabase RLS service role cron job security pitfalls](https://github.com/orgs/supabase/discussions/23136), [Secure Supabase Service Role Key](https://chat2db.ai/resources/blog/secure-supabase-role-key)

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 3: Timezone Confusion Between Storage and Display

**What goes wrong:**
Vercel Cron runs in UTC. Users expect to schedule in their local time. Common mistakes:
- Storing `scheduled_for` in user's local time → cron misses or executes at wrong time
- Displaying UTC times to users → "I scheduled for 9am but it shows 2pm"
- Not accounting for DST transitions → emails send 1 hour early/late twice a year

**Example failure:**
```
User (PST): Schedules for "2026-03-10 09:00 PST" (day DST starts)
Developer: Stores "2026-03-10 09:00:00-08:00"
Cron (UTC): Converts to "2026-03-10 17:00:00Z"
DST happens: PST → PDT, offset changes -08:00 → -07:00
User expectation: Email at 9am PDT (17:00 UTC)
Actual send: 17:00 UTC = 10am PDT (1 hour late!)
```

**Why it happens:**
- Mixing timezone-aware and timezone-naive timestamps
- Storing local times instead of UTC
- Not using user's timezone for display conversions
- DST edge cases not tested

**Consequences:**
- Emails sent at wrong times (damages UX, missed opportunities)
- User confusion ("I scheduled it wrong?")
- Compliance issues if time-sensitive (e.g., "send review request 1 day after service")

**Prevention:**
```typescript
// STORAGE: Always UTC
scheduled_for TIMESTAMPTZ  -- PostgreSQL handles UTC storage

// CONVERSION: Client → Server (scheduling)
const scheduledForUTC = new Date(userSelectedDateTime).toISOString()

// CONVERSION: Server → Client (display)
const userTimezone = 'America/Los_Angeles'  // from user profile
const displayTime = new Date(scheduledForUTC).toLocaleString('en-US', {
  timeZone: userTimezone,
  dateStyle: 'medium',
  timeStyle: 'short'
})
```

**UX best practices:**
- Show user's timezone in scheduling UI: "Schedule for [date] [time] PST"
- Display confirmation: "Scheduled for Jan 28, 2026 at 9:00 AM PST (in 3 hours)"
- Add timezone selector if business serves multiple timezones

**Detection:**
- User reports: "Email sent at wrong time"
- Analytics: Scheduled vs actual send time delta > 60 minutes (excluding processing delays)
- Test DST boundary dates explicitly

**Source:** [Handling Timezones within Enterprise-Level Applications](https://medium.com/@20011002nimeth/handling-timezones-within-enterprise-level-applications-utc-vs-local-time-309cbe438eaf), [Time Zone Selection UX](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/)

**Phase to address:** Phase 2 (Scheduling UI & User Timezone Handling)

---

### Pitfall 4: Forgetting to Re-validate Business Rules at Send Time

**What goes wrong:**
Scheduled sends are created with validation snapshot at schedule time, but conditions change before send time:
- Contact opts out after scheduling → email still sends (CAN-SPAM violation)
- Business hits monthly quota between schedule and send → send fails or quota exceeded
- Contact archived/deleted → email sends to invalid contact
- Cooldown period still active at schedule time but expires by send time → duplicate validation error

**Example:**
```
Monday 9am: User schedules send to 50 contacts for Friday 9am
Monday 10am: Contact #23 opts out
Friday 9am: Cron processes scheduled sends → Contact #23 receives email
Result: CAN-SPAM violation, complaint, potential legal action
```

**Why it happens:**
- Developers validate eligibility only at schedule creation
- Cron processing assumes scheduled sends are "pre-validated"
- No re-check before actual send

**Consequences:**
- Legal violations (CAN-SPAM, GDPR)
- Wasted quota on failed sends
- User confusion ("Why did it skip this contact?")
- Contact complaints → sender reputation damage

**Prevention:**
```typescript
// In cron processor
for (const scheduledSend of scheduledSends) {
  // CRITICAL: Re-fetch contact with current status
  const contact = await getContact(scheduledSend.contact_id)

  // Re-validate ALL business rules
  if (contact.opted_out) {
    await updateScheduledSend(scheduledSend.id, {
      status: 'cancelled',
      cancel_reason: 'contact_opted_out'
    })
    continue
  }

  if (contact.status === 'archived') {
    await updateScheduledSend(scheduledSend.id, {
      status: 'cancelled',
      cancel_reason: 'contact_archived'
    })
    continue
  }

  // Check cooldown (may have changed since scheduling)
  const cooldownCheck = checkCooldown(contact.last_sent_at)
  if (!cooldownCheck.canSend) {
    await updateScheduledSend(scheduledSend.id, {
      status: 'cancelled',
      cancel_reason: 'cooldown_active'
    })
    continue
  }

  // Check monthly quota (current count, not count at schedule time)
  const quotaCheck = await checkMonthlyQuota(business.id)
  if (!quotaCheck.hasQuota) {
    await updateScheduledSend(scheduledSend.id, {
      status: 'cancelled',
      cancel_reason: 'quota_exceeded'
    })
    continue
  }

  // All checks pass → proceed with send
  await processSend(scheduledSend)
}
```

**Detection:**
- Track cancellation reasons in `scheduled_sends` table
- Alert if cancellation rate > 5% (indicates schedule-time vs send-time drift)
- Monthly audit: opted-out contacts who received emails

**Source:** [Common Email Scheduling Mistakes](https://woodpecker.co/blog/how-to-schedule-an-email/), existing codebase analysis

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

## Integration Pitfalls

Mistakes when connecting scheduled sending to existing immediate send flow.

### Pitfall 5: Inconsistent Business Rule Application Between Immediate and Scheduled Sends

**What goes wrong:**
Scheduled sends bypass or apply different validation than immediate sends:
- Immediate send checks rate limit per user, scheduled send has no rate limit
- Immediate send enforces cooldown, scheduled send uses stale cooldown check
- Immediate send uses idempotency keys, scheduled send doesn't
- Monthly quota counted differently (scheduled counted at schedule time vs send time)

**Why it happens:**
- Two separate code paths for immediate vs scheduled
- Copy-paste with drift over time
- Different developers implement each feature
- Scheduled send processor reimplements rules instead of reusing existing functions

**Consequences:**
- Users discover loopholes ("I can bypass cooldown by scheduling")
- Quota accounting becomes inaccurate
- Support burden: "Why did this work but that didn't?"
- Future rule changes need to be updated in multiple places

**Prevention:**
```typescript
// SHARED validation functions (DRY principle)
// lib/validations/send-eligibility.ts
export async function checkContactEligibility(contact, business) {
  // Single source of truth for eligibility rules
  if (contact.opted_out) return { canSend: false, reason: 'opted_out' }
  if (contact.status === 'archived') return { canSend: false, reason: 'archived' }

  const cooldown = checkCooldown(contact.last_sent_at)
  if (!cooldown.canSend) return { canSend: false, reason: 'cooldown' }

  return { canSend: true }
}

export async function checkBusinessQuota(business) {
  const usage = await getMonthlyCount(business.id)
  const limit = MONTHLY_SEND_LIMITS[business.tier]
  if (usage >= limit) return { hasQuota: false, reason: 'quota_exceeded' }
  return { hasQuota: true }
}

// REUSE in both flows
// lib/actions/send.ts (immediate send)
const eligibility = await checkContactEligibility(contact, business)
if (!eligibility.canSend) return { error: eligibility.reason }

// app/api/cron/process-scheduled-sends/route.ts (scheduled send)
const eligibility = await checkContactEligibility(contact, business)
if (!eligibility.canSend) {
  await cancelScheduledSend(id, eligibility.reason)
  continue
}
```

**Testing:**
- Integration test suite covering both immediate and scheduled sends
- Property-based testing: same contact + business should have same eligibility result
- Regression tests when business rules change

**Detection:**
- Code review checklist: "Did you update both send flows?"
- Static analysis: detect duplicate validation logic
- Monthly audit: compare immediate vs scheduled send failure reasons (should have similar distribution)

**Source:** Existing codebase analysis (lib/actions/send.ts has comprehensive validation)

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 6: Idempotency Key Conflicts Between Immediate and Scheduled Sends

**What goes wrong:**
Current code uses `idempotencyKey: 'send-${sendLog.id}'` for Resend. If scheduled sends reuse the same pattern:
- Immediate send creates `send_logs.id = abc123`, uses idempotency key `send-abc123`
- Scheduled send creates `scheduled_sends.id = def456`, references same contact/template
- Both map to different tables but Resend sees them as potentially duplicate if keys collide

Worse: If scheduled send creates a `send_log` BEFORE sending (like immediate flow does), and cron crashes between log creation and send, retry will fail because idempotency key prevents re-send but email was never sent.

**Why it happens:**
- Two different ID spaces (send_logs.id vs scheduled_sends.id) both used for idempotency
- 24-hour Resend idempotency window overlaps with scheduling window
- Retry logic doesn't account for idempotency key reuse

**Consequences:**
- Emails silently not sent (Resend returns cached response from previous send)
- Duplicate emails if keys are different but should be deduplicated
- Debugging nightmare: "Why didn't this scheduled send actually send?"

**Prevention:**
```typescript
// IMMEDIATE SEND: Use send_logs.id
{ idempotencyKey: `immediate-${sendLog.id}` }

// SCHEDULED SEND: Use scheduled_sends.id
{ idempotencyKey: `scheduled-${scheduledSend.id}` }

// ALTERNATIVE: Include timestamp for absolute uniqueness
{ idempotencyKey: `${scheduledSend.id}-${Date.now()}` }

// BEST: Include business context for clarity
{ idempotencyKey: `business-${businessId}-scheduled-${scheduledSend.id}` }
```

**Additional considerations:**
- Resend's 24-hour TTL: Don't rely on idempotency beyond 24 hours
- Document idempotency key format in code comments
- Test retry scenarios explicitly

**Detection:**
- Log idempotency keys with every send attempt
- Monitor Resend API responses for "idempotent request" indicators
- Alert if scheduled send status = 'processing' for > 5 minutes

**Source:** [Resend Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys), [Preventing duplicate emails with Idempotency Keys](https://www.linkedin.com/posts/zenorocha_how-do-you-prevent-duplicate-emails-the-activity-7331716190966362112-EGgm)

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 7: Monthly Quota Counting Confusion (Schedule Time vs Send Time)

**What goes wrong:**
When should a scheduled send count toward monthly quota?
- Option A: At schedule time → user can't schedule more after hitting quota, but quota resets before send time (send fails or credits negative balance)
- Option B: At send time → user can schedule unlimited sends, quota explodes when they all process
- Option C: Decrement at schedule, refund on cancel → complex accounting, race conditions on quota checks

**Example failure (Option B):**
```
User tier: basic (100 sends/month)
Current usage: 95 sends
User schedules: 50 sends for tomorrow
Quota check at schedule time: 95 < 100 ✓ (allows scheduling)
Tomorrow: Cron processes 50 scheduled sends
Result: 145 total sends (45 over quota)
```

**Why it happens:**
- No clear decision on quota reservation semantics
- Immediate sends count at send time, scheduled sends follow same pattern blindly
- Cancellation flow doesn't refund reserved quota

**Consequences:**
- Quota overruns → financial loss if provider charges overage
- User frustration: "Why did it let me schedule if I don't have quota?"
- Billing disputes

**Prevention (Recommended: Reserve at schedule time):**
```typescript
// SCHEDULE TIME: Reserve quota
const currentUsage = await getMonthlyCount(businessId)
const scheduledPending = await getScheduledCount(businessId) // NEW
const totalCommitted = currentUsage + scheduledPending

if (totalCommitted + contactIds.length > monthlyLimit) {
  return { error: 'Insufficient quota (includes pending scheduled sends)' }
}

// Create scheduled sends (counted in scheduledPending)
await createScheduledSends(...)

// SEND TIME: Convert reservation to actual usage
await processSend(scheduledSend)
// (send_log with status=sent now counted in currentUsage)

// CANCELLATION: Free up reservation
await cancelScheduledSend(id)
// (no longer counted in scheduledPending)
```

**Alternative (Simpler: Count at send time with hard limit):**
```typescript
// Prevent over-scheduling with buffer
const scheduledCount = await getScheduledCount(businessId)
if (scheduledCount >= monthlyLimit * 0.5) {
  return { error: 'Too many pending scheduled sends. Wait for some to process.' }
}

// At send time, fail gracefully if quota exceeded
if (currentUsage >= monthlyLimit) {
  await cancelScheduledSend(id, 'quota_exceeded_at_send_time')
  continue
}
```

**UX communication:**
- Show "Available quota: 50 (includes 20 scheduled)" in UI
- Warn user if scheduling will use >80% of remaining quota
- Monthly summary email: "You have 10 scheduled sends pending"

**Detection:**
- Daily report: sum(sent) + sum(scheduled pending) per business
- Alert if any business exceeds quota by >10%
- Audit trail for quota adjustments

**Source:** [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit), existing codebase analysis (lib/actions/send.ts lines 310-318)

**Phase to address:** Phase 2 (Scheduling UI & User Timezone Handling)

---

## UX Pitfalls

Common user experience mistakes with scheduling features.

### Pitfall 8: No Confirmation or Visibility After Scheduling

**What goes wrong:**
User schedules a send, sees success toast, then:
- Can't find list of pending scheduled sends
- Can't edit or cancel scheduled send
- No reminder before send happens
- No notification when send completes
- Forgets they scheduled it, schedules again (duplicate)

**Why it happens:**
- Developers focus on backend processing, neglect UX
- No "scheduled sends" dashboard or list view
- No email confirmation of scheduling action
- No pre-send reminder

**Consequences:**
- User anxiety: "Did it work? When will it send?"
- Support tickets: "How do I cancel a scheduled send?"
- Duplicate sends (user forgets and re-schedules)
- Lost trust in feature

**Prevention:**
```typescript
// 1. Immediate confirmation
toast.success(`Scheduled ${count} emails for ${formatDate(scheduledFor)}`)

// 2. Redirect to scheduled sends view
router.push('/dashboard/scheduled-sends')

// 3. Show pending scheduled sends on dashboard
<ScheduledSendsWidget>
  <p>You have {pendingCount} emails scheduled</p>
  <Link href="/dashboard/scheduled-sends">View & manage →</Link>
</ScheduledSendsWidget>

// 4. Email confirmation (optional but recommended)
await sendConfirmationEmail({
  to: user.email,
  subject: 'Review request scheduled',
  body: `You scheduled ${count} review requests for ${formatDate(scheduledFor)}.
         View details: ${appUrl}/dashboard/scheduled-sends`
})

// 5. Pre-send reminder (optional, for high-value sends)
// 1 hour before scheduled_for, send reminder email
```

**UI must-haves:**
- `/dashboard/scheduled-sends` page with table of pending sends
- Columns: scheduled_for, contact count, template, status, actions (cancel, edit)
- Filter by date range, search by contact
- Cancel button with confirmation dialog
- Badge on sidebar navigation: "Scheduled (3)"

**Source:** [Email Scheduling Not Working in Gmail](https://www.getinboxzero.com/blog/post/email-scheduling-not-working-gmail), [Cancel scheduled email implementation](https://help.salesforce.com/s/articleView?id=000384224&language=en_US&type=1)

**Phase to address:** Phase 3 (Scheduled Sends Management UI)

---

### Pitfall 9: Confusing Timezone Display (See Pitfall 3 for technical details)

**What goes wrong (UX angle):**
User sees "Scheduled for 2026-01-28 17:00:00Z" and has to mentally convert to their timezone. Common UX mistakes:
- Showing UTC times in UI ("What timezone is this?")
- Showing relative times without absolute time ("in 3 hours" → user closes app → comes back → "in 2 hours" → "wait, when exactly?")
- No timezone indicator next to time
- No conversion tool or explanation

**Why it happens:**
- Developers comfortable with UTC forget users aren't
- ISO 8601 timestamps displayed directly from database
- No design spec for timezone UX

**Consequences:**
- User schedules for wrong time ("I thought 9am was in 9am UTC")
- Support burden: "When will my email send?"
- Negative reviews: "Confusing interface"

**Prevention:**
```typescript
// GOOD: Show user's local time with timezone
Scheduled for: Jan 28, 2026 at 9:00 AM PST

// BETTER: Show relative + absolute
Scheduled for: Tomorrow at 9:00 AM PST (in 18 hours)

// BEST: Interactive, clear about timezone
┌─────────────────────────────────────┐
│ Schedule for                        │
│ [Date picker: Jan 28, 2026]         │
│ [Time picker: 09:00 AM]             │
│ Timezone: [PST ▼] (GMT-8)          │
│                                     │
│ ⏰ Email will send in 18 hours     │
│ (Jan 28, 2026 at 5:00 PM UTC)      │
└─────────────────────────────────────┘
```

**Best practices:**
- Always show timezone abbreviation (PST, PDT, EST) next to time
- Detect user's timezone automatically (browser API)
- Allow timezone override in user settings
- Show "Scheduled for [local time] ([relative time])" in confirmation
- Display UTC in dev tools / logs only, not user UI

**Source:** [Time Picker UX Best Practices](https://www.eleken.co/blog-posts/time-picker-ux), [Designing A Time Zone Selection UX](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/)

**Phase to address:** Phase 2 (Scheduling UI & User Timezone Handling)

---

### Pitfall 10: Allowing Cancel Without Clear Expectations

**What goes wrong:**
User cancels a scheduled send but:
- Doesn't realize some emails already sent (batch started processing)
- Expects refund of quota reservation (if quota is reserved at schedule time)
- Cancels accidentally (no confirmation dialog)
- Can't re-schedule same send after cancellation

**Why it happens:**
- Cancel button is too easy to click
- No explanation of what "cancel" means
- Partial sends not communicated
- Status transitions not clear

**Consequences:**
- User frustration: "I cancelled but it still sent!"
- Support tickets
- Quota accounting confusion

**Prevention:**
```typescript
// UI: Cancel confirmation dialog
<AlertDialog>
  <AlertDialogTitle>Cancel scheduled send?</AlertDialogTitle>
  <AlertDialogDescription>
    This will cancel {remainingCount} pending emails.
    {alreadySentCount > 0 && (
      <p className="text-yellow-600">
        Note: {alreadySentCount} emails have already been sent and cannot be cancelled.
      </p>
    )}
    This action cannot be undone.
  </AlertDialogDescription>
  <AlertDialogAction onClick={handleCancel}>Cancel send</AlertDialogAction>
</AlertDialog>

// Backend: Handle partial sends
if (scheduledSend.status === 'processing') {
  return {
    error: 'This send is currently processing. Some emails may have already been sent. Please wait for processing to complete.'
  }
}

// Allow cancel only for 'pending' status
if (scheduledSend.status === 'pending') {
  await updateScheduledSend(id, {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: user.id
  })
}
```

**Status flow for cancellation:**
- `pending` → `cancelled` (user action)
- `processing` → cannot cancel (in progress)
- `sent` / `failed` → cannot cancel (already completed)

**Source:** [Cancel a scheduled email implementation](https://help.salesforce.com/s/articleView?id=000384224&language=en_US&type=1), [Cancel a scheduled user-initiated Send](https://knowledge.hubspot.com/marketing-email/can-i-cancel-a-sent-or-scheduled-email-send-in-hubspot)

**Phase to address:** Phase 3 (Scheduled Sends Management UI)

---

## Operational Pitfalls

Deployment, monitoring, and reliability issues specific to cron-based scheduling.

### Pitfall 11: Vercel Cron Silently Failing Without Monitoring

**What goes wrong:**
Vercel Cron runs every minute but:
- Cron endpoint returns 500 error → Vercel retries, but scheduled sends don't process
- Database connection timeout → cron exits early, partial batch processed
- Deployment during cron execution → cron terminates mid-batch
- Vercel Cron disabled accidentally (plan downgrade, billing issue) → no sends

**Why it happens:**
- Cron failures are silent (no user to report error)
- Developers don't set up monitoring for cron jobs
- Vercel Cron has no built-in alerting
- Logs buried in Vercel dashboard

**Consequences:**
- Scheduled sends stuck in `pending` forever
- Users think emails sent but they didn't
- SLA violations (if promised "send within 5 minutes of scheduled time")
- Reputation damage

**Prevention:**
```typescript
// 1. Cron endpoint returns structured logs
export async function GET(request: Request) {
  const startTime = Date.now()
  let processedCount = 0
  let errorCount = 0

  try {
    const result = await processScheduledSends()
    processedCount = result.processedCount
    errorCount = result.errorCount

    // Log success metrics
    console.log(JSON.stringify({
      type: 'cron_success',
      duration_ms: Date.now() - startTime,
      processed: processedCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    }))

    return NextResponse.json({ success: true, processedCount, errorCount })
  } catch (error) {
    // Log failure
    console.error(JSON.stringify({
      type: 'cron_failure',
      duration_ms: Date.now() - startTime,
      error: error.message,
      timestamp: new Date().toISOString()
    }))

    // Alert external service (e.g., Sentry, Axiom, BetterStack)
    await sendAlert({
      severity: 'critical',
      message: `Cron failed: ${error.message}`,
      context: { processedCount, errorCount }
    })

    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// 2. Dead letter queue for stuck sends
// Every hour, check for scheduled sends older than 10 minutes past scheduled_for
const stuckSends = await db
  .select()
  .from(scheduled_sends)
  .where(
    and(
      eq(scheduled_sends.status, 'pending'),
      lt(scheduled_sends.scheduled_for, new Date(Date.now() - 10 * 60 * 1000))
    )
  )

if (stuckSends.length > 0) {
  await sendAlert({
    severity: 'high',
    message: `${stuckSends.length} scheduled sends are stuck (overdue by >10 min)`,
  })
}

// 3. Health check endpoint
// GET /api/health/scheduled-sends
// Returns: oldest pending send, queue depth, last cron run time
export async function GET() {
  const lastCronRun = await getLastCronRunTime() // from logs or dedicated table
  const pendingCount = await getScheduledSendsCount({ status: 'pending' })
  const oldestPending = await getOldestScheduledSend({ status: 'pending' })

  const isHealthy = (
    lastCronRun && Date.now() - lastCronRun.getTime() < 2 * 60 * 1000 && // Ran in last 2 min
    (!oldestPending || oldestPending.scheduled_for > new Date(Date.now() - 10 * 60 * 1000)) // No sends overdue >10min
  )

  return NextResponse.json({
    healthy: isHealthy,
    lastCronRun,
    pendingCount,
    oldestPendingScheduledFor: oldestPending?.scheduled_for
  })
}
```

**External monitoring:**
- Vercel Cron logs → Axiom/Datadog/Logtail
- BetterStack cron monitoring (ping endpoint after successful run)
- Sentry for error tracking
- Uptime monitoring on health check endpoint (alert if unhealthy)

**Detection:**
- Alert if cron doesn't run for >5 minutes
- Alert if >10 scheduled sends are overdue
- Alert if cron error rate >5%
- Daily summary: cron executions, avg duration, error count

**Source:** [How to Monitor Cron Jobs in 2026](https://dev.to/cronmonitor/how-to-monitor-cron-jobs-in-2026-a-complete-guide-28g9), [Our complete cron job guide for 2026](https://uptimerobot.com/knowledge-hub/cron-monitoring/cron-job-guide/)

**Phase to address:** Phase 4 (Monitoring & Reliability)

---

### Pitfall 12: Resend Rate Limit Exhaustion During Batch Processing

**What goes wrong:**
Resend API has default limit of 2 requests/second. Cron processes 25 scheduled sends in a loop:
```typescript
for (const send of scheduledSends) {
  await resend.emails.send(...) // 25 API calls in rapid succession
}
```
After 2nd send, rate limit kicks in → 429 errors → sends fail

**Why it happens:**
- Batch processing doesn't respect provider rate limits
- No delay between API calls
- Resend's 2/second limit not documented prominently
- Works fine in dev (low volume) but breaks in production

**Consequences:**
- Scheduled sends fail with 429 errors
- Quota wasted (counted at schedule time but send fails)
- User frustration: "Why didn't my scheduled send work?"
- Need manual retry

**Prevention:**
```typescript
// Option 1: Simple delay between sends
for (const send of scheduledSends) {
  await processSend(send)
  await new Promise(resolve => setTimeout(resolve, 500)) // 500ms = 2/sec max
}

// Option 2: Rate-limited queue (better for production)
import pLimit from 'p-limit'

const limit = pLimit(2) // 2 concurrent requests max

const promises = scheduledSends.map(send =>
  limit(() => processSend(send))
)

await Promise.all(promises)

// Option 3: Exponential backoff on 429
async function processSendWithRetry(send, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await resend.emails.send(...)
      return result
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
}
```

**Configuration:**
- Monitor Resend rate limit headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Contact Resend support to increase rate limits (available on paid plans)
- Adjust cron batch size based on rate limit (2/sec * 60sec = 120 max per minute)

**Detection:**
- Log all 429 errors with context (send_id, timestamp)
- Alert if 429 error rate >1% of sends
- Track Resend rate limit headers in logs

**Source:** [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit), [Mastering Email Rate Limits with Resend API](https://dalenguyen.medium.com/mastering-email-rate-limits-a-deep-dive-into-resend-api-and-cloud-run-debugging-f1b97c995904)

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 13: No Graceful Degradation for Partial Batch Failures

**What goes wrong:**
Cron processes batch of 25 scheduled sends:
- Sends 1-10: success
- Send 11: Resend API timeout
- Sends 12-25: never processed (loop breaks)

Users 12-25 never get their scheduled sends, but system shows status = `processing` forever.

**Why it happens:**
- Batch processing loop exits on first error
- No try-catch around individual send
- All-or-nothing transaction logic

**Consequences:**
- Partial sends lost
- Status inconsistency (some `sent`, some stuck in `processing`)
- Manual intervention required

**Prevention:**
```typescript
// Process each send independently with error handling
const results = await Promise.allSettled(
  scheduledSends.map(async (send) => {
    try {
      // Update status to 'processing' with row-level lock
      await updateScheduledSend(send.id, { status: 'processing' })

      // Re-validate business rules
      const validation = await validateSendEligibility(send)
      if (!validation.canSend) {
        await updateScheduledSend(send.id, {
          status: 'cancelled',
          cancel_reason: validation.reason
        })
        return { success: false, reason: validation.reason }
      }

      // Process send
      const result = await processSend(send)

      // Update status based on result
      await updateScheduledSend(send.id, {
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        sent_at: result.success ? new Date().toISOString() : null
      })

      return { success: result.success }
    } catch (error) {
      // Mark as failed, don't block other sends
      await updateScheduledSend(send.id, {
        status: 'failed',
        error_message: error.message
      })

      console.error(`Failed to process scheduled send ${send.id}:`, error)
      return { success: false, error: error.message }
    }
  })
)

// Log summary
const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
const failed = results.filter(r => r.status === 'rejected' || !r.value.success).length

console.log(JSON.stringify({
  type: 'batch_complete',
  total: scheduledSends.length,
  successful,
  failed,
  timestamp: new Date().toISOString()
}))
```

**Retry logic for failed sends:**
```sql
-- Track retry attempts
ALTER TABLE scheduled_sends
ADD COLUMN retry_count INTEGER DEFAULT 0,
ADD COLUMN last_retry_at TIMESTAMPTZ;

-- Exponential backoff for retries
-- Retry failed sends: immediately, +5min, +30min, then give up
```

**Detection:**
- Alert if failure rate >10% in a batch
- Daily report: scheduled sends by status (pending, processing, sent, failed, cancelled)
- Audit sends stuck in `processing` for >5 minutes

**Source:** [Cron Jobs vs Real Task Schedulers](https://dev.to/elvissautet/cron-jobs-vs-real-task-schedulers-a-love-story-1fka), [Managing Distributed Cron Jobs in NestJS](https://medium.com/geekfarmer/managing-distributed-cron-jobs-in-nestjs-from-basic-to-production-ready-solutions-7caed0cc14cf)

**Phase to address:** Phase 1 (Database Schema & Core Processing Logic)

---

### Pitfall 14: No Visibility Into Processing State During Cron Execution

**What goes wrong:**
User schedules 50 emails. Cron starts processing. User opens dashboard and sees:
- Status: "pending" (hasn't updated yet)
- Or status: "processing" (but no progress indicator)
- Or status: "sent" (but which ones? how many? when?)

No way to tell:
- How many have been sent so far
- Which contacts succeeded/failed
- When processing will complete

**Why it happens:**
- Status is binary (pending/processing/sent)
- No progress tracking
- No detailed results stored

**Consequences:**
- User anxiety: "Is it working?"
- Support tickets: "What happened to my scheduled send?"
- No debugging data when things go wrong

**Prevention:**
```sql
-- Add progress tracking to scheduled_sends
ALTER TABLE scheduled_sends
ADD COLUMN total_contacts INTEGER NOT NULL DEFAULT 0,
ADD COLUMN sent_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN failed_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN cancelled_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN processing_started_at TIMESTAMPTZ,
ADD COLUMN processing_completed_at TIMESTAMPTZ;

-- Link individual sends to scheduled_send
ALTER TABLE send_logs
ADD COLUMN scheduled_send_id UUID REFERENCES scheduled_sends(id) ON DELETE SET NULL;
```

```typescript
// Update progress after each send
async function processSend(scheduledSend, contact) {
  const result = await sendEmail(contact)

  // Create send_log
  await createSendLog({
    ...emailData,
    scheduled_send_id: scheduledSend.id,
    status: result.success ? 'sent' : 'failed'
  })

  // Increment counter
  await db
    .update(scheduled_sends)
    .set({
      sent_count: sql`sent_count + 1`,
      failed_count: result.success ? sql`failed_count` : sql`failed_count + 1`
    })
    .where(eq(scheduled_sends.id, scheduledSend.id))
}

// UI: Show progress
<ScheduledSendRow>
  <span>Scheduled for {formatDate(send.scheduled_for)}</span>
  <Progress
    value={(send.sent_count + send.failed_count) / send.total_contacts * 100}
  />
  <span>{send.sent_count} / {send.total_contacts} sent</span>
  {send.failed_count > 0 && (
    <Badge variant="destructive">{send.failed_count} failed</Badge>
  )}
</ScheduledSendRow>
```

**Real-time updates (optional):**
- Polling: Refetch scheduled sends every 5 seconds while status = 'processing'
- Supabase Realtime: Subscribe to scheduled_sends updates
- WebSockets: Push progress updates from cron to frontend

**Source:** UX best practices, existing codebase pattern (batch send results in lib/actions/send.ts lines 500-530)

**Phase to address:** Phase 3 (Scheduled Sends Management UI)

---

## Summary: Pitfall Severity & Phase Mapping

| Pitfall | Severity | Phase to Address | Detection Method |
|---------|----------|------------------|------------------|
| 1. Duplicate sends (race conditions) | CRITICAL | Phase 1 | Monitor provider_id duplicates |
| 2. Service role key exposure | CRITICAL | Phase 1 | Track 401s on cron endpoint |
| 3. Timezone confusion | CRITICAL | Phase 2 | User reports, DST testing |
| 4. Business rule re-validation | CRITICAL | Phase 1 | Opt-out audit, cancellation tracking |
| 5. Inconsistent validation (immediate vs scheduled) | HIGH | Phase 1 | Integration tests, code review |
| 6. Idempotency key conflicts | HIGH | Phase 1 | Log key usage, monitor Resend responses |
| 7. Quota counting confusion | HIGH | Phase 2 | Daily quota audit |
| 8. No confirmation/visibility | MEDIUM | Phase 3 | User feedback, support tickets |
| 9. Confusing timezone display | MEDIUM | Phase 2 | User feedback |
| 10. Cancel expectations unclear | MEDIUM | Phase 3 | Support tickets |
| 11. Silent cron failures | CRITICAL | Phase 4 | External monitoring, health checks |
| 12. Resend rate limit exhaustion | HIGH | Phase 1 | Track 429 errors |
| 13. No graceful degradation | HIGH | Phase 1 | Track batch failure rates |
| 14. No processing visibility | MEDIUM | Phase 3 | User feedback |

---

## Phase-Specific Warnings

### Phase 1: Database Schema & Core Processing Logic
**High-risk areas:**
- Race conditions in cron processor (Pitfall 1)
- Service role authentication (Pitfall 2)
- Business rule re-validation (Pitfall 4)
- Idempotency key design (Pitfall 6)
- Rate limit handling (Pitfall 12)
- Error handling in batch processing (Pitfall 13)

**Mitigation:**
- Use `FOR UPDATE SKIP LOCKED` in SQL
- Implement cron secret validation before any processing
- Extract shared validation functions
- Document idempotency key format
- Implement rate limiting with delays or queues
- Use `Promise.allSettled` for batch processing

### Phase 2: Scheduling UI & User Timezone Handling
**High-risk areas:**
- Timezone storage vs display (Pitfall 3)
- Quota reservation logic (Pitfall 7)
- Confusing timezone UX (Pitfall 9)

**Mitigation:**
- Store UTC, display local with timezone abbreviation
- Decide on quota reservation strategy upfront
- Show relative + absolute times in UI
- Test DST boundary dates

### Phase 3: Scheduled Sends Management UI
**High-risk areas:**
- No visibility after scheduling (Pitfall 8)
- Cancel expectations (Pitfall 10)
- Processing state visibility (Pitfall 14)

**Mitigation:**
- Build dedicated /dashboard/scheduled-sends page
- Show progress bars for processing sends
- Require confirmation for cancellation
- Link to send_logs for detailed results

### Phase 4: Monitoring & Reliability
**High-risk areas:**
- Silent cron failures (Pitfall 11)

**Mitigation:**
- Implement structured logging in cron endpoint
- Set up external monitoring (BetterStack, Sentry)
- Create health check endpoint
- Alert on stuck sends (overdue >10 min)
- Daily summary reports

---

## Open Questions for Roadmap Planning

1. **Quota reservation strategy:** Count at schedule time or send time? (Recommend: schedule time with reservation)
2. **Retry policy:** How many retries for failed sends? (Recommend: 3 retries with exponential backoff)
3. **Batch size:** How many scheduled sends to process per cron tick? (Recommend: 25, limited by Resend rate limit)
4. **User timezone:** Store in user profile or auto-detect? (Recommend: auto-detect with override option)
5. **Monitoring:** Which external service for cron monitoring? (Options: BetterStack, Axiom, Sentry)

---

## Sources

- [Braze Race Conditions](https://www.braze.com/docs/user_guide/engagement_tools/testing/race_conditions)
- [Supabase RLS service role cron job security](https://github.com/orgs/supabase/discussions/23136)
- [Secure Supabase Service Role Key](https://chat2db.ai/resources/blog/secure-supabase-role-key)
- [Resend Idempotency Keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Preventing duplicate emails with Idempotency Keys](https://www.linkedin.com/posts/zenorocha_how-do-you-prevent-duplicate-emails-the-activity-7331716190966362112-EGgm)
- [Resend Rate Limits](https://resend.com/docs/api-reference/rate-limit)
- [Mastering Email Rate Limits with Resend API](https://dalenguyen.medium.com/mastering-email-rate-limits-a-deep-dive-into-resend-api-and-cloud-run-debugging-f1b97c995904)
- [Handling Timezones within Enterprise-Level Applications](https://medium.com/@20011002nimeth/handling-timezones-within-enterprise-level-applications-utc-vs-local-time-309cbe438eaf)
- [Time Picker UX Best Practices](https://www.eleken.co/blog-posts/time-picker-ux)
- [Designing A Time Zone Selection UX](https://smart-interface-design-patterns.com/articles/time-zone-selection-ux/)
- [How to Monitor Cron Jobs in 2026](https://dev.to/cronmonitor/how-to-monitor-cron-jobs-in-2026-a-complete-guide-28g9)
- [Our complete cron job guide for 2026](https://uptimerobot.com/knowledge-hub/cron-monitoring/cron-job-guide/)
- [Cron Jobs vs Real Task Schedulers](https://dev.to/elvissautet/cron-jobs-vs-real-task-schedulers-a-love-story-1fka)
- [Managing Distributed Cron Jobs in NestJS](https://medium.com/geekfarmer/managing-distributed-cron-jobs-in-nestjs-from-basic-to-production-ready-solutions-7caed0cc14cf)
- [Cancel a scheduled email implementation](https://help.salesforce.com/s/articleView?id=000384224&language=en_US&type=1)
- [Cancel a scheduled user-initiated Send](https://knowledge.hubspot.com/marketing-email/can-i-cancel-a-sent-or-scheduled-email-send-in-hubspot)
- [Common Email Scheduling Mistakes](https://woodpecker.co/blog/how-to-schedule-an-email/)
- [Email Scheduling Not Working in Gmail](https://www.getinboxzero.com/blog/post/email-scheduling-not-working-gmail)
