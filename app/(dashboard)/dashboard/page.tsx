import { getBusiness } from '@/lib/actions/business'
import { getServiceTypeSettings } from '@/lib/data/business'
import {
  getDashboardKPIs,
  getReadyToSendJobs,
  getAttentionAlerts,
} from '@/lib/data/dashboard'
import { getJobCounts } from '@/lib/data/jobs'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

import { KPIWidgets } from '@/components/dashboard/kpi-widgets'
import { ReadyToSendQueue } from '@/components/dashboard/ready-to-send-queue'
import { AttentionAlerts } from '@/components/dashboard/attention-alerts'

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
  const [kpiData, readyJobs, alerts, jobCounts] = await Promise.all([
    getDashboardKPIs(business.id),
    getReadyToSendJobs(business.id, serviceTypeTiming),
    getAttentionAlerts(business.id),
    getJobCounts(),
  ])

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s your overview for today</p>
      </div>

      <KPIWidgets data={kpiData} />
      <ReadyToSendQueue
        jobs={readyJobs}
        hasJobHistory={jobCounts.total > 0}
      />
      <AttentionAlerts alerts={alerts} />
    </div>
  )
}
