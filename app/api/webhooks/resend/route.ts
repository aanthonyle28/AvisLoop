import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// === In-memory rate limiting for webhook endpoint ===
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in ms

function checkWebhookRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = ipRequestCounts.get(ip)

  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

// Use service role for webhook handler - no user context available
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

// Map Resend event types to our status values
const STATUS_MAP: Record<string, string> = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.opened': 'opened',
}

// Events that should trigger contact opt-out
const OPT_OUT_EVENTS = ['email.bounced', 'email.complained']

/**
 * Resend Webhook Types (simplified)
 */
interface ResendWebhookEvent {
  type: string
  data: {
    email_id: string
    to: string[]
    tags?: Array<{ name: string; value: string }>
  }
}

export async function POST(req: NextRequest) {
  // === Rate limit check BEFORE signature verification (save CPU) ===
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
  if (!checkWebhookRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const payload = await req.text()

    // === Verify webhook signature ===
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event: ResendWebhookEvent
    try {
      // Verify signature using Resend SDK
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: req.headers.get('svix-id') || '',
          timestamp: req.headers.get('svix-timestamp') || '',
          signature: req.headers.get('svix-signature') || '',
        },
        webhookSecret: webhookSecret,
      }) as ResendWebhookEvent
    } catch (verifyError) {
      console.error('Webhook signature verification failed:', verifyError)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    // === Extract send_log_id from tags ===
    const sendLogId = event.data.tags?.find(tag => tag.name === 'send_log_id')?.value

    if (!sendLogId) {
      // Email wasn't sent through our system (or missing tag) - ignore
      console.log(`Webhook received for unknown email: ${event.type}`)
      return NextResponse.json({ received: true })
    }

    // === Map event type to status ===
    const newStatus = STATUS_MAP[event.type]
    if (!newStatus) {
      // Unknown event type - acknowledge but don't process
      console.log(`Unknown webhook event type: ${event.type}`)
      return NextResponse.json({ received: true })
    }

    // === Update send_log status ===
    const { error: updateError } = await supabase
      .from('send_logs')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sendLogId)

    if (updateError) {
      console.error('Failed to update send_log:', updateError)
      // Don't return error - we don't want Resend to retry for our DB issues
    }

    // === Auto opt-out contact on bounce or complaint ===
    if (OPT_OUT_EVENTS.includes(event.type)) {
      // Get the contact_id from the send_log
      const { data: sendLog } = await supabase
        .from('send_logs')
        .select('contact_id')
        .eq('id', sendLogId)
        .single()

      if (sendLog?.contact_id) {
        const { error: optOutError } = await supabase
          .from('contacts')
          .update({ opted_out: true })
          .eq('id', sendLog.contact_id)

        if (optOutError) {
          console.error('Failed to opt-out contact:', optOutError)
        } else {
          console.log(`Contact ${sendLog.contact_id} opted out due to ${event.type}`)
        }
      }
    }

    // === Stop campaign if link clicked (review submission intent) ===
    if (event.type === 'email.clicked') {
      const enrollmentId = event.data.tags?.find((t: { name: string; value: string }) => t.name === 'enrollment_id')?.value

      // If this was a campaign email, stop the enrollment
      if (enrollmentId) {
        await supabase
          .from('campaign_enrollments')
          .update({
            status: 'stopped',
            stop_reason: 'review_clicked',
            stopped_at: new Date().toISOString(),
          })
          .eq('id', enrollmentId)
          .eq('status', 'active')  // Only stop if still active

        console.log(`Stopped enrollment ${enrollmentId} - review clicked`)
      } else {
        // Try to find enrollment via send_log
        const { data: sendLog } = await supabase
          .from('send_logs')
          .select('campaign_enrollment_id')
          .eq('id', sendLogId)
          .single()

        if (sendLog?.campaign_enrollment_id) {
          await supabase
            .from('campaign_enrollments')
            .update({
              status: 'stopped',
              stop_reason: 'review_clicked',
              stopped_at: new Date().toISOString(),
            })
            .eq('id', sendLog.campaign_enrollment_id)
            .eq('status', 'active')

          console.log(`Stopped enrollment ${sendLog.campaign_enrollment_id} - review clicked (via send_log)`)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Return 200 to prevent Resend from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
