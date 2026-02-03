import { getBusiness } from '@/lib/actions/business'
import { getCustomers } from '@/lib/actions/customer'
import { getMonthlyUsage, getResponseRate, getNeedsAttentionCount, getRecentActivity, getRecentActivityFull, getResendReadyContacts } from '@/lib/data/send-logs'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SendPageClient } from '@/components/send/send-page-client'

export default async function SendPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/onboarding')
  }

  const supabase = await createClient()

  // Fetch required data in parallel
  const [
    { customers },
    monthlyUsage,
    responseRate,
    needsAttention,
    recentActivity,
    recentActivityFull,
    resendReadyContacts,
  ] = await Promise.all([
    getCustomers({ limit: 200 }),
    getMonthlyUsage(),
    getResponseRate(),
    getNeedsAttentionCount(),
    getRecentActivity(5),
    getRecentActivityFull(5),
    getResendReadyContacts(supabase, business.id),
  ])

  const hasReviewLink = !!business.google_review_link
  const templates = business.email_templates || []
  const resendReadyContactIds = resendReadyContacts.map((c: { id: string }) => c.id)

  const displayName = business.default_sender_name || business.name || 'there'

  return (
    <div className="container mx-auto py-6 px-4">
      <SendPageClient
        customers={customers}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={hasReviewLink}
        recentActivity={recentActivity}
        recentActivityFull={recentActivityFull}
        resendReadyContactIds={resendReadyContactIds}
        displayName={displayName}
        showStats={true}
        usage={monthlyUsage}
        responseRate={responseRate}
        needsAttention={needsAttention}
      />
    </div>
  )
}
