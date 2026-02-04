import { notFound } from 'next/navigation'
import { parseReviewToken } from '@/lib/review/token'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ReviewFlow } from './review-flow'
import { REVIEW_PAGE_COPY } from '@/lib/review/routing'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ token: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: REVIEW_PAGE_COPY.heading,
    robots: 'noindex, nofollow', // Don't index review pages
  }
}

/**
 * Public review page - entry point from email/SMS review links.
 *
 * Flow:
 * 1. Parse and validate token (expires after 30 days)
 * 2. Fetch customer and business data
 * 3. Render interactive ReviewFlow component
 *
 * Token validation happens server-side to prevent enumeration attacks.
 * Uses service role client since this is a public (unauthenticated) page.
 */
export default async function ReviewPage({ params }: Props) {
  const { token } = await params

  // Validate token
  const tokenData = parseReviewToken(token)
  if (!tokenData) {
    console.log('Invalid or expired review token')
    notFound()
  }

  // Use service role for public page (no auth context)
  const supabase = createServiceRoleClient()

  // Fetch customer and business in parallel
  const [customerResult, businessResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, email')
      .eq('id', tokenData.customerId)
      .single(),
    supabase
      .from('businesses')
      .select('id, name, google_review_link')
      .eq('id', tokenData.businessId)
      .single(),
  ])

  // Handle missing data
  if (customerResult.error || !customerResult.data) {
    console.error('Customer not found:', tokenData.customerId)
    notFound()
  }

  if (businessResult.error || !businessResult.data) {
    console.error('Business not found:', tokenData.businessId)
    notFound()
  }

  const customer = customerResult.data
  const business = businessResult.data

  // Check if Google review link is configured
  const hasGoogleLink = !!business.google_review_link

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-xl border p-8">
          <ReviewFlow
            token={token}
            customer={{ id: customer.id, name: customer.name }}
            business={{
              id: business.id,
              name: business.name,
              googleReviewLink: business.google_review_link,
            }}
            enrollmentId={tokenData.enrollmentId}
            hasGoogleLink={hasGoogleLink}
          />
        </div>

        {/* Footer - FTC compliance language */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          {REVIEW_PAGE_COPY.footer}
        </p>
      </div>
    </div>
  )
}
