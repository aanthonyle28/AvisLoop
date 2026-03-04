import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkAuditRateLimit } from '@/lib/rate-limit'
import { searchBusiness } from '@/lib/audit/places-client'
import { computeReputationScore } from '@/lib/audit/scoring'

const searchSchema = z.object({
  businessName: z.string().min(2).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
})

/**
 * POST /api/audit/search
 *
 * Public endpoint: searches for a business by name + city via Google Places API,
 * computes reputation score, and returns a preview (grade + score) before email gate.
 *
 * Rate limited: 5 searches per IP per day (fixedWindow).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const rateLimitResult = await checkAuditRateLimit(ip)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Daily audit limit reached. Try again tomorrow.',
          remaining: 0,
        },
        { status: 429 },
      )
    }

    // Parse and validate input
    const body = await req.json()
    const parsed = searchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { businessName, city } = parsed.data

    // Call Google Places API
    const result = await searchBusiness(businessName, city)
    if (!result) {
      return NextResponse.json(
        {
          error:
            'No business found on Google Maps. Check the name and city.',
        },
        { status: 404 },
      )
    }

    // Compute reputation score
    const reputation = computeReputationScore(
      result.rating,
      result.userRatingCount,
    )

    return NextResponse.json({
      place: {
        placeId: result.placeId,
        displayName: result.displayName,
        formattedAddress: result.formattedAddress,
      },
      grade: reputation.grade,
      score: reputation.score,
      rating: result.rating,
      reviewCount: result.userRatingCount,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('[audit/search] Error:', error)
    return NextResponse.json(
      { error: 'Failed to look up business' },
      { status: 500 },
    )
  }
}
