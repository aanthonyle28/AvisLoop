'use client'

import Link from 'next/link'
import { ArrowSquareOut, WarningCircle, Star, ArrowRight } from '@phosphor-icons/react'

interface StatStripProps {
  usage: {
    count: number
    limit: number
    tier: string
  }
  responseRate: {
    rate: number
    total: number
    responded: number
  }
  needsAttention: {
    total: number
    pending: number
    failed: number
  }
}

export function StatStrip({ usage, responseRate, needsAttention }: StatStripProps) {
  const percentage = Math.min((usage.count / usage.limit) * 100, 100)
  const remaining = usage.limit - usage.count
  const filledStars = Math.round(responseRate.rate / 20)

  // Determine usage CTA
  const isNearLimit = percentage >= 80 && percentage < 90
  const isAtLimit = percentage >= 90

  // Only show star avg when there's actual data
  const starAvg = responseRate.total > 0 ? (responseRate.rate / 20).toFixed(1) : '0.0'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Monthly Usage */}
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Usage</h3>
          {isAtLimit ? (
            <WarningCircle size={16} weight="bold" className="text-destructive" />
          ) : (
            <ArrowSquareOut size={16} weight="regular" className="text-muted-foreground" />
          )}
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold">
            {usage.count.toLocaleString()}/{usage.limit.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">sends used</div>
        </div>

        <div className="mb-2">
          <div className="bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className={`${isAtLimit ? 'bg-destructive' : 'bg-primary'} rounded-full h-1.5 transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {isAtLimit ? (
          <Link href="/billing" className="text-xs text-destructive hover:underline font-medium">
            Limit reached — Upgrade now
          </Link>
        ) : isNearLimit ? (
          <Link href="/billing" className="text-xs text-primary hover:underline">
            {remaining.toLocaleString()} remaining — Manage plan
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">
            {remaining.toLocaleString()} remaining this month
          </div>
        )}
      </div>

      {/* Review Rate */}
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Review Rate</h3>
          <Star size={16} weight="regular" className="text-muted-foreground" />
        </div>

        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{responseRate.rate}%</span>
            {responseRate.total > 0 && responseRate.rate > 0 && (
              <span className="text-xs text-green-600 font-medium">
                +{responseRate.rate}% from last month
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                weight={i < filledStars ? 'fill' : 'regular'}
                className={i < filledStars ? 'text-yellow-400' : 'text-muted-foreground/40'}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{starAvg}/5 avg</span>
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-card border border-border rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Needs Attention</h3>
          <WarningCircle size={16} weight="regular" className="text-muted-foreground" />
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold">{needsAttention.total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">items</div>
        </div>

        {needsAttention.total > 0 ? (
          <Link href="/history?status=failed" className="flex items-center gap-2">
            {needsAttention.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                {needsAttention.pending} Pending
                <ArrowRight size={10} weight="bold" />
              </span>
            )}
            {needsAttention.failed > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                {needsAttention.failed} Failed
                <ArrowRight size={10} weight="bold" />
              </span>
            )}
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">All clear</div>
        )}
      </div>
    </div>
  )
}
