import { getBusiness } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { redirect } from 'next/navigation'
import { SendPageClient } from '@/components/send/send-page-client'

export default async function SendPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/dashboard/settings')
  }

  // Fetch required data in parallel
  const [
    { contacts },
    monthlyUsage,
  ] = await Promise.all([
    getContacts({ limit: 200 }),
    getMonthlyUsage(),
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
      />
    </div>
  )
}
