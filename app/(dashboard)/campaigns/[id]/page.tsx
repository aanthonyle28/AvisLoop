import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCampaign, getCampaignEnrollments, getCampaignEnrollmentCounts } from '@/lib/data/campaign'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PencilSimple, EnvelopeSimple, ChatCircle, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { ENROLLMENT_STATUS_LABELS, STOP_REASON_LABELS, TOUCH_STATUS_LABELS } from '@/lib/constants/campaigns'
import { formatDistanceToNow, format } from 'date-fns'

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CampaignDetailPageProps) {
  const { id } = await params
  const campaign = await getCampaign(id)
  return {
    title: campaign ? `${campaign.name} | Campaigns` : 'Campaign Not Found',
  }
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params
  const [campaign, enrollments, counts] = await Promise.all([
    getCampaign(id),
    getCampaignEnrollments(id, { limit: 20 }),
    getCampaignEnrollmentCounts(id),
  ])

  if (!campaign) {
    notFound()
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/campaigns"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{campaign.name}</h1>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status === 'active' ? 'Active' : 'Paused'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {campaign.service_type
              ? SERVICE_TYPE_LABELS[campaign.service_type]
              : 'All services'}
            {' · '}
            {campaign.campaign_touches.length} touches
          </p>
        </div>

        {!campaign.is_preset && (
          <Link href={`/campaigns/${id}/edit`}>
            <Button>
              <PencilSimple className="mr-2 h-4 w-4" />
              Edit Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stopped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.stopped}</div>
          </CardContent>
        </Card>
      </div>

      {/* Touch sequence visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Touch Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            {campaign.campaign_touches.map((touch, idx) => (
              <div key={touch.id} className="flex items-center gap-2">
                {idx > 0 && (
                  <span className="text-muted-foreground">→</span>
                )}
                <div className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2">
                    {touch.channel === 'email' ? (
                      <EnvelopeSimple className="h-5 w-5" />
                    ) : (
                      <ChatCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium capitalize">{touch.channel}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {touch.delay_hours < 24
                      ? `${touch.delay_hours}h after ${idx === 0 ? 'job' : `touch ${idx}`}`
                      : `${Math.round(touch.delay_hours / 24)}d after ${idx === 0 ? 'job' : `touch ${idx}`}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enrollments list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No enrollments yet. Jobs will be enrolled when marked complete.
            </p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">
                      {enrollment.customers?.name || 'Unknown customer'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Enrolled {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                      {enrollment.jobs?.service_type && (
                        <> · {SERVICE_TYPE_LABELS[enrollment.jobs.service_type]}</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        enrollment.status === 'active' ? 'default' :
                        enrollment.status === 'completed' ? 'secondary' :
                        'outline'
                      }
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                    </Badge>
                    {enrollment.stop_reason && (
                      <span className="text-xs text-muted-foreground">
                        {STOP_REASON_LABELS[enrollment.stop_reason]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
