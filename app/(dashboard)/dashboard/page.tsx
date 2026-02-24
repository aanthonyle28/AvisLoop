import { getBusiness } from '@/lib/actions/business'
import { getServiceTypeSettings } from '@/lib/data/business'
import {
  getDashboardKPIs,
  getReadyToSendJobs,
  getAttentionAlerts,
  getRecentCampaignEvents,
} from '@/lib/data/dashboard'
import { getJobCounts } from '@/lib/data/jobs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { getSetupProgress } from '@/lib/data/onboarding'
import type { PipelineSummary } from '@/lib/types/dashboard'

export const metadata = {
  title: 'Dashboard',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/onboarding')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ''
  const firstName = fullName.split(' ')[0] || ''

  // Get service type settings for urgency calculation
  const serviceSettings = await getServiceTypeSettings()
  const serviceTypeTiming = serviceSettings?.serviceTypeTiming || {
    hvac: 24,
    plumbing: 48,
    electrical: 24,
    cleaning: 4,
    roofing: 72,
    painting: 48,
    handyman: 24,
    other: 24,
  }

  // Fetch all dashboard data in parallel
  const [kpiData, readyJobs, alerts, jobCounts, recentEvents, setupProgress] = await Promise.all([
    getDashboardKPIs(business.id),
    getReadyToSendJobs(business.id, serviceTypeTiming),
    getAttentionAlerts(business.id),
    getJobCounts(),
    getRecentCampaignEvents(business.id),
    getSetupProgress(),
  ])

  const pipelineSummary: PipelineSummary = {
    activeSequences: kpiData.activeSequences.value,
    pending: kpiData.pendingQueued.value,
    requestsSentThisWeek: kpiData.requestsSentThisWeek.value,
  }

  return (
    <DashboardClient
      greeting={getGreeting()}
      firstName={firstName}
      businessId={business.id}
      kpiData={kpiData}
      pipelineSummary={pipelineSummary}
      events={recentEvents}
      readyJobs={readyJobs}
      alerts={alerts}
      hasJobHistory={jobCounts.total > 0}
      setupProgress={setupProgress}
    />
  )
}
