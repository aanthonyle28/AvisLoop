'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { useDashboardPanel } from '@/components/dashboard/dashboard-shell'
import { RightPanelDefault } from '@/components/dashboard/right-panel-default'
import { RightPanelJobDetail } from '@/components/dashboard/right-panel-job-detail'
import { RightPanelAttentionDetail } from '@/components/dashboard/right-panel-attention-detail'
import { RightPanelGettingStarted } from '@/components/dashboard/right-panel-getting-started'
import { ReadyToSendQueue } from '@/components/dashboard/ready-to-send-queue'
import { AttentionAlerts } from '@/components/dashboard/attention-alerts'
import { Button } from '@/components/ui/button'
import { useAddJob } from '@/components/jobs/add-job-provider'
import type {
  DashboardKPIs,
  PipelineSummary,
  CampaignEvent,
  ReadyToSendJob,
  AttentionAlert,
  SelectableAlertItem,
} from '@/lib/types/dashboard'
import type { ChecklistItemId } from '@/lib/constants/checklist'

// ── Helpers to extract data from alert descriptions ──────────────────────────

/**
 * Extract customer name from alert description strings like
 * "Failed to send to John Smith: ..." or "John Smith left 2-star feedback"
 */
function extractCustomerName(description: string): string {
  const toMatch = description.match(/to ([^:]+?)(?::|$)/)
  if (toMatch) return toMatch[1].trim()

  const forMatch = description.match(/for ([^,]+)$/)
  if (forMatch) return forMatch[1].trim()

  const leftMatch = description.match(/^([^l]+) left /)
  if (leftMatch) return leftMatch[1].trim()

  return 'Customer'
}

/**
 * Extract error message from failed send description.
 * Description format: "Failed to send to {name}: {error}" or "Failed to send to {name}"
 */
function extractErrorMessage(description: string): string | undefined {
  const colonIndex = description.indexOf(': ')
  if (colonIndex !== -1) {
    return description.slice(colonIndex + 2)
  }
  return undefined
}

/**
 * Extract star rating from feedback description like "John left 2-star feedback"
 */
function extractRating(description: string): number | undefined {
  const match = description.match(/(\d+)-star/)
  if (match) return parseInt(match[1], 10)
  return undefined
}

/**
 * Map AttentionAlert array to SelectableAlertItem array for the right panel.
 */
function toSelectableAlerts(alerts: AttentionAlert[]): SelectableAlertItem[] {
  return alerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    customerName: extractCustomerName(alert.description),
    timestamp: alert.timestamp,
    retryable: alert.retryable,
    sendLogId: alert.sendLogId,
    errorMessage: alert.type === 'failed_send' ? extractErrorMessage(alert.description) : undefined,
    feedbackId: alert.feedbackId,
    rating: alert.type === 'unresolved_feedback' ? extractRating(alert.description) : undefined,
    feedbackText: undefined,
  }))
}

// ── Inner components (have access to useDashboardPanel context) ───────────────

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
 * Left-column content — rendered inside DashboardShell so it has access
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

  // Show Getting Started in left column on mobile (right panel is hidden on mobile)
  const showGettingStartedMobile =
    setupProgress &&
    !setupProgress.dismissed &&
    setupProgress.items &&
    !setupProgress.items['first_review_click']

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

      {/* Getting Started — mobile only (right panel hidden on mobile) */}
      {showGettingStartedMobile && (
        <div className="lg:hidden">
          <RightPanelGettingStarted items={setupProgress!.items} />
        </div>
      )}
    </div>
  )
}

/**
 * DashboardDetailContent — rendered inside DashboardShell as the detailContent prop.
 * Has access to useDashboardPanel context and renders the correct detail view.
 */
function DashboardDetailContent({
  businessId,
  alerts,
}: {
  businessId: string
  alerts: AttentionAlert[]
}) {
  const { panelView } = useDashboardPanel()
  const selectableAlerts = toSelectableAlerts(alerts)

  if (panelView.type === 'job-detail') {
    return (
      <RightPanelJobDetail
        jobId={panelView.jobId}
        businessId={businessId}
      />
    )
  }

  if (panelView.type === 'attention-detail') {
    const alert = selectableAlerts.find(a => a.id === panelView.alertId)
    if (alert) {
      return <RightPanelAttentionDetail alert={alert} />
    }
  }

  return null
}

// ── Outer component ───────────────────────────────────────────────────────────

export interface DashboardClientProps {
  greeting: string
  firstName: string
  businessId: string
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
 * Architecture:
 * - DashboardShell provides DashboardPanelProvider context
 * - Left column (children): DashboardContent with task lists
 * - Right panel default: compact KPIs + pipeline + recent activity
 * - Right panel detail: DashboardDetailContent (reads panelView from context)
 * - Right panel getting-started: checklist for new users
 *
 * Both DashboardContent and DashboardDetailContent are rendered as children
 * of DashboardShell, giving them access to useDashboardPanel context.
 */
export function DashboardClient({
  greeting,
  firstName,
  businessId,
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

  // Getting Started content for right panel
  // Show when user hasn't gotten their first review click and hasn't dismissed
  const showGettingStarted =
    setupProgress &&
    !setupProgress.dismissed &&
    setupProgress.items &&
    !setupProgress.items['first_review_click']

  const gettingStartedContent = showGettingStarted ? (
    <div className="p-4">
      <RightPanelGettingStarted items={setupProgress!.items} />
    </div>
  ) : undefined

  return (
    <DashboardShell
      defaultContent={rightPanelDefaultContent}
      detailContent={
        <DashboardDetailContent
          businessId={businessId}
          alerts={alerts}
        />
      }
      gettingStartedContent={gettingStartedContent}
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
