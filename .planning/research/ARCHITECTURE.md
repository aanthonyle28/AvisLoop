# Architecture Patterns: v2.0 Review Follow-Up System

**Project:** AvisLoop Review SaaS - v2.0 Multi-Channel Campaign Milestone
**Researched:** 2026-02-02
**Confidence:** HIGH

## Executive Summary

This document describes how Twilio SMS, campaign sequences, LLM personalization, and job tracking integrate into the existing Next.js + Supabase + Vercel Cron architecture. The v1.0 MVP established solid patterns: Server Actions for mutations, Route Handlers for webhooks and cron, Supabase RLS for multi-tenancy, and FOR UPDATE SKIP LOCKED for race-safe processing. v2.0 extends these patterns rather than replacing them.

**Key architectural decisions:**
- **Unified messaging pipeline**: Email and SMS share a common `message_templates` table and processing logic
- **Campaign engine extends existing cron**: Same `/api/cron/process-scheduled-sends` route processes both ad-hoc scheduled sends and campaign touches
- **LLM personalization as pipeline stage**: Optional pre-processing step before render, with fallback to template on failure
- **Job-centric data model**: Jobs are the new primary entity, contacts become job-linked, campaigns target jobs not contacts
- **Twilio webhook security**: Signature verification via `twilio.validateRequest()` (same pattern as Resend webhook verification)

## Current Architecture (v1.0 MVP Baseline)

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App Router                    │
├─────────────────────────────────────────────────────────────┤
│ Server Components (default)                                 │
│ - Dashboard pages: /dashboard, /send, /contacts, /history   │
│ - Fetch data via Supabase browser client (RLS enforced)     │
│ - No secrets, scoped to auth.uid()                          │
├─────────────────────────────────────────────────────────────┤
│ Client Components ('use client')                            │
│ - Interactive forms, dialogs, data tables                   │
│ - Call Server Actions for mutations                          │
│ - No direct DB access, no service role                      │
├─────────────────────────────────────────────────────────────┤
│ Server Actions ('use server')                               │
│ - createContact, sendReviewRequest, updateBusiness, etc.    │
│ - Auth via supabase.auth.getUser()                          │
│ - Mutations via Supabase browser client (RLS enforced)      │
│ - Resend email sending, Stripe operations                   │
│ - revalidatePath() for cache invalidation                   │
├─────────────────────────────────────────────────────────────┤
│ Route Handlers (app/api/*)                                  │
│ - Webhooks: /api/webhooks/resend, /api/webhooks/stripe      │
│ - Cron: /api/cron/process-scheduled-sends                   │
│ - Use service role client (no RLS, trusted context)         │
│ - Signature verification for webhooks                        │
│ - CRON_SECRET auth for cron endpoints                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Postgres                       │
├─────────────────────────────────────────────────────────────┤
│ Tables (RLS enabled on all):                                │
│ - businesses, contacts, email_templates, send_logs          │
│ - scheduled_sends, billing, onboarding                      │
│                                                              │
│ RPC Functions:                                              │
│ - claim_due_scheduled_sends(limit_count) → SETOF            │
│   Uses FOR UPDATE SKIP LOCKED for race-safe claiming        │
│ - recover_stuck_scheduled_sends(stale_minutes) → SETOF      │
│   Resets processing → pending for crashed cron runs         │
│                                                              │
│ RLS Pattern:                                                │
│ - All policies use business_id IN (SELECT id FROM businesses│
│   WHERE user_id = auth.uid())                               │
│ - Service role bypasses RLS (used only in webhooks/cron)    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
├─────────────────────────────────────────────────────────────┤
│ Resend (email):                                             │
│ - Send via resend.emails.send() from Server Actions/cron    │
│ - Webhooks POST to /api/webhooks/resend                     │
│ - Signature verification via resend.webhooks.verify()       │
│ - Update send_logs status (delivered, bounced, etc.)        │
│                                                              │
│ Stripe (billing):                                           │
│ - Checkout/portal from Server Actions                       │
│ - Webhooks POST to /api/webhooks/stripe                     │
│ - Signature verification via stripe.webhooks.constructEvent │
│ - Update billing status                                     │
│                                                              │
│ Vercel Cron:                                                │
│ - Triggers /api/cron/process-scheduled-sends every minute   │
│ - Provides CRON_SECRET in Authorization header              │
│ - Processes scheduled_sends table (status: pending → sent)  │
│                                                              │
│ Upstash Redis (rate limiting):                              │
│ - Per-user send rate limit (10 sends/min)                   │
│ - In-memory fallback for dev environment                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Scheduled Send

```
1. User creates scheduled send (Server Action)
   ↓
2. Insert into scheduled_sends (status: 'pending', scheduled_for: future timestamp)
   ↓
3. Vercel Cron triggers every minute
   ↓
4. /api/cron/process-scheduled-sends:
   a. call recover_stuck_scheduled_sends(10) — reset stale processing records
   b. call claim_due_scheduled_sends(50) — atomically claim pending sends
   c. FOR UPDATE SKIP LOCKED ensures no race between concurrent cron runs
   ↓
5. For each claimed scheduled_send:
   a. Fetch business, check quota
   b. Fetch all contacts in contact_ids array
   c. Re-validate each contact (cooldown, opt-out, archived)
   d. Send via Resend with idempotencyKey
   e. Insert/update send_logs
   f. Update contacts (last_sent_at, send_count)
   g. Update scheduled_send (status: completed/failed, executed_at, send_log_ids)
   ↓
6. Resend delivers email → webhook to /api/webhooks/resend
   ↓
7. Update send_logs (status: delivered/bounced/opened)
```

**Key patterns to preserve:**
- **FOR UPDATE SKIP LOCKED**: Prevents double-processing when multiple cron instances run
- **Status transitions**: pending → processing → completed/failed (with recovery for stuck processing)
- **Idempotency keys**: All external API calls include idempotency key to prevent duplicates
- **RLS everywhere**: Every table has explicit policies, service role used only in trusted contexts
- **Revalidate paths**: Server Actions call revalidatePath() after mutations for cache freshness

## New Architecture: v2.0 Extensions

### 1. Database Schema Changes

#### New Tables

**1.1 Jobs Table**

```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Customer info (replaces contact as primary entity)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,

  -- Job details
  job_type TEXT NOT NULL, -- 'plumbing', 'hvac', 'electrical', 'roofing', etc.
  job_date DATE NOT NULL,
  job_address TEXT,
  job_value DECIMAL(10,2),

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'scheduled',
  completed_at TIMESTAMPTZ,

  -- Review tracking
  review_requested BOOLEAN NOT NULL DEFAULT false,
  review_submitted BOOLEAN NOT NULL DEFAULT false,
  review_submitted_at TIMESTAMPTZ,

  -- Campaign enrollment (nullable - jobs can exist without campaigns)
  enrolled_campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT jobs_status_valid CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  CONSTRAINT jobs_customer_contact_check CHECK (
    customer_email IS NOT NULL OR customer_phone IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_jobs_business_id ON public.jobs (business_id);
CREATE INDEX idx_jobs_status ON public.jobs (business_id, status);
CREATE INDEX idx_jobs_job_date ON public.jobs (business_id, job_date DESC);
CREATE INDEX idx_jobs_campaign ON public.jobs (enrolled_campaign_id) WHERE enrolled_campaign_id IS NOT NULL;

-- Composite index for dashboard "ready to send" query
CREATE INDEX idx_jobs_ready_to_send ON public.jobs (business_id, status, review_requested)
  WHERE status = 'completed' AND review_requested = false;

-- RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own jobs"
  ON public.jobs FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users update own jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
```

**Design rationale:**
- Jobs replace contacts as the primary entity (contacts become a v1.0 legacy table)
- Customer contact info embedded in jobs (denormalized for simplicity)
- `review_requested` flag prevents duplicate requests (dashboard "ready to send" filter)
- `enrolled_campaign_id` links jobs to campaigns (nullable for manual sends)
- Composite index optimizes dashboard queries: "completed jobs not yet requested"

**1.2 Campaigns Table**

```sql
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Campaign identity
  name TEXT NOT NULL,
  description TEXT,

  -- Trigger
  trigger_type TEXT NOT NULL DEFAULT 'job_completed',

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft',
  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Touch configuration (stored as JSONB for flexibility)
  touches JSONB NOT NULL DEFAULT '[]',
  -- Example touches array:
  -- [
  --   { "delay_hours": 24, "channel": "email", "template_id": "uuid", "personalize": true },
  --   { "delay_hours": 72, "channel": "sms", "template_id": "uuid", "personalize": false },
  --   { "delay_hours": 168, "channel": "email", "template_id": "uuid", "personalize": false }
  -- ]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT campaigns_status_valid CHECK (
    status IN ('draft', 'active', 'paused', 'archived')
  ),
  CONSTRAINT campaigns_trigger_valid CHECK (
    trigger_type IN ('job_completed', 'manual')
  )
);

-- Indexes
CREATE INDEX idx_campaigns_business_id ON public.campaigns (business_id);
CREATE INDEX idx_campaigns_active ON public.campaigns (business_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users update own campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own campaigns"
  ON public.campaigns FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
```

**Design rationale:**
- `touches` as JSONB array allows flexible multi-touch configuration without separate tables
- Each touch specifies: delay from trigger, channel (email/sms), template_id, personalize flag
- `is_active` separate from `status` allows pausing without losing draft/active distinction
- Trigger type 'job_completed' auto-enrolls jobs, 'manual' requires explicit enrollment

**1.3 Campaign Enrollments Table**

```sql
CREATE TABLE public.campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- Enrollment lifecycle
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_timestamp TIMESTAMPTZ NOT NULL, -- job.completed_at for job_completed campaigns
  status TEXT NOT NULL DEFAULT 'active',

  -- Touch tracking
  current_touch_index INTEGER NOT NULL DEFAULT 0,
  completed_touches INTEGER NOT NULL DEFAULT 0,

  -- Completion
  completed_at TIMESTAMPTZ,
  stopped_reason TEXT, -- 'completed', 'opted_out', 'campaign_paused', 'job_cancelled'

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT enrollments_status_valid CHECK (
    status IN ('active', 'completed', 'stopped')
  ),
  CONSTRAINT enrollments_unique_job_campaign UNIQUE (job_id, campaign_id)
);

-- Indexes
CREATE INDEX idx_enrollments_business_id ON public.campaign_enrollments (business_id);
CREATE INDEX idx_enrollments_campaign_id ON public.campaign_enrollments (campaign_id);
CREATE INDEX idx_enrollments_job_id ON public.campaign_enrollments (job_id);

-- Composite index for cron "due touches" query
CREATE INDEX idx_enrollments_due_touches ON public.campaign_enrollments (
  status, current_touch_index, trigger_timestamp
) WHERE status = 'active';

-- RLS
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments"
  ON public.campaign_enrollments FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- No INSERT/UPDATE/DELETE policies for users - enrollments managed by system
-- (Server Actions will use service role or stored procedures)
```

**Design rationale:**
- `trigger_timestamp` is the anchor for calculating touch due times (e.g., trigger_timestamp + 24h for first touch)
- `current_touch_index` tracks progression through touches array
- `stopped_reason` provides audit trail for why enrollment ended
- Unique constraint prevents duplicate enrollments per job+campaign
- Index on (status, current_touch_index, trigger_timestamp) optimizes cron query for due touches

**1.4 Message Templates Table (Unified Email + SMS)**

```sql
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,

  -- Template identity
  name TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email' or 'sms'

  -- Content
  subject TEXT, -- Only for email
  body TEXT NOT NULL,

  -- Personalization
  supports_llm_personalization BOOLEAN NOT NULL DEFAULT false,
  llm_prompt TEXT, -- Instructions for LLM personalization

  -- Lifecycle
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT templates_channel_valid CHECK (channel IN ('email', 'sms')),
  CONSTRAINT templates_email_has_subject CHECK (
    channel != 'email' OR subject IS NOT NULL
  ),
  CONSTRAINT templates_sms_length CHECK (
    channel != 'sms' OR char_length(body) <= 1600
  )
);

-- Indexes
CREATE INDEX idx_message_templates_business_id ON public.message_templates (business_id);
CREATE INDEX idx_message_templates_channel ON public.message_templates (business_id, channel, is_active);

-- RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own templates"
  ON public.message_templates FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users insert own templates"
  ON public.message_templates FOR INSERT TO authenticated
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users update own templates"
  ON public.message_templates FOR UPDATE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users delete own templates"
  ON public.message_templates FOR DELETE TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
```

**Design rationale:**
- Replaces `email_templates` table with unified template system
- `channel` discriminator allows same CRUD interface for email and SMS
- SMS length constraint enforces 1600 chars (allows for personalization expansion)
- `llm_prompt` stores instructions like "Make this more friendly and mention their specific job type"
- `supports_llm_personalization` flag allows per-template opt-in

#### Modified Tables

**1.5 Update `send_logs` for Multi-Channel**

```sql
-- Add channel column
ALTER TABLE public.send_logs ADD COLUMN channel TEXT NOT NULL DEFAULT 'email';
ALTER TABLE public.send_logs ADD CONSTRAINT send_logs_channel_valid
  CHECK (channel IN ('email', 'sms'));

-- Add job_id reference (nullable for v1.0 contact-based sends)
ALTER TABLE public.send_logs ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Add enrollment reference (nullable for ad-hoc sends)
ALTER TABLE public.send_logs ADD COLUMN enrollment_id UUID
  REFERENCES public.campaign_enrollments(id) ON DELETE SET NULL;

-- Add personalization tracking
ALTER TABLE public.send_logs ADD COLUMN was_personalized BOOLEAN DEFAULT false;
ALTER TABLE public.send_logs ADD COLUMN personalization_failed BOOLEAN DEFAULT false;

-- Add indexes
CREATE INDEX idx_send_logs_job_id ON public.send_logs (job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_send_logs_enrollment_id ON public.send_logs (enrollment_id) WHERE enrollment_id IS NOT NULL;
CREATE INDEX idx_send_logs_channel ON public.send_logs (business_id, channel, created_at DESC);
```

**Migration strategy:**
- Keep `contact_id` column for v1.0 compatibility
- New sends use `job_id` instead
- Dashboard queries check both columns: `WHERE contact_id IS NOT NULL OR job_id IS NOT NULL`

**1.6 Update `businesses` for Twilio + Services**

```sql
-- Add Twilio phone number
ALTER TABLE public.businesses ADD COLUMN twilio_phone_number TEXT;

-- Add services offered (JSONB array for multi-select)
ALTER TABLE public.businesses ADD COLUMN services JSONB DEFAULT '[]';
-- Example: ["plumbing", "drain_cleaning", "water_heater", "emergency_service"]

-- Add software integrations metadata
ALTER TABLE public.businesses ADD COLUMN software_integrations JSONB DEFAULT '{}';
-- Example: { "housecall_pro": { "connected": true, "api_key_set": true } }
```

**1.7 Update `onboarding` for New Steps**

```sql
-- Add new checklist fields
ALTER TABLE public.onboarding ADD COLUMN services_selected BOOLEAN DEFAULT false;
ALTER TABLE public.onboarding ADD COLUMN software_connected BOOLEAN DEFAULT false;
ALTER TABLE public.onboarding ADD COLUMN campaign_created BOOLEAN DEFAULT false;
```

#### New RPC Functions

**1.8 Campaign Touch Processing Function**

```sql
CREATE OR REPLACE FUNCTION claim_due_campaign_touches(
  limit_count INT DEFAULT 50
)
RETURNS TABLE (
  enrollment_id UUID,
  business_id UUID,
  campaign_id UUID,
  job_id UUID,
  touch_index INT,
  touch_config JSONB,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  job_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH due_enrollments AS (
    SELECT
      e.id AS enrollment_id,
      e.business_id,
      e.campaign_id,
      e.job_id,
      e.current_touch_index,
      c.touches,
      j.customer_name,
      j.customer_email,
      j.customer_phone,
      j.job_type
    FROM public.campaign_enrollments e
    JOIN public.campaigns c ON e.campaign_id = c.id
    JOIN public.jobs j ON e.job_id = j.id
    WHERE
      e.status = 'active'
      AND c.is_active = true
      AND e.current_touch_index < jsonb_array_length(c.touches)
      -- Calculate if current touch is due
      AND e.trigger_timestamp +
          ((c.touches->e.current_touch_index->>'delay_hours')::int || ' hours')::interval
          <= now()
    ORDER BY e.trigger_timestamp ASC
    LIMIT limit_count
    FOR UPDATE OF e SKIP LOCKED
  )
  SELECT
    de.enrollment_id,
    de.business_id,
    de.campaign_id,
    de.job_id,
    de.current_touch_index AS touch_index,
    de.touches->de.current_touch_index AS touch_config,
    de.customer_name,
    de.customer_email,
    de.customer_phone,
    de.job_type
  FROM due_enrollments de;
END;
$$ LANGUAGE plpgsql;
```

**Design rationale:**
- Uses FOR UPDATE SKIP LOCKED (same pattern as scheduled_sends claiming)
- Returns all data needed for sending in one query (avoids N+1)
- Calculates due time: trigger_timestamp + delay_hours from touch config
- Joins to jobs table to get customer contact info for sending

### 2. Twilio SMS Integration

#### 2.1 Configuration Module

```typescript
// lib/sms/twilio.ts
import twilio from 'twilio'

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER!

export interface SendSMSOptions {
  to: string
  body: string
  businessId: string
  jobId?: string
  enrollmentId?: string
}

export async function sendSMS(options: SendSMSOptions) {
  const { to, body, businessId, jobId, enrollmentId } = options

  // Business-specific from number (multi-tenant phone numbers)
  const business = await getBusinessWithPhone(businessId)
  const fromNumber = business.twilio_phone_number || TWILIO_PHONE_NUMBER

  try {
    const message = await twilioClient.messages.create({
      from: fromNumber,
      to: to,
      body: body,
      statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`,
    })

    return { success: true, providerId: message.sid }
  } catch (error) {
    console.error('Twilio send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**Key patterns:**
- Per-business phone numbers stored in `businesses.twilio_phone_number`
- Falls back to platform default for businesses without dedicated numbers
- `statusCallback` URL for delivery tracking (same pattern as Resend webhooks)
- Returns `providerId` (Twilio message SID) for correlation in webhooks

#### 2.2 Twilio Webhooks

**Status Callback Webhook** (delivery tracking)

```typescript
// app/api/webhooks/twilio/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()

  // === 1. Parse form data (Twilio sends application/x-www-form-urlencoded) ===
  const formData = await req.formData()
  const body = Object.fromEntries(formData.entries())

  // === 2. Verify Twilio signature ===
  const signature = req.headers.get('X-Twilio-Signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/status`

  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    body
  )

  if (!isValid) {
    console.error('Invalid Twilio signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // === 3. Map Twilio status to our send_logs status ===
  const messageSid = body.MessageSid as string
  const messageStatus = body.MessageStatus as string

  const STATUS_MAP: Record<string, string> = {
    'delivered': 'delivered',
    'undelivered': 'bounced',
    'failed': 'failed',
    'sent': 'sent',
  }

  const newStatus = STATUS_MAP[messageStatus]
  if (!newStatus) {
    console.log(`Unknown Twilio status: ${messageStatus}`)
    return NextResponse.json({ received: true })
  }

  // === 4. Update send_log ===
  const { error } = await supabase
    .from('send_logs')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_id', messageSid)
    .eq('channel', 'sms')

  if (error) {
    console.error('Failed to update send_log:', error)
  }

  return NextResponse.json({ received: true })
}
```

**Inbound Message Webhook** (STOP handling)

```typescript
// app/api/webhooks/twilio/inbound/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from 'twilio'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse'

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()

  // === 1. Parse and verify (same pattern as status webhook) ===
  const formData = await req.formData()
  const body = Object.fromEntries(formData.entries())

  const signature = req.headers.get('X-Twilio-Signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/inbound`

  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    body
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // === 2. Check for STOP keywords ===
  const messageBody = (body.Body as string || '').trim().toUpperCase()
  const fromNumber = body.From as string

  const STOP_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']

  if (STOP_KEYWORDS.includes(messageBody)) {
    // === 3. Opt out all jobs with this phone number ===
    await supabase
      .from('jobs')
      .update({ opted_out: true }) // Add opted_out column to jobs table
      .eq('customer_phone', fromNumber)

    // === 4. Stop active enrollments ===
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stopped_reason: 'opted_out',
        completed_at: new Date().toISOString(),
      })
      .eq('status', 'active')
      .in('job_id', supabase
        .from('jobs')
        .select('id')
        .eq('customer_phone', fromNumber)
      )

    // === 5. Respond with TwiML confirmation ===
    const twiml = new MessagingResponse()
    twiml.message('You have been unsubscribed from our messages.')

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Not a STOP message, acknowledge without response
  return new NextResponse('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
```

**Security notes:**
- Both webhooks use `twilio.validateRequest()` for signature verification
- Same pattern as Resend webhook: verify signature, update DB, return 200
- Inbound webhook returns TwiML (XML response) per Twilio requirements
- Uses service role client (webhooks have no user context)

### 3. LLM Personalization Architecture

#### 3.1 Personalization Pipeline

```typescript
// lib/ai/personalize.ts

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface PersonalizeMessageOptions {
  template: string
  llmPrompt: string
  context: {
    customer_name: string
    job_type: string
    business_name: string
  }
}

export interface PersonalizeMessageResult {
  success: boolean
  body?: string
  error?: string
}

export async function personalizeMessage(
  options: PersonalizeMessageOptions
): Promise<PersonalizeMessageResult> {
  const { template, llmPrompt, context } = options

  try {
    // === 1. Build prompt ===
    const systemPrompt = `You are a helpful assistant that personalizes customer messages.

INSTRUCTIONS:
${llmPrompt}

CONTEXT:
- Customer name: ${context.customer_name}
- Job type: ${context.job_type}
- Business name: ${context.business_name}

ORIGINAL TEMPLATE:
${template}

OUTPUT INSTRUCTIONS:
- Return ONLY the personalized message text
- Do not include any explanations or meta-commentary
- Keep the message under 1500 characters
- Maintain the core message and call-to-action from the template`

    // === 2. Call Claude API with caching ===
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: 'Please personalize the message now.',
        }
      ],
    })

    // === 3. Extract response ===
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim()

    if (!responseText || responseText.length === 0) {
      return {
        success: false,
        error: 'LLM returned empty response'
      }
    }

    return {
      success: true,
      body: responseText
    }

  } catch (error) {
    console.error('LLM personalization error:', error)

    // === Rate limit handling ===
    if (error instanceof Anthropic.APIError && error.status === 429) {
      return {
        success: false,
        error: 'LLM rate limit exceeded'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

**Key design decisions:**

1. **Prompt caching**: System prompt includes `cache_control` for cost efficiency
   - Template + instructions cached for 5 minutes (Anthropic default)
   - Reduces cost by ~90% for repeated personalizations

2. **Rate limiting strategy**:
   - Handle 429 errors gracefully (fall back to template)
   - No retry logic in cron (would delay entire batch)
   - Consider Upstash Redis for cross-request rate tracking

3. **Model selection**:
   - Claude 3.5 Sonnet for quality/speed balance
   - Haiku too inconsistent for brand-sensitive messages
   - Opus unnecessary for this use case

4. **Timeout handling**:
   - Set reasonable timeout (5s) to prevent cron delays
   - Fall back to template on timeout

### 4. Build Order and Dependencies

Based on architectural dependencies, recommended build order:

#### Phase 1: Foundation (Data Model)
1. Migration: Create `jobs` table
2. Migration: Create `message_templates` table (replaces `email_templates`)
3. Migration: Create `campaigns` table
4. Migration: Create `campaign_enrollments` table
5. Migration: Modify `send_logs` for multi-channel
6. Migration: Modify `businesses` for Twilio + services
7. Migration: RPC function `claim_due_campaign_touches()`

**Why first:** All subsequent features depend on these tables

#### Phase 2: Jobs CRUD
1. Server Actions: `createJob`, `updateJob`, `markJobCompleted`
2. Pages: `/dashboard/jobs` (list view)
3. Components: Job form, job status badge
4. Migration: Update `onboarding` table for new steps

**Why second:** Jobs are the core entity; needed before campaigns

#### Phase 3: Twilio SMS Integration
1. Config: `lib/sms/twilio.ts` (sendSMS function)
2. Webhook: `/api/webhooks/twilio/status` (delivery tracking)
3. Webhook: `/api/webhooks/twilio/inbound` (STOP handling)
4. Server Action: `provisionPhoneNumber` (optional for MVP)
5. Test: Send test SMS from dashboard

**Why third:** Independent of campaigns; can be tested with manual sends

#### Phase 4: Message Templates
1. Server Actions: `createTemplate`, `updateTemplate` (unified email/SMS)
2. Pages: `/dashboard/templates` (list view)
3. Components: Template form with channel selector
4. Migration: Migrate existing `email_templates` to `message_templates`

**Why fourth:** Needed before campaigns can be configured

#### Phase 5: Campaign Engine
1. Server Actions: `createCampaign`, `updateCampaign`, `enrollJobInCampaign`
2. Cron: Extend `/api/cron/process-scheduled-sends` with campaign touch processing
3. Pages: `/dashboard/campaigns` (list view, builder)
4. Components: Campaign builder (touch configuration UI)
5. Test: Create campaign, enroll job, verify touches execute

**Why fifth:** Depends on jobs, templates, and SMS integration

#### Phase 6: LLM Personalization
1. Config: `lib/ai/personalize.ts` (Claude integration)
2. Rate limiting: `lib/ai/rate-limit.ts` (Upstash)
3. Cron: Add personalization pipeline to touch processing
4. Templates: Add `supports_llm_personalization` and `llm_prompt` fields to UI
5. Test: Enable personalization on template, verify LLM calls in cron

**Why sixth:** Optional enhancement; campaigns work without it

#### Phase 7: Dashboard Redesign
1. Queries: `getPipelineKPIs`, `getReadyToSendJobs`, `getNeedsAttention`
2. Components: Pipeline widget, ready-to-send queue, needs-attention alerts
3. Pages: Update `/dashboard` with new layout

**Why seventh:** Cosmetic; system fully functional without it

#### Phase 8: Onboarding Updates
1. Steps: Services selection, software integration, campaign creation
2. Migration: Update `onboarding` table with new checklist fields
3. Pages: Extend `/onboarding` wizard

**Why last:** UX polish; MVP usable without updated onboarding

## Anti-Patterns to Avoid

### 1. Race Conditions in Campaign Processing

**Bad:**
```typescript
// Fetch due enrollments without locking
const { data: enrollments } = await supabase
  .from('campaign_enrollments')
  .select('*')
  .eq('status', 'active')
  .lte('next_touch_due', now())

// Update each enrollment (RACE CONDITION if multiple cron instances run)
for (const e of enrollments) {
  await processTouch(e)
  await supabase
    .from('campaign_enrollments')
    .update({ current_touch_index: e.current_touch_index + 1 })
    .eq('id', e.id)
}
```

**Good:**
```typescript
// Use RPC with FOR UPDATE SKIP LOCKED
const { data: enrollments } = await supabase
  .rpc('claim_due_campaign_touches', { limit_count: 50 })

// Enrollments are locked; no other cron instance can claim them
for (const e of enrollments) {
  await processTouch(e)
  await supabase
    .from('campaign_enrollments')
    .update({ current_touch_index: e.current_touch_index + 1 })
    .eq('id', e.id)
}
```

### 2. LLM Failures Breaking Sends

**Bad:**
```typescript
// Personalize message, fail entire send if LLM fails
const personalized = await personalizeMessage(template, context)
if (!personalized.success) {
  throw new Error('Personalization failed')
}
await sendEmail({ body: personalized.body })
```

**Good:**
```typescript
// Personalize message, fall back to template on failure
let body = template.body
let wasPersonalized = false

if (shouldPersonalize) {
  const personalized = await personalizeMessage(template, context)
  if (personalized.success) {
    body = personalized.body
    wasPersonalized = true
  } else {
    // Log failure but continue with template
    console.warn('Personalization failed, using template')
  }
}

await sendEmail({ body })
```

### 3. N+1 Queries in Cron Processing

**Bad:**
```typescript
// Fetch enrollments, then fetch job for each enrollment
const { data: enrollments } = await supabase.rpc('claim_due_campaign_touches')

for (const e of enrollments) {
  const { data: job } = await supabase
    .from('jobs')
    .select('customer_name, customer_email')
    .eq('id', e.job_id)
    .single()

  await sendEmail({ to: job.customer_email })
}
```

**Good:**
```typescript
// RPC function returns all needed data via JOIN
const { data: enrollments } = await supabase.rpc('claim_due_campaign_touches')
// Returns: enrollment_id, job_id, customer_name, customer_email, touch_config

for (const e of enrollments) {
  await sendEmail({ to: e.customer_email })
}
```

### 4. Missing Webhook Signature Verification

**Bad:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json()

  // SECURITY RISK: No signature verification
  await supabase
    .from('send_logs')
    .update({ status: body.status })
    .eq('provider_id', body.message_id)
}
```

**Good:**
```typescript
export async function POST(req: NextRequest) {
  const payload = await req.text()

  // Verify Twilio signature
  const signature = req.headers.get('X-Twilio-Signature') || ''
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    body
  )

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Proceed with update
  await supabase.from('send_logs').update({ /* ... */ })
}
```

## Scalability Considerations

### At 100 users (MVP)
- **Cron frequency**: 1 minute (sufficient)
- **Batch size**: 50 scheduled sends + 50 campaign touches per cron run
- **LLM rate limit**: 30 personalizations/min per business
- **Database**: Single Supabase Postgres instance, no sharding needed
- **Cost**: ~$50/month (Vercel Hobby + Supabase Free + Anthropic usage)

### At 10K users (Growth)
- **Cron frequency**: 30 seconds (increase via Vercel Pro plan)
- **Batch size**: 100 scheduled sends + 100 campaign touches per cron run
- **LLM rate limit**: 60 personalizations/min per business (tier-based)
- **Database**: Add read replicas for dashboard queries
- **Cost**: ~$500/month (Vercel Pro + Supabase Pro + Anthropic usage)

### At 1M users (Scale)
- **Cron frequency**: Migrate to dedicated queue (BullMQ + Redis)
- **Batch size**: Process 1000+ per worker, multiple parallel workers
- **LLM rate limit**: 100+ personalizations/min per business, multi-provider fallback
- **Database**: Shard by business_id using Citus Data or migrate to distributed DB
- **Cost**: ~$5K/month (custom infrastructure + Anthropic usage)

## Sources

### Twilio Integration
- [Webhooks Security | Twilio](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
- [How to secure Twilio webhook URLs in Node.js | Twilio](https://www.twilio.com/en-us/blog/how-to-secure-twilio-webhook-urls-in-nodejs)
- [Track Twilio SMS Delivery Status with Next.js Webhooks: Complete StatusCallback Guide](https://www.sent.dm/resources/twilio-node-js-next-js-delivery-status-and-callbacks)
- [Important Change to the Twilio Phone Number Provisioning API | Twilio](https://www.twilio.com/en-us/blog/company/communications/change-phone-number-provisioning-api)
- [GitHub - twilio/twilio-node: Node.js helper library](https://github.com/twilio/twilio-node)

### Campaign Architecture
- [Email drip sequences 101: How to architect a marketing automation workflow](https://www.linkedin.com/pulse/email-drip-sequences-101-how-architect-marketing-automation-ruben-dua)
- [Data model best practices | Adobe Campaign](https://experienceleague.adobe.com/en/docs/campaign-classic/using/configuring-campaign-classic/data-model/data-model-best-practices)

### Multi-Channel Messaging
- [12 Best Unified Messaging Platforms to Consider in 2026](https://www.tidio.com/blog/unified-messaging-platform/)
- [What Is Unified Messaging? The Benefits, Features & Why It Matters Now](https://www.nextiva.com/blog/unified-messaging.html)
- [Omnichannel Messaging Platform | OpenText Core Messaging](https://www.opentext.com/products/core-messaging)

### LLM Rate Limiting
- [Rate Limits for LLM Providers: working with rate limits from OpenAI, Anthropic, and DeepSeek | Requesty Blog](https://www.requesty.ai/blog/rate-limits-for-llm-providers-openai-anthropic-and-deepseek)
- [Rate Limiting in AI Gateway : The Ultimate Guide](https://www.truefoundry.com/blog/rate-limiting-in-llm-gateway)
- [Tackling Rate Limiting - Portkey Docs](https://portkey.ai/docs/guides/getting-started/tackling-rate-limiting)
- [Rate limits | OpenAI API](https://platform.openai.com/docs/guides/rate-limits)

### Job Tracking
- [What Is Customer Lifecycle Management? Complete Guide for 2026 - Vtiger CRM Blog](https://www.vtiger.com/blog/https-www-vtiger-com-blog-what-is-customer-lifecycle-management/)
- [Customer Management Software (CRM) for Service Businesses](https://www.commusoft.com/en-us/features/customer-database-software/)
- [CRM Database Schema Example (A Practical Guide)](https://www.dragonflydb.io/databases/schema/crm)

### SaaS Database Design
- [Designing your SaaS Database for Scale with Postgres - Citus Data](https://www.citusdata.com/blog/2016/10/03/designing-your-saas-database-for-high-scalability/)
- [Multi-tenant SaaS partitioning models for PostgreSQL - AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/partitioning-models.html)
