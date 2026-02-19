'use client'

import { Sparkle } from '@phosphor-icons/react'
import type { PersonalizationSummary } from '@/lib/data/personalization'

interface PersonalizationSectionProps {
  summary: PersonalizationSummary
}

/** Format a USD cost value for display. */
function formatCost(cost: number): string {
  if (cost < 0.01) return '<$0.01'
  if (cost < 1) return `$${cost.toFixed(2)}`
  return `$${cost.toFixed(2)}`
}

/**
 * Personalization stats section for the settings page.
 * Displays personalization rate, campaign sends, and LLM usage capacity.
 */
export function PersonalizationSection({ summary }: PersonalizationSectionProps) {
  const { stats, usage, health, healthMessage } = summary

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkle weight="fill" className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-medium">AI Personalization</h3>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Personalization Rate */}
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Personalization Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getRateColor(stats.personalizationRate)}`}>
              {stats.campaignSendsThisWeek > 0 ? `${stats.personalizationRate}%` : '--'}
            </span>
            {stats.isEstimated && stats.campaignSendsThisWeek > 0 && (
              <span className="text-xs text-muted-foreground">(estimated)</span>
            )}
          </div>
        </div>

        {/* Campaign Sends This Week */}
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Campaign Sends (7d)
          </div>
          <div className="text-2xl font-bold">
            {stats.campaignSendsThisWeek}
          </div>
        </div>

        {/* Fallback Rate */}
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Fallback Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {stats.campaignSendsThisWeek > 0 ? `${stats.fallbackRate}%` : '--'}
            </span>
            {stats.isEstimated && stats.campaignSendsThisWeek > 0 && (
              <span className="text-xs text-muted-foreground">(estimated)</span>
            )}
          </div>
        </div>

        {/* Estimated Monthly Cost */}
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Est. Monthly Cost
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {summary.costEstimate.weeklyVolume > 0
                ? formatCost(summary.costEstimate.estimatedMonthlyCost)
                : '--'}
            </span>
            {summary.costEstimate.isProjection && summary.costEstimate.weeklyVolume > 0 && (
              <span className="text-xs text-muted-foreground">(projected)</span>
            )}
          </div>
        </div>
      </div>

      {/* Usage capacity bar (only if rate limiting is configured) */}
      {usage.isConfigured && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">LLM Usage (hourly)</span>
            <span className="font-medium">
              {usage.used} / {usage.limit} calls
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getBarColor(usage.usagePercent)}`}
              style={{ width: `${Math.min(usage.usagePercent, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {usage.remaining} calls remaining
            {usage.resetAt && ` \u00b7 resets ${formatResetTime(usage.resetAt)}`}
          </div>
          {summary.costEstimate.weeklyVolume > 0 && (
            <div className="text-xs text-muted-foreground">
              AI personalization cost is included in your plan — no additional charges.
              {summary.costEstimate.costPerCall > 0 && (
                <span> (~{formatCost(summary.costEstimate.costPerCall * 1000)}/1K messages)</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Health status */}
      <div className={`flex items-center gap-2 text-sm ${getHealthTextColor(health)}`}>
        <span className={`inline-block h-2 w-2 rounded-full ${getHealthDotColor(health)}`} />
        {healthMessage}
      </div>
    </div>
  )
}

/** Color for personalization rate text based on percentage. */
function getRateColor(rate: number): string {
  if (rate >= 95) return 'text-success'
  if (rate >= 80) return 'text-warning'
  return 'text-destructive'
}

/** Color for the usage capacity bar based on percentage. */
function getBarColor(percent: number): string {
  if (percent >= 90) return 'bg-destructive'
  if (percent >= 70) return 'bg-warning'
  return 'bg-success'
}

/** Color for the health status dot. */
function getHealthDotColor(health: 'great' | 'good' | 'degraded'): string {
  switch (health) {
    case 'great': return 'bg-success'
    case 'good': return 'bg-warning'
    case 'degraded': return 'bg-destructive'
  }
}

/** Color for the health status text. */
function getHealthTextColor(health: 'great' | 'good' | 'degraded'): string {
  switch (health) {
    case 'great': return 'text-success'
    case 'good': return 'text-muted-foreground'
    case 'degraded': return 'text-warning'
  }
}

/** Format a reset date as relative time (e.g., "in 42 minutes"). */
function formatResetTime(resetAt: Date): string {
  const now = new Date()
  const diffMs = resetAt.getTime() - now.getTime()

  if (diffMs <= 0) return 'soon'

  const minutes = Math.ceil(diffMs / (1000 * 60))
  if (minutes < 60) return `in ${minutes}m`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `in ${hours}h ${remainingMinutes}m`
}
