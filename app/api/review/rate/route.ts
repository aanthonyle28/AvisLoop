import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseReviewToken } from '@/lib/review/token'
import { z } from 'zod'

// Use service role for public endpoint (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
 *
 * This endpoint:
 * 1. Validates the review token
 * 2. Stops any active campaign enrollment (prevents further touches)
 * 3. Returns success (rating is logged but not stored separately - feedback is stored in /api/feedback)
 *
 * Note: For 4-5 star ratings going to Google, this is our only record.
 * For 1-3 star ratings, the feedback will be stored via /api/feedback.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = ratingSchema.parse(body)

    // Validate token
    const tokenData = parseReviewToken(validated.token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

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
        // Don't fail the request - enrollment stop is secondary
      } else {
        console.log(`Stopped enrollment ${tokenData.enrollmentId} - ${stopReason}`)
      }
    }

    // Log the interaction (for analytics, could expand later)
    console.log('Review rating recorded:', {
      customerId: tokenData.customerId,
      businessId: tokenData.businessId,
      rating: validated.rating,
      destination: validated.destination,
      enrollmentId: tokenData.enrollmentId || 'none',
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
