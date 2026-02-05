'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { WarningCircle, DotsThree, CheckCircle, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { quickEnrollJob } from '@/lib/actions/dashboard'
import type { ReadyToSendJob } from '@/lib/types/dashboard'

interface ReadyToSendQueueProps {
  jobs: ReadyToSendJob[]
  hasJobHistory: boolean
}

export function ReadyToSendQueue({ jobs, hasJobHistory }: ReadyToSendQueueProps) {
  const [isPending, startTransition] = useTransition()
  const [enrollingJobId, setEnrollingJobId] = useState<string | null>(null)

  const displayJobs = jobs.slice(0, 5)
  const hasMore = jobs.length > 5

  const handleEnroll = (jobId: string, serviceType: string) => {
    setEnrollingJobId(jobId)
    startTransition(async () => {
      try {
        const result = await quickEnrollJob(jobId)

        if (result.success && result.enrolled) {
          toast.success(`Enrolled in ${result.campaignName}`)
        } else if (result.success && result.noMatchingCampaign) {
          // Prompt to create campaign
          const serviceTypeName = serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
          toast.error(`No campaign for ${serviceTypeName}`, {
            description: 'Create a campaign for this service type',
            action: {
              label: 'Create Campaign',
              onClick: () => {
                window.location.href = `/campaigns/new?serviceType=${serviceType}`
              },
            },
          })
        } else if (result.error) {
          toast.error(result.error)
        }
      } catch (error) {
        toast.error('Failed to enroll job')
        console.error('Enroll error:', error)
      } finally {
        setEnrollingJobId(null)
      }
    })
  }

  return (
    <Card id="ready-to-send-queue">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">Ready to Send</CardTitle>
        {jobs.length > 0 && (
          <Badge variant="secondary">{jobs.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {/* Empty states */}
        {jobs.length === 0 && hasJobHistory && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" weight="fill" />
            <p className="text-sm text-muted-foreground">
              All caught up — no jobs waiting for enrollment
            </p>
          </div>
        )}

        {jobs.length === 0 && !hasJobHistory && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Plus className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No jobs yet — add a completed job to get started
            </p>
            <Button asChild size="sm">
              <Link href="/jobs">
                <Plus className="h-4 w-4 mr-1" />
                Add Job
              </Link>
            </Button>
          </div>
        )}

        {/* Job list */}
        {displayJobs.length > 0 && (
          <div className="space-y-0">
            {displayJobs.map((job, index) => {
              const serviceTypeName = job.service_type.charAt(0).toUpperCase() + job.service_type.slice(1)
              const isEnrolling = isPending && enrollingJobId === job.id

              return (
                <div
                  key={job.id}
                  className={`flex items-center justify-between py-3 ${
                    index < displayJobs.length - 1 ? 'border-b' : ''
                  }`}
                >
                  {/* Left side: urgency flag + customer info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {job.isStale && (
                      <div
                        className="flex-shrink-0 mt-0.5"
                        title={`${serviceTypeName} jobs typically send within ${job.threshold}h`}
                      >
                        <WarningCircle
                          className="h-5 w-5 text-yellow-500"
                          weight="fill"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {serviceTypeName} • Completed{' '}
                        {formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Right side: actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(job.id, job.service_type)}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? 'Enrolling...' : 'Enroll'}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost">
                          <DotsThree className="h-4 w-4" weight="bold" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/send?jobId=${job.id}`}>
                            Send one-off
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/jobs">
                            View job
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Show all link */}
        {hasMore && (
          <div className="mt-4 pt-3 border-t">
            <Link
              href="/jobs?status=completed&enrolled=false"
              className="text-sm text-primary hover:underline"
            >
              Show all ({jobs.length})
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ReadyToSendQueueSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {[1, 2, 3].map((i, index) => (
            <div
              key={i}
              className={`flex items-center justify-between py-3 ${
                index < 2 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="h-5 w-5 bg-muted animate-pulse rounded-full mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-56 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
