'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignForJob } from '@/lib/data/campaign'
import type { QuickEnrollResult } from '@/lib/types/dashboard'
import type { ServiceType, JobWithEnrollment } from '@/lib/types/database'

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

    // Check if CUSTOMER already has active enrollment (not just this job)
    // Fixes duplicate enrollment bug: old code checked job_id, missing cross-job duplicates
    const { data: existingEnrollment } = await supabase
      .from('campaign_enrollments')
      .select('id, campaigns:campaign_id(name)')
      .eq('customer_id', job.customer_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingEnrollment) {
      const campaign = Array.isArray(existingEnrollment.campaigns)
        ? existingEnrollment.campaigns[0]
        : existingEnrollment.campaigns
      const name = (campaign as { name: string } | null)?.name || 'a campaign'
      return { success: false, error: `Customer already enrolled in ${name}` }
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

/**
 * Retry a failed send by resetting its status to pending.
 * Only failed sends are retryable (not bounced).
 */
export async function retrySend(sendLogId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch the send_log and verify ownership
    const { data: sendLog, error: fetchError } = await supabase
      .from('send_logs')
      .select('id, status, business_id')
      .eq('id', sendLogId)
      .single()

    if (fetchError || !sendLog) {
      return { success: false, error: 'Send log not found' }
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', sendLog.business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify status is 'failed' (only failed sends are retryable)
    if (sendLog.status !== 'failed') {
      return { success: false, error: 'Only failed sends can be retried' }
    }

    // Reset status to 'pending' so cron processor picks it up
    const { error: updateError } = await supabase
      .from('send_logs')
      .update({ status: 'pending' })
      .eq('id', sendLogId)

    if (updateError) {
      return { success: false, error: 'Failed to retry send' }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error retrying send:', error)
    return { success: false, error: 'An error occurred while retrying' }
  }
}

/**
 * Acknowledge a permanent failure (bounced email, STOP request) that can't be retried.
 * Marks the alert as acknowledged by prepending [ACK] to error_message.
 */
export async function acknowledgeAlert(sendLogId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch the send_log and verify ownership
    const { data: sendLog, error: fetchError } = await supabase
      .from('send_logs')
      .select('id, error_message, business_id')
      .eq('id', sendLogId)
      .single()

    if (fetchError || !sendLog) {
      return { success: false, error: 'Send log not found' }
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', sendLog.business_id)
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return { success: false, error: 'Unauthorized' }
    }

    // Prepend [ACK] to error_message if not already present
    const currentMessage = sendLog.error_message || ''
    const newMessage = currentMessage.startsWith('[ACK]')
      ? currentMessage
      : `[ACK] ${currentMessage}`

    const { error: updateError } = await supabase
      .from('send_logs')
      .update({ error_message: newMessage })
      .eq('id', sendLogId)

    if (updateError) {
      return { success: false, error: 'Failed to acknowledge alert' }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Fetch full job detail for the JobDetailDrawer (from dashboard queue).
 * Returns JobWithEnrollment shape with customer and enrollment data.
 */
export async function getJobDetail(jobId: string): Promise<JobWithEnrollment | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) return null

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers!inner (id, name, email, phone),
        campaign_enrollments (
          id,
          status,
          campaigns (id, name)
        )
      `)
      .eq('id', jobId)
      .eq('business_id', business.id)
      .single()

    if (error || !job) return null

    return job as unknown as JobWithEnrollment
  } catch (error) {
    console.error('Error fetching job detail:', error)
    return null
  }
}

/**
 * Dismiss a job from the dashboard ready-to-send queue.
 * Sets campaign_override = 'dismissed' to exclude it from the queue.
 * Different from 'one_off' which is a legitimate user choice (send manually).
 */
export async function dismissJobFromQueue(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) return { success: false, error: 'Business not found' }

    const { error } = await supabase
      .from('jobs')
      .update({ campaign_override: 'dismissed' })
      .eq('id', jobId)
      .eq('business_id', business.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error dismissing job from queue:', error)
    return { success: false, error: 'An error occurred' }
  }
}

/**
 * Mark a one-off job as sent after the user successfully sends a one-off request.
 * Sets campaign_override = 'one_off_sent' to remove it from the ready-to-send queue.
 */
export async function markOneOffSent(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!business) return { success: false, error: 'Business not found' }

    const { error } = await supabase
      .from('jobs')
      .update({ campaign_override: 'one_off_sent' })
      .eq('id', jobId)
      .eq('business_id', business.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error marking one-off as sent:', error)
    return { success: false, error: 'An error occurred' }
  }
}
