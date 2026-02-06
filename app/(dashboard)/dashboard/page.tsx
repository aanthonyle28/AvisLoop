import { getBusiness } from '@/lib/actions/business'
import { getServiceTypeSettings } from '@/lib/data/business'
import {
  getDashboardKPIs,
  getReadyToSendJobs,
  getAttentionAlerts,
} from '@/lib/data/dashboard'
import { getJobCounts } from '@/lib/data/jobs'
import { getChecklistState } from '@/lib/data/checklist'
import { redirect } from 'next/navigation'

import { KPIWidgets } from '@/components/dashboard/kpi-widgets'
import { ReadyToSendQueue } from '@/components/dashboard/ready-to-send-queue'
import { AttentionAlerts } from '@/components/dashboard/attention-alerts'
import { GettingStartedChecklist } from '@/components/onboarding/getting-started-checklist'

export const metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/onboarding')
  }

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
  const [kpiData, readyJobs, alerts, jobCounts, checklistState] = await Promise.all([
    getDashboardKPIs(business.id),
    getReadyToSendJobs(business.id, serviceTypeTiming),
    getAttentionAlerts(business.id),
    getJobCounts(),
    getChecklistState(business.id),
  ])

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Getting Started Checklist - show for new users */}
      {!checklistState.dismissed && (
        <GettingStartedChecklist
          items={checklistState.items}
          completedCount={checklistState.completedCount}
          allComplete={checklistState.allComplete}
          collapsed={checklistState.collapsed}
          firstSeenAt={checklistState.firstSeenAt}
        />
      )}

      <KPIWidgets data={kpiData} />
      <ReadyToSendQueue
        jobs={readyJobs}
        hasJobHistory={jobCounts.total > 0}
      />
      <AttentionAlerts alerts={alerts} />
    </div>
  )
}
