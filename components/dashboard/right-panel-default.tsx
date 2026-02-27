'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Star,
  ChartBar,
  Target,
  PaperPlaneTilt,
  UserPlus,
  ChatCircleText,
  ArrowRight,
  CaretRight,
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { TrendIndicator } from '@/components/dashboard/kpi-widgets'
import { Sparkline } from '@/components/dashboard/sparkline'
import { cn } from '@/lib/utils'
import type { DashboardKPIs, PipelineSummary, CampaignEvent } from '@/lib/types/dashboard'

interface RightPanelDefaultProps {
  kpiData: DashboardKPIs
  pipelineSummary: PipelineSummary
  events: CampaignEvent[]
}

// KPI accent colors — match the icon colors used per card
const KPI_COLORS = {
  reviews: '#F59E0B',    // amber — matches Star icon color
  rating: '#008236',     // green — matches ChartBar icon color
  conversion: '#2C879F', // teal — matches Target icon color
} as const

// ─── KPISummaryBar ────────────────────────────────────────────────────────────

interface KPISummaryBarProps {
  kpiData: DashboardKPIs
  onClick: () => void
}

/**
 * KPISummaryBar — compact mobile KPI row shown at the top of the dashboard.
 *
 * Only visible below the lg breakpoint (lg:hidden).
 * Tapping opens the full KPI/activity view in the mobile bottom sheet.
 */
export function KPISummaryBar({ kpiData, onClick }: KPISummaryBarProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden w-full flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm hover:bg-muted/30 active:bg-muted/50 transition-colors text-left"
      aria-label="View full dashboard stats"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex items-center gap-1">
          <span className="font-semibold">{kpiData.reviewsThisMonth.value}</span>
          <span className="text-muted-foreground text-xs">reviews</span>
        </span>
        <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <span className="font-semibold">{kpiData.averageRating.value.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs">avg</span>
        </span>
        <span className="text-muted-foreground/40 text-xs" aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <span className="font-semibold">{kpiData.conversionRate.value}%</span>
          <span className="text-muted-foreground text-xs">conv</span>
        </span>
      </div>
      <CaretRight size={14} className="text-muted-foreground shrink-0 ml-2" />
    </button>
  )
}

function getEventStyle(type: CampaignEvent['type']) {
  switch (type) {
    case 'review_click':
      return { Icon: Star, bg: 'bg-success-bg', text: 'text-success' }
    case 'touch_sent':
      return { Icon: PaperPlaneTilt, bg: 'bg-info-bg', text: 'text-info' }
    case 'feedback_submitted':
      return { Icon: ChatCircleText, bg: 'bg-warning-bg', text: 'text-warning' }
    case 'enrollment':
      return { Icon: UserPlus, bg: 'bg-muted', text: 'text-muted-foreground' }
  }
}

function getEventHref(event: CampaignEvent): string {
  switch (event.type) {
    case 'review_click':
      return '/history?status=reviewed'
    case 'touch_sent':
      return '/history'
    case 'feedback_submitted':
      return '/feedback'
    case 'enrollment':
      return '/campaigns'
  }
}

function getEventDescription(event: CampaignEvent): string {
  switch (event.type) {
    case 'touch_sent':
      if (event.touchNumber != null && event.channel) {
        return `Touch ${event.touchNumber} ${event.channel} → ${event.customerName}`
      }
      if (event.touchNumber != null) {
        return `Touch ${event.touchNumber} → ${event.customerName}`
      }
      return `Message → ${event.customerName}`
    case 'review_click':
      return `${event.customerName} clicked review link`
    case 'feedback_submitted':
      return `${event.customerName} left ${event.rating}-star feedback`
    case 'enrollment':
      return `${event.customerName} enrolled in ${event.campaignName}`
  }
}

export function RightPanelDefault({
  kpiData,
  pipelineSummary,
  events,
}: RightPanelDefaultProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Section 1: Compact KPI Cards */}
      <div className="space-y-2">
        {/* Reviews This Month */}
        <Link href="/history?status=reviewed" className="block">
          <Card className="p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Reviews This Month</span>
              <Star size={14} weight="fill" className="text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{kpiData.reviewsThisMonth.value}</span>
              <TrendIndicator
                value={kpiData.reviewsThisMonth.trend}
                period="vs last month"
                size="sm"
              />
            </div>
            <div className="mt-2">
              <Sparkline
                data={(kpiData.reviewsThisMonth.history || []).map(d => d.value)}
                color={KPI_COLORS.reviews}
                height={32}
              />
              {(!kpiData.reviewsThisMonth.history || kpiData.reviewsThisMonth.history.length < 2) && (
                <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5">Not enough data</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Average Rating */}
        <Link href="/feedback" className="block">
          <Card className="p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Average Rating</span>
              <ChartBar size={14} weight="fill" className="text-[#008236] dark:text-[#00B84B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{kpiData.averageRating.value.toFixed(1)}</span>
              <TrendIndicator
                value={kpiData.averageRating.trend}
                period="vs last month"
                size="sm"
              />
            </div>
            <div className="mt-2">
              <Sparkline
                data={(kpiData.averageRating.history || []).map(d => d.value)}
                color={KPI_COLORS.rating}
                height={32}
              />
              {(!kpiData.averageRating.history || kpiData.averageRating.history.length < 2) && (
                <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5">Not enough data</p>
              )}
            </div>
          </Card>
        </Link>

        {/* Conversion Rate */}
        <Link href="/history" className="block">
          <Card className="p-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Conversion Rate</span>
              <Target size={14} weight="fill" className="text-[#2C879F] dark:text-[#38A9C5]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{kpiData.conversionRate.value}%</span>
              <TrendIndicator
                value={kpiData.conversionRate.trend}
                period="vs last month"
                size="sm"
              />
            </div>
            <div className="mt-2">
              <Sparkline
                data={(kpiData.conversionRate.history || []).map(d => d.value)}
                color={KPI_COLORS.conversion}
                height={32}
              />
              {(!kpiData.conversionRate.history || kpiData.conversionRate.history.length < 2) && (
                <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5">Not enough data</p>
              )}
            </div>
          </Card>
        </Link>
      </div>

      {/* Section 2: Pipeline Counters */}
      <div className="grid grid-cols-3 divide-x divide-border rounded-lg border bg-muted/30">
        <div className="flex flex-col items-center justify-center py-3 px-2 text-center">
          <span className="text-sm font-semibold">{pipelineSummary.requestsSentThisWeek}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Sent</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-2 text-center">
          <span className="text-sm font-semibold">{pipelineSummary.activeSequences}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Active</span>
        </div>
        <div className="flex flex-col items-center justify-center py-3 px-2 text-center">
          <span className="text-sm font-semibold">{pipelineSummary.pending}</span>
          <span className="text-xs text-muted-foreground mt-0.5">Queued</span>
        </div>
      </div>

      {/* Section 3: Recent Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Activity</span>
          <Link
            href="/history"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
            <ArrowRight size={12} />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No activity yet — complete a job to get started
          </p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => {
              const style = getEventStyle(event.type)
              const description = getEventDescription(event)

              return (
                <Link
                  key={event.id}
                  href={getEventHref(event)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('flex items-center justify-center rounded-full w-7 h-7 shrink-0', style.bg)}>
                    <style.Icon size={14} weight="fill" className={style.text} />
                  </div>
                  <span className="text-xs truncate flex-1 text-foreground/80">{description}</span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
