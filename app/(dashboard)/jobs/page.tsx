import { Suspense } from 'react'
import { getJobs } from '@/lib/data/jobs'
import { getCustomers } from '@/lib/actions/customer'
import { getMatchingCampaignsForJobs, getCampaignsByIds } from '@/lib/data/campaign'
import { getServiceTypeSettings } from '@/lib/data/business'
import { JobsClient } from '@/components/jobs/jobs-client'
import type { ServiceType } from '@/lib/types/database'

export const metadata = {
  title: 'Jobs',
  description: 'Manage your service jobs',
}

async function JobsContent() {
  const [{ jobs, total, businessId }, { customers }, serviceSettings] = await Promise.all([
    getJobs(),
    getCustomers({ limit: 200 }), // For customer selector in add/edit forms
    getServiceTypeSettings(),
  ])

  const enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]

  // Get unique service types from jobs for campaign preview
  const serviceTypes = [...new Set(jobs.map(j => j.service_type))] as ServiceType[]

  // Fetch matching campaigns for enrollment preview (only if we have businessId and jobs)
  const campaignMap = businessId && serviceTypes.length > 0
    ? await getMatchingCampaignsForJobs(businessId, serviceTypes)
    : new Map<string, { campaignName: string; firstTouchDelay: number }>()

  // Fetch campaign names for jobs with campaign_override UUIDs
  const overrideIds = [...new Set(
    jobs
      .filter(j => j.campaign_override && j.campaign_override !== 'one_off')
      .map(j => j.campaign_override!)
  )]
  const campaignNames = overrideIds.length > 0
    ? await getCampaignsByIds(overrideIds)
    : new Map<string, { campaignName: string; firstTouchDelay: number }>()

  return (
    <JobsClient
      initialJobs={jobs}
      totalJobs={total}
      customers={customers}
      campaignMap={campaignMap}
      campaignNames={campaignNames}
      enabledServiceTypes={enabledServiceTypes}
    />
  )
}

export default function JobsPage() {
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
        <JobsContent />
      </Suspense>
    </div>
  )
}
