import { Suspense } from 'react'
import { getCustomers } from '@/lib/actions/customer'
import { getBusiness } from '@/lib/actions/business'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { CustomersClient } from '@/components/customers/customers-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Customers',
  description: 'Manage your customers',
}

async function CustomersContent() {
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
    <CustomersClient
      initialCustomers={customers}
      business={business}
      templates={sendTemplates}
      monthlyUsage={monthlyUsage}
      hasReviewLink={!!business.google_review_link}
    />
  )
}

export default function CustomersPage() {
  return (
    <div className="container py-6 space-y-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      }>
        <CustomersContent />
      </Suspense>
    </div>
  )
}
