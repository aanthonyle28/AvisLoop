/**
 * Twilio Inbound SMS Webhook
 *
 * Handles incoming SMS messages from Twilio, primarily for opt-out processing.
 * TCPA requires processing STOP keywords within 5 minutes.
 *
 * Twilio Supported STOP Keywords (auto-handled by Twilio at carrier level):
 *   STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT
 *
 * We also handle informal variants for belt-and-suspenders compliance.
 *
 * @module app/api/webhooks/twilio/inbound/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  validateTwilioRequest,
  parseWebhookBody,
  buildWebhookUrl,
} from '@/lib/sms/webhook-validation'

// STOP keywords per TCPA requirements
const STOP_KEYWORDS = [
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
]

export async function POST(request: NextRequest) {
  // 1. Get raw body and signature
  const body = await request.text()
  const signature = request.headers.get('X-Twilio-Signature')

  if (!signature) {
    console.error('[Twilio Inbound] Missing Twilio signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 403 })
  }

  // 2. Parse body and validate signature
  const params = parseWebhookBody(body)
  const url = buildWebhookUrl('/api/webhooks/twilio/inbound')
  const isValid = validateTwilioRequest(signature, url, params)

  if (!isValid) {
    console.error('[Twilio Inbound] Invalid Twilio webhook signature')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Extract message details
  const { Body, From, OptOutType } = params

  // 4. Handle STOP keywords
  // Twilio may send OptOutType='STOP' for standard keywords
  // We also check message body for informal variants
  const normalizedBody = (Body || '').trim().toUpperCase()
  const isStop =
    OptOutType === 'STOP' ||
    STOP_KEYWORDS.includes(normalizedBody) ||
    normalizedBody.includes('STOP') ||
    normalizedBody.includes('UNSUBSCRIBE')

  if (isStop && From) {
    await handleOptOut(From)
    // Log only last 4 digits for privacy
    console.log(`[Twilio Inbound] Opt-out processed for phone: ***${From.slice(-4)}`)
  }

  // Twilio expects 200 response (even for non-STOP messages)
  return NextResponse.json({ success: true })
}

/**
 * Update customer SMS consent status to opted_out.
 * TCPA requires immediate processing (within 5 minutes).
 *
 * NOTE: Updates ALL customers with matching phone number.
 * This is intentional - if dad and son share a phone, both should opt out.
 *
 * @param phoneNumber - The phone number that sent the STOP message
 */
async function handleOptOut(phoneNumber: string) {
  const supabase = createServiceRoleClient()

  const { error, count } = await supabase
    .from('customers')
    .update({
      sms_consent_status: 'opted_out',
      sms_consent_at: new Date().toISOString(),
      sms_consent_source: 'sms_reply_stop',
      sms_consent_method: 'phone_call', // Reply via phone/SMS
    })
    .eq('phone', phoneNumber)

  if (error) {
    console.error('[Twilio Inbound] Failed to update opt-out status:', error)
  } else {
    console.log(`[Twilio Inbound] Updated ${count ?? 'unknown'} customer(s) to opted_out`)
  }
}
