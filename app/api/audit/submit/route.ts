import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { searchBusiness } from '@/lib/audit/places-client'
import { computeReputationScore } from '@/lib/audit/scoring'

const submitSchema = z.object({
  email: z.string().email(),
  businessName: z.string().min(2).max(100).trim(),
  city: z.string().min(2).max(100).trim(),
})

/**
 * POST /api/audit/submit
 *
 * Email gate endpoint: validates email, re-fetches live business data from Places API
 * (required by Google TOS — cannot cache raw API results), computes score, creates
 * audit_report in DB, fire-and-forgets lead capture, and returns reportId for redirect.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate input
    const body = await req.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { email, businessName, city } = parsed.data

    // Extract IP for lead tracking
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

    // Re-fetch live data from Places API (cannot use cached data per Google TOS)
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

    // Use service role client — no user session on public page
    const supabase = createServiceRoleClient()

    // Insert audit report
    const { data: report, error: reportError } = await supabase
      .from('audit_reports')
      .insert({
        business_name: businessName,
        city,
        place_id: result.placeId,
        place_display_name: result.displayName,
        place_address: result.formattedAddress,
        score: reputation.score,
        grade: reputation.grade,
        rating_snapshot: result.rating,
        review_count_snapshot: result.userRatingCount,
        gaps_json: reputation.gaps,
        lead_email: email,
      })
      .select('id')
      .single()

    if (reportError || !report) {
      console.error('[audit/submit] Failed to insert audit report:', reportError)
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 },
      )
    }

    // Fire-and-forget lead capture — don't block response on error
    supabase
      .from('audit_leads')
      .insert({
        email,
        business_name: businessName,
        city,
        report_id: report.id,
        ip_address: ip,
      })
      .then(({ error: leadError }) => {
        if (leadError) {
          console.error('[audit/submit] Failed to insert audit lead:', leadError)
        }
      })

    return NextResponse.json({ reportId: report.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    console.error('[audit/submit] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 },
    )
  }
}
