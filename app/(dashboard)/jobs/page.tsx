import { getActiveBusiness } from '@/lib/data/active-business'
import { getJobs } from '@/lib/data/jobs'
import { getCustomers } from '@/lib/actions/customer'
import { getMatchingCampaignsForJobs, getCampaignsByIds } from '@/lib/data/campaign'
import { JobsClient } from '@/components/jobs/jobs-client'
import type { ServiceType } from '@/lib/types/database'

export const metadata = {
  title: 'Jobs',
  description: 'Manage your service jobs',
}

export default async function JobsPage() {
  const business = await getActiveBusiness()
  if (!business) {
    return (
      <div className="container py-6">
        <p className="text-muted-foreground">No business found.</p>
      </div>
    )
  }

  const [{ jobs, total }, { customers }] = await Promise.all([
    getJobs(business.id),
    getCustomers({ limit: 200 }), // For customer selector in add/edit forms
  ])

  // Get unique service types from jobs for campaign preview
  const serviceTypes = [...new Set(jobs.map(j => j.service_type))] as ServiceType[]

  // Fetch matching campaigns for enrollment preview (only if we have jobs)
  const campaignMap = serviceTypes.length > 0
    ? await getMatchingCampaignsForJobs(business.id, serviceTypes)
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
    <div className="container py-6 space-y-8">
      <JobsClient
        initialJobs={jobs}
        totalJobs={total}
        customers={customers}
        campaignMap={campaignMap}
        campaignNames={campaignNames}
      />
    </div>
  )
}
