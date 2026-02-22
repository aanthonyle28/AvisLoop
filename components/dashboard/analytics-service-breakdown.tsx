'use client'

import { ChartBar } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAddJob } from '@/components/jobs/add-job-provider'
import type { ServiceTypeAnalytics } from '@/lib/data/analytics'

interface Props {
  data: ServiceTypeAnalytics
}

export function ServiceTypeBreakdown({ data }: Props) {
  const { openAddJob } = useAddJob()

  // Empty state
  if (data.byServiceType.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <ChartBar size={32} weight="regular" className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">
          No analytics data yet
        </h2>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Analytics appear once campaigns start sending. Complete a job to kick off your first campaign.
        </p>
        <Button onClick={openAddJob}>Add your first job</Button>
      </div>
    )
  }

  const { totals } = data

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overall Response Rate</p>
            <p className="text-4xl font-bold">{totals.overallResponseRate}%</p>
            <p className="text-xs text-muted-foreground">
              of delivered requests got a response
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overall Review Rate</p>
            <p className="text-4xl font-bold">{totals.overallReviewRate}%</p>
            <p className="text-xs text-muted-foreground">
              of delivered requests led to a public review
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Requests Sent</p>
            <p className="text-4xl font-bold">{totals.totalSent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">across all service types</p>
          </div>
        </Card>
      </div>

      {/* Service Type Breakdown Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Breakdown by Service Type</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Service Type</th>
                  <th className="pb-3 font-medium text-right">Sent</th>
                  <th className="pb-3 font-medium text-right">Delivered</th>
                  <th className="pb-3 font-medium text-right">Reviews</th>
                  <th className="pb-3 font-medium text-right">Feedback</th>
                  <th className="pb-3 font-medium">Response Rate</th>
                  <th className="pb-3 font-medium">Review Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.byServiceType.map((metrics) => (
                  <tr key={metrics.serviceType} className="border-b last:border-0">
                    <td className="py-4 font-medium">{metrics.displayName}</td>
                    <td className="py-4 text-right text-muted-foreground">
                      {metrics.totalSent}
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {metrics.delivered}
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {metrics.reviewed}
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {metrics.feedbackCount}
                    </td>
                    <td className="py-4">
                      <PercentageBar rate={metrics.responseRate} />
                    </td>
                    <td className="py-4">
                      <PercentageBar rate={metrics.reviewRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PercentageBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium min-w-[3ch]">{rate}%</span>
    </div>
  )
}
