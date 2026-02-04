# Phase 24: Multi-Touch Campaign Engine - Research

**Researched:** 2026-02-04
**Domain:** Multi-touch drip campaign automation with PostgreSQL and Vercel
**Confidence:** HIGH

## Summary

Multi-touch campaign engines automate sequential message delivery (emails and SMS) triggered by job completion events. The system requires four main components: (1) campaign configuration tables storing touch sequences with timing and templates, (2) enrollment tracking tables managing customer progression through campaigns, (3) distributed cron processing using PostgreSQL's FOR UPDATE SKIP LOCKED for race-safe job claiming, and (4) analytics aggregation for performance metrics.

The existing codebase already implements the core patterns needed: Vercel Cron with CRON_SECRET authentication, claim_due_scheduled_sends() RPC using FOR UPDATE SKIP LOCKED, multi-tenant business scoping with RLS, and webhook-based status tracking via Resend. Phase 24 extends these patterns to handle multi-touch sequences with stop conditions and channel-specific throttling.

Key architectural decisions: (1) anchor timing to scheduled_time not actual_send_time to prevent cascading delays, (2) use channel-based opt-out tracking (SMS vs email separate), (3) implement per-business per-channel rate limiting using Redis/Upstash, (4) compute analytics via aggregation queries over send_logs rather than materialized views for simpler maintenance.

**Primary recommendation:** Reuse the existing claim_due_scheduled_sends() pattern by creating claim_due_campaign_touches() RPC that atomically claims due touches, then process in the same Vercel Cron route with channel-specific sending logic.

## Standard Stack

The project's existing stack is already optimal for campaign automation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | Latest | Campaign/enrollment storage, atomic job claiming | Native FOR UPDATE SKIP LOCKED, JSONB for flexible config, excellent RLS support |
| Vercel Cron | Built-in | Scheduled campaign touch processing | Serverless-native, automatic CRON_SECRET auth, runs every minute |
| @upstash/ratelimit | 2.0.8+ | Per-business per-channel throttling | Redis-based distributed rate limiting, works in serverless |
| Resend | 6.9.1+ | Email sending with webhooks | Already integrated, webhook support for opens/clicks |
| Twilio | TBD | SMS sending (Phase 21) | Industry standard for A2P SMS, webhook support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0+ | Timing calculations, timezone handling | Already in use, simpler than moment.js |
| zod | 4.3.6+ | Campaign config validation | Already in use for type-safe forms |
| @tanstack/react-table | 8.21.3+ | Campaign list/enrollment tables | Already in use for customers/jobs tables |

### No Additional Installation Required
All necessary dependencies are already installed. Phase 24 uses existing patterns and libraries.

## Architecture Patterns

### Recommended Database Structure

```
supabase/migrations/
├── 20260204_create_campaigns.sql         # Campaign definitions
├── 20260204_create_campaign_touches.sql  # Touch sequences
├── 20260204_create_campaign_enrollments.sql  # Job→Campaign tracking
├── 20260204_claim_due_campaign_touches.sql   # RPC for atomic claiming
└── 20260204_add_send_log_fields.sql      # Add campaign_id, touch_number
```

### Pattern 1: Campaign Configuration (campaigns table)

**What:** Stores campaign definitions with service type targeting and status toggle

**When to use:** Campaign CRUD operations, enrollment matching

**Schema:**
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_type TEXT, -- NULL = "all services"
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused'
  is_preset BOOLEAN NOT NULL DEFAULT false, -- System presets read-only
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT campaigns_status_valid CHECK (status IN ('active', 'paused')),
  CONSTRAINT campaigns_service_type_valid CHECK (
    service_type IS NULL OR
    service_type IN ('hvac', 'plumbing', 'electrical', 'cleaning',
                     'roofing', 'painting', 'handyman', 'other')
  )
);

-- RLS: Users can view system presets (is_preset=true) OR their own campaigns
CREATE POLICY "Users view campaigns"
ON campaigns FOR SELECT TO authenticated
USING (is_preset = true OR business_id IN (
  SELECT id FROM businesses WHERE user_id = auth.uid()
));
```

**Key insight:** Service type filtering at campaign level enables tiered model (Free=1 default campaign, Pro=per-service campaigns). NULL service_type means "match all jobs."

### Pattern 2: Touch Sequences (campaign_touches table)

**What:** Ordered sequence of message touches within a campaign

**When to use:** Template selection, timing calculation, rendering campaign flow

**Schema:**
```sql
CREATE TABLE campaign_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  touch_number INT NOT NULL, -- 1, 2, 3, 4
  channel TEXT NOT NULL, -- 'email' or 'sms'
  delay_hours INT NOT NULL, -- Hours after job completion (touch 1) or previous touch
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT touches_channel_valid CHECK (channel IN ('email', 'sms')),
  CONSTRAINT touches_touch_number_valid CHECK (touch_number BETWEEN 1 AND 4),
  CONSTRAINT touches_delay_positive CHECK (delay_hours > 0),
  UNIQUE (campaign_id, touch_number)
);

CREATE INDEX idx_touches_campaign_id ON campaign_touches (campaign_id, touch_number);
```

**Key insight:** Delay is ALWAYS relative to previous touch's scheduled time (not actual send time) to prevent cascading delays from quiet hours or failures.

### Pattern 3: Enrollment Tracking (campaign_enrollments table)

**What:** Tracks job progression through campaign touches with state machine

**When to use:** Determining which touches are due, stopping campaigns, analytics

**Schema:**
```sql
CREATE TABLE campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'active', -- State machine
  stop_reason TEXT, -- Why stopped (if stopped)

  current_touch INT NOT NULL DEFAULT 1, -- Next touch to send (1-4)
  touch_1_scheduled_at TIMESTAMPTZ,
  touch_1_sent_at TIMESTAMPTZ,
  touch_1_status TEXT, -- 'pending', 'sent', 'skipped', 'failed'
  touch_2_scheduled_at TIMESTAMPTZ,
  touch_2_sent_at TIMESTAMPTZ,
  touch_2_status TEXT,
  touch_3_scheduled_at TIMESTAMPTZ,
  touch_3_sent_at TIMESTAMPTZ,
  touch_3_status TEXT,
  touch_4_scheduled_at TIMESTAMPTZ,
  touch_4_sent_at TIMESTAMPTZ,
  touch_4_status TEXT,

  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped')
  ),
  CONSTRAINT enrollments_stop_reason_valid CHECK (
    stop_reason IS NULL OR stop_reason IN (
      'review_clicked', 'feedback_submitted', 'opted_out_sms',
      'opted_out_email', 'owner_stopped', 'campaign_paused',
      'campaign_deleted', 'repeat_job'
    )
  ),
  CONSTRAINT enrollments_current_touch_valid CHECK (current_touch BETWEEN 1 AND 4),
  -- One active enrollment per customer per campaign
  UNIQUE (customer_id, campaign_id, status)
    WHERE status = 'active'
);

-- Critical index for claiming due touches
CREATE INDEX idx_enrollments_due_touches ON campaign_enrollments
  USING btree (status, current_touch, touch_1_scheduled_at, touch_2_scheduled_at,
               touch_3_scheduled_at, touch_4_scheduled_at)
  WHERE status = 'active';

CREATE INDEX idx_enrollments_business_campaign ON campaign_enrollments
  (business_id, campaign_id, status);
```

**Key insight:** Denormalized touch timestamps enable simple due-touch queries without joins. The claim RPC can quickly find `WHERE status='active' AND touch_N_scheduled_at <= NOW() AND touch_N_sent_at IS NULL`.

### Pattern 4: Atomic Touch Claiming RPC

**What:** Race-safe claiming of due campaign touches across distributed cron workers

**When to use:** Every minute in Vercel Cron, similar to claim_due_scheduled_sends()

**Implementation:**
```sql
-- Source: Existing claim_due_scheduled_sends() pattern in 00010_claim_due_scheduled_sends.sql
CREATE OR REPLACE FUNCTION claim_due_campaign_touches(limit_count INT DEFAULT 100)
RETURNS TABLE (
  enrollment_id UUID,
  business_id UUID,
  campaign_id UUID,
  job_id UUID,
  customer_id UUID,
  touch_number INT,
  channel TEXT,
  template_id UUID,
  scheduled_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  -- Touch 1
  SELECT
    e.id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
    1 AS touch_number,
    t.channel, t.template_id,
    e.touch_1_scheduled_at
  FROM campaign_enrollments e
  JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 1
  WHERE e.status = 'active'
    AND e.current_touch = 1
    AND e.touch_1_scheduled_at <= NOW()
    AND e.touch_1_sent_at IS NULL
  ORDER BY e.touch_1_scheduled_at ASC
  LIMIT limit_count
  FOR UPDATE OF e SKIP LOCKED

  UNION ALL

  -- Touch 2
  SELECT
    e.id, e.business_id, e.campaign_id, e.job_id, e.customer_id,
    2 AS touch_number,
    t.channel, t.template_id,
    e.touch_2_scheduled_at
  FROM campaign_enrollments e
  JOIN campaign_touches t ON t.campaign_id = e.campaign_id AND t.touch_number = 2
  WHERE e.status = 'active'
    AND e.current_touch = 2
    AND e.touch_2_scheduled_at <= NOW()
    AND e.touch_2_sent_at IS NULL
    AND e.touch_1_sent_at IS NOT NULL -- Guardrail: don't send touch 2 before touch 1
  ORDER BY e.touch_2_scheduled_at ASC
  LIMIT limit_count
  FOR UPDATE OF e SKIP LOCKED

  -- Repeat for touch 3 and touch 4...
  ;
END;
$$ LANGUAGE plpgsql;
```

**Source:** Pattern verified from [PostgreSQL FOR UPDATE SKIP LOCKED for Queue-Based Workflows](https://www.netdata.cloud/academy/update-skip-locked/) and existing codebase implementation.

**Why it works:** FOR UPDATE SKIP LOCKED prevents race conditions between concurrent Vercel Cron invocations. Each worker claims different touches atomically.

### Pattern 5: Channel-Specific Rate Limiting

**What:** Per-business per-channel throttling to prevent spam flags

**When to use:** Before sending each email/SMS in cron processor

**Implementation:**
```typescript
// Source: @upstash/ratelimit sliding window pattern
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Separate limiters per channel
const emailRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 emails per hour
  analytics: true,
  prefix: "ratelimit:email",
});

const smsRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 SMS per hour
  analytics: true,
  prefix: "ratelimit:sms",
});

// In cron processor
const { success, remaining } = await emailRateLimiter.limit(businessId);
if (!success) {
  // Skip this touch, it will be claimed again next minute
  continue;
}
```

**Source:** Pattern from [@upstash/ratelimit documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts) and verified in [API Rate Limiting 2026 guide](https://www.levo.ai/resources/blogs/api-rate-limiting-guide-2026).

**Key insight:** Sliding window prevents burst sending. If business hits 100/hour limit, remaining touches wait for next window. Separate limiters per channel allow 100 emails + 100 SMS simultaneously.

### Pattern 6: Enrollment on Job Completion

**What:** Automatically enroll job in matching campaign when marked complete

**When to use:** Job status changes from any state to 'completed'

**Implementation:**
```typescript
// In jobs update Server Action
async function markJobComplete(jobId: string, enrollInCampaign: boolean = true) {
  // Update job status
  await supabase
    .from('jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (!enrollInCampaign) return;

  // Find matching campaign (service type match or "all services")
  const { data: job } = await supabase
    .from('jobs')
    .select('business_id, customer_id, service_type')
    .eq('id', jobId)
    .single();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, (campaign_touches(touch_number, delay_hours))')
    .eq('business_id', job.business_id)
    .eq('status', 'active')
    .or(`service_type.eq.${job.service_type},service_type.is.null`)
    .order('service_type', { ascending: false }) // Prefer specific match over "all"
    .limit(1)
    .single();

  if (!campaign) return; // No campaign configured

  // Cancel any active enrollments for same customer (repeat job logic)
  await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: 'repeat_job',
      stopped_at: new Date().toISOString()
    })
    .eq('customer_id', job.customer_id)
    .eq('status', 'active');

  // Calculate touch 1 scheduled time
  const touch1 = campaign.campaign_touches.find(t => t.touch_number === 1);
  const touch1ScheduledAt = new Date(Date.now() + touch1.delay_hours * 60 * 60 * 1000);

  // Create enrollment
  await supabase
    .from('campaign_enrollments')
    .insert({
      business_id: job.business_id,
      campaign_id: campaign.id,
      job_id: jobId,
      customer_id: job.customer_id,
      status: 'active',
      current_touch: 1,
      touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
    });
}
```

**Key decisions from CONTEXT.md:**
- Checkbox "Enroll in review campaign" checked by default (90% auto-enroll)
- Repeat job cancels old enrollment, starts fresh from touch 1
- Service type matching: specific campaign preferred, falls back to "all services"
- Touch 1 timing uses service_type_timing from businesses table (Phase 22)

### Pattern 7: Stop Conditions

**What:** Detect events that should stop campaign progression

**When to use:** (1) Resend webhook receives 'opened' or 'clicked' event, (2) Customer opts out, (3) Owner clicks "Stop" button

**Implementation:**
```typescript
// 1. Review link clicked (Resend webhook)
// In /api/webhooks/resend route
if (event.type === 'email.clicked') {
  const { send_log_id } = event.data.tags;

  // Find enrollment via send_log
  const { data: sendLog } = await supabase
    .from('send_logs')
    .select('campaign_enrollment_id')
    .eq('id', send_log_id)
    .single();

  if (sendLog?.campaign_enrollment_id) {
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'review_clicked',
        stopped_at: new Date().toISOString()
      })
      .eq('id', sendLog.campaign_enrollment_id)
      .eq('status', 'active'); // Only stop if still active
  }
}

// 2. Customer opted out of email
// In opt-out handler
await supabase
  .from('campaign_enrollments')
  .update({
    status: 'stopped',
    stop_reason: 'opted_out_email',
    stopped_at: new Date().toISOString()
  })
  .eq('customer_id', customerId)
  .eq('status', 'active');

// 3. Owner manually stops
// In campaign detail page
await supabase
  .from('campaign_enrollments')
  .update({
    status: 'stopped',
    stop_reason: 'owner_stopped',
    stopped_at: new Date().toISOString()
  })
  .eq('id', enrollmentId);
```

**Key decisions from CONTEXT.md:**
- Review clicked OR feedback submitted (Phase 26) both stop campaign
- Partial opt-out (SMS only): Skip SMS touches, continue email touches
- Owner can only stop (no pause/resume) - permanent cancellation
- Campaign paused: All active enrollments stop with reason='campaign_paused'

### Pattern 8: Quiet Hours with Timezone

**What:** Delay sends scheduled during quiet hours to next acceptable window

**When to use:** Before sending each touch, check if scheduled_at falls in quiet hours

**Implementation:**
```typescript
import { getHours, addHours, setHours, setMinutes } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

function adjustForQuietHours(
  scheduledAt: Date,
  customerTimezone: string
): Date {
  // Convert UTC scheduled time to customer's timezone
  const localTime = utcToZonedTime(scheduledAt, customerTimezone);
  const hour = getHours(localTime);

  // Quiet hours: before 8am or after 9pm (TCPA compliance)
  // Stricter states: 8pm cutoff instead of 9pm
  const quietStart = 21; // 9pm (use 20 for stricter states)
  const quietEnd = 8;    // 8am

  if (hour >= quietEnd && hour < quietStart) {
    // Within acceptable window, no adjustment
    return scheduledAt;
  }

  // During quiet hours - delay to next 8am
  let nextWindow = setHours(setMinutes(localTime, 0), 8);
  if (hour >= quietStart) {
    // After 9pm -> next morning 8am
    nextWindow = addHours(nextWindow, 24);
  }

  // Convert back to UTC
  return zonedTimeToUtc(nextWindow, customerTimezone);
}
```

**Source:** Quiet hours requirements from [TCPA SMS Quiet Hours compliance](https://mailchimp.com/resources/sms-quiet-hours/) and [email timezone best practices](https://www.mailerlite.com/blog/best-time-to-send-email).

**Key decisions from CONTEXT.md:**
- Use customer.timezone field (IANA timezone)
- Delay to next window (10pm scheduled → 8am next day)
- Timing reference is previous touch's scheduled time, not adjusted time
- This prevents cascading: Touch 2 delay = 48h after Touch 1 scheduled, even if Touch 1 sent at adjusted time

### Pattern 9: Retry with Exponential Backoff

**What:** Retry failed sends with increasing delays before marking permanently failed

**When to use:** Email provider returns 5xx error or rate limit response

**Implementation:**
```typescript
async function sendWithRetry(
  sendFn: () => Promise<void>,
  maxRetries: number = 3
): Promise<{ success: boolean; error?: string }> {
  const delays = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000]; // 1min, 5min, 15min

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sendFn();
      return { success: true };
    } catch (error) {
      const statusCode = error.statusCode || 500;

      // Don't retry client errors (except 429 rate limit)
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return { success: false, error: error.message };
      }

      // Last attempt
      if (attempt === maxRetries) {
        return { success: false, error: `Failed after ${maxRetries} retries` };
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
    }
  }
}
```

**Source:** Pattern verified from [Exponential Backoff Best Practices](https://betterstack.com/community/guides/monitoring/exponential-backoff/) and [AWS Retry with Backoff Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html).

**Key decisions from CONTEXT.md:**
- After max retries fail: Skip touch, continue to next touch
- Mark touch as 'failed' but don't stop enrollment
- Update enrollment: `touch_N_status = 'failed'`, increment `current_touch`

### Pattern 10: Analytics Aggregation

**What:** Compute campaign performance metrics from send_logs table

**When to use:** Campaign detail page, campaign list quick stats

**Implementation:**
```sql
-- Campaign performance aggregation query
WITH campaign_sends AS (
  SELECT
    sl.campaign_id,
    sl.touch_number,
    COUNT(*) AS total_sends,
    COUNT(*) FILTER (WHERE sl.status = 'opened') AS opens,
    COUNT(*) FILTER (WHERE sl.status = 'clicked') AS clicks,
    COUNT(DISTINCT ce.id) FILTER (WHERE ce.stop_reason = 'review_clicked') AS conversions
  FROM send_logs sl
  JOIN campaign_enrollments ce ON ce.id = sl.campaign_enrollment_id
  WHERE sl.campaign_id = $1
  GROUP BY sl.campaign_id, sl.touch_number
)
SELECT
  touch_number,
  total_sends,
  opens,
  clicks,
  conversions,
  ROUND(100.0 * opens / NULLIF(total_sends, 0), 2) AS open_rate,
  ROUND(100.0 * clicks / NULLIF(total_sends, 0), 2) AS click_rate,
  ROUND(100.0 * conversions / NULLIF(total_sends, 0), 2) AS conversion_rate
FROM campaign_sends
ORDER BY touch_number;
```

**Alternative: Materialized Views** - NOT recommended for this phase.

**Why not materialized views:** Real-time analytics with pg_ivm extension or Timescale continuous aggregates add complexity. For campaign stats refreshed on page load, simple aggregation queries over indexed send_logs are sufficient. Consider materialized views only if dashboard performance becomes an issue (unlikely with proper indexing).

**Source:** Pattern from [PostgreSQL Materialized Views for Analytics](https://oneuptime.com/blog/post/2026-01-25-use-materialized-views-postgresql/view) - evaluated but deferred.

### Anti-Patterns to Avoid

- **Anchoring to actual send time:** Causes cascading delays. Touch 2 scheduled 48h after Touch 1 was sent (not scheduled) means quiet hours delay Touch 1 → also delays Touch 2 → unpredictable campaign duration.

- **Global rate limiting:** Limiting all businesses to shared pool punishes high-tier customers. Use per-business keys: `ratelimit:email:${businessId}`.

- **Updating enrollments after every send:** Atomic claiming at start of processing is sufficient. Update enrollment only after processing all claimed touches.

- **Complex state machine:** Keep it simple: `active` → `completed` or `stopped`. No "paused then resumed" logic (per CONTEXT.md decision).

- **Sending touches out of order:** Always check `touch_N-1_sent_at IS NOT NULL` before claiming touch N. Guardrail prevents race conditions.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | Custom counters in Postgres | @upstash/ratelimit | Distributed, sliding window, works in serverless, already installed |
| Timezone math | Manual offset calculations | date-fns + date-fns-tz | Handles DST, leap years, edge cases |
| State machine validation | Manual if/else chains | Postgres CHECK constraints | Database-level integrity, can't be bypassed |
| Atomic job claiming | SELECT + UPDATE race | FOR UPDATE SKIP LOCKED | Built into Postgres 9.5+, proven pattern |
| Email/SMS retry logic | Custom backoff | Exponential backoff library OR simple delays array | Well-studied delays (1min, 5min, 15min) prevent thundering herd |
| Webhook signature verification | Custom crypto | Resend/Twilio SDKs | Built-in signature validation |
| Campaign analytics | Custom aggregation tables | Standard aggregation queries over send_logs | Simpler, uses existing indexes, no sync issues |

**Key insight:** Campaign engines have well-established patterns. The hardest parts (atomic claiming, rate limiting, retry logic) are solved problems. Don't reinvent them.

## Common Pitfalls

### Pitfall 1: Race Conditions in Enrollment Cancellation

**What goes wrong:** When marking job complete, you query for existing enrollments, then cancel them. But between query and cancel, cron processor might claim a touch from that enrollment.

**Why it happens:** Two transactions reading same data without proper locking.

**How to avoid:**
- Use UPDATE with WHERE condition atomically: `UPDATE campaign_enrollments SET status='stopped' WHERE customer_id=$1 AND status='active'`
- Don't SELECT then UPDATE in separate queries
- Postgres row-level locks protect against double-processing

**Warning signs:** Send logs showing sends after enrollment marked stopped, customer complaints about receiving message after completing action.

### Pitfall 2: Cascading Delays from Actual Send Time

**What goes wrong:** Touch 2 scheduled "48 hours after Touch 1 sent" seems logical, but if Touch 1 hits quiet hours and sends 10 hours late, Touch 2 also sends 10 hours late, and Touch 3 is 20 hours late, etc.

**Why it happens:** Confusing "time between touches" with "predictable campaign duration."

**How to avoid:**
- Always anchor to `scheduled_at` timestamps, never `sent_at`
- Touch 2 scheduled = Touch 1 scheduled + 48h (not Touch 1 sent + 48h)
- Guardrail: Don't send Touch N before Touch N-1 completes, but schedule independently

**Warning signs:** Campaign duration varies wildly between customers, touches bunching up, complaints about unexpected timing.

**Source:** Validated by [Optimizely campaign timing behavior](https://support.optimizely.com/hc/en-us/articles/4407282990989) which notes systems can anchor to either actual or scheduled time - scheduled is more predictable.

### Pitfall 3: Channel-Blind Opt-Out

**What goes wrong:** Customer opts out of SMS, system stops entire campaign including email touches.

**Why it happens:** Single opted_out flag instead of channel-specific tracking.

**How to avoid:**
- Use `sms_consent_status` and `opted_out` (email) separately
- In cron processor: `if (channel === 'sms' && sms_consent_status !== 'opted_in') { skip }`
- Customer can opt out of one channel while staying enrolled for other

**Warning signs:** Customers asking "why did emails stop when I only opted out of texts?"

**TCPA compliance:** Separate channel opt-outs are legally distinct. SMS requires explicit consent (opt-in), email follows CAN-SPAM (opt-out). Don't conflate them.

**Source:** [TCPA Opt-Out Requirements 2026](https://activeprospect.com/blog/tcpa-opt-out-requirements/) clarifies channel-specific consent.

### Pitfall 4: Forgetting Service Role Client for Cron

**What goes wrong:** Cron route uses `createClient()` (browser client) instead of `createServiceRoleClient()`, RLS policies block all queries.

**Why it happens:** Copy-pasting from client-side code, forgetting cron runs server-only.

**How to avoid:**
- **Always** use `createServiceRoleClient()` in /api/cron routes
- Never use browser client in API routes
- Existing codebase has correct pattern in app/api/cron/process-scheduled-sends/route.ts

**Warning signs:** Cron logs showing "no results" despite data in database, RLS policy errors.

### Pitfall 5: Throttling at Wrong Scope

**What goes wrong:** Rate limiter checks `remaining` count but ignores business_id, all businesses share same limit.

**Why it happens:** Forgot to include businessId in rate limit key.

**How to avoid:**
```typescript
// WRONG: Global limit
const { success } = await emailRateLimiter.limit("email-sends");

// CORRECT: Per-business limit
const { success } = await emailRateLimiter.limit(`email:${businessId}`);
```

**Warning signs:** High-volume customer complaining about being throttled when they're under their limit.

### Pitfall 6: Missing Indexes on Scheduled Time

**What goes wrong:** Claiming due touches runs slowly, cron times out, touches accumulate.

**Why it happens:** Query scans entire enrollments table instead of using index on scheduled_at.

**How to avoid:**
- Create index on (status, current_touch, touch_N_scheduled_at) columns used in WHERE clause
- Use partial index `WHERE status='active'` to reduce index size
- Existing pattern from scheduled_sends has correct index strategy

**Warning signs:** Cron execution time increasing over time, claimed count dropping, touches sending late.

**Source:** Verified by [PostgreSQL Performance for Queue Workloads](https://www.pgcasts.com/episodes/the-skip-locked-feature-in-postgres-9-5).

### Pitfall 7: Campaign Deletion with Active Enrollments

**What goes wrong:** User deletes campaign, enrollments reference deleted campaign_id, cron processor crashes.

**Why it happens:** Missing foreign key constraint or allowing deletion without cleanup.

**How to avoid:**
- Add CHECK before deletion: `SELECT COUNT(*) FROM campaign_enrollments WHERE campaign_id=$1 AND status='active'`
- If count > 0, show error: "Cannot delete campaign with active enrollments. Stop enrollments first."
- Alternative: Use ON DELETE CASCADE but mark enrollments as stopped first

**Warning signs:** Database foreign key errors in cron logs, orphaned enrollments.

### Pitfall 8: Not Handling Missing Contact Info

**What goes wrong:** SMS touch scheduled but customer has no phone number, send fails, enrollment gets stuck.

**Why it happens:** Enrollment created before checking all touches have required contact info.

**How to avoid:**
- At enrollment time: Check if campaign has SMS touches AND customer has valid phone
- In cron processor: Skip touch if channel requirements not met (no phone for SMS, no email for email)
- Mark touch as 'skipped', move to next touch
- Don't fail entire enrollment for one invalid touch

**Warning signs:** Enrollments stuck at same touch, retry loops, customer support tickets.

**Source:** Existing codebase checks phone_status and sms_consent_status - extend to campaign touches.

## Code Examples

Verified patterns from official sources and existing codebase:

### Vercel Cron Configuration

```json
// vercel.json
// Source: Existing C:\AvisLoop\vercel.json + Vercel Cron documentation
{
  "crons": [
    {
      "path": "/api/cron/process-scheduled-sends",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/cron/process-campaign-touches",
      "schedule": "* * * * *"
    }
  ]
}
```

**Source:** [Vercel Cron Jobs Quickstart](https://vercel.com/docs/cron-jobs/quickstart)

### Cron Authentication Pattern

```typescript
// app/api/cron/process-campaign-touches/route.ts
// Source: Existing app/api/cron/process-scheduled-sends/route.ts
export async function GET(request: Request) {
  // Authenticate via CRON_SECRET
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return NextResponse.json(
      { ok: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const expectedAuth = `Bearer ${cronSecret}`;
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createServiceRoleClient();

  // ... claim and process touches
}
```

**Source:** [Vercel Cron Security Best Practices 2026](https://medium.com/@quentinmousset/testing-next-js-cron-jobs-locally-my-journey-from-frustration-to-solution-6ffb2e774d7a)

### Resend Webhook Handler for Stop Conditions

```typescript
// app/api/webhooks/resend/route.ts
// Source: Resend webhook documentation + stop conditions logic
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: Request) {
  const event = await request.json();
  const supabase = createServiceRoleClient();

  // Update send_log status from webhook
  if (event.data.email_id) {
    await supabase
      .from('send_logs')
      .update({
        status: event.type.replace('email.', ''), // 'email.opened' → 'opened'
      })
      .eq('provider_id', event.data.email_id);
  }

  // Stop campaign if review clicked
  if (event.type === 'email.clicked' && event.data.tags?.send_log_id) {
    const { data: sendLog } = await supabase
      .from('send_logs')
      .select('campaign_enrollment_id')
      .eq('id', event.data.tags.send_log_id)
      .single();

    if (sendLog?.campaign_enrollment_id) {
      await supabase
        .from('campaign_enrollments')
        .update({
          status: 'stopped',
          stop_reason: 'review_clicked',
          stopped_at: new Date().toISOString(),
        })
        .eq('id', sendLog.campaign_enrollment_id)
        .eq('status', 'active');
    }
  }

  return NextResponse.json({ received: true });
}
```

**Source:** [Resend Webhooks Documentation](https://resend.com/blog/webhooks)

### Campaign Touch Processing Loop

```typescript
// app/api/cron/process-campaign-touches/route.ts
// Core processing logic
for (const touch of claimedTouches) {
  try {
    // 1. Fetch business and customer
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, tier, google_review_link')
      .eq('id', touch.business_id)
      .single();

    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, email, phone, timezone, opted_out, sms_consent_status')
      .eq('id', touch.customer_id)
      .single();

    // 2. Check channel-specific requirements
    if (touch.channel === 'email' && customer.opted_out) {
      await markTouchSkipped(touch, 'opted_out_email');
      continue;
    }

    if (touch.channel === 'sms') {
      if (customer.sms_consent_status !== 'opted_in') {
        await markTouchSkipped(touch, 'no_sms_consent');
        continue;
      }
      if (!customer.phone) {
        await markTouchSkipped(touch, 'no_phone');
        continue;
      }
    }

    // 3. Adjust for quiet hours
    const adjustedTime = adjustForQuietHours(
      new Date(touch.scheduled_at),
      customer.timezone
    );

    if (adjustedTime > new Date()) {
      // Not ready yet, skip for now
      continue;
    }

    // 4. Check rate limit
    const limiter = touch.channel === 'email' ? emailRateLimiter : smsRateLimiter;
    const { success } = await limiter.limit(`${touch.channel}:${touch.business_id}`);

    if (!success) {
      // Hit rate limit, try again next minute
      continue;
    }

    // 5. Send message
    await sendMessage(touch, business, customer);

    // 6. Update enrollment
    await supabase
      .from('campaign_enrollments')
      .update({
        [`touch_${touch.touch_number}_sent_at`]: new Date().toISOString(),
        [`touch_${touch.touch_number}_status`]: 'sent',
        current_touch: touch.touch_number + 1,
        // Calculate next touch scheduled time
        [`touch_${touch.touch_number + 1}_scheduled_at`]: calculateNextTouchTime(
          touch.scheduled_at, // Anchor to THIS touch's scheduled time
          nextTouchDelayHours
        ),
      })
      .eq('id', touch.enrollment_id);

  } catch (error) {
    // Retry logic with exponential backoff
    const retryResult = await sendWithRetry(() => sendMessage(touch, business, customer));

    if (!retryResult.success) {
      // Max retries failed, mark as failed and move to next touch
      await markTouchFailed(touch, retryResult.error);
    }
  }
}

async function markTouchSkipped(touch: ClaimedTouch, reason: string) {
  await supabase
    .from('campaign_enrollments')
    .update({
      [`touch_${touch.touch_number}_status`]: 'skipped',
      current_touch: touch.touch_number + 1,
      // Still calculate next touch time
    })
    .eq('id', touch.enrollment_id);
}
```

**Source:** Pattern adapted from existing app/api/cron/process-scheduled-sends/route.ts

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Materialized views for analytics | Real-time aggregation with pg_ivm | 2025 | pg_ivm enables instant dashboard updates without REFRESH MATERIALIZED VIEW |
| Fixed STOP keyword opt-out | "Any reasonable means" opt-out | April 2026 (TCPA) | Must detect STOP, QUIT, END, CANCEL, UNSUBSCRIBE, etc. |
| Single opt-out for all channels | Channel-specific opt-out | Jan 2026 (TCPA) | SMS opt-out doesn't affect email (and vice versa) |
| Apple Mail open rates ~30% | Apple MPP inflated to ~60% | 2021 | Click-to-open rate (CTOR) more reliable than open rate |
| Node-cron in serverless | Vercel Cron (HTTP requests) | 2023 | Serverless can't keep background processes running |
| SELECT FOR UPDATE | SELECT FOR UPDATE SKIP LOCKED | Postgres 9.5 (2016) | Eliminates blocking, enables horizontal scaling |

**Deprecated/outdated:**
- **Materialized views without pg_ivm:** Requires manual REFRESH, stale data between refreshes. Use pg_ivm or real-time aggregation.
- **Global SMS consent flag:** TCPA 2026 requires opt-out method, IP address, timestamp, who captured it. Use full audit trail.
- **Email open rate as primary KPI:** Apple MPP breaks this. Use click rate and conversion rate instead.
- **Hard-coded 8am-9pm quiet hours:** State laws vary (some require 8pm cutoff). Make configurable per business.

## Open Questions

Things that couldn't be fully resolved:

1. **Twilio SMS Status Webhooks**
   - What we know: Twilio supports delivery status webhooks similar to Resend
   - What's unclear: Phase 21 blocked on A2P campaign approval, exact webhook payload structure unknown
   - Recommendation: Mirror Resend webhook pattern for SMS when Phase 21 completes. Same stop condition logic (SMS clicked → stop campaign).

2. **Materialized Views vs Real-Time Aggregation**
   - What we know: pg_ivm enables instant materialized view updates, but adds complexity
   - What's unclear: Whether dashboard performance requires caching at 100+ campaigns per business
   - Recommendation: Start with real-time aggregation queries. Add pg_ivm materialized views only if performance becomes issue (unlikely with proper indexes on send_logs).

3. **Multi-Campaign Collision Prevention**
   - What we know: Free tier = 1 campaign per business, Pro tier = 1 per service type
   - What's unclear: Edge case where job matches multiple campaigns (service_type='hvac' and 'all' campaigns both active)
   - Recommendation: Prioritize specific service type campaign over 'all'. SQL: `ORDER BY service_type NULLS LAST LIMIT 1`.

4. **Campaign Preset Touch Timing**
   - What we know: User said "Claude's discretion" for exact delays
   - What's unclear: Optimal timing for review requests varies by industry
   - Recommendation:
     - Conservative: Touch 1 @ 24h, Touch 2 @ 72h (3 days)
     - Standard: Touch 1 @ 24h, Touch 2 @ 72h, Touch 3 @ 168h (7 days)
     - Aggressive: Touch 1 @ 4h, Touch 2 @ 24h, Touch 3 @ 72h, Touch 4 @ 168h
     - SMS touches get immediate attention (4h for Aggressive preset's first SMS)

5. **Enrollment Cooldown Scope**
   - What we know: Default 30 days cooldown prevents spam for repeat jobs
   - What's unclear: Whether cooldown is per-customer-per-campaign or per-customer globally
   - Recommendation: Per-customer globally (simplest). If customer enrolled in ANY campaign within 30 days, skip auto-enrollment. Owner can manually enroll if needed.

## Sources

### Primary (HIGH confidence)

- **Existing Codebase Patterns:**
  - C:\AvisLoop\app\api\cron\process-scheduled-sends\route.ts - Cron processing, atomic claiming, CRON_SECRET auth
  - C:\AvisLoop\supabase\migrations\00010_claim_due_scheduled_sends.sql - FOR UPDATE SKIP LOCKED RPC pattern
  - C:\AvisLoop\supabase\migrations\20260203_create_jobs.sql - Multi-tenant RLS, service types, CHECK constraints
  - C:\AvisLoop\vercel.json - Cron configuration

- **Official Documentation:**
  - [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) - Configuration, security, best practices
  - [Resend Webhooks](https://resend.com/blog/webhooks) - Email event types, payload structure
  - [PostgreSQL Row-Level Locks Guide](https://scalablearchitect.com/postgresql-row-level-locks-a-complete-guide-to-for-update-for-share-skip-locked-and-nowait/) - FOR UPDATE SKIP LOCKED behavior
  - [@upstash/ratelimit Documentation](https://upstash.com/docs/redis/sdks/ratelimit-ts) - Sliding window rate limiting

### Secondary (MEDIUM confidence)

- [PostgreSQL SKIP LOCKED for Queue-Based Workflows | Netdata](https://www.netdata.cloud/academy/update-skip-locked/) - Queue processing patterns
- [The Unreasonable Effectiveness of SKIP LOCKED in PostgreSQL](https://www.inferable.ai/blog/posts/postgres-skip-locked) - Real-world examples
- [Multi-Tenant Database Design Patterns 2024](https://daily.dev/blog/multi-tenant-database-design-patterns-2024) - Shared schema with tenant_id
- [TCPA SMS Quiet Hours Compliance | Mailchimp](https://mailchimp.com/resources/sms-quiet-hours/) - 8am-9pm requirement
- [Best Time to Send Email 2026 | MailerLite](https://www.mailerlite.com/blog/best-time-to-send-email) - Timezone scheduling best practices
- [Exponential Backoff Best Practices | Better Stack](https://betterstack.com/community/guides/monitoring/exponential-backoff/) - Retry strategy patterns
- [AWS Retry with Backoff Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/retry-backoff.html) - Official pattern guidance

### Tertiary (LOW confidence - needs validation)

- [Campaign Funnel Analysis | Metabase](https://www.metabase.com/learn/grow-your-data-skills/business-analysis-methods/how-to-do-funnel-analysis) - Analytics event structure (general guidance, not campaign-specific)
- [TCPA Opt-Out Requirements 2026 | ActiveProspect](https://activeprospect.com/blog/tcpa-opt-out-requirements/) - Regulatory changes (legal interpretation, verify with counsel)
- [PostgreSQL Materialized Views 2026 | OneUpTime](https://oneuptime.com/blog/post/2026-01-25-use-materialized-views-postgresql/view) - When to use materialized views (opted to defer)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture patterns: HIGH - Extending proven patterns from existing codebase
- Database schema: HIGH - Following established RLS and multi-tenant patterns
- Cron processing: HIGH - Replicating claim_due_scheduled_sends() pattern
- Rate limiting: HIGH - @upstash/ratelimit is standard solution, well-documented
- Quiet hours: MEDIUM - TCPA requirements clear, but timezone edge cases need testing
- Analytics: MEDIUM - Aggregation queries sufficient, but performance at scale unverified
- Stop conditions: HIGH - Webhook patterns proven, opt-out tracking extends existing fields
- Retry logic: HIGH - Exponential backoff is well-established pattern

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain with established patterns)

**Key constraints from CONTEXT.md applied:**
- 3 campaign presets (Conservative/Standard/Aggressive) with SMS-first for Aggressive
- Timing anchored to scheduled time, not actual send time
- Channel-specific opt-out handling (SMS vs email separate)
- Per-business per-channel throttling (100/hour each)
- Enrollment cooldown (30 days default, 7-90 days range)
- One-to-one campaign-to-service mapping (no multi-service campaigns)
- Free tier = 1 default campaign, Pro tier = 1 per service type
