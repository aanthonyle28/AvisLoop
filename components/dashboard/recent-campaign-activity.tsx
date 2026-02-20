'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  PaperPlaneTilt,
  Star,
  ChatCircleText,
  UserPlus,
  ArrowRight,
} from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignEvent, PipelineSummary } from '@/lib/types/dashboard'

interface RecentCampaignActivityProps {
  events: CampaignEvent[]
  pipelineSummary: PipelineSummary
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
        return `Touch ${event.touchNumber} ${event.channel} sent to ${event.customerName}`
      }
      if (event.touchNumber != null) {
        return `Touch ${event.touchNumber} sent to ${event.customerName}`
      }
      return `Message sent to ${event.customerName}`
    case 'review_click':
      return `${event.customerName} clicked review link`
    case 'feedback_submitted':
      return `${event.customerName} left ${event.rating}-star feedback`
    case 'enrollment':
      return `${event.customerName} enrolled in ${event.campaignName}`
  }
}

export function RecentCampaignActivity({
  events,
  pipelineSummary,
}: RecentCampaignActivityProps) {
  const { activeSequences, pending, requestsSentThisWeek } = pipelineSummary

  // Build inline counter string
  const counterParts: string[] = []
  if (activeSequences > 0) counterParts.push(`${activeSequences} active sequences`)
  if (pending > 0) counterParts.push(`${pending} pending`)
  if (requestsSentThisWeek > 0) counterParts.push(`${requestsSentThisWeek} sent this week`)
  const counterText = counterParts.join(' · ')

  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-card px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold">Recent Campaign Activity</span>
        </div>
        <p className="text-sm text-muted-foreground">
          No campaign activity yet — complete a job to get started
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card px-5 py-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">Recent Campaign Activity</span>
          {counterText && (
            <span className="text-xs text-muted-foreground">{counterText}</span>
          )}
        </div>
        <Link
          href="/history"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View All
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Event list */}
      <div className="space-y-1">
        {events.slice(0, 5).map((event) => {
          const Icon = getEventIcon(event.type)
          const description = getEventDescription(event)

          return (
            <div
              key={event.id}
              className="flex items-center gap-3 rounded px-2 py-1.5"
            >
              <Icon size={16} className="text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1">{description}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function RecentCampaignActivitySkeleton() {
  return (
    <div className="rounded-lg border bg-card px-5 py-4">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>

      {/* Event rows skeleton */}
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-1.5">
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 w-48 flex-1" />
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
