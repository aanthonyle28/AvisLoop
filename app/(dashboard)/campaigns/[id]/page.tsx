import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getCampaign, getCampaignEnrollments, getCampaignEnrollmentCounts, getCampaignAnalytics } from '@/lib/data/campaign'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getBusiness } from '@/lib/actions/business'
import { markCampaignReviewed } from '@/lib/actions/checklist'
import { CampaignStats } from '@/components/campaigns/campaign-stats'
import { CampaignDetailShell } from './campaign-detail-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkle, CaretLeft, CaretRight } from '@phosphor-icons/react/dist/ssr'
import { TouchSequenceDisplay } from '@/components/campaigns/touch-sequence-display'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { ENROLLMENT_STATUS_LABELS, STOP_REASON_LABELS } from '@/lib/constants/campaigns'
import { formatDistanceToNow } from 'date-fns'

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata({ params }: CampaignDetailPageProps) {
  const { id } = await params
  const campaign = await getCampaign(id)
  return {
    title: campaign ? `${campaign.name} | Campaigns` : 'Campaign Not Found',
  }
}

export default async function CampaignDetailPage({ params, searchParams }: CampaignDetailPageProps) {
  const { id } = await params
  const { page: pageParam } = await searchParams

  const currentPage = Math.max(1, parseInt(pageParam || '1', 10))
  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  const [campaign, enrollmentsResult, counts, analytics, templates, business] = await Promise.all([
    getCampaign(id),
    getCampaignEnrollments(id, { limit: pageSize, offset }),
    getCampaignEnrollmentCounts(id),
    getCampaignAnalytics(id),
    getAvailableTemplates(),
    getBusiness(),
    markCampaignReviewed(),
  ])

  const { enrollments, total } = enrollmentsResult
  const totalPages = Math.ceil(total / pageSize)

  if (!campaign) {
    notFound()
  }

  if (!business) redirect('/onboarding')

  const totalTouches = campaign.campaign_touches.length

  return (
    <div className="container py-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 mb-2 text-sm text-muted-foreground hover:text-foreground w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaigns
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
            {campaign.personalization_enabled && (
              <Badge variant="secondary" className="gap-1">
                <Sparkle weight="fill" className="h-3 w-3 text-amber-500" />
                AI Personalized
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {campaign.service_type
              ? SERVICE_TYPE_LABELS[campaign.service_type]
              : 'All services'}
            {' · '}
            {campaign.campaign_touches.length} touches
          </p>
        </div>

        <CampaignDetailShell
          campaign={campaign}
          templates={templates}
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-muted/40">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Active</p>
            <p className="text-2xl font-bold">{counts.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Completed</p>
            <p className="text-2xl font-bold">{counts.completed}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/40">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-muted-foreground font-medium mb-1">Stopped</p>
            <p className="text-2xl font-bold">{counts.stopped}</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <CampaignStats
        touchStats={analytics.touchStats}
        stopReasons={analytics.stopReasons}
        totalEnrollments={analytics.totalEnrollments}
        avgTouchesCompleted={analytics.avgTouchesCompleted}
        touchCount={campaign.campaign_touches.length}
      />

      {/* Touch sequence visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Touch Sequence</CardTitle>
        </CardHeader>
        <CardContent>
          <TouchSequenceDisplay
            touches={campaign.campaign_touches}
            templates={templates}
          />
        </CardContent>
      </Card>

      {/* Enrollments list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Enrollments ({total})</CardTitle>
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
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {enrollment.customers?.name || 'Unknown customer'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <span>
                        {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                      </span>
                      {enrollment.status === 'active' && enrollment.current_touch && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span>
                            Touch {Math.max(0, enrollment.current_touch - 1)}/{totalTouches}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
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

              {/* Pagination controls */}
              {total > pageSize && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {offset + 1}-{Math.min(offset + pageSize, total)} of {total} enrollments
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/campaigns/${id}?page=${currentPage - 1}`}
                      className={currentPage <= 1 ? 'pointer-events-none' : ''}
                    >
                      <Button variant="outline" size="sm" disabled={currentPage <= 1}>
                        <CaretLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Link
                      href={`/campaigns/${id}?page=${currentPage + 1}`}
                      className={currentPage >= totalPages ? 'pointer-events-none' : ''}
                    >
                      <Button variant="outline" size="sm" disabled={currentPage >= totalPages}>
                        Next
                        <CaretRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
