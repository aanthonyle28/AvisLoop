'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignForJob } from '@/lib/data/campaign'
import type { QuickEnrollResult } from '@/lib/types/dashboard'
import type { ServiceType } from '@/lib/types/database'

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
