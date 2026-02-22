import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

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
  try {
    const payload = await req.text()

    // === Verify webhook signature ===
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const resend = new Resend(resendApiKey)

    let event: ResendWebhookEvent
    try {
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

    // Create service role client inside handler
    const supabase = createServiceRoleClient()

    // === Extract send_log_id from tags ===
    const sendLogId = event.data.tags?.find(tag => tag.name === 'send_log_id')?.value

    if (!sendLogId) {
      console.log(`Webhook received for unknown email: ${event.type}`)
      return NextResponse.json({ received: true })
    }

    // === Map event type to status ===
    const newStatus = STATUS_MAP[event.type]
    if (!newStatus) {
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
    }

    // === Auto opt-out contact on bounce or complaint ===
    if (OPT_OUT_EVENTS.includes(event.type)) {
      const { data: sendLog } = await supabase
        .from('send_logs')
        .select('customer_id')
        .eq('id', sendLogId)
        .single()

      if (sendLog?.customer_id) {
        const { error: optOutError } = await supabase
          .from('customers')
          .update({ opted_out: true })
          .eq('id', sendLog.customer_id)

        if (optOutError) {
          console.error('Failed to opt-out contact:', optOutError)
        } else {
          console.log(`Contact ${sendLog.customer_id} opted out due to ${event.type}`)

          // Stop any active campaign enrollments for this customer
          await supabase
            .from('campaign_enrollments')
            .update({
              status: 'stopped',
              stop_reason: 'opted_out_email',
              stopped_at: new Date().toISOString(),
            })
            .eq('customer_id', sendLog.customer_id)
            .eq('status', 'active')

          console.log(`Stopped active enrollments for customer ${sendLog.customer_id} - opted out of email`)
        }
      }
    }

    // === Stop campaign if link clicked (review submission intent) ===
    if (event.type === 'email.clicked') {
      const enrollmentId = event.data.tags?.find((t: { name: string; value: string }) => t.name === 'enrollment_id')?.value

      if (enrollmentId) {
        await supabase
          .from('campaign_enrollments')
          .update({
            status: 'stopped',
            stop_reason: 'review_clicked',
            stopped_at: new Date().toISOString(),
          })
          .eq('id', enrollmentId)
          .eq('status', 'active')

        console.log(`Stopped enrollment ${enrollmentId} - review clicked`)
      } else {
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
