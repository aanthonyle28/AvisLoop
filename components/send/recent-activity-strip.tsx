'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight } from '@phosphor-icons/react'
import { StatusBadge } from '@/components/history/status-badge'
import type { SendStatus } from '@/components/history/status-badge'

export interface RecentActivity {
  id: string
  contact_name: string
  contact_email: string
  subject: string
  status: string
  created_at: string
  batch_id?: string
  batch_count?: number
}

interface RecentActivityStripProps {
  activities: RecentActivity[]
  mode: 'quick' | 'bulk'
  onItemClick?: (id: string) => void
}

export function RecentActivityStrip({ activities, mode, onItemClick }: RecentActivityStripProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white border border-[#E3E3E3] rounded-lg px-5 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Recent Activity:</span>
            <span className="text-sm text-muted-foreground">No sends yet</span>
          </div>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            View All
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      </div>
    )
  }

  // Group by batch if in bulk mode
  const displayItems = mode === 'bulk' && activities.some(a => a.batch_id)
    ? groupByBatch(activities)
    : activities.slice(0, 3)

  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg px-5 py-4 mb-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground shrink-0">Recent Activity:</span>

        <div className="flex items-center gap-1 overflow-hidden flex-1 min-w-0">
          {displayItems.map((item, index) => {
            const isBatch = 'batch_count' in item && item.batch_count && item.batch_count > 1
            const label = isBatch ? `${item.batch_count} contacts` : (item.contact_name || item.contact_email.split('@')[0])
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: false })

            return (
              <div key={item.id} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <span className="text-muted-foreground mx-2 shrink-0">|</span>
                )}
                <button
                  onClick={() => onItemClick?.(item.id)}
                  className="flex items-center gap-2 hover:bg-muted/50 rounded px-1.5 py-0.5 transition-colors min-w-0"
                >
                  <span className="text-sm font-medium truncate">{label}</span>
                  <StatusBadge status={item.status as SendStatus} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                </button>
              </div>
            )
          })}
        </div>

        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          View All
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
    </div>
  )
}

function groupByBatch(activities: RecentActivity[]): RecentActivity[] {
  const batches = new Map<string, RecentActivity[]>()

  for (const activity of activities) {
    const batchId = activity.batch_id || activity.id
    if (!batches.has(batchId)) {
      batches.set(batchId, [])
    }
    batches.get(batchId)!.push(activity)
  }

  return Array.from(batches.values())
    .map((items) => ({
      ...items[0],
      batch_count: items.length,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
}
