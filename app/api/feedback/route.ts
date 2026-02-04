import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { parseReviewToken } from '@/lib/review/token'
import { feedbackSchema } from '@/lib/validations/feedback'
import { z } from 'zod'

// Use service role for public endpoint (no user context)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

/**
 * POST /api/feedback
 *
 * Stores private feedback from customers who rated 1-3 stars.
 * Also sends email notification to business owner.
 *
 * This endpoint:
 * 1. Validates the review token
 * 2. Stores feedback in customer_feedback table
 * 3. Stops campaign enrollment if present
 * 4. Sends notification email to business owner
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = feedbackSchema.parse(body)

    // Validate token
    const tokenData = parseReviewToken(validated.token)
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Fetch customer and business data
    const [customerResult, businessResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id, name, email')
        .eq('id', tokenData.customerId)
        .single(),
      supabase
        .from('businesses')
        .select('id, name, user_id')
        .eq('id', tokenData.businessId)
        .single(),
    ])

    if (customerResult.error || !customerResult.data) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const customer = customerResult.data
    const business = businessResult.data

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('customer_feedback')
      .insert({
        business_id: tokenData.businessId,
        customer_id: tokenData.customerId,
        enrollment_id: tokenData.enrollmentId || null,
        rating: validated.rating,
        feedback_text: validated.feedback_text || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    // Stop campaign enrollment if present
    if (tokenData.enrollmentId) {
      const { error: stopError } = await supabase
        .from('campaign_enrollments')
        .update({
          status: 'stopped',
          stop_reason: 'feedback_submitted',
          stopped_at: new Date().toISOString(),
        })
        .eq('id', tokenData.enrollmentId)
        .eq('status', 'active')

      if (stopError) {
        console.error('Failed to stop enrollment on feedback:', stopError)
      } else {
        console.log(`Stopped enrollment ${tokenData.enrollmentId} - feedback submitted`)
      }
    }

    // Get business owner's email
    const { data: ownerData } = await supabase.auth.admin.getUserById(business.user_id)
    const ownerEmail = ownerData?.user?.email

    // Send notification email to owner
    if (ownerEmail && process.env.RESEND_API_KEY) {
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/feedback`
        const starsFilled = generateStars(validated.rating)
        const starsEmpty = generateStars(5 - validated.rating, true)
        const feedbackHtml = validated.feedback_text
          ? `<p><strong>Feedback:</strong></p>
      <div class="feedback-box">
        ${escapeHtml(validated.feedback_text).replace(/\n/g, '<br>')}
      </div>`
          : '<p><em>No additional comments provided.</em></p>'

        await resend.emails.send({
          from: 'AvisLoop <notifications@avisloop.com>',
          to: ownerEmail,
          subject: `New feedback from ${customer.name} (${validated.rating} star${validated.rating === 1 ? '' : 's'})`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-top: none; }
    .footer { background: #f8f9fa; padding: 15px 20px; border-radius: 0 0 8px 8px; font-size: 14px; color: #6c757d; }
    .rating { font-size: 24px; margin: 10px 0; }
    .feedback-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .btn { display: inline-block; background: #0070f3; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Customer Feedback</h2>
    </div>
    <div class="content">
      <p><strong>Customer:</strong> ${escapeHtml(customer.name)} (${escapeHtml(customer.email)})</p>
      <p><strong>Rating:</strong></p>
      <div class="rating">${starsFilled}${starsEmpty}</div>

      ${feedbackHtml}

      <p>This feedback was submitted through your review funnel. You can respond to the customer directly or mark this as resolved in your dashboard.</p>

      <a href="${dashboardUrl}" class="btn">View in Dashboard</a>
    </div>
    <div class="footer">
      <p>This notification was sent by AvisLoop. You're receiving this because you have a business account with review funnel enabled.</p>
    </div>
  </div>
</body>
</html>
          `,
        })

        console.log(`Notification sent to ${ownerEmail} for feedback ${feedback.id}`)
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError)
        // Don't fail the request - email is secondary
      }
    }

    return NextResponse.json({ success: true, feedbackId: feedback.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate star characters for email display.
 * Uses Unicode stars that render well in most email clients.
 */
function generateStars(count: number, empty = false): string {
  const star = empty ? '\u2606' : '\u2B50' // Star outline vs filled star
  return star.repeat(count)
}

/**
 * Escape HTML to prevent XSS in email content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
