import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'
import { publicJobSchema } from '@/lib/validations/public-job'
import { createPublicJob } from '@/lib/actions/public-job'

/**
 * POST /api/complete
 *
 * Public, rate-limited endpoint for job completion form submissions.
 * No authentication required — business is resolved from the form token.
 *
 * Flow:
 * 1. Rate limit by IP
 * 2. Validate request body against publicJobSchema
 * 3. Resolve business from form_token (service-role client)
 * 4. Validate service type against business's enabled types
 * 5. Create customer + job + enrollment via createPublicJob()
 * 6. Return 201 on success
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Rate limit by IP address
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimitResult = await checkPublicRateLimit(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Step 2: Parse and validate body
    const body = await req.json()
    const parsed = publicJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Step 3: Resolve business from token (service-role — no RLS)
    // SERVICE-ROLE CLIENT: bypasses RLS for token lookup
    const supabase = createServiceRoleClient()
    const { data: business } = await supabase
      .from('businesses')
      .select('id, service_types_enabled')
      .eq('form_token', parsed.data.token)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Invalid form' }, { status: 404 })
    }

    // Step 4: Validate service type against business's enabled service types
    const enabledTypes = business.service_types_enabled as string[] | null
    if (
      enabledTypes &&
      enabledTypes.length > 0 &&
      !enabledTypes.includes(parsed.data.serviceType)
    ) {
      return NextResponse.json(
        { error: 'Service type not available for this business' },
        { status: 400 }
      )
    }

    // Step 5: Create customer + job + enrollment
    const result = await createPublicJob({
      businessId: business.id,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail || undefined,
      customerPhone: parsed.data.customerPhone || undefined,
      serviceType: parsed.data.serviceType,
      notes: parsed.data.notes || undefined,
    })

    // Step 6: Return response
    if (result.success) {
      return NextResponse.json({ success: true }, { status: 201 })
    }

    return NextResponse.json(
      { error: result.error || 'Failed to create job' },
      { status: 500 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    // Log without PII
    console.error('[POST /api/complete] Internal error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
