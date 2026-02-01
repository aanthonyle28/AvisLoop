import Link from 'next/link'
import { ArrowSquareOut, WarningCircle, Star } from '@phosphor-icons/react/dist/ssr'

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Monthly Usage */}
      <div className="bg-white border border-[#E3E3E3] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Monthly Usage</h3>
          {isAtLimit ? (
            <WarningCircle size={16} weight="bold" className="text-red-600" />
          ) : (
            <ArrowSquareOut size={16} weight="regular" className="text-muted-foreground" />
          )}
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold">
            {usage.count.toLocaleString()}/{usage.limit.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">sends</div>
        </div>

        <div className="mb-2">
          <div className="bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
            <div
              className={`${isAtLimit ? 'bg-red-600' : 'bg-primary'} rounded-full h-1.5 transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {isAtLimit ? (
          <Link href="/billing" className="text-xs text-red-600 hover:underline font-medium">
            Limit reached — Upgrade now
          </Link>
        ) : isNearLimit ? (
          <Link href="/billing" className="text-xs text-primary hover:underline">
            {remaining.toLocaleString()} remaining — Manage plan
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">
            {remaining.toLocaleString()} remaining
          </div>
        )}
      </div>

      {/* Review Rate */}
      <div className="bg-white border border-[#E3E3E3] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Review Rate</h3>
          <Star size={16} weight="regular" className="text-muted-foreground" />
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold">{responseRate.rate}%</div>
          <div className="text-xs text-muted-foreground">
            {responseRate.responded}/{responseRate.total} responded
          </div>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={14}
              weight={i < filledStars ? 'fill' : 'regular'}
              className={i < filledStars ? 'text-yellow-400' : 'text-gray-300'}
            />
          ))}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="bg-white border border-[#E3E3E3] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Needs Attention</h3>
          <WarningCircle size={16} weight="regular" className="text-muted-foreground" />
        </div>

        <div className="mb-2">
          <div className="text-2xl font-bold">{needsAttention.total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">items</div>
        </div>

        {needsAttention.total > 0 ? (
          <Link href="/history?status=failed" className="text-xs text-primary hover:underline">
            {needsAttention.pending > 0 && `${needsAttention.pending} pending`}
            {needsAttention.pending > 0 && needsAttention.failed > 0 && ', '}
            {needsAttention.failed > 0 && `${needsAttention.failed} failed`}
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground">All clear</div>
        )}
      </div>
    </div>
  )
}
