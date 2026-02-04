import { Suspense } from 'react'
import { getJobs } from '@/lib/data/jobs'
import { getCustomers } from '@/lib/actions/customer'
import { JobsClient } from '@/components/jobs/jobs-client'

export const metadata = {
  title: 'Jobs',
  description: 'Manage your service jobs',
}

async function JobsContent() {
  const [{ jobs, total }, { customers }] = await Promise.all([
    getJobs(),
    getCustomers({ limit: 200 }), // For customer selector in add/edit forms
  ])
  return <JobsClient initialJobs={jobs} totalJobs={total} customers={customers} />
}

export default function JobsPage() {
  return (
    <div className="container py-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      }>
        <JobsContent />
      </Suspense>
    </div>
  )
}
