'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getReadyToSendJobWithCampaign } from '@/lib/data/dashboard'
import type { JobPanelDetail } from '@/lib/types/dashboard'
import type { JobWithEnrollment } from '@/lib/types/database'

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
/**
 * Server action wrapper for getReadyToSendJobWithCampaign.
 * Callable from client components (unlike the data function which uses server-only imports).
 */
export async function fetchJobPanelDetail(
  jobId: string,
  businessId: string
): Promise<JobPanelDetail | null> {
  return getReadyToSendJobWithCampaign(jobId, businessId)
}

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
