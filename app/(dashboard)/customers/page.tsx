import { Suspense } from 'react'
import { getCustomers } from '@/lib/actions/customer'
import { CustomersClient } from '@/components/customers/customers-client'

export const metadata = {
  title: 'Customers',
  description: 'Manage your customers',
}

async function CustomersContent() {
  const { customers } = await getCustomers()
  return <CustomersClient initialCustomers={customers} />
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
