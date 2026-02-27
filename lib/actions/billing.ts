'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'
import { redirect } from 'next/navigation'

/**
 * Create a Stripe Checkout session for subscription.
 * Redirects user to Stripe-hosted checkout page.
 * Creates Stripe customer if none exists for the business.
 */
export async function createCheckoutSession(priceId: string): Promise<never> {
  const business = await getActiveBusiness()
  if (!business) throw new Error('No business found')

  // Need user.email for Stripe customer metadata
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Fetch stripe_customer_id for the active business
  const { data: bizData } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('id', business.id)
    .single()

  let customerId = bizData?.stripe_customer_id
  if (!customerId) {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        business_id: business.id,
        user_id: user.id,
      }
    })
    customerId = customer.id

    // Save customer ID (race condition handled by UNIQUE constraint)
    await supabase
      .from('businesses')
      .update({ stripe_customer_id: customerId })
      .eq('id', business.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing?canceled=1`,
    metadata: { business_id: business.id },
    subscription_data: {
      metadata: { business_id: business.id }
    }
  })

  redirect(session.url!)
}

/**
 * Create a Stripe Customer Portal session for subscription management.
 * Redirects user to Stripe-hosted portal page.
 * Requires existing stripe_customer_id (user must have subscribed before).
 */
export async function createPortalSession(): Promise<never> {
  const business = await getActiveBusiness()
  if (!business) throw new Error('No business found')

  const supabase = await createClient()
  const { data: bizData } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('id', business.id)
    .single()

  if (!bizData?.stripe_customer_id) {
    throw new Error('No billing account found. Please subscribe first.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: bizData.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing`
  })

  redirect(session.url)
}
