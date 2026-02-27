'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'
import type { ServiceType } from '@/lib/types/database'

export interface AvailableCampaign {
  id: string
  name: string
  serviceType: ServiceType | null
  touchCount: number
  firstTouchDelayHours: number
  isRecommended: boolean
}

/**
 * Get active campaigns that could enroll a job with the given service type.
 * Returns campaigns matching the service type + "all services" (null) campaigns.
 * The most specific match is marked as recommended.
 */
export async function getAvailableCampaignsForJob(
  serviceType: ServiceType
): Promise<AvailableCampaign[]> {
  const business = await getActiveBusiness()
  if (!business) return []

  const supabase = await createClient()

  // Fetch active campaigns matching service type OR all-services
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      service_type,
      campaign_touches (touch_number, delay_hours)
    `)
    .eq('business_id', business.id)
    .eq('status', 'active')
    .or(`service_type.eq.${serviceType},service_type.is.null`)
    .order('service_type', { ascending: false, nullsFirst: false }) // Specific match first

  if (!campaigns || campaigns.length === 0) return []

  // Map to AvailableCampaign format
  return campaigns.map((c, index) => {
    const touches = (c.campaign_touches || []).sort(
      (a: { touch_number: number }, b: { touch_number: number }) => a.touch_number - b.touch_number
    )
    const firstTouch = touches[0]

    return {
      id: c.id,
      name: c.name,
      serviceType: c.service_type as ServiceType | null,
      touchCount: touches.length,
      firstTouchDelayHours: firstTouch?.delay_hours || 24,
      // First result is the most specific match (recommended)
      isRecommended: index === 0,
    }
  })
}
