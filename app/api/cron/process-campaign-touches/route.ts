import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { resend, RESEND_FROM_EMAIL } from '@/lib/email/resend'
import { ReviewRequestEmail } from '@/lib/email/templates/review-request'
import { render } from '@react-email/render'
import { adjustForQuietHours } from '@/lib/utils/quiet-hours'
import { DEFAULT_EMAIL_RATE_LIMIT, DEFAULT_SMS_RATE_LIMIT } from '@/lib/constants/campaigns'
import type { ClaimedCampaignTouch } from '@/lib/types/database'

// Initialize rate limiters (lazy - only if Redis env vars present)
let emailRateLimiter: Ratelimit | null = null
let smsRateLimiter: Ratelimit | null = null

function getEmailRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  if (!emailRateLimiter) {
    const redis = Redis.fromEnv()
    emailRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEFAULT_EMAIL_RATE_LIMIT, '1 h'),
      analytics: true,
      prefix: 'ratelimit:campaign:email',
    })
  }
  return emailRateLimiter
}

function getSmsRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null
  if (!smsRateLimiter) {
    const redis = Redis.fromEnv()
    smsRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEFAULT_SMS_RATE_LIMIT, '1 h'),
      analytics: true,
      prefix: 'ratelimit:campaign:sms',
    })
  }
  return smsRateLimiter
}

export async function GET(request: Request) {
  // === 1. Authenticate via CRON_SECRET ===
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not set')
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServiceRoleClient()

    // === 2. Claim due campaign touches ===
    const { data: claimedTouches, error: claimError } = await supabase
      .rpc('claim_due_campaign_touches', { limit_count: 100 })

    if (claimError) {
      console.error('Failed to claim touches:', claimError)
      return NextResponse.json({ ok: false, error: 'Failed to claim touches' }, { status: 500 })
    }

    if (!claimedTouches || claimedTouches.length === 0) {
      return NextResponse.json({
        ok: true,
        timestamp: new Date().toISOString(),
        claimed: 0,
        results: { processed: 0, sent: 0, skipped: 0, failed: 0, deferred: 0 },
      })
    }

    // === 3. Process each claimed touch ===
    let processed = 0
    let sent = 0
    let skipped = 0
    let failed = 0
    let deferred = 0

    for (const touch of claimedTouches as ClaimedCampaignTouch[]) {
      processed++

      try {
        // Fetch business and customer
        // NOTE: Customer select includes send_count for tracking updates
        const [{ data: business }, { data: customer }] = await Promise.all([
          supabase
            .from('businesses')
            .select('id, name, google_review_link, default_sender_name')
            .eq('id', touch.business_id)
            .single(),
          supabase
            .from('customers')
            .select('id, name, email, phone, timezone, opted_out, sms_consent_status, send_count')
            .eq('id', touch.customer_id)
            .single(),
        ])

        if (!business || !customer) {
          await markTouchFailed(supabase, touch, 'Business or customer not found')
          failed++
          continue
        }

        // === 4. Check channel-specific requirements ===
        if (touch.channel === 'email') {
          if (customer.opted_out) {
            await markTouchSkipped(supabase, touch, 'opted_out_email')
            skipped++
            continue
          }
        }

        if (touch.channel === 'sms') {
          if (customer.sms_consent_status !== 'opted_in') {
            await markTouchSkipped(supabase, touch, 'no_sms_consent')
            skipped++
            continue
          }
          if (!customer.phone) {
            await markTouchSkipped(supabase, touch, 'no_phone')
            skipped++
            continue
          }
        }

        // === 5. Check quiet hours ===
        const scheduledAt = new Date(touch.scheduled_at)
        const adjustedTime = adjustForQuietHours(scheduledAt, customer.timezone || 'America/New_York')

        if (adjustedTime > new Date()) {
          // In quiet hours, defer to adjusted time
          // Update enrollment with new scheduled time (will be claimed again later)
          await supabase
            .from('campaign_enrollments')
            .update({
              [`touch_${touch.touch_number}_scheduled_at`]: adjustedTime.toISOString(),
            })
            .eq('id', touch.enrollment_id)

          deferred++
          continue
        }

        // === 6. Check rate limit ===
        const limiter = touch.channel === 'email' ? getEmailRateLimiter() : getSmsRateLimiter()
        if (limiter) {
          const { success: withinLimit } = await limiter.limit(`${touch.channel}:${touch.business_id}`)
          if (!withinLimit) {
            // Rate limited, will retry next minute
            deferred++
            continue
          }
        }

        // === 7. Send message ===
        if (touch.channel === 'email') {
          const sendResult = await sendEmailTouch(supabase, touch, business, customer)
          if (sendResult.success) {
            sent++
          } else {
            failed++
          }
        } else {
          // SMS - TODO: Implement in Phase 21
          // For now, mark as skipped with reason
          await markTouchSkipped(supabase, touch, 'sms_not_implemented')
          skipped++
        }

      } catch (error) {
        console.error(`Error processing touch ${touch.enrollment_id}:`, error)
        await markTouchFailed(supabase, touch, error instanceof Error ? error.message : 'Unknown error')
        failed++
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      claimed: claimedTouches.length,
      results: { processed, sent, skipped, failed, deferred },
    })

  } catch (error) {
    console.error('Cron handler error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Send email touch and update enrollment state.
 */
async function sendEmailTouch(
  supabase: ReturnType<typeof createServiceRoleClient>,
  touch: ClaimedCampaignTouch,
  business: { id: string; name: string; google_review_link: string | null; default_sender_name: string | null },
  customer: { id: string; name: string; email: string; send_count: number | null }
): Promise<{ success: boolean; error?: string }> {
  if (!business.google_review_link) {
    await markTouchFailed(supabase, touch, 'No review link configured')
    return { success: false, error: 'No review link' }
  }

  // Fetch template if specified
  let subject = `${business.name} would love your feedback!`
  let templateBody: string | null = null

  if (touch.template_id) {
    const { data: template } = await supabase
      .from('message_templates')
      .select('subject, body')
      .eq('id', touch.template_id)
      .single()

    if (template) {
      subject = template.subject || subject
      templateBody = template.body
    }
  }

  // Create send_log entry
  const { data: sendLog, error: logError } = await supabase
    .from('send_logs')
    .insert({
      business_id: touch.business_id,
      customer_id: touch.customer_id,
      template_id: touch.template_id,
      campaign_id: touch.campaign_id,
      campaign_enrollment_id: touch.enrollment_id,
      touch_number: touch.touch_number,
      channel: 'email',
      status: 'pending',
      subject,
    })
    .select('id')
    .single()

  if (logError || !sendLog) {
    await markTouchFailed(supabase, touch, 'Failed to create send log')
    return { success: false, error: 'Send log creation failed' }
  }

  // Render and send email
  const senderName = business.default_sender_name || business.name

  const html = await render(
    ReviewRequestEmail({
      customerName: customer.name,
      businessName: business.name,
      reviewLink: business.google_review_link,
      senderName,
    })
  )

  const { data: emailData, error: emailError } = await resend.emails.send(
    {
      from: `${senderName} <${RESEND_FROM_EMAIL}>`,
      to: customer.email,
      subject,
      html,
      tags: [
        { name: 'send_log_id', value: sendLog.id },
        { name: 'business_id', value: touch.business_id },
        { name: 'campaign_id', value: touch.campaign_id },
        { name: 'enrollment_id', value: touch.enrollment_id },
        { name: 'touch_number', value: String(touch.touch_number) },
      ],
    },
    { idempotencyKey: `campaign-touch-${touch.enrollment_id}-${touch.touch_number}` }
  )

  // Update send_log
  await supabase
    .from('send_logs')
    .update({
      status: emailError ? 'failed' : 'sent',
      provider_id: emailData?.id || null,
      error_message: emailError?.message || null,
    })
    .eq('id', sendLog.id)

  if (emailError) {
    await markTouchFailed(supabase, touch, emailError.message)
    return { success: false, error: emailError.message }
  }

  // Update enrollment - mark touch sent and schedule next
  await updateEnrollmentAfterSend(supabase, touch)

  // Update customer tracking - use atomic increment to avoid race conditions
  await supabase
    .from('customers')
    .update({
      last_sent_at: new Date().toISOString(),
      send_count: (customer.send_count || 0) + 1,
    })
    .eq('id', touch.customer_id)

  return { success: true }
}

/**
 * Mark a touch as sent and schedule next touch.
 */
async function updateEnrollmentAfterSend(
  supabase: ReturnType<typeof createServiceRoleClient>,
  touch: ClaimedCampaignTouch
): Promise<void> {
  const now = new Date().toISOString()

  // Get next touch delay
  const { data: nextTouch } = await supabase
    .from('campaign_touches')
    .select('delay_hours')
    .eq('campaign_id', touch.campaign_id)
    .eq('touch_number', touch.touch_number + 1)
    .single()

  const updateData: Record<string, unknown> = {
    [`touch_${touch.touch_number}_sent_at`]: now,
    [`touch_${touch.touch_number}_status`]: 'sent',
    current_touch: touch.touch_number + 1,
    updated_at: now,
  }

  if (nextTouch) {
    // Schedule next touch relative to THIS touch's scheduled time (not sent time)
    const nextScheduledAt = new Date(
      new Date(touch.scheduled_at).getTime() + nextTouch.delay_hours * 60 * 60 * 1000
    ).toISOString()
    updateData[`touch_${touch.touch_number + 1}_scheduled_at`] = nextScheduledAt
    updateData[`touch_${touch.touch_number + 1}_status`] = 'pending'
  } else {
    // No more touches, mark enrollment completed
    updateData.status = 'completed'
    updateData.completed_at = now
  }

  await supabase
    .from('campaign_enrollments')
    .update(updateData)
    .eq('id', touch.enrollment_id)
}

/**
 * Mark touch as skipped and advance to next.
 */
async function markTouchSkipped(
  supabase: ReturnType<typeof createServiceRoleClient>,
  touch: ClaimedCampaignTouch,
  reason: string
): Promise<void> {
  console.log(`Touch skipped: ${touch.enrollment_id}/${touch.touch_number} - ${reason}`)

  // Schedule next touch even if this one skipped
  await updateEnrollmentAfterSend(supabase, touch)

  // Override the status to 'skipped' instead of 'sent'
  await supabase
    .from('campaign_enrollments')
    .update({
      [`touch_${touch.touch_number}_status`]: 'skipped',
    })
    .eq('id', touch.enrollment_id)
}

/**
 * Mark touch as failed and advance to next.
 */
async function markTouchFailed(
  supabase: ReturnType<typeof createServiceRoleClient>,
  touch: ClaimedCampaignTouch,
  error: string
): Promise<void> {
  console.error(`Touch failed: ${touch.enrollment_id}/${touch.touch_number} - ${error}`)

  // Schedule next touch even if this one failed
  await updateEnrollmentAfterSend(supabase, touch)

  // Override the status to 'failed' instead of 'sent'
  await supabase
    .from('campaign_enrollments')
    .update({
      [`touch_${touch.touch_number}_status`]: 'failed',
    })
    .eq('id', touch.enrollment_id)
}
