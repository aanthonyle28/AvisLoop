import { Suspense } from 'react'
import { getJobs } from '@/lib/data/jobs'
import { getCustomers } from '@/lib/actions/customer'
import { getMatchingCampaignsForJobs } from '@/lib/data/campaign'
import { JobsClient } from '@/components/jobs/jobs-client'
import type { ServiceType } from '@/lib/types/database'

export const metadata = {
  title: 'Jobs',
  description: 'Manage your service jobs',
}

interface JobsPageProps {
  searchParams: Promise<{ action?: string }>
}

async function JobsContent({ defaultAddJobOpen }: { defaultAddJobOpen: boolean }) {
  const [{ jobs, total, businessId }, { customers }] = await Promise.all([
    getJobs(),
    getCustomers({ limit: 200 }), // For customer selector in add/edit forms
  ])

  // Get unique service types from jobs for campaign preview
  const serviceTypes = [...new Set(jobs.map(j => j.service_type))] as ServiceType[]

  // Fetch matching campaigns for enrollment preview (only if we have businessId and jobs)
  const campaignMap = businessId && serviceTypes.length > 0
    ? await getMatchingCampaignsForJobs(businessId, serviceTypes)
    : new Map<string, { campaignName: string; firstTouchDelay: number }>()

  return (
    <JobsClient
      initialJobs={jobs}
      totalJobs={total}
      customers={customers}
      campaignMap={campaignMap}
      defaultAddJobOpen={defaultAddJobOpen}
    />
  )
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const { action } = await searchParams
  const shouldOpenAddJob = action === 'add'

  return (
    <div className="container py-6 space-y-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      }>
        <JobsContent defaultAddJobOpen={shouldOpenAddJob} />
      </Suspense>
    </div>
  )
}
