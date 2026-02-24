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
} from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { TrendIndicator } from '@/components/dashboard/kpi-widgets'
import type { DashboardKPIs, PipelineSummary, CampaignEvent } from '@/lib/types/dashboard'

interface RightPanelDefaultProps {
  kpiData: DashboardKPIs
  pipelineSummary: PipelineSummary
  events: CampaignEvent[]
}

function getEventIcon(type: CampaignEvent['type']) {
  switch (type) {
    case 'touch_sent':
      return PaperPlaneTilt
    case 'review_click':
      return Star
    case 'feedback_submitted':
      return ChatCircleText
    case 'enrollment':
      return UserPlus
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
          <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
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
          </Card>
        </Link>

        {/* Average Rating */}
        <Link href="/feedback" className="block">
          <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
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
          </Card>
        </Link>

        {/* Conversion Rate */}
        <Link href="/history" className="block">
          <Card className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
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
          <div className="space-y-0.5">
            {events.slice(0, 5).map((event) => {
              const Icon = getEventIcon(event.type)
              const description = getEventDescription(event)

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-2 rounded px-2 py-1.5"
                >
                  <Icon size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-xs truncate flex-1 text-foreground/80">{description}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
