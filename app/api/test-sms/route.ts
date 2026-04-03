import { NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms/send-sms'

/**
 * Quick SMS test endpoint. DELETE THIS FILE after testing.
 *
 * Usage: just open in browser:
 *   /api/test-sms?to=+12065551234&key=avisloop-sms-test-2026
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const to = searchParams.get('to')

  if (key !== 'avisloop-sms-test-2026') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  if (!to) {
    return NextResponse.json({ error: 'Missing ?to=+1XXXXXXXXXX' }, { status: 400 })
  }

  const result = await sendSms({
    to,
    body: 'AvisLoop SMS test - if you received this, your A2P Messaging Service is working!',
    businessId: 'test',
    customerId: 'test',
    sendLogId: 'test',
  })

  return NextResponse.json(result)
}
