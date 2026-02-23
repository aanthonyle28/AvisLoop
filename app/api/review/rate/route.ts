import { NextRequest, NextResponse } from 'next/server'
import { parseReviewToken } from '@/lib/review/token'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'

const ratingSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  destination: z.enum(['google', 'feedback']),
})

/**
 * POST /api/review/rate
 *
 * Records the customer's rating selection and stops campaign enrollment.
 * Called when customer submits their rating (before redirect or feedback form).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimitResult = await checkPublicRateLimit(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
    const body = await req.json()
    const validated = ratingSchema.parse(body)

    // Validate token
    const tokenData = parseReviewToken(validated.token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Create service role client inside handler (not module scope)
    const supabase = createServiceRoleClient()

    // Verify customer and business exist
    const [customerCheck, businessCheck] = await Promise.all([
      supabase.from('customers').select('id').eq('id', tokenData.customerId).single(),
      supabase.from('businesses').select('id').eq('id', tokenData.businessId).single(),
    ])

    if (customerCheck.error || businessCheck.error) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 400 })
    }

    // Stop campaign enrollment if present
    if (tokenData.enrollmentId) {
      const stopReason = validated.destination === 'google' ? 'review_clicked' : 'feedback_submitted'

      const { error: stopError } = await supabase
        .from('campaign_enrollments')
        .update({
          status: 'stopped',
          stop_reason: stopReason,
          stopped_at: new Date().toISOString(),
        })
        .eq('id', tokenData.enrollmentId)
        .eq('status', 'active') // Only stop if still active

      if (stopError) {
        console.error('Failed to stop enrollment:', stopError)
      } else {
        console.log(`Stopped enrollment ${tokenData.enrollmentId} - ${stopReason}`)
      }

      // Mark associated send_logs as reviewed so KPI "Reviews This Month" works
      const { error: reviewedError } = await supabase
        .from('send_logs')
        .update({ reviewed_at: new Date().toISOString() })
        .eq('campaign_enrollment_id', tokenData.enrollmentId)
        .is('reviewed_at', null)

      if (reviewedError) {
        console.error('Failed to set reviewed_at on send_logs:', reviewedError)
      }
    }

    // Log the interaction for analytics
    console.log('Review rating recorded:', {
      customerId: tokenData.customerId.slice(0, 8) + '...',
      businessId: tokenData.businessId.slice(0, 8) + '...',
      rating: validated.rating,
      destination: validated.destination,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Rating submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
