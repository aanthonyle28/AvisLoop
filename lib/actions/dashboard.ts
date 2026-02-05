'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignForJob } from '@/lib/data/campaign'
import type { QuickEnrollResult } from '@/lib/types/dashboard'
import type { ServiceType } from '@/lib/types/database'

/**
 * Quick enroll a job from the dashboard ready-to-send queue.
 * Auto-matches campaign by service type (service-specific or "all services" fallback).
 * Returns different states based on enrollment outcome.
 */
export async function quickEnrollJob(jobId: string): Promise<QuickEnrollResult> {
  const supabase = await createClient()

  try {
    // Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (businessError || !business) {
      return { success: false, error: 'Business not found' }
    }

    // Fetch the job with service type
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, business_id, customer_id, service_type, completed_at, status')
      .eq('id', jobId)
      .eq('business_id', business.id)
      .single()

    if (jobError || !job) {
      return { success: false, error: 'Job not found' }
    }

    if (job.status !== 'completed') {
      return { success: false, error: 'Job must be completed to enroll' }
    }

    // Check if job already has active enrollment
    const { data: existingEnrollment } = await supabase
      .from('campaign_enrollments')
      .select('id')
      .eq('job_id', jobId)
      .eq('status', 'active')
      .maybeSingle()

    if (existingEnrollment) {
      return { success: false, error: 'Job already enrolled in a campaign' }
    }

    // Find matching active campaign (service-specific or "all services" fallback)
    const campaign = await getActiveCampaignForJob(business.id, job.service_type as ServiceType)

    if (!campaign) {
      return {
        success: true,
        enrolled: false,
        noMatchingCampaign: true,
        serviceType: job.service_type,
      }
    }

    // Get first touch to calculate scheduled time
    const touch1 = campaign.campaign_touches.find(t => t.touch_number === 1)
    if (!touch1) {
      return { success: false, error: 'Campaign has no touch 1 configured' }
    }

    // Calculate touch 1 scheduled time
    const touch1ScheduledAt = new Date(Date.now() + touch1.delay_hours * 60 * 60 * 1000)

    // Calculate subsequent touch scheduled times (if they exist)
    const touch2 = campaign.campaign_touches.find(t => t.touch_number === 2)
    const touch3 = campaign.campaign_touches.find(t => t.touch_number === 3)
    const touch4 = campaign.campaign_touches.find(t => t.touch_number === 4)

    let touch2ScheduledAt: Date | null = null
    let touch3ScheduledAt: Date | null = null
    let touch4ScheduledAt: Date | null = null

    if (touch2) {
      touch2ScheduledAt = new Date(touch1ScheduledAt.getTime() + touch2.delay_hours * 60 * 60 * 1000)
    }
    if (touch3 && touch2ScheduledAt) {
      touch3ScheduledAt = new Date(touch2ScheduledAt.getTime() + touch3.delay_hours * 60 * 60 * 1000)
    }
    if (touch4 && touch3ScheduledAt) {
      touch4ScheduledAt = new Date(touch3ScheduledAt.getTime() + touch4.delay_hours * 60 * 60 * 1000)
    }

    // Create enrollment record
    const { error: enrollError } = await supabase
      .from('campaign_enrollments')
      .insert({
        business_id: business.id,
        campaign_id: campaign.id,
        job_id: jobId,
        customer_id: job.customer_id,
        status: 'active',
        current_touch: 1,
        touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
        touch_1_status: 'pending',
        touch_2_scheduled_at: touch2ScheduledAt?.toISOString() || null,
        touch_2_status: touch2 ? 'pending' : null,
        touch_3_scheduled_at: touch3ScheduledAt?.toISOString() || null,
        touch_3_status: touch3 ? 'pending' : null,
        touch_4_scheduled_at: touch4ScheduledAt?.toISOString() || null,
        touch_4_status: touch4 ? 'pending' : null,
        enrolled_at: new Date().toISOString(),
      })

    if (enrollError) {
      // Handle unique constraint (already enrolled)
      if (enrollError.code === '23505') {
        return {
          success: false,
          error: 'Customer already has active enrollment for this campaign'
        }
      }
      return { success: false, error: `Failed to enroll: ${enrollError.message}` }
    }

    // Revalidate dashboard to show updated queue
    revalidatePath('/dashboard')

    return {
      success: true,
      enrolled: true,
      campaignName: campaign.name,
    }
  } catch (error) {
    console.error('Error in quickEnrollJob:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}
