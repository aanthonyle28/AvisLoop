'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { useDashboardPanel } from '@/components/dashboard/dashboard-shell'
import { RightPanelDefault } from '@/components/dashboard/right-panel-default'
import { ReadyToSendQueue } from '@/components/dashboard/ready-to-send-queue'
import { AttentionAlerts } from '@/components/dashboard/attention-alerts'
import { WelcomeCard } from '@/components/dashboard/welcome-card'
import { Button } from '@/components/ui/button'
import { useAddJob } from '@/components/jobs/add-job-provider'
import type {
  DashboardKPIs,
  PipelineSummary,
  CampaignEvent,
  ReadyToSendJob,
  AttentionAlert,
} from '@/lib/types/dashboard'
import type { ChecklistItemId } from '@/lib/constants/checklist'

interface DashboardContentProps {
  greeting: string
  firstName: string
  kpiData: DashboardKPIs
  readyJobs: ReadyToSendJob[]
  alerts: AttentionAlert[]
  hasJobHistory: boolean
  setupProgress: { completedCount: number; dismissed: boolean; items: Record<ChecklistItemId, boolean> } | null
}

/**
 * Inner content component — rendered inside DashboardShell so it has access
 * to useDashboardPanel context.
 */
function DashboardContent({
  greeting,
  firstName,
  kpiData,
  readyJobs,
  alerts,
  hasJobHistory,
  setupProgress,
}: DashboardContentProps) {
  const { panelView, setPanelView } = useDashboardPanel()
  const { openAddJob } = useAddJob()

  const selectedJobId = panelView.type === 'job-detail' ? panelView.jobId : undefined
  const selectedAlertId = panelView.type === 'attention-detail' ? panelView.alertId : undefined

  const handleSelectJob = useCallback((jobId: string) => {
    setPanelView({ type: 'job-detail', jobId })
  }, [setPanelView])

  const handleSelectAlert = useCallback((alertId: string) => {
    setPanelView({ type: 'attention-detail', alertId })
  }, [setPanelView])

  // Dynamic subtitle based on current counts
  const subtitle = (() => {
    const readyCount = readyJobs.length
    const alertCount = alerts.length
    if (readyCount === 0 && alertCount === 0) {
      return `Sent ${kpiData.requestsSentThisWeek.value} messages this week · ${kpiData.reviewsThisMonth.value} reviews received`
    }
    const parts: string[] = []
    if (readyCount > 0) parts.push(`${readyCount} job${readyCount !== 1 ? 's' : ''} ready to send`)
    if (alertCount > 0) parts.push(`${alertCount} item${alertCount !== 1 ? 's' : ''} need attention`)
    return parts.join(' · ')
  })()

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={openAddJob}>
            Add Job
          </Button>
          <Button variant="outline" asChild>
            <Link href="/campaigns">View Campaigns</Link>
          </Button>
        </div>
      </div>

      {/* Welcome card for first-run users */}
      {setupProgress && setupProgress.completedCount === 0 && !setupProgress.dismissed && (
        <WelcomeCard items={setupProgress.items} />
      )}

      {/* Ready to Send — compact rows */}
      <ReadyToSendQueue
        jobs={readyJobs}
        hasJobHistory={hasJobHistory}
        onSelectJob={handleSelectJob}
        selectedJobId={selectedJobId}
      />

      {/* Needs Attention — compact rows */}
      <AttentionAlerts
        alerts={alerts}
        onSelectAlert={handleSelectAlert}
        selectedAlertId={selectedAlertId}
      />
    </div>
  )
}

export interface DashboardClientProps {
  greeting: string
  firstName: string
  kpiData: DashboardKPIs
  pipelineSummary: PipelineSummary
  events: CampaignEvent[]
  readyJobs: ReadyToSendJob[]
  alerts: AttentionAlert[]
  hasJobHistory: boolean
  setupProgress: { completedCount: number; dismissed: boolean; items: Record<ChecklistItemId, boolean> } | null
}

/**
 * DashboardClient — server page passes all data here.
 *
 * Renders DashboardShell (two-column layout) with:
 * - Left column: greeting header + task lists (ReadyToSend + AttentionAlerts)
 * - Right panel default: compact KPIs + pipeline counters + recent activity
 */
export function DashboardClient({
  greeting,
  firstName,
  kpiData,
  pipelineSummary,
  events,
  readyJobs,
  alerts,
  hasJobHistory,
  setupProgress,
}: DashboardClientProps) {
  const rightPanelDefaultContent = (
    <RightPanelDefault
      kpiData={kpiData}
      pipelineSummary={pipelineSummary}
      events={events}
    />
  )

  return (
    <DashboardShell
      defaultContent={rightPanelDefaultContent}
      detailContent={null}
    >
      <DashboardContent
        greeting={greeting}
        firstName={firstName}
        kpiData={kpiData}
        readyJobs={readyJobs}
        alerts={alerts}
        hasJobHistory={hasJobHistory}
        setupProgress={setupProgress}
      />
    </DashboardShell>
  )
}
