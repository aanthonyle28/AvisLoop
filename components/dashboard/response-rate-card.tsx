import { TrendingUp } from 'lucide-react'

interface ResponseRateCardProps {
  total: number
  responded: number
  rate: number
}

/**
 * Get tier info (color class and tip message) based on response rate percentage.
 */
function getTierInfo(rate: number, total: number): { color: string; tip: string } {
  if (total === 0) {
    return {
      color: 'text-muted-foreground',
      tip: 'Send your first review request to start tracking',
    }
  }

  if (rate === 0) {
    return {
      color: 'text-muted-foreground',
      tip: 'No responses yet -- consider following up',
    }
  }

  if (rate < 10) {
    return {
      color: 'text-red-500',
      tip: 'Try personalizing your subject line or sending at different times',
    }
  }

  if (rate < 25) {
    return {
      color: 'text-orange-500',
      tip: 'Below average -- consider following up with non-responders',
    }
  }

  if (rate < 40) {
    return {
      color: 'text-yellow-500',
      tip: 'On track -- consistent sending keeps momentum',
    }
  }

  if (rate < 60) {
    return {
      color: 'text-green-500',
      tip: 'Strong response rate -- your messaging is resonating',
    }
  }

  return {
    color: 'text-emerald-500',
    tip: 'Excellent -- your customers are highly engaged',
  }
}

/**
 * Dashboard widget showing response rate percentage, raw counts,
 * color indicator, and contextual tip based on performance tier.
 */
export function ResponseRateCard({ total, responded, rate }: ResponseRateCardProps) {
  const { color, tip } = getTierInfo(rate, total)

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium">Response Rate</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${color} mt-1`}
          style={{ backgroundColor: 'currentColor' }}
        />
        <span className="text-3xl font-bold">{rate}%</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {responded} of {total} responded
      </p>
      <p className="text-sm text-muted-foreground mt-2 italic">
        {tip}
      </p>
    </div>
  )
}
