'use server'

/**
 * SMS sending action for review requests
 *
 * Implements all business rules for TCPA-compliant SMS sending:
 * - Authentication
 * - Rate limiting (per-user)
 * - Consent checking (must be 'opted_in')
 * - Quiet hours enforcement (8am-9pm customer local time)
 * - Monthly quota enforcement
 * - Retry queue for transient failures
 *
 * @module lib/actions/send-sms.action
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendSms } from '@/lib/sms/send-sms'
import { checkQuietHours } from '@/lib/sms/quiet-hours'
import { queueSmsRetry } from '@/lib/actions/sms-retry'
import { smsMessageSchema } from '@/lib/validations/sms'
import { checkSendRateLimit } from '@/lib/rate-limit'
import { MONTHLY_SEND_LIMITS } from '@/lib/constants/billing'

export type SmsActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  queued?: boolean // True if queued for quiet hours
  queuedFor?: string // ISO timestamp when it will be sent
  data?: { sendLogId: string }
}

/**
 * Send an SMS review request to a customer.
 * Implements all business rules: auth, rate limit, consent, quiet hours, monthly limit.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Rate limit check (per-user)
 * 3. Get business + customer + template
 * 4. Check customer has phone number (fallback info if not)
 * 5. Check SMS consent (must be 'opted_in')
 * 6. Check quiet hours (queue if outside 8am-9pm local)
 * 7. Check monthly limit
 * 8. Create send_log (channel: 'sms', status: 'pending')
 * 9. Send via Twilio (or queue for retry)
 * 10. Update send_log with result
 */
export async function sendSmsRequest(
  _prevState: SmsActionState | null,
  formData: FormData
): Promise<SmsActionState> {
  const supabase = await createClient()

  // === 1. Authenticate user ===
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to send review requests' }
  }

  // === 2. Rate limit check ===
  const rateLimitResult = await checkSendRateLimit(user.id)
  if (!rateLimitResult.success) {
    return { error: 'Rate limit exceeded. Please wait before sending more messages.' }
  }

  // === Parse and validate input ===
  const parsed = smsMessageSchema.safeParse({
    body: formData.get('body'),
    customerId: formData.get('customerId'),
    templateId: formData.get('templateId') || undefined,
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { body, customerId, templateId } = parsed.data

  // === 3. Get business ===
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, google_review_link, default_sender_name, tier')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // === Get customer ===
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select(
      'id, name, email, phone, phone_status, status, sms_consent_status, timezone, send_count'
    )
    .eq('id', customerId)
    .eq('business_id', business.id)
    .single()

  if (customerError || !customer) {
    return { error: 'Customer not found' }
  }

  // === 4. Check phone number ===
  if (!customer.phone || customer.phone_status !== 'valid') {
    return {
      error: `${customer.name} does not have a valid phone number. Use email instead.`,
    }
  }

  // === 5. Check SMS consent (TCPA requirement) ===
  // Only customers with sms_consent_status = 'opted_in' can receive SMS
  if (customer.sms_consent_status !== 'opted_in') {
    return {
      error: `${customer.name} has not opted in to SMS messages. Update their consent status first.`,
    }
  }

  if (customer.status === 'archived') {
    return { error: 'Cannot send to archived customers' }
  }

  // === 6. Check quiet hours ===
  const timezone = customer.timezone || 'America/New_York'
  const quietHoursCheck = checkQuietHours(timezone)

  // === 7. Check monthly limit ===
  const monthlyLimit = MONTHLY_SEND_LIMITS[business.tier] || MONTHLY_SEND_LIMITS.basic
  const { count: monthlyCount } = await getMonthlyCount(supabase, business.id)

  if (monthlyCount >= monthlyLimit) {
    return {
      error: `Monthly send limit reached (${monthlyLimit}). Upgrade your plan for more sends.`,
    }
  }

  // === 8. Create send_log ===
  const { data: sendLog, error: logError } = await supabase
    .from('send_logs')
    .insert({
      business_id: business.id,
      contact_id: customerId, // Legacy field
      customer_id: customerId,
      template_id: templateId || null,
      channel: 'sms',
      status: 'pending',
      subject: body, // SMS body stored in subject field
    })
    .select('id')
    .single()

  if (logError || !sendLog) {
    return { error: 'Failed to create send log' }
  }

  // === Handle quiet hours - queue for later ===
  if (!quietHoursCheck.canSend) {
    await queueSmsRetry({
      sendLogId: sendLog.id,
      reason: 'quiet_hours',
      scheduledFor: quietHoursCheck.nextSendTime!,
    })

    revalidatePath('/dashboard')
    revalidatePath('/campaigns')

    return {
      success: true,
      queued: true,
      queuedFor: quietHoursCheck.nextSendTime!.toISOString(),
      data: { sendLogId: sendLog.id },
    }
  }

  // === 9. Send via Twilio ===
  // Body should include review link - caller must provide it in the message body
  // (typically interpolated from template or manually entered with business.google_review_link)
  const result = await sendSms({
    to: customer.phone,
    body, // Must include review link from business.google_review_link
    businessId: business.id,
    customerId: customer.id,
    sendLogId: sendLog.id,
  })

  // === 10. Update send_log with result ===
  if (result.success) {
    await supabase
      .from('send_logs')
      .update({
        status: 'sent',
        provider_message_id: { twilio_sid: result.messageSid },
      })
      .eq('id', sendLog.id)

    // Update customer tracking fields
    await supabase
      .from('customers')
      .update({
        last_sent_at: new Date().toISOString(),
        send_count: (customer.send_count || 0) + 1,
      })
      .eq('id', customerId)

    revalidatePath('/dashboard')
    revalidatePath('/campaigns')

    return { success: true, data: { sendLogId: sendLog.id } }
  }

  // === Handle failure - queue for retry if retryable ===
  await queueSmsRetry({
    sendLogId: sendLog.id,
    reason: 'twilio_error',
    error: result.error,
  })

  revalidatePath('/dashboard')
  revalidatePath('/campaigns')

  return {
    error: `Failed to send SMS: ${result.error}. Message queued for retry.`,
    data: { sendLogId: sendLog.id },
  }
}

/**
 * Helper to get monthly send count for a business.
 * Counts sends from the first of the current month.
 */
async function getMonthlyCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<{ count: number }> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .gte('created_at', startOfMonth.toISOString())
    .in('status', ['sent', 'delivered', 'opened'])

  return { count: count || 0 }
}
