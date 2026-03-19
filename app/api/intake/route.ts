import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { clientIntakeSchema } from '@/lib/validations/client-intake'
import { DEFAULT_TIMING_HOURS, type ServiceTypeValue } from '@/lib/validations/job'

/**
 * POST /api/intake — Public client intake form submission.
 *
 * Creates a new business under the agency owner with design brief data,
 * service types, and optional review management configuration.
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
    ownerName,
    ownerEmail,
    ownerPhone,
    serviceTypes,
    customServiceNames,
    description,
    targetAudience,
    brandColors,
    currentWebsite,
    inspirationUrls,
    assetPaths,
    wantsReviewManagement,
    googleReviewLink,
    smsConsentAcknowledged,
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

  // 4. Determine client_type based on review management add-on
  const clientType = wantsReviewManagement ? 'both' : 'web_design'

  // 5. Build intake_data JSONB for design brief
  const parsedInspirationUrls = (inspirationUrls || '')
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.length > 0)

  const intakeData = {
    description: description || undefined,
    targetAudience: targetAudience || undefined,
    brandColors: brandColors || undefined,
    currentWebsite: currentWebsite || undefined,
    inspirationUrls: parsedInspirationUrls.length > 0 ? parsedInspirationUrls : undefined,
    assetPaths: assetPaths && assetPaths.length > 0 ? assetPaths : undefined,
  }

  // 6. Create new business under the agency owner (PURE INSERT)
  const { data: newBusiness, error: insertError } = await supabase
    .from('businesses')
    .insert({
      user_id: ownerId,
      name: businessName,
      phone: ownerPhone || null,
      owner_name: ownerName || null,
      owner_email: ownerEmail || null,
      owner_phone: ownerPhone || null,
      google_review_link: wantsReviewManagement ? (googleReviewLink || null) : null,
      client_type: clientType,
      domain: currentWebsite || null,
      intake_data: intakeData,
    })
    .select('id')
    .single()

  if (insertError || !newBusiness) {
    console.error('[intake] business insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 })
  }

  // 7. Save service types + timing + consent
  const timingMap: Record<string, number> = {}
  for (const serviceType of serviceTypes) {
    timingMap[serviceType] = DEFAULT_TIMING_HOURS[serviceType as ServiceTypeValue]
  }

  const updatePayload: Record<string, unknown> = {
    service_types_enabled: serviceTypes,
    service_type_timing: timingMap,
    custom_service_names: serviceTypes.includes('other') ? customServiceNames : [],
    onboarding_completed_at: new Date().toISOString(),
  }

  // Only set SMS consent if review management was requested
  if (wantsReviewManagement && smsConsentAcknowledged) {
    updatePayload.sms_consent_acknowledged = true
    updatePayload.sms_consent_acknowledged_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('businesses')
    .update(updatePayload)
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
