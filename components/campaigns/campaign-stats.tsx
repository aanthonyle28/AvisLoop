'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { STOP_REASON_LABELS } from '@/lib/constants/campaigns'

interface TouchStat {
  touchNumber: number
  sent: number
  pending: number
  skipped: number
  failed: number
}

interface CampaignStatsProps {
  touchStats: TouchStat[]
  stopReasons: Record<string, number>
  totalEnrollments: number
  avgTouchesCompleted: number
  touchCount: number // Number of touches in the campaign
}

export function CampaignStats({
  touchStats,
  stopReasons,
  totalEnrollments,
  avgTouchesCompleted,
  touchCount,
}: CampaignStatsProps) {
  // Only show stats for touches that exist in the campaign
  const relevantTouchStats = touchStats.slice(0, touchCount)

  if (totalEnrollments === 0) {
    return null // Don't show stats if no enrollments yet
  }

  return (
    <div className="space-y-4">
      {/* Touch Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Touch Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relevantTouchStats.map((touch) => {
              const total = touch.sent + touch.pending + touch.skipped + touch.failed
              const sentPercent = total > 0 ? Math.round((touch.sent / total) * 100) : 0

              return (
                <div key={touch.touchNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Touch {touch.touchNumber}</span>
                    <span className="text-muted-foreground">
                      {touch.sent} sent {total > 0 && `(${sentPercent}%)`}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {touch.sent > 0 && (
                      <div
                        className="bg-green-500 rounded-sm"
                        style={{ flex: touch.sent }}
                        title={`Sent: ${touch.sent}`}
                      />
                    )}
                    {touch.pending > 0 && (
                      <div
                        className="bg-yellow-500 rounded-sm"
                        style={{ flex: touch.pending }}
                        title={`Pending: ${touch.pending}`}
                      />
                    )}
                    {touch.skipped > 0 && (
                      <div
                        className="bg-gray-400 rounded-sm"
                        style={{ flex: touch.skipped }}
                        title={`Skipped: ${touch.skipped}`}
                      />
                    )}
                    {touch.failed > 0 && (
                      <div
                        className="bg-red-500 rounded-sm"
                        style={{ flex: touch.failed }}
                        title={`Failed: ${touch.failed}`}
                      />
                    )}
                    {total === 0 && (
                      <div className="bg-muted rounded-sm flex-1" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-sm" />
              <span>Sent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-sm" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-sm" />
              <span>Skipped</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-sm" />
              <span>Failed</span>
            </div>
          </div>

          {/* Average touches */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avg. touches completed</span>
              <span className="font-medium">{avgTouchesCompleted} / {touchCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stop Reasons */}
      {Object.keys(stopReasons).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stop Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stopReasons)
                .sort(([, a], [, b]) => b - a)
                .map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <Badge variant="outline" className="font-normal">
                      {STOP_REASON_LABELS[reason as keyof typeof STOP_REASON_LABELS] || reason}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
