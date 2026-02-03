# Technology Stack Additions for v2.0 Review Follow-Up System

**Project:** AvisLoop v2.0 - SMS, Campaigns, LLM Personalization
**Researched:** 2026-02-02
**Milestone Type:** Subsequent - Adding features to existing MVP

## Executive Summary

**Recommendation:** Add four targeted libraries to existing stack for SMS (Twilio), LLM personalization (Vercel AI SDK), timezone handling (date-fns-tz), and campaign orchestration (native Postgres + Vercel Cron).

**Core principle:** Leverage existing infrastructure (Supabase, Vercel Cron, Resend patterns) and add minimal, focused dependencies for new capabilities.

**Bundle impact:** +150-200kb (Twilio SDK 80kb, Vercel AI SDK packages 60kb, date-fns-tz 40kb, type definitions 20kb)

## Existing Stack (DO NOT Re-add)

Already validated and in use:
- Next.js 15 (App Router), TypeScript, React 19
- Supabase (Postgres + Auth + RLS + pg_cron)
- Tailwind CSS 3.4 + tailwindcss-animate
- Resend (email sending)
- Stripe (billing)
- Upstash Redis (rate limiting)
- Phosphor Icons, Kumbh Sans
- Vercel Cron (every minute for scheduled processing)

## New Dependencies for v2.0

### Core SMS & Telephony

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **twilio** | ^5.11.2 | SMS sending, delivery webhooks, STOP handling | Official Node.js SDK, A2P 10DLC support, built-in signature verification, 80kb bundle |
| **@types/twilio-node** | ^3.8.0 | TypeScript definitions | Type safety for Twilio client |

**Installation:**
```bash
npm install twilio@^5.11.2 @types/twilio-node@^3.8.0
```

**Rationale:**
- Twilio is the market leader for SMS compliance in 2026 (A2P 10DLC, TCPA, carrier relationships)
- SDK handles STOP keyword filtering automatically (compliance requirement)
- Built-in webhook signature verification prevents spoofing attacks
- Lazy loading enabled by default (performance)
- TypeScript support with official types
- Alternatives (MessageBird, Vonage) have weaker A2P 10DLC tooling

**Environment variables:**
```env
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxx... # For 10DLC campaigns
```

### LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **ai** | ^6.0.68 | Vercel AI SDK core (unified LLM API) | Provider-agnostic, 25+ providers, built-in streaming, tool support, 20kb |
| **@ai-sdk/openai** | ^1.0.68 | OpenAI provider (GPT-4o-mini primary) | Official provider package, gpt-4o-mini support, $0.15/1M input tokens, 20kb |
| **@ai-sdk/anthropic** | ^1.0.68 | Anthropic provider (Haiku 4.5 fallback) | Official provider package, claude-haiku-4-5 support, $1/1M input tokens, 20kb |

**Installation:**
```bash
npm install ai@^6.0.68 @ai-sdk/openai@^1.0.68 @ai-sdk/anthropic@^1.0.68
```

**Rationale:**
- Vercel AI SDK provides unified API for multiple providers (switch with 1 line of code)
- GPT-4o-mini: $0.15/1M input tokens (cost-effective for high-volume personalization)
- Claude Haiku 4.5: $1/1M input tokens (fallback when OpenAI rate limits or outages)
- Built-in streaming support (not needed for batch personalization but future-ready)
- AI SDK 6 introduces agent abstraction (useful for future multi-step workflows)
- Native TypeScript, React 19 compatible, Next.js App Router optimized
- Alternative (direct OpenAI SDK): No fallback pattern, more code for provider switching

**Environment variables:**
```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Cost projections:**
- 1000 personalized messages/month: ~$0.30 with GPT-4o-mini (avg 2000 tokens/message)
- Haiku fallback adds $1.50 if used for same volume
- Caching: Prompt caching (Anthropic) or structured output caching (OpenAI) can reduce costs 50-90%

### Timezone & Scheduling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **date-fns-tz** | ^3.2.0 | Timezone-aware date operations, TCPA quiet hours | Lightweight (40kb), tree-shakeable, DST-aware, integrates with date-fns 4.1.0 (already installed) |

**Installation:**
```bash
npm install date-fns-tz@^3.2.0
```

**Rationale:**
- TCPA compliance requires 8am-9pm recipient local time enforcement (8am-8pm in some states)
- Must handle DST transitions automatically
- date-fns-tz extends existing date-fns 4.1.0 (no replacement needed)
- Lightweight vs moment-timezone (deprecated) or Luxon (heavier, 72kb)
- Tree-shakeable: only import zonedTimeToUtc, utcToZonedTime, format functions
- Alternative (Temporal API): Not stable yet, polyfill too large (150kb+)

**Usage pattern:**
```typescript
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';

// Check if 8am-9pm in recipient's timezone
const recipientTime = utcToZonedTime(new Date(), 'America/New_York');
const hour = recipientTime.getHours();
const isQuietHours = hour < 8 || hour >= 21;
```

### Campaign Orchestration

**Recommendation: NO additional dependencies needed.**

Use existing stack:
- **Supabase Postgres JSONB columns** for campaign touch sequences
- **Supabase pg_cron** for minutely campaign processing (already configured)
- **Vercel Cron** (alternative/backup for Supabase cron)
- **Postgres ENUM types** for campaign status, touch status, service categories
- **RLS policies** for multi-tenant campaign access

**Rationale:**
- Campaign engine is business logic, not infrastructure
- JSONB columns handle flexible touch sequences without migrations
- Existing Vercel Cron (every minute) already processing scheduled sends
- Bull, BullMQ, or node-cron add complexity without benefit at this scale
- Supabase pg_cron more reliable than in-app cron for serverless (no cold start issues)
- RLS enforces org_id scoping automatically (security requirement)

**Database schema patterns:**
```sql
-- Campaign touches stored as JSONB
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  name TEXT,
  touches JSONB NOT NULL, -- Array of touch configs
  status campaign_status_enum,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Touch config structure:
-- [
--   { "type": "email", "delay_hours": 0, "template_id": "..." },
--   { "type": "sms", "delay_hours": 24, "template_id": "..." },
--   { "type": "email", "delay_hours": 72, "template_id": "..." }
-- ]

-- Service categories as ENUM
CREATE TYPE service_category_enum AS ENUM (
  'plumbing',
  'hvac',
  'electrical',
  'roofing',
  'general_contractor',
  'other'
);
```

## Integration with Existing Stack

### Supabase Integration Points

**SMS sending via Twilio (similar to Resend email pattern):**
```typescript
// app/actions/send-sms.ts (Server Action)
'use server'
import { createClient } from '@/lib/supabase/server';
import { twilioClient } from '@/lib/twilio';

export async function sendSMS(contactId: string, message: string) {
  const supabase = await createClient();

  // RLS enforces org_id scoping automatically
  const { data: contact } = await supabase
    .from('contacts')
    .select('phone, org_id')
    .eq('id', contactId)
    .single();

  // Check quiet hours before sending
  const isQuietHours = checkQuietHours(contact.timezone);
  if (isQuietHours) {
    // Queue for next available window
    await scheduleForSend(contactId, message);
    return;
  }

  // Send via Twilio
  const result = await twilioClient.messages.create({
    to: contact.phone,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: message,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  });

  // Store send record with RLS
  await supabase.from('sends').insert({
    contact_id: contactId,
    org_id: contact.org_id,
    channel: 'sms',
    twilio_sid: result.sid,
    status: 'queued',
  });
}
```

**LLM personalization (batch processing via Vercel Cron):**
```typescript
// app/api/cron/personalize-messages/route.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export async function POST(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch contacts needing personalized messages
  const contacts = await fetchPendingContacts();

  for (const contact of contacts) {
    try {
      // Try GPT-4o-mini first (cheaper)
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: `Personalize this message for ${contact.name}: ${template}`,
      });
      await storePersonalizedMessage(contact.id, text);
    } catch (error) {
      // Fallback to Haiku 4.5 on rate limit or error
      const { text } = await generateText({
        model: anthropic('claude-haiku-4-5'),
        prompt: `Personalize this message for ${contact.name}: ${template}`,
      });
      await storePersonalizedMessage(contact.id, text);
    }
  }

  return Response.json({ processed: contacts.length });
}
```

**Campaign processing via existing Vercel Cron:**
```typescript
// app/api/cron/process-campaigns/route.ts (ALREADY EXISTS, extend it)
export async function POST(request: Request) {
  // Existing cron runs every minute
  // Add campaign logic to existing scheduled processing

  const campaignsReady = await fetchCampaignsTouchesReady();

  for (const touch of campaignsReady) {
    if (touch.type === 'email') {
      await sendEmail(touch.contact_id, touch.template_id);
    } else if (touch.type === 'sms') {
      // New: SMS sending with quiet hours check
      await sendSMS(touch.contact_id, touch.template_id);
    }

    // Mark touch as sent
    await markTouchSent(touch.id);
  }
}
```

### Twilio Webhook Integration

**Receiving delivery status and STOP replies:**
```typescript
// app/api/webhooks/twilio/route.ts
import twilio from 'twilio';

export async function POST(request: Request) {
  // Verify webhook signature (CRITICAL for security)
  const signature = request.headers.get('x-twilio-signature');
  const url = new URL(request.url).toString();
  const params = await request.formData();

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature!,
    url,
    Object.fromEntries(params)
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 403 });
  }

  const messageSid = params.get('MessageSid');
  const status = params.get('MessageStatus'); // delivered, failed, undelivered
  const optOutType = params.get('OptOutType'); // STOP keyword handling

  // Update send record
  await supabase
    .from('sends')
    .update({
      status,
      opt_out: optOutType === 'STOP',
      delivered_at: status === 'delivered' ? new Date() : null,
    })
    .eq('twilio_sid', messageSid);

  // If STOP, mark contact as opted out
  if (optOutType === 'STOP') {
    await supabase
      .from('contacts')
      .update({ sms_opt_out: true })
      .eq('phone', params.get('From'));
  }

  return new Response('OK', { status: 200 });
}
```

### RLS Considerations

**All new tables MUST have RLS enabled:**
```sql
-- Jobs table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their org"
  ON jobs FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert jobs in their org"
  ON jobs FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campaigns in their org"
  ON campaigns FOR ALL
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));

-- Campaign sends table
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign sends in their org"
  ON campaign_sends FOR SELECT
  USING (org_id IN (SELECT org_id FROM user_orgs WHERE user_id = auth.uid()));
```

## What NOT to Add

| Technology | Why Avoid |
|------------|-----------|
| **node-cron** | Serverless incompatible (Next.js on Vercel doesn't run persistent processes), Vercel Cron already configured |
| **Bull / BullMQ** | Requires Redis queue (Upstash Redis used for rate limiting only), overkill for campaign scheduling, Postgres + pg_cron sufficient |
| **moment-timezone** | Deprecated, 67kb, use date-fns-tz instead (40kb, tree-shakeable) |
| **Luxon** | 72kb vs date-fns-tz 40kb, overlapping functionality with date-fns 4.1.0 already installed |
| **Temporal API polyfill** | 150kb+, unstable spec, date-fns-tz sufficient for timezone needs |
| **LangChain** | 500kb+ bundle, overkill for message personalization, Vercel AI SDK sufficient |
| **OpenAI SDK directly** | No fallback pattern, more code for provider switching, Vercel AI SDK abstracts this |
| **Anthropic SDK directly** | Same reason as OpenAI, Vercel AI SDK provides unified interface |
| **Vonage / MessageBird** | Weaker A2P 10DLC compliance tooling vs Twilio, less US carrier support |
| **Firebase Cloud Functions** | Wrong platform (already on Vercel), adds complexity, Supabase pg_cron sufficient |

## Twilio A2P 10DLC Compliance Requirements

**CRITICAL for SMS sending in US (regulatory requirement, not optional):**

### Registration Process

1. **Business Profile (Brand) Registration**
   - Business name, EIN/Tax ID, address, website
   - Business type (private profit, non-profit, government)
   - Approval time: ~4 business days
   - Cost: $4/month per brand

2. **Campaign Registration**
   - Campaign type: Customer Care, Mixed, Marketing, etc.
   - Use case description: "Review request follow-up for home service customers"
   - Sample messages (must match actual content)
   - Opt-in method: "Customer provides phone during service booking"
   - Opt-out handling: "Reply STOP to unsubscribe" (automatic via Twilio)
   - Approval time: ~1 week
   - Cost: $1.50-$10/month per campaign depending on throughput

3. **10DLC Number Assignment**
   - Assign Twilio phone number to Messaging Service
   - Link Messaging Service to approved campaign
   - Use Messaging Service SID (not phone number directly) for sending

**Consequences of not registering:**
- Carrier fees: $0.003/message additional charge for unregistered traffic
- Throttled throughput: 6 messages/minute vs 4,500/day registered
- Risk of number suspension by carriers

### STOP Keyword Handling (Automatic via Twilio)

Twilio automatically handles these opt-out keywords (case-insensitive):
- STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
- REVOKE, OPTOUT (added April 2025 FCC update)

**Automatic behavior:**
- Twilio replies with pre-configured opt-out message
- Adds number to blocklist (future sends fail with Error 21610)
- Your webhook receives OptOutType parameter to update database

**Required in initial message:**
- Must include "Reply STOP to unsubscribe" or equivalent

### TCPA Quiet Hours Compliance

**Federal law (applies to all states):**
- No SMS before 8:00 AM or after 9:00 PM recipient's local time
- Penalties: $500-$1,500 per message violation

**State-specific restrictions (more strict):**
- Florida, Connecticut, Maryland, Oklahoma, Washington: 8 AM - 8 PM only
- Texas: 9 AM - 9 PM Mon-Sat, 12 PM - 9 PM Sunday

**Implementation strategy:**
```typescript
// Store contact timezone in database
// Check recipient's local time before sending
// Queue sends outside quiet hours for next available window
// Use date-fns-tz for accurate timezone conversions with DST handling
```

**Best practice:**
- Use 9 AM - 8 PM window to cover strictest state laws
- Always respect contact's timezone (get from area code or ask during onboarding)
- Handle DST transitions automatically (date-fns-tz does this)

### Opt-In Requirements

**Required for A2P 10DLC campaign approval:**
- Express written consent (TCPA requirement)
- Clear disclosure of message frequency ("We'll send review requests after service")
- Clear disclosure of message rates ("Message and data rates may apply")
- Easy opt-out instructions ("Reply STOP to unsubscribe")
- Privacy policy link

**Implementation:**
- Add checkbox to contact creation form
- Store opt_in_consent: true in contacts table
- Never send SMS without consent = true
- Display opt-in language in UI: "By providing your phone number, you agree to receive SMS review requests from [Business Name]. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe."

## Environment Variables Summary

**Add to `.env.local` (development):**
```env
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI (primary LLM)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic (fallback LLM)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Existing (already configured)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
# RESEND_API_KEY=...
# STRIPE_SECRET_KEY=...
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
# CRON_SECRET=... (for Vercel Cron auth)
```

**Add to Vercel project settings (production):**
- All above variables
- Mark `TWILIO_AUTH_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` as sensitive (encrypted)

## Database Migration Considerations

**New tables needed:**

1. **jobs** table
   - id, org_id, customer_id, service_category, service_date, notes, created_at
   - RLS policies for org_id scoping
   - Index on org_id, customer_id, service_date

2. **campaigns** table
   - id, org_id, name, touches (JSONB), status (enum), created_at
   - Touches structure: [{ type, delay_hours, template_id }]
   - RLS policies for org_id scoping

3. **campaign_sends** table
   - id, org_id, campaign_id, contact_id, touch_index, scheduled_for, sent_at, status
   - Tracks each touch in each campaign
   - Index on scheduled_for (for cron queries), org_id

4. **Extend contacts table**
   - Add columns: sms_opt_in (boolean), sms_opt_out (boolean), timezone (text)
   - Timezone defaults to business timezone if not specified

5. **Extend sends table**
   - Add columns: channel (enum: 'email', 'sms'), twilio_sid (text), opt_out (boolean)
   - Existing columns: contact_id, org_id, status, delivered_at

**Enum types:**
```sql
CREATE TYPE campaign_status_enum AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE service_category_enum AS ENUM ('plumbing', 'hvac', 'electrical', 'roofing', 'general_contractor', 'landscaping', 'cleaning', 'other');
CREATE TYPE send_channel_enum AS ENUM ('email', 'sms');
```

## Cost Analysis

### SMS Costs (Twilio)

- **A2P 10DLC registration:** $4/month brand + $1.50-$10/month campaign = ~$6-$14/month fixed
- **SMS rates (US):** $0.0079/segment (160 characters)
- **Average review request SMS:** 1-2 segments = $0.0079-$0.0158/message
- **Projected volume:** 1000 SMS/month = $7.90-$15.80/month variable
- **Total SMS cost:** ~$14-$30/month for 1000 messages

### LLM Costs (OpenAI + Anthropic)

- **GPT-4o-mini (primary):** $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Claude Haiku 4.5 (fallback):** $1 per 1M input tokens, $5 per 1M output tokens
- **Average personalization:** 500 input tokens (context) + 150 output tokens (personalized message) = 650 tokens/message
- **Projected volume:** 1000 personalized messages/month
  - Input: 500k tokens = $0.08 (GPT-4o-mini)
  - Output: 150k tokens = $0.09 (GPT-4o-mini)
  - **Total: $0.17/month** (assuming 95% GPT-4o-mini, 5% Haiku fallback adds $0.03)
- **LLM cost:** ~$0.20/month for 1000 messages

**Combined monthly costs for 1000 contacts:**
- Email (Resend): $0 (free tier: 3,000/month)
- SMS (Twilio): $14-$30
- LLM (OpenAI/Anthropic): $0.20
- **Total incremental cost:** ~$14-$31/month

**Cost per customer:**
- Email: $0
- SMS: $0.014-$0.030
- LLM: $0.0002
- **Total: $0.014-$0.030 per contact**

**Pricing implications:**
- Can offer SMS as $0.02/message add-on (covers cost + margin)
- LLM personalization is negligible cost (bundle into tiers)
- A2P 10DLC fixed costs justify minimum SMS volume (200+ messages/month)

## Performance Considerations

### Bundle Size Impact

- **Twilio SDK:** 80kb gzipped
- **Vercel AI SDK packages:** 60kb total (ai + @ai-sdk/openai + @ai-sdk/anthropic)
- **date-fns-tz:** 40kb (tree-shakeable, only import 2-3 functions)
- **Type definitions:** 20kb
- **Total new bundle weight:** 200kb
- **Acceptable:** Email sending (Resend) already 60kb, SMS is comparable use case

### Lazy Loading Strategy

**Server-side only (no client bundle impact):**
- Twilio SDK only in Server Actions, Route Handlers, Vercel Cron routes
- Vercel AI SDK only in Vercel Cron routes (batch processing)
- date-fns-tz only in server-side quiet hours checks

**No client components need these libraries.**

### Rate Limiting

**Existing Upstash Redis rate limiter:**
- Extend to include SMS sending (10 SMS per org per minute)
- Email already rate limited (20 per minute per org)
- LLM batch processing no rate limit (runs via cron, not user-triggered)

**Twilio rate limits (A2P 10DLC):**
- Registered campaigns: 4,500 messages/day throughput
- Conservative approach: 1 message/second max (86,400/day theoretical)
- App rate limit: 10/minute per org (600/hour, 14,400/day) - well under Twilio limit

**OpenAI rate limits (Tier 1):**
- GPT-4o-mini: 200 requests/minute, 2M tokens/minute
- Batch processing 1000 messages = 650k tokens, fits in 1 minute
- No additional throttling needed

### Caching Strategy

**LLM prompt caching (cost optimization):**
- OpenAI: Use structured output caching (automatic, 50% cost reduction)
- Anthropic: Prompt caching reduces cost 90% for repeated system prompts

**Implementation:**
```typescript
// Reusable system prompt (cached by providers)
const SYSTEM_PROMPT = `You are a professional message personalizer for home service businesses...`;

// Changes per message (not cached)
const userPrompt = `Customer: ${name}, Service: ${service}, Date: ${date}`;

// Providers cache SYSTEM_PROMPT automatically
```

## Testing & Development

### Local Development Setup

1. **Twilio Test Credentials**
   - Use Twilio test credentials (free): https://console.twilio.com/
   - Test phone numbers: use your own verified number
   - Webhook testing: use ngrok or Vercel dev tunnel
   - Signature validation: works with test credentials

2. **LLM API Keys**
   - OpenAI: $5 free credit for new accounts
   - Anthropic: $5 free credit for new accounts
   - Both provide playground for testing prompts

3. **Vercel Cron Local Testing**
   - Cron routes only work in production (Vercel deployment)
   - For local testing: add `npm run cron:test` script to package.json
   - Script manually calls cron routes with CRON_SECRET header

```json
// package.json addition
{
  "scripts": {
    "cron:test": "curl -X POST http://localhost:3000/api/cron/process-campaigns -H 'Authorization: Bearer test-secret'"
  }
}
```

### End-to-End Testing Checklist

- [ ] SMS sending via Twilio (test number)
- [ ] Delivery status webhook updates send record
- [ ] STOP keyword marks contact as opted out
- [ ] Quiet hours check prevents sends 9pm-8am recipient time
- [ ] LLM personalization generates valid messages
- [ ] Fallback to Haiku on OpenAI rate limit
- [ ] Campaign sequence triggers correctly
- [ ] RLS policies prevent cross-org access
- [ ] Webhook signature validation rejects invalid requests

## Rollback Plan

**If SMS integration fails in production:**

1. **Feature flag SMS sending**
   - Add `SMS_ENABLED=false` env var
   - Campaigns fall back to email-only
   - No data loss (contacts, campaigns still stored)

2. **If Twilio webhooks fail**
   - SMS sends still work (fire-and-forget)
   - Lose delivery status updates (non-critical)
   - Poll Twilio API for status as backup

3. **If LLM personalization fails**
   - Fall back to template messages (existing system)
   - No impact on sending (personalization is pre-processing)
   - Queue personalization for retry

**No changes require database rollback** (only additive tables/columns).

## Security Checklist

- [ ] Twilio credentials server-side only (never expose to client)
- [ ] Webhook signature verification implemented (prevent spoofing)
- [ ] LLM API keys server-side only
- [ ] RLS policies on all new tables (jobs, campaigns, campaign_sends)
- [ ] Rate limiting extended to SMS (10/minute per org)
- [ ] STOP keyword handling respects opt-out
- [ ] Quiet hours enforcement prevents TCPA violations
- [ ] No PII in LLM prompts (only name, service type)
- [ ] Twilio message logs include org_id for audit trail

## Sources

### SMS & Twilio
- [Twilio Node.js SDK npm](https://www.npmjs.com/package/twilio) - Version 5.11.2
- [Twilio A2P 10DLC Documentation](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc) - Registration requirements
- [Twilio A2P 10DLC Registration Guide](https://help.twilio.com/articles/1260801864489-How-do-I-register-to-use-A2P-10DLC-messaging) - Step-by-step process
- [Twilio STOP Keyword Handling](https://www.twilio.com/docs/proxy/opt-out-keywords) - Automatic opt-out compliance
- [FCC SMS Opt-Out Keywords Update](https://www.twilio.com/en-us/blog/insights/best-practices/update-to-fcc-s-sms-opt-out-keywords) - REVOKE/OPTOUT additions April 2025
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security) - Signature verification
- [Securing Twilio Webhooks in Node.js](https://www.twilio.com/en-us/blog/how-to-secure-twilio-webhook-urls-in-nodejs) - Implementation guide

### TCPA & Compliance
- [TCPA Quiet Hours Guide 2026](https://activeprospect.com/blog/tcpa-text-messages/) - Federal and state rules
- [TCPA Quiet Hours Violations](https://natlawreview.com/article/tick-tock-dont-get-caught-navigating-tcpas-quiet-hours) - Penalties and enforcement
- [SMS Compliance 2026](https://telnyx.com/resources/sms-compliance) - Comprehensive compliance overview

### LLM & Vercel AI SDK
- [Vercel AI SDK GitHub](https://github.com/vercel/ai) - Official repository
- [AI SDK 6 Release](https://vercel.com/blog/ai-sdk-6) - New agent features, v6 migration
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction) - Getting started
- [Vercel AI SDK Providers: OpenAI](https://ai-sdk.dev/providers/ai-sdk-providers/openai) - Installation and usage
- [Vercel AI SDK Providers: Anthropic](https://ai-sdk.dev/providers/ai-sdk-providers/anthropic) - Installation and usage
- [GPT-4o-mini Pricing](https://openai.com/api/pricing/) - $0.15/$0.60 per 1M tokens
- [Claude Haiku 4.5 Pricing](https://www.anthropic.com/news/claude-haiku-4-5) - $1/$5 per 1M tokens
- [LangChain vs Vercel AI SDK 2026](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) - Framework comparison

### Timezone Handling
- [date-fns-tz npm](https://www.npmjs.com/package/date-fns-tz) - Version 3.2.0
- [Handling Timezones in Node.js](https://tillitsdone.com/blogs/day-js-timezone-guide-for-node-js/) - Best practices
- [Dynamic Scheduled Notifications Across Time Zones](https://medium.com/@python-javascript-php-html-css/implementing-dynamic-scheduled-notifications-across-time-zones-with-node-js-3b99bf6ad7bd) - Implementation patterns
- [3 Rules for Handling Timezones](https://dev.to/corykeane/3-simple-rules-for-effectively-handling-dates-and-timezones-1pe0) - Store UTC, convert on use

### Vercel Cron & Scheduling
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) - Official docs
- [Vercel Cron Jobs Quickstart](https://vercel.com/docs/cron-jobs/quickstart) - Setup guide
- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/cron) - Alternative scheduling
- [Cron Jobs in Next.js: Serverless vs Serverful](https://yagyaraj234.medium.com/running-cron-jobs-in-nextjs-guide-for-serverful-and-stateless-server-542dd0db0c4c) - Architecture considerations

### Performance & Architecture
- [Next.js Performance Optimization 2026](https://medium.com/@shirkeharshal210/next-js-performance-optimization-app-router-a-practical-guide-a24d6b3f5db2) - App Router patterns
- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security) - Multi-tenant security
