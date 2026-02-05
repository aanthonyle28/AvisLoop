'use client'

import { CheckCircle, WarningCircle, ArrowDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ActionSummaryBannerProps {
  readyCount: number
  alertCount: number
}

export function ActionSummaryBanner({ readyCount, alertCount }: ActionSummaryBannerProps) {
  const total = readyCount + alertCount

  // All-clear state: no items need attention
  if (total === 0) {
    return (
      <div className={cn(
        "rounded-lg p-4 mb-6",
        "bg-green-50 dark:bg-green-950/20",
        "border border-green-200 dark:border-green-800"
      )}>
        <div className="flex items-center gap-3">
          <CheckCircle
            size={24}
            weight="fill"
            className="text-green-600 dark:text-green-400 flex-shrink-0"
          />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">
              All caught up -- nothing needs your attention
            </h2>
            <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
              Your automation is running smoothly
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Items pending state: user needs to take action
  const handleClick = () => {
    const targetId = readyCount > 0 ? 'ready-to-send-queue' : 'attention-alerts'
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Build subtext dynamically
  const subtextParts: string[] = []
  if (readyCount > 0) {
    subtextParts.push(`${readyCount} ready to send`)
  }
  if (alertCount > 0) {
    const alertLabel = alertCount === 1 ? 'alert' : 'alerts'
    subtextParts.push(`${alertCount} ${alertLabel}`)
  }
  const subtext = subtextParts.join(' and ')

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left rounded-lg p-4 mb-6",
        "bg-yellow-50 dark:bg-yellow-950/20",
        "border border-yellow-200 dark:border-yellow-800",
        "hover:bg-yellow-100 dark:hover:bg-yellow-950/30",
        "transition-colors"
      )}
    >
      <div className="flex items-center gap-3">
        <WarningCircle
          size={24}
          weight="fill"
          className="text-yellow-600 dark:text-yellow-400 flex-shrink-0"
        />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            {total} {total === 1 ? 'item' : 'items'} need attention
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
            {subtext}
          </p>
        </div>
        <ArrowDown
          size={20}
          className="text-yellow-600 dark:text-yellow-400 flex-shrink-0"
        />
      </div>
    </button>
  )
}
