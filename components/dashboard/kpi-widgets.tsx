'use client'

import Link from 'next/link'
import { Star, ChartBar, Target, TrendUp, TrendDown } from '@phosphor-icons/react'
import { Card, InteractiveCard } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardKPIs } from '@/lib/types/dashboard'

interface TrendIndicatorProps {
  value: number
  period: string
  size?: 'default' | 'sm'
}

export function TrendIndicator({ value, period, size = 'default' }: TrendIndicatorProps) {
  // If value is zero, show muted dash for no meaningful data
  if (value === 0) {
    return (
      <span className={cn(
        "text-muted-foreground",
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>
        —
      </span>
    )
  }

  const isPositive = value >= 0
  const Icon = isPositive ? TrendUp : TrendDown
  const colorClass = isPositive
    ? 'text-success'
    : 'text-destructive'

  return (
    <span className={cn(
      'flex items-center gap-1',
      colorClass,
      size === 'sm' ? 'text-xs' : 'text-sm'
    )}>
      <Icon size={size === 'sm' ? 12 : 14} weight="bold" />
      <span>{Math.abs(value)}% {period}</span>
    </span>
  )
}

interface KPIWidgetsProps {
  data: DashboardKPIs
}

export function KPIWidgets({ data }: KPIWidgetsProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Outcome metrics (large) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reviews This Month */}
        <Link href="/analytics" className="block">
          <InteractiveCard hoverAccent="amber" className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Reviews This Month
              </h3>
              <Star size={20} weight="fill" className="text-amber-500 dark:text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold">
                {data.reviewsThisMonth.value}
              </span>
              <TrendIndicator
                value={data.reviewsThisMonth.trend}
                period="vs last month"
              />
            </div>
          </InteractiveCard>
        </Link>

        {/* Average Rating */}
        <Link href="/analytics" className="block">
          <InteractiveCard hoverAccent="green" className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Average Rating
              </h3>
              <ChartBar size={20} weight="fill" className="text-[#008236] dark:text-[#00B84B]" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold">
                {data.averageRating.value.toFixed(1)}
              </span>
              <TrendIndicator
                value={data.averageRating.trend}
                period="vs last month"
              />
            </div>
          </InteractiveCard>
        </Link>

        {/* Conversion Rate */}
        <Link href="/analytics" className="block">
          <InteractiveCard hoverAccent="blue" className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </h3>
              <Target size={20} weight="fill" className="text-[#2C879F] dark:text-[#38A9C5]" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold">
                {data.conversionRate.value}%
              </span>
              <TrendIndicator
                value={data.conversionRate.trend}
                period="vs last month"
              />
            </div>
          </InteractiveCard>
        </Link>
      </div>
    </div>
  )
}

export function KPIWidgetsSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Outcome metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
