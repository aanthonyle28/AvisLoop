import { getCustomers } from '@/lib/actions/customer'
import { getBusiness } from '@/lib/actions/business'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { CustomersClient } from '@/components/customers/customers-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Customers',
  description: 'Manage your customers',
}

export default async function CustomersPage() {
  const business = await getBusiness()
  if (!business) redirect('/onboarding')

  const [{ customers }, monthlyUsage] = await Promise.all([
    getCustomers(),
    getMonthlyUsage(),
  ])

  // Email-only templates for the QuickSendModal
  const sendTemplates = (business.message_templates || []).filter(
    (t: { channel: string }) => t.channel === 'email'
  )

  return (
    <div className="container py-6 space-y-6">
      <CustomersClient
        initialCustomers={customers}
        business={business}
        templates={sendTemplates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={!!business.google_review_link}
      />
    </div>
  )
}
