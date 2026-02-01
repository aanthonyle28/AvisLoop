import { getBusiness } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { getMonthlyUsage, getResponseRate, getNeedsAttentionCount, getRecentActivity, getResendReadyContacts } from '@/lib/data/send-logs'
import { getOnboardingCardStatus } from '@/lib/data/onboarding'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SendPageClient } from '@/components/send/send-page-client'
import { StatStrip } from '@/components/send/stat-strip'

export default async function SendPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/onboarding')
  }

  const supabase = await createClient()

  // Fetch required data in parallel
  const [
    { contacts },
    monthlyUsage,
    responseRate,
    needsAttention,
    recentActivity,
    cardStatus,
    resendReadyContacts,
  ] = await Promise.all([
    getContacts({ limit: 200 }),
    getMonthlyUsage(),
    getResponseRate(),
    getNeedsAttentionCount(),
    getRecentActivity(5),
    getOnboardingCardStatus(),
    getResendReadyContacts(supabase, business.id),
  ])

  const hasReviewLink = !!business.google_review_link
  const templates = business.email_templates || []
  const resendReadyContactIds = resendReadyContacts.map(c => c.id)

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Send</h1>

      {/* Stat strip - hidden until user has sent at least one request */}
      {cardStatus.test_sent && (
        <StatStrip
          usage={monthlyUsage}
          responseRate={responseRate}
          needsAttention={needsAttention}
        />
      )}

      <SendPageClient
        contacts={contacts}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={hasReviewLink}
        recentActivity={recentActivity}
        resendReadyContactIds={resendReadyContactIds}
      />
    </div>
  )
}
