'use client'

import { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { useDashboardPanel } from '@/components/dashboard/dashboard-shell'
import { RightPanelDefault, KPISummaryBar } from '@/components/dashboard/right-panel-default'
import { RightPanelJobDetail } from '@/components/dashboard/right-panel-job-detail'
import { RightPanelAttentionDetail } from '@/components/dashboard/right-panel-attention-detail'
import { RightPanelGettingStarted } from '@/components/dashboard/right-panel-getting-started'
import { MobileBottomSheet } from '@/components/dashboard/mobile-bottom-sheet'
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

// ── Derive bottom sheet title from panel view type ────────────────────────────

function getMobileSheetTitle(type: string): string {
  switch (type) {
    case 'job-detail':
      return 'Job Details'
    case 'attention-detail':
      return 'Alert Details'
    case 'kpi-full':
      return 'Dashboard Stats'
    default:
      return 'Details'
  }
}

// ── Inner components (have access to useDashboardPanel context) ───────────────

interface DashboardContentProps {
  greeting: string
  firstName: string
  kpiData: DashboardKPIs
  pipelineSummary: PipelineSummary
  events: CampaignEvent[]
  readyJobs: ReadyToSendJob[]
  alerts: AttentionAlert[]
  hasJobHistory: boolean
  setupProgress: {
    completedCount: number
    dismissed: boolean
    collapsed: boolean
    allComplete: boolean
    items: Record<ChecklistItemId, boolean>
  } | null
  businessId: string
}

/**
 * Left-column content — rendered inside DashboardShell so it has access
 * to useDashboardPanel context.
 *
 * On mobile this component also manages the bottom sheet state:
 * - Watches panelView and opens/closes the sheet accordingly
 * - Renders MobileBottomSheet with the appropriate content
 * - Renders KPISummaryBar above task lists so stats are accessible without scrolling
 */
function DashboardContent({
  greeting,
  firstName,
  kpiData,
  pipelineSummary,
  events,
  readyJobs,
  alerts,
  hasJobHistory,
  setupProgress,
  businessId,
}: DashboardContentProps) {
  const { panelView, setPanelView, closePanel } = useDashboardPanel()
  const { openAddJob } = useAddJob()

  // Mobile bottom sheet state
  // 'kpi-full' is a virtual view type for the mobile KPI tap — not in RightPanelView union
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [mobileSheetMode, setMobileSheetMode] = useState<
    'job-detail' | 'attention-detail' | 'kpi-full'
  >('kpi-full')

  const selectedJobId = panelView.type === 'job-detail' ? panelView.jobId : undefined
  const selectedAlertId = panelView.type === 'attention-detail' ? panelView.alertId : undefined

  const handleSelectJob = useCallback((jobId: string) => {
    setPanelView({ type: 'job-detail', jobId })
  }, [setPanelView])

  const handleSelectAlert = useCallback((alertId: string) => {
    setPanelView({ type: 'attention-detail', alertId })
  }, [setPanelView])

  // When panelView changes to a detail view, open the mobile bottom sheet
  useEffect(() => {
    if (panelView.type === 'job-detail' || panelView.type === 'attention-detail') {
      setMobileSheetMode(panelView.type)
      setMobileSheetOpen(true)
    } else if (panelView.type === 'default') {
      // Panel closed — close the sheet too
      setMobileSheetOpen(false)
    }
  }, [panelView])

  // Handle mobile sheet close — reset panel to default
  const handleMobileSheetClose = useCallback(() => {
    setMobileSheetOpen(false)
    // If the sheet mode was a panelView-backed view, close the panel
    if (mobileSheetMode !== 'kpi-full') {
      closePanel()
    }
  }, [closePanel, mobileSheetMode])

  // Handle KPI summary bar tap — open bottom sheet with full stats
  const handleKpiBarTap = useCallback(() => {
    setMobileSheetMode('kpi-full')
    setMobileSheetOpen(true)
  }, [])

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
    !setupProgress.allComplete

  const selectableAlerts = toSelectableAlerts(alerts)

  // Determine content for mobile bottom sheet
  function renderMobileSheetContent() {
    switch (mobileSheetMode) {
      case 'job-detail':
        if (panelView.type === 'job-detail') {
          return (
            <RightPanelJobDetail
              jobId={panelView.jobId}
              businessId={businessId}
            />
          )
        }
        return null
      case 'attention-detail':
        if (panelView.type === 'attention-detail') {
          const alert = selectableAlerts.find(a => a.id === panelView.alertId)
          if (alert) {
            return <RightPanelAttentionDetail alert={alert} />
          }
        }
        return null
      case 'kpi-full':
        return (
          <RightPanelDefault
            kpiData={kpiData}
            pipelineSummary={pipelineSummary}
            events={events}
          />
        )
    }
  }

  return (
    <>
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

        {/* Compact KPI summary bar — mobile only, tappable to open full stats */}
        <KPISummaryBar kpiData={kpiData} onClick={handleKpiBarTap} />

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
            <RightPanelGettingStarted
              items={setupProgress!.items}
              completedCount={setupProgress!.completedCount}
              allComplete={setupProgress!.allComplete}
              initialCollapsed={setupProgress!.collapsed}
              initialDismissed={setupProgress!.dismissed}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom sheet — renders right panel content on screens below lg */}
      <MobileBottomSheet
        open={mobileSheetOpen}
        onOpenChange={handleMobileSheetClose}
        title={getMobileSheetTitle(mobileSheetMode)}
      >
        {renderMobileSheetContent()}
      </MobileBottomSheet>
    </>
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
  setupProgress: {
    completedCount: number
    dismissed: boolean
    collapsed: boolean
    allComplete: boolean
    items: Record<ChecklistItemId, boolean>
  } | null
}

/**
 * DashboardClient — server page passes all data here.
 *
 * Architecture:
 * - DashboardShell provides DashboardPanelProvider context
 * - Left column (children): DashboardContent with task lists
 * - Right panel default: compact KPIs + pipeline + recent activity
 * - Right panel detail: DashboardDetailContent (reads panelView from context)
 * - Right panel getting-started: persistent checklist card at top of right panel
 *
 * Both DashboardContent and DashboardDetailContent are rendered as children
 * of DashboardShell, giving them access to useDashboardPanel context.
 *
 * Mobile strategy:
 * - Right panel is hidden on mobile (lg:hidden in RightPanel component)
 * - DashboardContent renders KPISummaryBar above task lists on mobile
 * - Tapping a job/alert or the KPI bar opens MobileBottomSheet with the detail
 * - MobileBottomSheet close resets panelView to 'default'
 * - Getting Started renders inline in left column on mobile
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

  // Getting Started content for right panel — persistent card at top
  const showGettingStarted =
    setupProgress &&
    !setupProgress.dismissed

  const gettingStartedContent = showGettingStarted ? (
    <RightPanelGettingStarted
      items={setupProgress!.items}
      completedCount={setupProgress!.completedCount}
      allComplete={setupProgress!.allComplete}
      initialCollapsed={setupProgress!.collapsed}
      initialDismissed={setupProgress!.dismissed}
    />
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
        pipelineSummary={pipelineSummary}
        events={events}
        readyJobs={readyJobs}
        alerts={alerts}
        hasJobHistory={hasJobHistory}
        setupProgress={setupProgress}
        businessId={businessId}
      />
    </DashboardShell>
  )
}
