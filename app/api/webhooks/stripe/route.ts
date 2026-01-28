import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'

// In-memory rate limiting for failed signature verification attempts
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_FAILED_ATTEMPTS = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = failedAttempts.get(ip)

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    return true // Allow
  }

  return record.count < MAX_FAILED_ATTEMPTS
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = failedAttempts.get(ip)

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    failedAttempts.set(ip, { count: 1, firstAttempt: now })
  } else {
    record.count++
  }
}

export async function POST(request: Request) {
  // CRITICAL: Use text(), not json() for signature verification
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  // Rate limit check before signature verification
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Validate required env vars before use
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    recordFailedAttempt(ip)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Create Supabase client inside handler to limit scope (SEC-02)
  // Use service role for webhook handler - no user context available
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Build PRICE_TO_TIER mapping inside handler to ensure env vars are available
  // (env vars may be undefined at module load time in some environments)
  const PRICE_TO_TIER: Record<string, 'basic' | 'pro'> = {}
  if (process.env.STRIPE_BASIC_PRICE_ID) {
    PRICE_TO_TIER[process.env.STRIPE_BASIC_PRICE_ID] = 'basic'
  }
  if (process.env.STRIPE_PRO_PRICE_ID) {
    PRICE_TO_TIER[process.env.STRIPE_PRO_PRICE_ID] = 'pro'
  }

  // Handle events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session, PRICE_TO_TIER)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription, PRICE_TO_TIER)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        // Log but don't immediately revoke access
        // Stripe will update subscription status to past_due
        const invoice = event.data.object as Stripe.Invoice
        console.log(`Payment failed for invoice ${invoice.id}`)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Still return 200 to prevent retry storms
  }

  // Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  priceToTier: Record<string, 'basic' | 'pro'>
) {
  if (!session.subscription) return

  // Get business_id from session metadata
  const businessId = session.metadata?.business_id

  if (!businessId) {
    console.error('No business_id in checkout session metadata')
    return
  }

  // Fetch full subscription details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const subscriptionItem = subscription.items.data[0]
  const priceId = subscriptionItem.price.id
  const tier = priceToTier[priceId] || 'basic'

  // Update business tier
  await supabase
    .from('businesses')
    .update({ tier })
    .eq('id', businessId)

  // Create/update subscription record
  // Note: current_period_start/end are now on subscription items in Stripe API 2025-12-15
  await supabase
    .from('subscriptions')
    .upsert({
      id: subscription.id,
      business_id: businessId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscriptionItem.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })

  console.log(`Subscription ${subscription.id} created for business ${businessId}, tier: ${tier}`)
}

async function handleSubscriptionUpdated(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription,
  priceToTier: Record<string, 'basic' | 'pro'>
) {
  const businessId = subscription.metadata.business_id
  if (!businessId) {
    console.error('No business_id in subscription metadata')
    return
  }

  const subscriptionItem = subscription.items.data[0]
  const priceId = subscriptionItem.price.id
  const tier = priceToTier[priceId] || 'basic'

  // Update subscription record
  // Note: current_period_end is now on subscription items in Stripe API 2025-12-15
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: priceId,
      current_period_end: new Date(subscriptionItem.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('id', subscription.id)

  // Update tier only if subscription is active-ish
  // 7-day grace period for past_due per CONTEXT.md
  if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
    await supabase
      .from('businesses')
      .update({ tier })
      .eq('id', businessId)
  }

  console.log(`Subscription ${subscription.id} updated: ${subscription.status}`)
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  subscription: Stripe.Subscription
) {
  const businessId = subscription.metadata.business_id
  if (!businessId) {
    console.error('No business_id in subscription metadata')
    return
  }

  // Mark subscription as canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', subscription.id)

  // Revert business to trial tier
  // Access continues until end of billing period
  // The subscription already ended, so revert now
  await supabase
    .from('businesses')
    .update({ tier: 'trial' })
    .eq('id', businessId)

  console.log(`Subscription ${subscription.id} deleted, business ${businessId} reverted to trial`)
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
