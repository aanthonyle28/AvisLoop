# Phase 4: Core Sending - Research

**Researched:** 2026-01-27
**Domain:** Transactional email sending with rate limiting, webhooks, and status tracking
**Confidence:** HIGH

## Summary

This research investigates how to implement the Core Sending phase for the Review SaaS platform. The phase involves enabling users to send review request emails to contacts, with comprehensive logging, rate limiting, cooldown enforcement, and delivery status tracking via webhooks.

The standard approach for Next.js + Supabase applications is to use **Resend** as the email provider due to its superior developer experience, React Email integration, and modern API design. The send flow should use Server Actions for the core sending logic, with a dedicated API route for webhook handling. Rate limiting should be implemented at both the application level (Upstash Redis) and through Resend's built-in rate limit headers.

**Primary recommendation:** Use Resend with React Email templates, implement send logging in a new `send_logs` table, enforce cooldowns via database queries, and handle delivery status updates through a webhook endpoint.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | ^4.x | Email sending API | Best-in-class DX, React Email integration, SOC 2 compliant, webhook verification built-in |
| @react-email/components | ^0.0.x | Email templates | Type-safe React components for email, renders to HTML, dark mode support |
| @upstash/ratelimit | ^2.x | Rate limiting | Serverless-optimized, multiple algorithms, works with Vercel Edge |
| @upstash/redis | ^1.x | Redis client | Required for Upstash ratelimit, serverless-friendly |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-email/render | ^1.x | HTML rendering | Render React components to HTML string for sending |
| zod | ^4.x (existing) | Validation | Validate send request payloads |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Postmark | Better deliverability & built-in templates, but worse DX and no React Email integration |
| Upstash ratelimit | In-memory Map | Simpler setup, but doesn't work in serverless (no persistence between invocations) |
| React Email | HTML strings | No external dependency, but harder to maintain and style |

**Installation:**
```bash
pnpm add resend @react-email/components @react-email/render @upstash/ratelimit @upstash/redis
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── actions/
│   └── send.ts           # Server Actions for sending emails
├── data/
│   └── send-logs.ts      # Data fetching for send history
├── email/
│   ├── templates/
│   │   └── review-request.tsx  # React Email template
│   └── resend.ts         # Resend client singleton
├── rate-limit.ts         # Upstash rate limiter configuration
└── types/
    └── database.ts       # Add SendLog type

app/
├── api/
│   └── webhooks/
│       └── resend/
│           └── route.ts  # Webhook handler for delivery events
└── (dashboard)/
    └── send/
        └── page.tsx      # Send review request UI
```

### Pattern 1: Server Action for Email Sending
**What:** Use Server Actions (not API routes) for the main send flow
**When to use:** For user-initiated email sends from the UI
**Example:**
```typescript
// Source: Project pattern from lib/actions/contact.ts + Resend docs
'use server'

import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/email/resend'
import { ratelimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export async function sendReviewRequest(
  contactId: string,
  templateId: string
): Promise<{ error?: string; success?: boolean; sendLogId?: string }> {
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // 2. Rate limit check (per-user)
  const { success: withinLimit } = await ratelimit.limit(user.id)
  if (!withinLimit) {
    return { error: 'Rate limit exceeded. Please wait before sending more emails.' }
  }

  // 3. Get business, contact, and template
  // ... fetch data with RLS

  // 4. Check cooldown (contact.last_sent_at)
  // ... verify cooldown period

  // 5. Check monthly limit
  // ... count sends this month

  // 6. Check opt-out status
  // ... verify contact hasn't opted out

  // 7. Create send_log entry (status: 'pending')
  const { data: sendLog } = await supabase
    .from('send_logs')
    .insert({
      business_id: business.id,
      contact_id: contactId,
      template_id: templateId,
      status: 'pending',
    })
    .select('id')
    .single()

  // 8. Send via Resend with idempotency key
  const { data, error } = await resend.emails.send(
    {
      from: `${business.default_sender_name} <reviews@yourdomain.com>`,
      to: contact.email,
      subject: renderedSubject,
      html: renderedHtml,
      tags: [
        { name: 'send_log_id', value: sendLog.id },
        { name: 'business_id', value: business.id },
      ],
    },
    { idempotencyKey: `send-${sendLog.id}` }
  )

  // 9. Update send_log with result
  await supabase
    .from('send_logs')
    .update({
      status: error ? 'failed' : 'sent',
      provider_id: data?.id,
      error_message: error?.message,
    })
    .eq('id', sendLog.id)

  // 10. Update contact tracking fields
  await supabase
    .from('contacts')
    .update({
      last_sent_at: new Date().toISOString(),
      send_count: contact.send_count + 1,
    })
    .eq('id', contactId)

  return { success: !error, sendLogId: sendLog.id }
}
```

### Pattern 2: Webhook Handler for Delivery Status
**What:** API route to receive and process Resend webhooks
**When to use:** For tracking email delivery, bounces, complaints
**Example:**
```typescript
// Source: Resend webhook verification docs
// app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use service role for webhook handler (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()

    // Verify webhook signature
    const event = resend.webhooks.verify({
      payload,
      headers: {
        id: req.headers.get('svix-id')!,
        timestamp: req.headers.get('svix-timestamp')!,
        signature: req.headers.get('svix-signature')!,
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    })

    // Extract send_log_id from tags
    const sendLogId = event.data.tags?.send_log_id
    if (!sendLogId) {
      return NextResponse.json({ received: true })
    }

    // Map event type to status
    const statusMap: Record<string, string> = {
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'opened',
    }

    const newStatus = statusMap[event.type]
    if (newStatus) {
      await supabase
        .from('send_logs')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sendLogId)

      // If bounced or complained, consider marking contact
      if (newStatus === 'bounced' || newStatus === 'complained') {
        const { data: sendLog } = await supabase
          .from('send_logs')
          .select('contact_id')
          .eq('id', sendLogId)
          .single()

        if (sendLog) {
          await supabase
            .from('contacts')
            .update({ opted_out: true })
            .eq('id', sendLog.contact_id)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
  }
}
```

### Pattern 3: Rate Limiting Configuration
**What:** Configurable rate limiter using Upstash Redis
**When to use:** Protect against abuse, enforce tier limits
**Example:**
```typescript
// Source: Upstash ratelimit docs + Next.js best practices
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Per-user rate limit: 10 sends per minute
export const sendRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:send',
})

// Burst protection: 100 sends per hour
export const hourlyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  prefix: 'ratelimit:send:hourly',
})
```

### Anti-Patterns to Avoid
- **Direct email sending without logging:** Always create a send_log record BEFORE attempting to send. This ensures auditability even if the send fails.
- **Trusting client-side template content:** Never allow users to inject arbitrary HTML. Use pre-approved templates with variable substitution only.
- **Storing API keys in client components:** Resend API key must only be used in server-side code (Server Actions, API routes).
- **Webhook without signature verification:** Always verify the Resend webhook signature to prevent spoofed events.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate limiting | In-memory counter | @upstash/ratelimit | Serverless has no persistent state; counters reset on cold start |
| Email HTML | String templates | React Email | Cross-client compatibility is nightmare; React Email handles quirks |
| Template variables | Regex replace | React props | Type safety, no injection risk, composable |
| Idempotency | Custom dedup logic | Resend idempotencyKey | 24-hour built-in deduplication, no extra storage needed |
| Webhook verification | Manual HMAC | resend.webhooks.verify() | SDK handles signature verification correctly |

**Key insight:** Email sending looks trivial but has many edge cases: retries, bounces, rate limits, delivery tracking. Using battle-tested libraries prevents subtle bugs that damage sender reputation.

## Common Pitfalls

### Pitfall 1: Not Tracking Sends Before API Call
**What goes wrong:** If you call Resend first and then try to log, a crash between the two leaves you with a sent email but no record.
**Why it happens:** Developers optimize for the "happy path" and assume logging can happen after.
**How to avoid:** Always create a send_log with status='pending' BEFORE calling the email API. Update to 'sent'/'failed' after.
**Warning signs:** Send counts don't match actual emails sent; no record of failed sends.

### Pitfall 2: Not Enforcing Cooldowns
**What goes wrong:** Same contact gets spammed with multiple review requests, leading to complaints and opt-outs.
**Why it happens:** Cooldown check forgotten or easily bypassed via direct API calls.
**How to avoid:** Check `contact.last_sent_at` in the Server Action. Enforce minimum 7-30 day cooldown.
**Warning signs:** High unsubscribe/complaint rates; contacts receiving multiple emails in short period.

### Pitfall 3: Ignoring Monthly Limits in Tier Logic
**What goes wrong:** Users exceed their plan limits, causing unexpected costs or service degradation.
**Why it happens:** Limit checks not centralized or checked at send time.
**How to avoid:** Query monthly send count at the start of every send action. Block if limit reached.
**Warning signs:** Bills higher than expected; users complaining about being blocked mid-month.

### Pitfall 4: Not Handling Webhook Race Conditions
**What goes wrong:** Webhook arrives before the send action finishes, causing missing send_log.
**Why it happens:** Webhooks can arrive within milliseconds of send completion.
**How to avoid:** Create send_log with status='pending' BEFORE calling Resend. Webhook updates existing record.
**Warning signs:** Webhooks logged as "send_log not found"; status stuck on 'pending'.

### Pitfall 5: Blocking UI During Send
**What goes wrong:** User clicks send, UI freezes for 2-5 seconds waiting for email API response.
**Why it happens:** Synchronous send in the action without optimistic updates.
**How to avoid:** Show immediate "Sending..." state, update to success/failure after. Use useTransition.
**Warning signs:** Users clicking send multiple times; poor perceived performance.

## Code Examples

### Send Log Database Migration
```sql
-- Source: Project RLS patterns from existing migrations
-- Migration: 00005_create_send_logs

CREATE TABLE IF NOT EXISTS public.send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,  -- Resend email ID
  error_message TEXT,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT send_logs_status_valid CHECK (
    status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'opened')
  )
);

-- Enable RLS
ALTER TABLE public.send_logs ENABLE ROW LEVEL SECURITY;

-- Index for business queries
CREATE INDEX IF NOT EXISTS idx_send_logs_business_id ON public.send_logs USING btree (business_id);
CREATE INDEX IF NOT EXISTS idx_send_logs_contact_id ON public.send_logs USING btree (contact_id);
CREATE INDEX IF NOT EXISTS idx_send_logs_created_at ON public.send_logs USING btree (created_at DESC);

-- RLS Policies (same pattern as contacts)
CREATE POLICY "Users view own send_logs"
ON public.send_logs FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users insert own send_logs"
ON public.send_logs FOR INSERT
TO authenticated
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Users update own send_logs"
ON public.send_logs FOR UPDATE
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())))
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER send_logs_updated_at
  BEFORE UPDATE ON public.send_logs
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
```

### Contact Opt-Out Column Migration
```sql
-- Migration: 00006_add_contact_opt_out

-- Add opt-out flag to contacts
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS opted_out BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering sendable contacts
CREATE INDEX IF NOT EXISTS idx_contacts_sendable
ON public.contacts USING btree (business_id, status, opted_out)
WHERE status = 'active' AND opted_out = false;
```

### React Email Template
```tsx
// Source: React Email docs + project requirements
// lib/email/templates/review-request.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Hr,
} from '@react-email/components';

interface ReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  reviewLink: string;
  senderName: string;
}

export function ReviewRequestEmail({
  customerName,
  businessName,
  reviewLink,
  senderName,
}: ReviewRequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Share your experience with {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hi {customerName},</Heading>

          <Text style={text}>
            Thank you for choosing {businessName}! We'd really appreciate it if
            you could take a moment to share your experience.
          </Text>

          <Button href={reviewLink} style={button}>
            Leave a Review
          </Button>

          <Hr style={divider} />

          <Text style={footer}>
            Thanks so much,
            <br />
            {senderName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '4px',
  maxWidth: '580px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '0 auto',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '32px 0',
};

const footer = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '1.5',
};

export default ReviewRequestEmail;
```

### Resend Client Setup
```typescript
// Source: Resend Node.js SDK docs
// lib/email/resend.ts
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTML string templates | React Email components | 2023 | Type-safe, composable, better DX |
| API routes for forms | Server Actions | Next.js 14 (2023) | Simpler code, automatic form handling |
| SendGrid/Mailgun | Resend | 2023-2024 | Better DX, modern API, React integration |
| Manual webhook HMAC | SDK verification | 2024 | Less error-prone, handles edge cases |

**Deprecated/outdated:**
- `nodemailer` for transactional: Still works but requires SMTP setup; APIs like Resend are simpler
- Pages Router API routes: App Router + Server Actions preferred for new projects
- Custom rate limiting with Map: Doesn't work in serverless; use Upstash

## Open Questions

1. **Cooldown Period Duration**
   - What we know: Need to prevent spam by enforcing minimum time between sends to same contact
   - What's unclear: Exact duration (7 days? 14 days? 30 days?) - product decision
   - Recommendation: Start with 14 days, make configurable per-business later

2. **Monthly Limit Tiers**
   - What we know: Basic: 200, Pro: 500 mentioned in requirements
   - What's unclear: Where tier info is stored (businesses table? separate subscriptions table?)
   - Recommendation: For MVP, add `tier` column to businesses with default 'basic', hardcode limits in code

3. **Email Domain Configuration**
   - What we know: Resend requires verified sending domain
   - What's unclear: Will users use custom domains or shared platform domain?
   - Recommendation: Start with platform domain (reviews@avisloop.com), add custom domain support later

## Sources

### Primary (HIGH confidence)
- `/websites/resend` (Context7) - Email sending API, webhooks, idempotency
- `/resend/resend-node` (Context7) - Node.js SDK, tags, batch sending
- `/resend/react-email` (Context7) - Email template components
- `/vercel/next.js` (Context7) - Server Actions, API routes, rate limiting patterns
- `/activecampaign/postmark.js` (Context7) - Webhook interface reference

### Secondary (MEDIUM confidence)
- [Upstash Rate Limiting Blog](https://upstash.com/blog/nextjs-ratelimiting) - Serverless rate limiting patterns
- [Postmark vs Resend Comparison](https://forwardemail.net/en/blog/postmark-vs-resend-email-service-comparison) - Provider comparison
- [Next.js Weekly - Rate Limiting Server Actions](https://nextjsweekly.com/blog/rate-limiting-server-actions) - Implementation patterns

### Tertiary (LOW confidence)
- WebSearch results on transactional email database schemas - Limited specific guidance found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend and React Email are well-documented, active development
- Architecture: HIGH - Patterns match existing project structure and Next.js best practices
- Pitfalls: HIGH - Based on documented Resend behaviors and project requirements
- Database schema: MEDIUM - Based on project patterns, no external validation of send_log structure

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days - stack is stable)
