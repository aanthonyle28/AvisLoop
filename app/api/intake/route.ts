import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { clientIntakeSchema } from '@/lib/validations/client-intake'
import { DEFAULT_TIMING_HOURS, type ServiceTypeValue } from '@/lib/validations/job'

/**
 * POST /api/intake — Public client intake form submission.
 *
 * Flow:
 * 1. Rate limit by IP
 * 2. Validate body against Zod schema
 * 3. Resolve agency owner from intake_token (service-role)
 * 4. Create new business under that owner (INSERT)
 * 5. Save service types + timing
 * 6. Mark onboarding complete + SMS consent acknowledged
 * 7. Return 201
 */
export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  const rateLimitResult = await checkPublicRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  // 2. Parse & validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = clientIntakeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid input' },
      { status: 400 }
    )
  }

  const {
    businessName,
    phone,
    googleReviewLink,
    serviceTypes,
    customServiceNames,
    token,
  } = parsed.data

  // 3. Resolve agency owner from intake_token
  const supabase = createServiceRoleClient()

  const { data: ownerBusiness } = await supabase
    .from('businesses')
    .select('user_id')
    .eq('intake_token', token)
    .single()

  if (!ownerBusiness) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  const ownerId = ownerBusiness.user_id

  // 4. Create new business under the agency owner (PURE INSERT)
  const { data: newBusiness, error: insertError } = await supabase
    .from('businesses')
    .insert({
      user_id: ownerId,
      name: businessName,
      phone: phone || null,
      google_review_link: googleReviewLink || null,
    })
    .select('id')
    .single()

  if (insertError || !newBusiness) {
    console.error('[intake] business insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }

  // 5. Save service types + timing
  const timingMap: Record<string, number> = {}
  for (const serviceType of serviceTypes) {
    timingMap[serviceType] = DEFAULT_TIMING_HOURS[serviceType as ServiceTypeValue]
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update({
      service_types_enabled: serviceTypes,
      service_type_timing: timingMap,
      custom_service_names: serviceTypes.includes('other') ? customServiceNames : [],
      sms_consent_acknowledged: true,
      sms_consent_acknowledged_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', newBusiness.id)

  if (updateError) {
    console.error('[intake] business update error:', updateError)
    return NextResponse.json({ error: 'Failed to save business details' }, { status: 500 })
  }

  return NextResponse.json(
    { success: true, businessId: newBusiness.id },
    { status: 201 }
  )
}
