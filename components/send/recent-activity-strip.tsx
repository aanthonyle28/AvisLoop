'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, ListBullets } from '@phosphor-icons/react/dist/ssr'
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
      <div className="bg-white border border-[#E3E3E3] rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListBullets size={18} weight="bold" className="text-foreground" />
            <h3 className="font-semibold text-base">Recent Activity</h3>
          </div>
          <Link href="/history" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            View all
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
        <div className="text-center text-muted-foreground py-6">
          <p>No sends yet — send your first review request!</p>
        </div>
      </div>
    )
  }

  // Group activities by batch_id if in bulk mode
  const displayItems = mode === 'bulk' && activities.some(a => a.batch_id)
    ? groupByBatch(activities)
    : activities.slice(0, 5)

  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListBullets size={18} weight="bold" className="text-foreground" />
          <h3 className="font-semibold text-base">Recent Activity</h3>
        </div>
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          View all
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      <div className="space-y-3">
        {displayItems.map((item) => {
          const isBatch = 'batch_count' in item && item.batch_count && item.batch_count > 1

          return (
            <button
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isBatch ? (
                  <div className="text-sm">
                    <div className="font-medium">
                      {item.batch_count} contacts
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Bulk send
                    </div>
                  </div>
                ) : (
                  <div className="text-sm min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {item.contact_name}
                    </div>
                    <div className="text-muted-foreground text-xs truncate">
                      {item.contact_email}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={item.status as SendStatus} />
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Group activities by batch_id, showing most recent batch with count.
 * Returns max 5 batches.
 */
function groupByBatch(activities: RecentActivity[]): RecentActivity[] {
  const batches = new Map<string, RecentActivity[]>()

  // Group by batch_id
  for (const activity of activities) {
    const batchId = activity.batch_id || activity.id
    if (!batches.has(batchId)) {
      batches.set(batchId, [])
    }
    batches.get(batchId)!.push(activity)
  }

  // Convert to display items (take first item of each batch, add count)
  const batchItems = Array.from(batches.values())
    .map((items) => ({
      ...items[0],
      batch_count: items.length,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return batchItems
}
