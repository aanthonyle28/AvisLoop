import { ArrowSquareOut, WarningCircle, Star, TrendUp, TrendDown } from '@phosphor-icons/react/dist/ssr'

interface MonthlyUsageCardProps {
  count: number
  limit: number
  tier: string
}

export function MonthlyUsageCard({ count, limit }: MonthlyUsageCardProps) {
  const percentage = Math.min((count / limit) * 100, 100)
  const remaining = limit - count

  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Monthly Usage</h3>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowSquareOut size={16} weight="regular" />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">
          {count.toLocaleString()}/{limit.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">sends used</div>
      </div>

      <div className="mb-3">
        <div className="bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {remaining.toLocaleString()} remaining this month
      </div>
    </div>
  )
}

interface NeedsAttentionCardProps {
  total: number
  pending: number
  failed: number
}

export function NeedsAttentionCard({ total, pending, failed }: NeedsAttentionCardProps) {
  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Needs Attention</h3>
        <WarningCircle size={16} weight="regular" className="text-muted-foreground" />
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold mb-1">{total.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">items</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-status-clicked-text" />
          <span>{pending.toLocaleString()} Pending</span>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-status-failed-text" />
          <span>{failed.toLocaleString()} Failed</span>
        </div>
      </div>
    </div>
  )
}

interface ReviewRateCardProps {
  rate: number
  total: number
  responded: number
  previousRate?: number
}

export function ReviewRateCard({ rate, previousRate }: ReviewRateCardProps) {
  const filledStars = Math.round(rate / 20)
  const hasTrend = previousRate !== undefined
  const trendDiff = hasTrend ? rate - previousRate : 0
  const isPositive = trendDiff > 0

  return (
    <div className="bg-white border border-[#E3E3E3] rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Review Rate</h3>
        <Star size={16} weight="regular" className="text-muted-foreground" />
      </div>

      <div className="mb-3">
        <div className="text-3xl font-bold mb-1">{rate}%</div>
        {hasTrend && trendDiff !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendUp size={14} weight="bold" />
            ) : (
              <TrendDown size={14} weight="bold" />
            )}
            <span>{isPositive ? '+' : ''}{trendDiff}% from last month</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            weight={i < filledStars ? 'fill' : 'regular'}
            className={i < filledStars ? 'text-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {filledStars}/5 avg
        </span>
      </div>
    </div>
  )
}
