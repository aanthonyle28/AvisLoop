import { getActiveBusiness } from '@/lib/data/active-business'
import { getBusiness } from '@/lib/data/business'
import { getCustomers } from '@/lib/actions/customer'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { CustomersClient } from '@/components/customers/customers-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Customers',
  description: 'Manage your customers',
}

export default async function CustomersPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const businessId = activeBusiness.id

  const [business, { customers }, monthlyUsage] = await Promise.all([
    getBusiness(businessId),
    getCustomers(),
    getMonthlyUsage(businessId),
  ])

  if (!business) redirect('/onboarding')

  // Email-only templates for the QuickSendModal
  const sendTemplates = (business.message_templates || []).filter(
    (t) => t.channel === 'email'
  )

  return (
    <div className="container py-6 space-y-8">
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
