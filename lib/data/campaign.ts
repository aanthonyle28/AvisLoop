'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Campaign,
  CampaignWithTouches,
  CampaignEnrollment,
  CampaignEnrollmentWithDetails,
  ServiceType,
} from '@/lib/types/database'

/**
 * Get all campaigns for current user's business, optionally filtered by service type.
 * Includes system presets (is_preset=true) which have business_id=NULL.
 */
export async function getCampaigns(
  options?: { serviceType?: ServiceType | null; includePresets?: boolean }
): Promise<CampaignWithTouches[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return []

  let query = supabase
    .from('campaigns')
    .select(`
      *,
      campaign_touches (*)
    `)
    .order('created_at', { ascending: false })

  // Filter: business campaigns OR presets (if requested)
  if (options?.includePresets !== false) {
    query = query.or(`business_id.eq.${business.id},is_preset.eq.true`)
  } else {
    query = query.eq('business_id', business.id)
  }

  // Optional service type filter
  if (options?.serviceType !== undefined) {
    if (options.serviceType === null) {
      query = query.is('service_type', null)
    } else {
      query = query.eq('service_type', options.serviceType)
    }
  }

  const { data } = await query

  // Sort touches by touch_number
  return (data || []).map(campaign => ({
    ...campaign,
    campaign_touches: (campaign.campaign_touches || []).sort(
      (a: any, b: any) => a.touch_number - b.touch_number
    ),
  })) as CampaignWithTouches[]
}

/**
 * Get single campaign by ID with touches.
 */
export async function getCampaign(campaignId: string): Promise<CampaignWithTouches | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_touches (*)
    `)
    .eq('id', campaignId)
    .single()

  if (!data) return null

  return {
    ...data,
    campaign_touches: (data.campaign_touches || []).sort(
      (a: any, b: any) => a.touch_number - b.touch_number
    ),
  } as CampaignWithTouches
}

/**
 * Get system preset campaigns only.
 */
export async function getCampaignPresets(): Promise<CampaignWithTouches[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_touches (*)
    `)
    .eq('is_preset', true)
    .order('name')

  return (data || []).map(campaign => ({
    ...campaign,
    campaign_touches: (campaign.campaign_touches || []).sort(
      (a: any, b: any) => a.touch_number - b.touch_number
    ),
  })) as CampaignWithTouches[]
}

/**
 * Get enrollments for a campaign with customer and job details.
 */
export async function getCampaignEnrollments(
  campaignId: string,
  options?: { status?: 'active' | 'completed' | 'stopped'; limit?: number }
): Promise<CampaignEnrollmentWithDetails[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('campaign_enrollments')
    .select(`
      *,
      customers:customer_id (id, name, email, phone),
      jobs:job_id (id, service_type, completed_at),
      campaigns:campaign_id (id, name)
    `)
    .eq('campaign_id', campaignId)
    .order('enrolled_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data } = await query

  return (data || []) as CampaignEnrollmentWithDetails[]
}

/**
 * Get enrollment counts by status for a campaign (for quick stats).
 */
export async function getCampaignEnrollmentCounts(campaignId: string): Promise<{
  active: number
  completed: number
  stopped: number
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { active: 0, completed: 0, stopped: 0 }

  const [activeResult, completedResult, stoppedResult] = await Promise.all([
    supabase
      .from('campaign_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'active'),
    supabase
      .from('campaign_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'completed'),
    supabase
      .from('campaign_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'stopped'),
  ])

  return {
    active: activeResult.count || 0,
    completed: completedResult.count || 0,
    stopped: stoppedResult.count || 0,
  }
}

/**
 * Check if business has any active campaign (for enrollment logic).
 */
export async function getActiveCampaignForJob(
  businessId: string,
  serviceType: ServiceType
): Promise<CampaignWithTouches | null> {
  const supabase = await createClient()

  // Try to find campaign matching service type first, then fall back to "all services"
  const { data } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_touches (*)
    `)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .or(`service_type.eq.${serviceType},service_type.is.null`)
    .order('service_type', { ascending: false, nullsFirst: false })  // Specific match first
    .limit(1)
    .single()

  if (!data) return null

  return {
    ...data,
    campaign_touches: (data.campaign_touches || []).sort(
      (a: any, b: any) => a.touch_number - b.touch_number
    ),
  } as CampaignWithTouches
}
