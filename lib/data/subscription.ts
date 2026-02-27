import { createClient } from '@/lib/supabase/server'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import type { Subscription } from '@/lib/types/database'

/**
 * Fetch active subscription for the given business.
 * Returns the most recent subscription, or null if none exists.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getSubscription(businessId: string): Promise<Subscription | null> {
  const supabase = await createClient()

  // Get most recent subscription for the business
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !subscription) {
    return null
  }

  return subscription as Subscription
}

/**
 * Get combined billing info for the billing page.
 * Includes business tier, subscription status, monthly usage, and contact count.
 * Optimized: runs subscription, usage, and contact queries in parallel (PERF-01)
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getBusinessBillingInfo(businessId: string): Promise<{
  business: { id: string; tier: string; stripe_customer_id: string | null } | null
  subscription: Subscription | null
  usage: { count: number; limit: number }
  contactCount: number  // For BILL-07 contact limit display
}> {
  const supabase = await createClient()

  // Fetch business to confirm existence and get billing fields
  const { data: business } = await supabase
    .from('businesses')
    .select('id, tier, stripe_customer_id')
    .eq('id', businessId)
    .single()

  if (!business) {
    return {
      business: null,
      subscription: null,
      usage: { count: 0, limit: 0 },
      contactCount: 0,
    }
  }

  // Run remaining queries in parallel (PERF-01)
  const [subscriptionResult, usageData, contactCountResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    getMonthlyUsage(businessId),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'active'),
  ])

  return {
    business: {
      id: business.id,
      tier: business.tier,
      stripe_customer_id: business.stripe_customer_id,
    },
    subscription: subscriptionResult.data as Subscription | null,
    usage: {
      count: usageData.count,
      limit: usageData.limit,
    },
    contactCount: contactCountResult.count ?? 0,
  }
}
