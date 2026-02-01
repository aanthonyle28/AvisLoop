import { getBusiness } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { getMonthlyUsage, getResendReadyContacts, getNeedsAttentionCount, getResponseRate, getRecentActivity } from '@/lib/data/send-logs'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SendPageClient } from '@/components/send/send-page-client'

export default async function SendPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/dashboard/settings')
  }

  const supabase = await createClient()

  // Fetch all data in parallel
  const [
    { contacts },
    monthlyUsage,
    resendReadyContacts,
    needsAttention,
    responseRate,
    recentActivity
  ] = await Promise.all([
    getContacts({ limit: 200 }),
    getMonthlyUsage(),
    getResendReadyContacts(supabase, business.id),
    getNeedsAttentionCount(),
    getResponseRate(),
    getRecentActivity(5),
  ])

  const hasReviewLink = !!business.google_review_link
  const templates = business.email_templates || []

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Send</h1>

      <SendPageClient
        contacts={contacts}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={hasReviewLink}
        resendReadyContacts={resendReadyContacts}
        needsAttention={needsAttention}
        responseRate={responseRate}
        recentActivity={recentActivity}
      />
    </div>
  )
}
