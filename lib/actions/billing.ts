'use server'

import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Create a Stripe Checkout session for subscription.
 * Redirects user to Stripe-hosted checkout page.
 * Creates Stripe customer if none exists for the business.
 */
export async function createCheckoutSession(priceId: string): Promise<never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get business, create Stripe customer if needed
  const { data: business } = await supabase
    .from('businesses')
    .select('id, stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!business) throw new Error('No business found')

  let customerId = business.stripe_customer_id
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: business } = await supabase
    .from('businesses')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!business?.stripe_customer_id) {
    throw new Error('No billing account found. Please subscribe first.')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing`
  })

  redirect(session.url)
}
