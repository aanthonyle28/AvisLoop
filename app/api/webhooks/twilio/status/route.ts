/**
 * Twilio Delivery Status Webhook
 *
 * Handles delivery status callbacks from Twilio for SMS messages.
 * Updates send_logs with delivery status (delivered/failed/etc).
 *
 * Twilio Status Flow: queued -> sending -> sent -> delivered
 *                     OR: queued -> sending -> sent -> undelivered/failed
 *
 * Reference: https://www.twilio.com/docs/messaging/guides/outbound-message-logging
 *
 * @module app/api/webhooks/twilio/status/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  validateTwilioRequest,
  parseWebhookBody,
  buildWebhookUrl,
} from '@/lib/sms/webhook-validation'

// Twilio status values mapped to our send_logs status
const STATUS_MAP: Record<string, string> = {
  queued: 'pending',      // Message queued at Twilio
  sending: 'pending',     // Message being sent to carrier
  sent: 'sent',           // Message sent to carrier
  delivered: 'delivered', // Delivery confirmed by carrier
  undelivered: 'failed',  // Message failed to deliver
  failed: 'failed',       // Message failed (before carrier)
  read: 'opened',         // Message read (WhatsApp only, not SMS)
}

// Valid status transitions - prevent out-of-order webhooks from corrupting state
// e.g., if we already have 'delivered', don't downgrade to 'sent'
const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  failed: 99, // Terminal state - always allow update to failed
}

export async function POST(request: NextRequest) {
  // 1. Get raw body and signature
  const body = await request.text()
  const signature = request.headers.get('X-Twilio-Signature')

  if (!signature) {
    console.error('[Twilio Status] Missing Twilio signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
  }

  // 2. Parse body and validate signature
  const params = parseWebhookBody(body)
  const url = buildWebhookUrl('/api/webhooks/twilio/status')
  const isValid = validateTwilioRequest(signature, url, params)

  if (!isValid) {
    console.error('[Twilio Status] Invalid Twilio webhook signature')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Extract status details
  const {
    MessageSid,
    MessageStatus,
    ErrorCode,
    ErrorMessage,
  } = params

  if (!MessageSid || !MessageStatus) {
    console.error('[Twilio Status] Missing MessageSid or MessageStatus')
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 4. Map Twilio status to our status
  const newStatus = STATUS_MAP[MessageStatus.toLowerCase()] || 'pending'

  // 5. Update send_log
  await updateSendLog(MessageSid, newStatus, ErrorCode, ErrorMessage)

  return NextResponse.json({ success: true })
}

/**
 * Update send_log status from Twilio webhook.
 * Uses provider_message_id JSONB to find the record.
 * Respects status priority to handle out-of-order webhooks.
 *
 * @param messageSid - Twilio message SID
 * @param newStatus - Our mapped status value
 * @param errorCode - Twilio error code (if failed)
 * @param errorMessage - Twilio error message (if failed)
 */
async function updateSendLog(
  messageSid: string,
  newStatus: string,
  errorCode?: string,
  errorMessage?: string
) {
  const supabase = createServiceRoleClient()

  // Find send_log by Twilio message SID in provider_message_id JSONB
  // Query: provider_message_id->>'twilio_sid' = messageSid
  const { data: sendLog, error: findError } = await supabase
    .from('send_logs')
    .select('id, status')
    .filter('provider_message_id->>twilio_sid', 'eq', messageSid)
    .single()

  if (findError || !sendLog) {
    // Message not found - could be:
    // 1. Message from before webhook integration
    // 2. Race condition where webhook arrived before DB insert
    // 3. Message from different system
    console.warn(`[Twilio Status] Send log not found for SID: ${messageSid}`)
    return
  }

  // Check status priority (don't downgrade unless it's a failure)
  const currentPriority = STATUS_PRIORITY[sendLog.status] ?? 0
  const newPriority = STATUS_PRIORITY[newStatus] ?? 0

  if (newPriority <= currentPriority && newStatus !== 'failed') {
    console.log(`[Twilio Status] Skipping status update: ${sendLog.status} -> ${newStatus} (priority check)`)
    return
  }

  // Update send_log
  const updateData: Record<string, unknown> = {
    status: newStatus,
  }

  // Add error info if present
  if (errorCode || errorMessage) {
    updateData.error_message = errorMessage || `Error code: ${errorCode}`
  }

  const { error: updateError } = await supabase
    .from('send_logs')
    .update(updateData)
    .eq('id', sendLog.id)

  if (updateError) {
    console.error('[Twilio Status] Failed to update send_log status:', updateError)
  } else {
    console.log(`[Twilio Status] Updated send_log ${sendLog.id}: ${sendLog.status} -> ${newStatus}`)
  }
}
