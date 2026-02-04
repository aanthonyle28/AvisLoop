# Phase 21: SMS Foundation & Compliance - Research

**Researched:** 2026-02-04
**Domain:** Twilio SMS integration, TCPA compliance, webhook verification, quiet hours enforcement, exponential backoff retry
**Confidence:** HIGH

## Summary

This phase implements SMS sending via Twilio with full TCPA compliance (opt-in tracking, STOP handling, quiet hours enforcement, webhook verification). The codebase already has strong foundations: Phase 20 completed SMS consent tracking fields in the customers table, message_templates table supports both email and SMS channels (Phase 23), and existing scheduled_sends pattern provides proven queue architecture with `FOR UPDATE SKIP LOCKED` and recovery mechanisms.

**Current State Analysis:**
- Twilio credentials configured in .env.local (ACCOUNT_SID, AUTH_TOKEN)
- A2P 10DLC brand approved, campaign pending (can build code, can't send real SMS yet)
- customers table has sms_consent_status, sms_consent_at, phone, phone_status, timezone
- message_templates table supports channel='sms' with body-only templates
- send_logs table exists but needs channel column and provider-agnostic ID tracking
- Existing scheduled_sends pattern uses PostgreSQL claim_due_* RPC with SKIP LOCKED
- No SMS sending code exists yet
- No Twilio webhook endpoints exist yet
- No quiet hours enforcement logic exists yet

**Primary recommendation:** Use twilio-node SDK v5.x for sending and webhook validation, extend send_logs with channel discriminator and provider_message_id JSON field, implement quiet hours with date-fns-tz (utcToZonedTime + isWithinInterval), create retry queue table mirroring scheduled_sends pattern with exponential backoff (1min, 5min, 15min), handle STOP keywords via /api/webhooks/twilio/inbound with signature verification, and queue SMS sends outside quiet hours for next 8am window.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| twilio | 5.3+ | SMS sending and webhook validation | Official Twilio SDK, 113 code snippets in Context7, validateRequest() for webhook security, RestException error handling |
| date-fns-tz | 3.2+ | Timezone conversion for quiet hours | Lightweight (vs moment-timezone), uses Intl API for zone data (no bundle bloat), utcToZonedTime + format patterns verified |
| PostgreSQL RPC | built-in | Atomic claim pattern for retry queue | Proven pattern in scheduled_sends with FOR UPDATE SKIP LOCKED, prevents race conditions |
| Next.js Route Handlers | 15 | Webhook endpoints | App Router pattern, request.text() for raw body, headers() for signature access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 (existing) | Date arithmetic for retry delays | Already in package.json, isWithinInterval for quiet hours check |
| libphonenumber-js | 1.12.36 (existing) | E.164 validation | Already integrated in Phase 20 for phone normalization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| twilio SDK | axios + manual API | Twilio SDK has webhook validation built-in, error handling, idempotency |
| date-fns-tz | luxon | date-fns-tz is smaller (11KB vs 67KB), already using date-fns ecosystem |
| PostgreSQL queue | Redis/BullMQ | Adds infrastructure dependency, Postgres queue works for <10k sends/day |
| Manual retry logic | exponential-backoff npm | Custom logic gives precise control over 3-attempt limit and delays |

**Installation:**
```bash
npm install twilio date-fns-tz
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── sms/
│   ├── twilio.ts                    # Twilio client singleton
│   ├── send-sms.ts                  # Core SMS sending logic
│   └── quiet-hours.ts               # Quiet hours enforcement
├── actions/
│   ├── send.ts                      # EXTEND with SMS channel support
│   └── sms-retry.ts                 # Retry queue management
└── validations/
    └── sms.ts                       # SMS body validation (160 char limit)

app/api/webhooks/twilio/
├── inbound/route.ts                 # STOP keyword handling
└── status/route.ts                  # Delivery status updates

supabase/migrations/
├── XXXXX_extend_send_logs_sms.sql   # Add channel + provider_message_id
└── XXXXX_create_sms_retry_queue.sql # Retry queue table
```

### Pattern 1: SMS Sending with Twilio Node SDK
**What:** Send SMS via Twilio with error handling, status callback, and idempotency
**When to use:** All SMS sends (manual, batch, campaign)

**Example:**
```typescript
// lib/sms/twilio.ts
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing Twilio env vars')
}

export const twilioClient = twilio(accountSid, authToken)

// lib/sms/send-sms.ts
import { twilioClient, twilioPhoneNumber } from './twilio'
import type { RestException } from 'twilio/lib/rest/RestException'

interface SendSmsParams {
  to: string           // E.164 format: +15125551234
  body: string         // Max 160 chars GSM-7
  businessId: string
  customerId: string
  sendLogId: string
}

export async function sendSms(params: SendSmsParams): Promise<{
  success: boolean
  messageSid?: string
  error?: string
}> {
  try {
    const message = await twilioClient.messages.create({
      body: params.body,
      to: params.to,
      from: twilioPhoneNumber,
      statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/status`,
    })

    return {
      success: true,
      messageSid: message.sid,
    }
  } catch (error) {
    // Twilio-specific error handling
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as RestException
      return {
        success: false,
        error: `Twilio Error ${twilioError.code}: ${twilioError.message}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

### Pattern 2: Webhook Signature Verification
**What:** Verify Twilio webhook requests to prevent forgery
**When to use:** All Twilio webhook endpoints (inbound, status)

**Example:**
```typescript
// app/api/webhooks/twilio/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const authToken = process.env.TWILIO_AUTH_TOKEN!

export async function POST(request: NextRequest) {
  // 1. Get raw body and signature
  const body = await request.text()
  const signature = request.headers.get('X-Twilio-Signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
  }

  // 2. Parse URL-encoded body into params object
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  // 3. Verify signature
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}${request.nextUrl.pathname}`
  const isValid = twilio.validateRequest(authToken, signature, url, params)

  if (!isValid) {
    console.error('Invalid Twilio signature')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Process webhook
  const { Body, From, OptOutType } = params

  // Handle STOP keywords
  if (OptOutType === 'STOP') {
    await handleOptOut(From) // Update customer sms_consent_status
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: true })
}

async function handleOptOut(phoneNumber: string) {
  const supabase = await createClient()

  // Update customer consent status
  const { error } = await supabase
    .from('customers')
    .update({
      sms_consent_status: 'opted_out',
      sms_consent_at: new Date().toISOString(),
      sms_consent_source: 'sms_reply_stop',
    })
    .eq('phone', phoneNumber)

  if (error) {
    console.error('Failed to update opt-out status:', error)
  }
}
```

### Pattern 3: Quiet Hours Enforcement with date-fns-tz
**What:** Check if current time in customer's timezone is within 8am-9pm window
**When to use:** Before all SMS sends

**Example:**
```typescript
// lib/sms/quiet-hours.ts
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'
import { isWithinInterval } from 'date-fns'

interface QuietHoursResult {
  canSend: boolean
  nextSendTime?: Date  // When to send if currently in quiet hours
}

export function checkQuietHours(
  customerTimezone: string  // 'America/New_York'
): QuietHoursResult {
  const now = new Date()

  // Convert current UTC time to customer's timezone
  const zonedNow = utcToZonedTime(now, customerTimezone)

  const currentHour = zonedNow.getHours()

  // Check if within 8am-9pm (8 <= hour < 21)
  if (currentHour >= 8 && currentHour < 21) {
    return { canSend: true }
  }

  // Calculate next 8am in customer's timezone
  const next8am = new Date(zonedNow)

  if (currentHour >= 21) {
    // After 9pm - send tomorrow at 8am
    next8am.setDate(next8am.getDate() + 1)
  }

  next8am.setHours(8, 0, 0, 0)

  // Convert back to UTC for storage
  const nextSendTimeUTC = zonedTimeToUtc(next8am, customerTimezone)

  return {
    canSend: false,
    nextSendTime: nextSendTimeUTC,
  }
}

// Usage in send flow
export async function sendSmsWithQuietHours(
  customer: { phone: string; timezone: string },
  message: string,
  sendLogId: string
) {
  const quietHoursCheck = checkQuietHours(customer.timezone)

  if (!quietHoursCheck.canSend) {
    // Queue for later
    await queueSmsRetry({
      sendLogId,
      scheduledFor: quietHoursCheck.nextSendTime!,
      reason: 'quiet_hours',
    })

    return { queued: true, sendAt: quietHoursCheck.nextSendTime }
  }

  // Send immediately
  return await sendSms({
    to: customer.phone,
    body: message,
    sendLogId,
  })
}
```

### Pattern 4: Retry Queue with Exponential Backoff
**What:** Queue failed SMS sends with exponential backoff (1min, 5min, 15min, then fail)
**When to use:** Twilio API failures, quiet hours queueing

**Example:**
```typescript
// supabase/migrations/XXXXX_create_sms_retry_queue.sql
CREATE TABLE IF NOT EXISTS public.sms_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  send_log_id UUID NOT NULL REFERENCES public.send_logs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,

  scheduled_for TIMESTAMPTZ NOT NULL,
  last_attempted_at TIMESTAMPTZ,
  last_error TEXT,

  reason TEXT,  -- 'quiet_hours', 'twilio_error', 'rate_limit'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT sms_retry_queue_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  )
);

-- Partial index for claim query (mirrors scheduled_sends pattern)
CREATE INDEX idx_sms_retry_queue_pending_due
  ON public.sms_retry_queue (status, scheduled_for)
  WHERE status = 'pending';

-- RPC for atomic claim (mirrors claim_due_scheduled_sends)
CREATE OR REPLACE FUNCTION claim_due_sms_retries(limit_count INT DEFAULT 50)
RETURNS SETOF sms_retry_queue AS $$
  UPDATE sms_retry_queue
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM sms_retry_queue
    WHERE status = 'pending' AND scheduled_for <= now()
    ORDER BY scheduled_for ASC
    LIMIT limit_count
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$ LANGUAGE sql;

// lib/actions/sms-retry.ts
export async function queueSmsRetry(params: {
  sendLogId: string
  reason: 'quiet_hours' | 'twilio_error' | 'rate_limit'
  attemptCount?: number
}) {
  const supabase = await createClient()

  const attemptCount = params.attemptCount || 0
  const maxAttempts = 3

  // Calculate next retry time (exponential backoff)
  const delays = [1, 5, 15] // minutes
  const delayMinutes = delays[attemptCount] || 15

  const scheduledFor = new Date()
  scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes)

  // Get send_log to extract business_id and customer_id
  const { data: sendLog } = await supabase
    .from('send_logs')
    .select('business_id, customer_id')
    .eq('id', params.sendLogId)
    .single()

  if (!sendLog) return

  await supabase.from('sms_retry_queue').insert({
    business_id: sendLog.business_id,
    send_log_id: params.sendLogId,
    customer_id: sendLog.customer_id,
    attempt_count: attemptCount,
    max_attempts: maxAttempts,
    scheduled_for: scheduledFor.toISOString(),
    reason: params.reason,
  })
}

// Process retry queue (called by cron)
export async function processSmsRetries() {
  const supabase = await createClient()

  // Claim due retries (mirrors scheduled_sends pattern)
  const { data: retries } = await supabase.rpc('claim_due_sms_retries', {
    limit_count: 50,
  })

  if (!retries || retries.length === 0) return

  for (const retry of retries) {
    // Get customer and send_log
    const { data: customer } = await supabase
      .from('customers')
      .select('phone, timezone, sms_consent_status')
      .eq('id', retry.customer_id)
      .single()

    if (!customer || customer.sms_consent_status !== 'opted_in') {
      // Mark as failed
      await supabase
        .from('sms_retry_queue')
        .update({ status: 'failed' })
        .eq('id', retry.id)
      continue
    }

    // Check quiet hours again
    const quietHoursCheck = checkQuietHours(customer.timezone)
    if (!quietHoursCheck.canSend) {
      // Reschedule for next window
      await supabase
        .from('sms_retry_queue')
        .update({
          status: 'pending',
          scheduled_for: quietHoursCheck.nextSendTime,
        })
        .eq('id', retry.id)
      continue
    }

    // Attempt send
    const { data: sendLog } = await supabase
      .from('send_logs')
      .select('subject')
      .eq('id', retry.send_log_id)
      .single()

    const result = await sendSms({
      to: customer.phone,
      body: sendLog?.subject || 'Message',
      sendLogId: retry.send_log_id,
    })

    if (result.success) {
      // Update retry queue
      await supabase
        .from('sms_retry_queue')
        .update({ status: 'completed' })
        .eq('id', retry.id)

      // Update send_log
      await supabase
        .from('send_logs')
        .update({
          status: 'sent',
          provider_message_id: { twilio_sid: result.messageSid },
        })
        .eq('id', retry.send_log_id)
    } else {
      const newAttemptCount = retry.attempt_count + 1

      if (newAttemptCount >= retry.max_attempts) {
        // Max attempts reached - mark as failed
        await supabase
          .from('sms_retry_queue')
          .update({ status: 'failed', last_error: result.error })
          .eq('id', retry.id)

        await supabase
          .from('send_logs')
          .update({ status: 'failed', error_message: result.error })
          .eq('id', retry.send_log_id)
      } else {
        // Queue next retry
        await queueSmsRetry({
          sendLogId: retry.send_log_id,
          reason: 'twilio_error',
          attemptCount: newAttemptCount,
        })

        // Mark current retry as failed
        await supabase
          .from('sms_retry_queue')
          .update({ status: 'failed', last_error: result.error })
          .eq('id', retry.id)
      }
    }
  }
}
```

### Pattern 5: Extend send_logs for Multi-Channel Support
**What:** Add channel discriminator and provider-agnostic message ID storage
**When to use:** All sends (email and SMS)

**Example:**
```sql
-- Migration: extend_send_logs_sms.sql

-- 1. Add channel column with default 'email' for existing rows
ALTER TABLE send_logs
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'sms'));

-- Remove default after migration (new rows must specify channel)
ALTER TABLE send_logs ALTER COLUMN channel DROP DEFAULT;

-- 2. Rename provider_id to provider_email_id for clarity
ALTER TABLE send_logs RENAME COLUMN provider_id TO provider_email_id;

-- 3. Add provider_message_id JSONB for multi-provider support
-- Structure: { "resend_id": "...", "twilio_sid": "..." }
ALTER TABLE send_logs
  ADD COLUMN provider_message_id JSONB DEFAULT '{}'::jsonb;

-- 4. Add customer_id FK (currently only contact_id, need both during migration)
ALTER TABLE send_logs
  ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Backfill customer_id from contact_id (contacts view maps to customers)
UPDATE send_logs SET customer_id = contact_id WHERE customer_id IS NULL;

-- Make customer_id NOT NULL after backfill
ALTER TABLE send_logs ALTER COLUMN customer_id SET NOT NULL;

-- 5. Create index on channel for filtering
CREATE INDEX idx_send_logs_channel ON send_logs(channel);

-- 6. Create index on customer_id
CREATE INDEX idx_send_logs_customer_id ON send_logs(customer_id);

-- Example queries after migration:
-- Get all SMS sends: SELECT * FROM send_logs WHERE channel = 'sms'
-- Get Twilio message SID: SELECT provider_message_id->>'twilio_sid' FROM send_logs WHERE id = $1
```

### Pattern 6: Channel Selector in Send UI
**What:** Toggle between email/SMS in send form with character counter for SMS
**When to use:** Manual send UI, template selection

**Example:**
```typescript
// components/send/channel-selector.tsx
'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

export function ChannelSelector() {
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [smsBody, setSmsBody] = useState('')

  const GSM7_LIMIT = 160
  const remaining = GSM7_LIMIT - smsBody.length
  const isOverLimit = remaining < 0

  return (
    <div className="space-y-4">
      <div>
        <Label>Channel</Label>
        <Tabs value={channel} onValueChange={(v) => setChannel(v as 'email' | 'sms')}>
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {channel === 'sms' && (
        <div>
          <Label>Message</Label>
          <Textarea
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            placeholder="Enter SMS message..."
            maxLength={200}  // Allow slight overage for warning
          />
          <div className={`text-sm mt-1 ${isOverLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
            {remaining} characters remaining (160 max for single SMS)
          </div>
          {isOverLimit && (
            <p className="text-sm text-red-600 mt-1">
              Message will be split into multiple SMS (higher cost)
            </p>
          )}
        </div>
      )}

      <input type="hidden" name="channel" value={channel} />
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Don't skip webhook signature verification:** Attackers can forge webhooks to trigger opt-outs or update delivery status
- **Don't send SMS outside quiet hours without queueing:** TCPA violations lead to $500-$1500 fines per message
- **Don't use setTimeout for retries:** Server restarts lose retry state, use database queue
- **Don't send SMS to sms_consent_status='unknown':** TCPA requires explicit opt-in before first message
- **Don't rely on Twilio Advanced Opt-Out:** Standard STOP handling is sufficient, Advanced Opt-Out adds complexity
- **Don't store phone numbers without E.164 validation:** Twilio API rejects invalid formats, wasting retry attempts
- **Don't retry infinitely:** Max 3 attempts prevents infinite loops on permanent failures (invalid number, blocked)
- **Don't mix provider IDs in single column:** Use JSONB for provider_message_id to support multi-provider (Resend email_id + Twilio message_sid)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature validation | Custom HMAC verification | twilio.validateRequest() | Handles URL encoding edge cases, signature header format, protocol variations |
| Timezone conversion | UTC offset math | date-fns-tz utcToZonedTime | Handles DST transitions, IANA timezone database updates, leap seconds |
| Retry queue | In-memory queue with setTimeout | PostgreSQL table with RPC claim pattern | Survives server restarts, handles concurrent workers, atomic claim prevents race conditions |
| SMS character counting | string.length check | Consider GSM-7 encoding | 160-char limit applies to GSM-7, Unicode chars reduce limit to 70, emoji to 70 |
| Phone number validation | Regex patterns | libphonenumber-js (already integrated) | Handles country codes, area codes, carrier-specific rules, validates before API call |
| Exponential backoff | Custom delay calculation | Proven 1min/5min/15min pattern | Avoids thundering herd, aligns with Twilio rate limits, simple to debug |

**Key insight:** Webhook security requires exact URL matching (protocol, host, path, query params) and Twilio's validateRequest handles all edge cases. Timezone math has DST transitions that break naive offset calculations. PostgreSQL queue with SKIP LOCKED is production-proven pattern from scheduled_sends (already in codebase).

## Common Pitfalls

### Pitfall 1: Webhook Signature Validation Fails on Proxy/CDN
**What goes wrong:** Signature validation fails even though webhook is from Twilio because URL doesn't match (http vs https, different host)
**Why it happens:** Next.js running behind proxy, Twilio sees public URL but validation uses internal URL
**How to avoid:** Use NEXT_PUBLIC_SITE_URL for validation URL construction, ensure protocol matches (https in production)
**Warning signs:** All webhooks rejected with 403, signature validation always fails in production but works locally

### Pitfall 2: Quiet Hours Check Uses Sender Timezone Instead of Customer
**What goes wrong:** SMS sent at 10pm customer's time because code uses business.timezone (Eastern) instead of customer.timezone (Pacific)
**Why it happens:** Forgetting customers.timezone exists, defaulting to business timezone
**How to avoid:** Always use customer.timezone for quiet hours, fall back to business.timezone only on customer creation
**Warning signs:** Complaints about late-night texts, TCPA violations, quiet hours seem to work randomly

### Pitfall 3: Retry Queue Creates Infinite Loop on Invalid Phone Number
**What goes wrong:** Invalid phone number retries forever (attempt 1, 2, 3, 4, 5...) because max_attempts check missing
**Why it happens:** Forgetting to increment attempt_count or check max_attempts before queuing next retry
**How to avoid:** Check `if (newAttemptCount >= max_attempts) { mark_failed() } else { queue_retry() }`
**Warning signs:** sms_retry_queue table grows infinitely, same send_log_id appears 100+ times, cron logs show same error repeatedly

### Pitfall 4: STOP Webhook Updates Wrong Customer (Phone Number Collision)
**What goes wrong:** Two customers share same phone number (dad and son), STOP reply opts out both
**Why it happens:** Query `UPDATE customers SET sms_consent_status='opted_out' WHERE phone=$1` affects multiple rows
**How to avoid:** Accept partial opt-out, document in SMS_COMPLIANCE.md, or add unique constraint on phone (breaks valid use case)
**Warning signs:** Customer A opts out, Customer B complains they stopped receiving texts

### Pitfall 5: Character Counter Shows 160 but Twilio Sends 2 Messages
**What goes wrong:** UI shows 158/160 characters, Twilio charges for 2 messages because emoji or special chars used Unicode
**Why it happens:** JavaScript string.length counts UTF-16 code units, not GSM-7 bytes
**How to avoid:** Warn users about Unicode/emoji, document 70-char limit for Unicode, consider GSM-7 encoding library
**Warning signs:** Unexpected Twilio charges, customers report receiving 2 separate texts, "2 segments" in Twilio logs

### Pitfall 6: Quiet Hours Queue Delays Campaign Timing
**What goes wrong:** Job completed at 2pm, campaign configured for 24h delay (next day 2pm), but quiet hours queue delays until 8am, actual send is 42 hours later
**Why it happens:** Quiet hours adds extra delay on top of campaign delay, compounds timing issues
**How to avoid:** Campaign timing should target quiet hours window (schedule for next day 10am, not just +24h)
**Warning signs:** "Send in 24 hours" becomes 48 hours, customers complain about slow follow-up

### Pitfall 7: send_logs.channel Defaults to 'email' for SMS Sends
**What goes wrong:** SMS sends create send_logs with channel='email' because migration added DEFAULT 'email'
**Why it happens:** Forgetting to remove DEFAULT after backfilling existing rows
**How to avoid:** Migration pattern: ADD COLUMN with DEFAULT, backfill, DROP DEFAULT, require channel in INSERT
**Warning signs:** All sends show channel='email', SMS filtering returns 0 rows, analytics dashboard shows 0 SMS sends

### Pitfall 8: Webhook Delivers Out of Order (Queued → Sent → Failed)
**What goes wrong:** Status webhook arrives with status='failed' before status='sent', final status is 'sent' (wrong)
**Why it happens:** Twilio webhooks don't guarantee order, network delays, concurrent requests
**How to avoid:** Use state machine with valid transitions (pending → sent → delivered/failed, not sent → failed → sent)
**Warning signs:** Delivered messages show status='failed', bounced messages show status='delivered'

### Pitfall 9: No Twilio Phone Number Configured (TWILIO_PHONE_NUMBER Missing)
**What goes wrong:** SMS sends fail with "from parameter is required" error
**Why it happens:** A2P 10DLC campaign approved but developer forgot to configure TWILIO_PHONE_NUMBER in env
**How to avoid:** Add env var validation on app startup, throw error if TWILIO_PHONE_NUMBER missing in SMS code path
**Warning signs:** 100% SMS send failures, Twilio error code 21603, "from parameter is required"

### Pitfall 10: Scheduled SMS Sends Don't Respect Quiet Hours
**What goes wrong:** Campaign scheduled for 10pm sends at 10pm instead of queueing for 8am next day
**Why it happens:** Scheduled send logic bypasses quiet hours check, only manual sends check
**How to avoid:** Quiet hours check must happen in final send execution, not scheduling step
**Warning signs:** Scheduled sends arrive at odd hours, manual sends respect quiet hours but scheduled don't

## Code Examples

Verified patterns from official sources:

### Twilio SMS Send with Error Handling
```typescript
// Source: https://context7.com/twilio/twilio-node/llms.txt
import twilio from 'twilio'
import type { RestException } from 'twilio/lib/rest/RestException'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = twilio(accountSid, authToken)

async function sendSms(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      to,  // +15125551234 (E.164)
      from: process.env.TWILIO_PHONE_NUMBER,
      statusCallback: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/status`,
    })

    return { success: true, sid: message.sid, status: message.status }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const twilioError = error as RestException
      console.error(`Twilio Error ${twilioError.code}: ${twilioError.message}`)
      return { success: false, error: twilioError.message, code: twilioError.code }
    }

    return { success: false, error: 'Unknown error' }
  }
}
```

### Webhook Signature Verification (Next.js App Router)
```typescript
// Source: https://context7.com/twilio/twilio-node/llms.txt
// app/api/webhooks/twilio/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const authToken = process.env.TWILIO_AUTH_TOKEN!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('X-Twilio-Signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
  }

  // Parse URL-encoded body
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  // Verify signature
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/inbound`
  const isValid = twilio.validateRequest(authToken, signature, url, params)

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  // Process webhook
  const { Body, From, OptOutType } = params

  if (OptOutType === 'STOP') {
    // Handle opt-out
    await handleOptOut(From)
  }

  return NextResponse.json({ success: true })
}
```

### Quiet Hours Check with date-fns-tz
```typescript
// Source: https://github.com/marnusw/date-fns-tz
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

function checkQuietHours(customerTimezone: string): {
  canSend: boolean
  nextSendTime?: Date
} {
  const now = new Date()
  const zonedNow = utcToZonedTime(now, customerTimezone)

  const hour = zonedNow.getHours()

  // 8am-9pm window (8 <= hour < 21)
  if (hour >= 8 && hour < 21) {
    return { canSend: true }
  }

  // Calculate next 8am
  const next8am = new Date(zonedNow)
  if (hour >= 21) {
    next8am.setDate(next8am.getDate() + 1)  // Tomorrow
  }
  next8am.setHours(8, 0, 0, 0)

  return {
    canSend: false,
    nextSendTime: zonedTimeToUtc(next8am, customerTimezone),
  }
}
```

### STOP Keyword Handling
```typescript
// Source: Twilio documentation + TCPA requirements
async function handleStopKeyword(phoneNumber: string, body: string) {
  const stopKeywords = [
    'STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'
  ]

  const normalizedBody = body.trim().toUpperCase()

  // Check exact match and informal variants
  const isStop = stopKeywords.includes(normalizedBody) ||
    normalizedBody.includes('STOP') ||
    normalizedBody.includes('UNSUBSCRIBE')

  if (!isStop) return

  const supabase = await createClient()

  // Update consent status (TCPA audit trail)
  await supabase
    .from('customers')
    .update({
      sms_consent_status: 'opted_out',
      sms_consent_at: new Date().toISOString(),
      sms_consent_source: 'sms_reply_stop',
      sms_consent_method: 'phone_call',  // Reply is via phone
    })
    .eq('phone', phoneNumber)

  // Twilio automatically sends confirmation message
  // "You have successfully been unsubscribed..."
}
```

### Exponential Backoff Retry Queue
```typescript
// Pattern from existing scheduled_sends + exponential delays
const RETRY_DELAYS = [1, 5, 15]  // minutes

function calculateNextRetry(attemptCount: number): Date {
  const delayMinutes = RETRY_DELAYS[attemptCount] || 15
  const next = new Date()
  next.setMinutes(next.getMinutes() + delayMinutes)
  return next
}

async function queueSmsRetry(params: {
  sendLogId: string
  attemptCount: number
  error: string
}) {
  if (params.attemptCount >= 3) {
    // Max attempts - mark as failed
    await markSendLogFailed(params.sendLogId, params.error)
    return
  }

  const supabase = await createClient()
  const scheduledFor = calculateNextRetry(params.attemptCount)

  await supabase.from('sms_retry_queue').insert({
    send_log_id: params.sendLogId,
    attempt_count: params.attemptCount + 1,
    scheduled_for: scheduledFor.toISOString(),
    last_error: params.error,
  })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| STOP keyword only opt-out | STOP + informal message detection | Jan 2026 TCPA update | Must handle "Leave me alone", "Don't text me", not just exact STOP |
| Boolean opted_out field | Full consent audit trail (status, date, method, IP) | Jan 2026 TCPA update | TCPA requires 4-year retention of consent proof |
| moment-timezone for quiet hours | date-fns-tz | 2023+ | Smaller bundle (11KB vs 67KB), uses Intl API for zone data |
| Twilio Advanced Opt-Out | Standard STOP handling | 2025+ | Advanced Opt-Out adds complexity, standard handling sufficient for most |
| In-memory retry queue | Database queue with SKIP LOCKED | 2020+ PostgreSQL 9.5+ | Survives restarts, handles concurrent workers, proven pattern |
| Single provider_id column | JSONB provider_message_id | Multi-provider era | Supports Resend email_id + Twilio message_sid in same system |
| Manual webhook validation | twilio.validateRequest() | Always | SDK handles edge cases (URL encoding, protocol, query params) |

**Deprecated/outdated:**
- **moment-timezone for timezone conversion:** 67KB bundle too heavy, date-fns-tz uses Intl API (no timezone data in bundle)
- **Keyword-only opt-out:** TCPA Jan 2026 requires handling informal messages beyond STOP
- **setTimeout for retry delays:** Server restarts lose state, use database queue
- **Single provider_id TEXT column:** Multi-channel systems need provider-agnostic storage (JSONB)
- **Twilio Advanced Opt-Out for simple use cases:** Adds complexity, standard STOP handling covers TCPA requirements

## Open Questions

Things that couldn't be fully resolved:

1. **Twilio A2P 10DLC campaign approval timeline**
   - What we know: Brand approved (2026-02-03), campaign pending, typically 1-3 business days
   - What's unclear: Exact approval date, can build code but not test real sends until approved
   - Recommendation: Build all code in Phase 21, test with Twilio test credentials (Magic Numbers), deploy webhooks to production, activate real sends when campaign approved

2. **Phone number collision on STOP handling**
   - What we know: Two customers can share same phone number (family members, business line)
   - What's unclear: Should STOP opt out all customers with that phone, or require customer-specific opt-out?
   - Recommendation: Opt out all customers with matching phone (safer for TCPA compliance), document in SMS_COMPLIANCE.md

3. **GSM-7 vs Unicode character counting in UI**
   - What we know: 160-char limit for GSM-7, 70-char for Unicode, emoji forces Unicode
   - What's unclear: Should UI enforce GSM-7 validation or just warn about Unicode?
   - Recommendation: Phase 21 ships simple string.length counter with 160 limit + warning text, defer GSM-7 encoding library to future phase

4. **Retry queue vs scheduled_sends table unification**
   - What we know: Both tables have similar structure (claim pattern, status, scheduled_for)
   - What's unclear: Should sms_retry_queue be separate table or unified with scheduled_sends?
   - Recommendation: Keep separate for Phase 21 (clearer separation of concerns), consider unification in Phase 24 when campaign engine needs both

5. **TWILIO_PHONE_NUMBER provisioning**
   - What we know: Need to buy/configure Twilio phone number after campaign approval
   - What's unclear: Toll-free vs local number for review requests, area code selection strategy
   - Recommendation: Use toll-free number (no area code matching needed), document in SMS_COMPLIANCE.md post-approval

## Sources

### Primary (HIGH confidence)
- [Twilio Node.js SDK - Context7](https://context7.com/twilio/twilio-node/llms.txt) - SMS sending, webhook validation, error handling patterns
- [date-fns-tz GitHub](https://github.com/marnusw/date-fns-tz) - Timezone conversion API reference
- [Twilio STOP Keyword Support](https://help.twilio.com/articles/31560110671259-How-to-Track-Opt-Out-Opt-In-and-Help-Messages-Using-the-OptOutType-Parameter) - OptOutType webhook parameter
- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) - App Router webhook patterns
- [PostgreSQL FOR UPDATE SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE) - Claim pattern documentation

### Secondary (MEDIUM confidence)
- [TCPA text messages 2026 guide - ActiveProspect](https://activeprospect.com/blog/tcpa-text-messages/) - TCPA compliance requirements (Jan 2026 rules)
- [SMS Quiet Hours Best Practices - Listrak](https://www.listrak.com/blog/sms-quiet-hours-staying-compliant-and-respectful-in-your-messaging) - 8am-9pm standard, timezone detection
- [Queue-Based Exponential Backoff - DEV Community](https://dev.to/andreparis/queue-based-exponential-backoff-a-resilient-retry-pattern-for-distributed-systems-37f3) - Retry pattern architecture
- [Stripe Webhook Verification Next.js - Max Karlsson](https://maxkarlsson.dev/blog/verify-stripe-webhook-signature-in-next-js-api-routes) - App Router webhook signature pattern

### Tertiary (LOW confidence)
- [Twilio Advanced Opt-Out Blog](https://www.twilio.com/en-us/blog/introducing-advanced-opt-out) - Marketing content, less technical detail
- WebSearch results on exponential backoff libraries - Not verified with official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Twilio Node SDK verified in Context7 (113 snippets), date-fns-tz API from GitHub README, PostgreSQL claim pattern proven in scheduled_sends
- Architecture: HIGH - Patterns verified from Twilio docs, date-fns-tz examples, existing codebase (scheduled_sends, send_logs)
- Pitfalls: MEDIUM - Based on Twilio documentation, TCPA compliance articles, logical inference from multi-timezone scenarios
- TCPA compliance: MEDIUM - Based on ActiveProspect/Listrak articles (Jan 2026) but not verified with legal counsel
- Quiet hours enforcement: HIGH - date-fns-tz API verified, 8am-9pm standard confirmed across multiple sources

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, TCPA Jan 2026 rules already in effect)

**Codebase-specific findings:**
- send_logs table has provider_id TEXT (needs rename to provider_email_id + add provider_message_id JSONB)
- scheduled_sends pattern with claim_due_* RPC + SKIP LOCKED is production-proven (reuse for sms_retry_queue)
- message_templates table supports channel='sms' (Phase 23 complete)
- customers table has sms_consent_status, sms_consent_at, phone, phone_status, timezone (Phase 20 complete)
- No SMS sending code exists yet (greenfield implementation)
- Twilio credentials in .env.local (ACCOUNT_SID, AUTH_TOKEN) but TWILIO_PHONE_NUMBER missing (add after campaign approval)
- Existing send.ts action has 532 lines with cooldown, rate limit, monthly quota logic (extend for SMS channel)
