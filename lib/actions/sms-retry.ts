'use server'

/**
 * SMS retry queue management functions
 *
 * Handles queueing failed SMS sends for retry with exponential backoff,
 * and processing retry queue items when their scheduled time arrives.
 *
 * Exponential backoff delays: 1 min, 5 min, 15 min (max 3 attempts)
 *
 * @module lib/actions/sms-retry
 */

import { createClient } from '@/lib/supabase/server'
import { sendSms, isRetryableError } from '@/lib/sms/send-sms'
import { checkQuietHours } from '@/lib/sms/quiet-hours'
import type { SmsRetryReason, SmsRetryQueueItem } from '@/lib/sms/types'

// Exponential backoff delays in minutes: 1, 5, 15
const RETRY_DELAYS = [1, 5, 15]
const MAX_ATTEMPTS = 3

/**
 * Queue an SMS for retry with exponential backoff.
 * Used when:
 * - Twilio API fails with retryable error
 * - Rate limit exceeded
 * - Message delayed due to quiet hours
 *
 * @param params.sendLogId - The send_log ID to retry
 * @param params.reason - Why the retry is needed
 * @param params.attemptCount - Current attempt number (0-based)
 * @param params.scheduledFor - Override schedule time (for quiet hours)
 * @param params.error - Error message from previous attempt
 */
export async function queueSmsRetry(params: {
  sendLogId: string
  reason: SmsRetryReason
  attemptCount?: number
  scheduledFor?: Date
  error?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const attemptCount = params.attemptCount ?? 0

  // Check max attempts (except for quiet_hours which resets on new window)
  if (params.reason !== 'quiet_hours' && attemptCount >= MAX_ATTEMPTS) {
    // Mark send_log as failed
    await supabase
      .from('send_logs')
      .update({
        status: 'failed',
        error_message: params.error || 'Max retry attempts exceeded',
      })
      .eq('id', params.sendLogId)

    return { success: false, error: 'Max retry attempts exceeded' }
  }

  // Get send_log to extract business_id and customer_id
  const { data: sendLog, error: fetchError } = await supabase
    .from('send_logs')
    .select('business_id, customer_id')
    .eq('id', params.sendLogId)
    .single()

  if (fetchError || !sendLog) {
    console.error('Failed to fetch send_log for retry:', fetchError)
    return { success: false, error: 'Send log not found' }
  }

  // Calculate scheduled time
  let scheduledFor: Date
  if (params.scheduledFor) {
    scheduledFor = params.scheduledFor
  } else {
    // Exponential backoff: 1min, 5min, 15min
    const delayMinutes = RETRY_DELAYS[attemptCount] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1]
    scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + delayMinutes)
  }

  // Insert into retry queue
  const { error: insertError } = await supabase.from('sms_retry_queue').insert({
    business_id: sendLog.business_id,
    send_log_id: params.sendLogId,
    customer_id: sendLog.customer_id,
    attempt_count: attemptCount,
    max_attempts: MAX_ATTEMPTS,
    scheduled_for: scheduledFor.toISOString(),
    reason: params.reason,
    last_error: params.error ?? null,
  })

  if (insertError) {
    console.error('Failed to queue SMS retry:', insertError)
    return { success: false, error: 'Failed to queue retry' }
  }

  console.log(`Queued SMS retry for send_log ${params.sendLogId}, attempt ${attemptCount + 1}, scheduled for ${scheduledFor.toISOString()}`)
  return { success: true }
}

/**
 * Process a single SMS retry queue item.
 * Called by cron job after claiming with FOR UPDATE SKIP LOCKED.
 *
 * Checks:
 * 1. Customer still exists
 * 2. Customer consent still opted_in (may have changed since queueing)
 * 3. Quiet hours (reschedules if in quiet hours)
 * 4. Send log still exists with message content
 *
 * On failure: either queues next retry or marks permanently failed.
 */
export async function processSmsRetryItem(
  retry: SmsRetryQueueItem
): Promise<{ success: boolean; shouldRequeue: boolean; error?: string }> {
  const supabase = await createClient()

  // Get customer for phone and timezone
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('phone, timezone, sms_consent_status')
    .eq('id', retry.customer_id)
    .single()

  if (customerError || !customer) {
    await markRetryFailed(supabase, retry.id, 'Customer not found')
    return { success: false, shouldRequeue: false, error: 'Customer not found' }
  }

  // Check consent (customer may have opted out since queueing)
  if (customer.sms_consent_status !== 'opted_in') {
    await markRetryFailed(supabase, retry.id, 'Customer opted out')
    await supabase
      .from('send_logs')
      .update({ status: 'failed', error_message: 'Customer opted out' })
      .eq('id', retry.send_log_id)
    return { success: false, shouldRequeue: false, error: 'Customer opted out' }
  }

  // Check quiet hours
  const quietHoursCheck = checkQuietHours(customer.timezone || 'America/New_York')
  if (!quietHoursCheck.canSend) {
    // Reschedule for next window
    await supabase
      .from('sms_retry_queue')
      .update({
        status: 'pending',
        scheduled_for: quietHoursCheck.nextSendTime!.toISOString(),
        reason: 'quiet_hours',
      })
      .eq('id', retry.id)

    return { success: false, shouldRequeue: false, error: 'Rescheduled for quiet hours' }
  }

  // Get send_log for message content
  const { data: sendLog, error: sendLogError } = await supabase
    .from('send_logs')
    .select('subject')
    .eq('id', retry.send_log_id)
    .single()

  if (sendLogError || !sendLog) {
    await markRetryFailed(supabase, retry.id, 'Send log not found')
    return { success: false, shouldRequeue: false, error: 'Send log not found' }
  }

  // Attempt to send SMS
  const result = await sendSms({
    to: customer.phone!,
    body: sendLog.subject, // Subject field used for SMS body
    businessId: retry.business_id,
    customerId: retry.customer_id,
    sendLogId: retry.send_log_id,
  })

  if (result.success) {
    // Mark retry as completed
    await supabase
      .from('sms_retry_queue')
      .update({ status: 'completed' })
      .eq('id', retry.id)

    // Update send_log
    await supabase
      .from('send_logs')
      .update({
        status: 'sent',
        provider_message_id: { twilio_sid: result.messageSid },
      })
      .eq('id', retry.send_log_id)

    return { success: true, shouldRequeue: false }
  }

  // Send failed
  const newAttemptCount = retry.attempt_count + 1

  // Check if error is retryable
  if (!isRetryableError(result.errorCode) || newAttemptCount >= MAX_ATTEMPTS) {
    // Permanent failure or max attempts
    await markRetryFailed(supabase, retry.id, result.error)
    await supabase
      .from('send_logs')
      .update({ status: 'failed', error_message: result.error })
      .eq('id', retry.send_log_id)

    return { success: false, shouldRequeue: false, error: result.error }
  }

  // Queue next retry with exponential backoff
  await queueSmsRetry({
    sendLogId: retry.send_log_id,
    reason: 'twilio_error',
    attemptCount: newAttemptCount,
    error: result.error,
  })

  // Mark current retry as failed (new one queued)
  await markRetryFailed(supabase, retry.id, result.error)

  return { success: false, shouldRequeue: false, error: result.error }
}

/**
 * Mark a retry queue item as failed with error message and timestamp.
 */
async function markRetryFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  retryId: string,
  error?: string
) {
  await supabase
    .from('sms_retry_queue')
    .update({
      status: 'failed',
      last_error: error ?? null,
      last_attempted_at: new Date().toISOString(),
    })
    .eq('id', retryId)
}
