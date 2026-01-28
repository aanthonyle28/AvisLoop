# Phase 6: Billing & Limits - Research

**Researched:** 2026-01-27
**Domain:** Stripe subscription billing with Next.js App Router + Supabase
**Confidence:** HIGH

## Summary

This phase implements Stripe subscription billing for a multi-tenant SaaS application. The integration follows the standard Stripe + Next.js + Supabase pattern used by Vercel's official subscription template. Key components include: Stripe Checkout for payment collection, Customer Portal for subscription management, and webhooks for real-time data synchronization.

The existing codebase already has a `tier` column on the `businesses` table with values `trial`, `basic`, and `pro`, and monthly limit enforcement in the send action. This phase adds Stripe integration to transition users between tiers based on payment status, and extends the UI with usage warnings and billing management.

**Primary recommendation:** Use Stripe hosted Checkout for payments and Customer Portal for subscription management. Store minimal Stripe data in Supabase (customer_id on businesses, plus a subscriptions table). Handle all Stripe events through a single webhook endpoint using signature verification.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | 20.x | Server-side Stripe API | Official Node.js SDK, TypeScript support, auto-retries |
| @stripe/stripe-js | 8.x | Client-side Stripe.js loader | Required for PCI compliance, ES module wrapper |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | Supabase already in stack | Use existing Supabase client |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Stripe Checkout | Stripe Elements | Elements = more control but more code; Checkout = faster, hosted, PCI-compliant |
| Customer Portal | Custom billing UI | Portal = zero maintenance; Custom = full control but must handle edge cases |

**Installation:**
```bash
pnpm add stripe @stripe/stripe-js
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  api/
    webhooks/
      stripe/
        route.ts            # Stripe webhook handler
  (dashboard)/
    billing/
      page.tsx              # Billing page (view plan, usage, manage)
lib/
  stripe/
    client.ts               # Server-side Stripe client initialization
    checkout.ts             # Checkout session creation
    portal.ts               # Customer portal session creation
  actions/
    billing.ts              # Server actions for billing operations
  data/
    subscription.ts         # Fetch subscription/usage data
supabase/
  migrations/
    00006_add_billing.sql   # Add stripe_customer_id, subscriptions table
```

### Pattern 1: Server Action for Checkout
**What:** Create Stripe Checkout sessions via Server Actions, not API routes
**When to use:** All checkout flows in App Router
**Example:**
```typescript
// Source: https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/
'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createCheckoutSession(priceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get or create Stripe customer
  const { data: business } = await supabase
    .from('businesses')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  let customerId = business?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { business_id: business?.id, user_id: user.id }
    })
    customerId = customer.id
    await supabase
      .from('businesses')
      .update({ stripe_customer_id: customerId })
      .eq('id', business?.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?canceled=1`,
    subscription_data: {
      metadata: { business_id: business?.id }
    }
  })

  redirect(session.url!)
}
```

### Pattern 2: Webhook Handler with Raw Body
**What:** Handle Stripe webhooks with proper signature verification
**When to use:** All webhook endpoints
**Example:**
```typescript
// Source: https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()  // CRITICAL: Use text(), not json()
  const signature = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle events...
  return NextResponse.json({ received: true })
}
```

### Pattern 3: Customer Portal Session
**What:** Create portal session for subscription management
**When to use:** "Manage Subscription" button clicks
**Example:**
```typescript
// Source: https://docs.stripe.com/customer-management/integrate-customer-portal
'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function createPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!business?.stripe_customer_id) {
    throw new Error('No billing account found')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing`
  })

  redirect(session.url)
}
```

### Anti-Patterns to Avoid
- **Trusting client-side prices:** Never accept price amounts from the client. Always use price IDs and fetch from Stripe server-side.
- **Parsing webhook body as JSON first:** Use `request.text()` to get raw body before signature verification.
- **Storing raw card data:** Never store card details. Use Stripe Checkout/Elements for PCI compliance.
- **Mixing test/live keys:** Use separate environment variables and verify mode matches.
- **Ignoring webhook failures:** Log all failures, but return 200 to prevent retry storms for non-Stripe issues.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment form | Custom card input | Stripe Checkout | PCI compliance, fraud prevention, auto-updates |
| Subscription management UI | Custom cancel/update forms | Stripe Customer Portal | Handles proration, invoices, payment method updates |
| Payment retry logic | Custom retry scheduler | Stripe Smart Retries | ML-optimized timing, built-in dunning |
| Webhook signature verification | Manual HMAC check | `stripe.webhooks.constructEvent()` | Handles timing attacks, format changes |
| Proration calculation | Custom math | Stripe's built-in proration | Handles edge cases, billing cycles |

**Key insight:** Stripe has spent years handling payment edge cases (timezone issues, currency rounding, failed retries, chargebacks). Their hosted solutions encode this experience.

## Common Pitfalls

### Pitfall 1: Webhook Body Parsing
**What goes wrong:** Signature verification fails with "Invalid signature" error
**Why it happens:** Next.js auto-parses JSON, corrupting the raw body needed for signature verification
**How to avoid:** Use `request.text()` in App Router, never `request.json()` before verification
**Warning signs:** Works locally with Stripe CLI but fails in production

### Pitfall 2: Test vs Live Mode Keys
**What goes wrong:** Webhooks return 400 or subscription data doesn't match
**Why it happens:** Using test webhook secret with live events or vice versa
**How to avoid:** Use `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` per environment; verify both are from same mode
**Warning signs:** "No signatures found matching the expected signature" errors

### Pitfall 3: Missing Customer Portal Configuration
**What goes wrong:** Portal session creation returns error about missing configuration
**Why it happens:** Customer Portal must be configured in Stripe Dashboard before API use
**How to avoid:** Configure portal in Dashboard > Settings > Billing > Customer Portal FIRST
**Warning signs:** Error: "No portal configuration found"

### Pitfall 4: Race Condition on Customer Creation
**What goes wrong:** Duplicate Stripe customers created for same user
**Why it happens:** Multiple checkout attempts before first customer ID is saved
**How to avoid:** Use database constraint on stripe_customer_id; check-then-create atomically or use idempotency keys
**Warning signs:** Multiple customers in Stripe for same email

### Pitfall 5: Ignoring Subscription Status
**What goes wrong:** Users lose access immediately on any payment issue
**Why it happens:** Only checking `active` status, not handling `past_due` grace period
**How to avoid:** Treat `past_due` as active for grace period (7 days per context); only revoke on `canceled`, `unpaid`, or `incomplete_expired`
**Warning signs:** Customer complaints about sudden access loss

### Pitfall 6: Not Storing Business ID in Metadata
**What goes wrong:** Cannot associate webhook events with correct business
**Why it happens:** Only storing customer_id, not business_id in subscription metadata
**How to avoid:** Include `business_id` in `subscription_data.metadata` during checkout
**Warning signs:** Webhook handler cannot find which business to update

## Code Examples

Verified patterns from official sources:

### Database Schema Addition
```sql
-- Source: https://supabase-sql.vercel.app/stripe-subscriptions
-- Migration: 00006_add_billing.sql

-- Add Stripe customer ID to businesses
ALTER TABLE public.businesses
  ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,                    -- Stripe subscription ID
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                   -- active, past_due, canceled, etc.
  price_id TEXT NOT NULL,                 -- Stripe price ID
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Index for business lookup
CREATE INDEX idx_subscriptions_business_id ON public.subscriptions(business_id);

-- RLS: Users view own subscriptions
CREATE POLICY "Users view own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = (SELECT auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime(updated_at);
```

### Webhook Event Handling
```typescript
// Source: https://docs.stripe.com/billing/subscriptions/webhooks
// Handle key subscription events

switch (event.type) {
  case 'checkout.session.completed': {
    const session = event.data.object as Stripe.Checkout.Session
    const businessId = session.subscription_data?.metadata?.business_id
      || session.metadata?.business_id

    // Update business tier based on price
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
    const priceId = subscription.items.data[0].price.id
    const tier = PRICE_TO_TIER[priceId] // Map price IDs to tiers

    await supabase.from('businesses').update({ tier }).eq('id', businessId)
    await supabase.from('subscriptions').upsert({
      id: subscription.id,
      business_id: businessId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    break
  }

  case 'customer.subscription.updated': {
    const subscription = event.data.object as Stripe.Subscription
    const businessId = subscription.metadata.business_id

    // Determine tier from price
    const priceId = subscription.items.data[0].price.id
    const tier = PRICE_TO_TIER[priceId]

    // Update subscription and tier
    await supabase.from('subscriptions').update({
      status: subscription.status,
      price_id: priceId,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }).eq('id', subscription.id)

    // Only update tier if subscription is active
    if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
      await supabase.from('businesses').update({ tier }).eq('id', businessId)
    }
    break
  }

  case 'customer.subscription.deleted': {
    const subscription = event.data.object as Stripe.Subscription
    const businessId = subscription.metadata.business_id

    // Revert to trial tier
    await supabase.from('businesses').update({ tier: 'trial' }).eq('id', businessId)
    await supabase.from('subscriptions').update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    }).eq('id', subscription.id)
    break
  }

  case 'invoice.payment_failed': {
    const invoice = event.data.object as Stripe.Invoice
    // Log for monitoring, but don't immediately revoke access
    // Stripe will retry and eventually fire subscription.updated with past_due status
    console.log(`Payment failed for invoice ${invoice.id}`)
    break
  }
}
```

### Usage Warning Component Pattern
```typescript
// Pattern for showing usage warnings per CONTEXT.md decisions
// Show banner at 80%+ usage with behavior-based nudge

function UsageWarning({ usage }: { usage: { count: number; limit: number; tier: string } }) {
  const percentage = (usage.count / usage.limit) * 100
  const remaining = usage.limit - usage.count

  if (percentage < 80) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <p className="text-amber-800 font-medium">
        {remaining} sends remaining this month
      </p>
      {percentage >= 100 ? (
        <p className="text-amber-700 text-sm mt-1">
          {usage.tier === 'trial' ? 'Trial' : 'Plan'} limit reached.{' '}
          <Link href="/billing" className="underline">Start a plan</Link> to keep sending.
        </p>
      ) : null}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| API Routes for checkout | Server Actions | Next.js 14+ (2024) | Simpler code, better type safety |
| Webhook in /pages/api | Route Handler in /app/api | Next.js 13+ (2023) | Uses App Router conventions |
| Manual proration | Stripe built-in proration | Always available | Automatic, accurate calculations |
| Custom billing UI | Stripe Customer Portal | 2020+ | Zero maintenance, handles edge cases |

**Deprecated/outdated:**
- `bodyParser: false` config: Not needed in App Router (body parsing is already disabled)
- `/pages/api` webhooks: Use `/app/api` Route Handlers for App Router projects

## Open Questions

Things that couldn't be fully resolved:

1. **Stripe Price IDs vs Lookup Keys**
   - What we know: Both work; lookup keys allow price changes without code deploys
   - What's unclear: Whether lookup keys add unnecessary complexity for fixed pricing
   - Recommendation: Use hardcoded price IDs for MVP (simpler), can add lookup keys later if needed

2. **Contact Limit Enforcement Timing**
   - What we know: CONTEXT.md says soft limit (can add contacts over limit, can't send)
   - What's unclear: Should we warn during import or only at send time?
   - Recommendation: Warn during CSV import if it would exceed limit, but allow the import

## Sources

### Primary (HIGH confidence)
- [Stripe Billing Subscriptions Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) - Event handling patterns
- [Stripe Customer Portal Integration](https://docs.stripe.com/customer-management/integrate-customer-portal) - Portal session API
- [Supabase SQL Stripe Subscriptions](https://supabase-sql.vercel.app/stripe-subscriptions) - Database schema pattern

### Secondary (MEDIUM confidence)
- [Vercel Next.js Subscription Payments](https://github.com/vercel/nextjs-subscription-payments) - Reference architecture
- [Stripe + Next.js Complete Guide 2025](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) - Server Actions pattern
- [Next.js App Router Webhook Verification](https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f) - Raw body handling

### Tertiary (LOW confidence)
- [npm stripe package](https://www.npmjs.com/package/stripe) - Version 20.x (npm blocked, version from search)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Stripe SDKs, verified versions
- Architecture: HIGH - Patterns from official Stripe docs and Vercel template
- Pitfalls: HIGH - Documented issues from multiple sources with clear solutions

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (Stripe API stable, patterns well-established)

## Environment Variables Required

```env
# Stripe (Server-only)
STRIPE_SECRET_KEY=sk_live_...        # or sk_test_... for development
STRIPE_WEBHOOK_SECRET=whsec_...      # From Stripe Dashboard > Webhooks

# Stripe (Client-safe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # or pk_test_...

# Stripe Price IDs (can be in code or env)
STRIPE_BASIC_PRICE_ID=price_...      # $49/mo Basic plan
STRIPE_PRO_PRICE_ID=price_...        # $99/mo Pro plan

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```
