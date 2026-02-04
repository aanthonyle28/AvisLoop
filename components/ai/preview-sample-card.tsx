'use client'

import { useTransition } from 'react'
import { CheckCircle, Warning, ArrowsClockwise } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PreviewDiff } from '@/components/ai/preview-diff'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

export interface PreviewSample {
  customerId: string
  customerName: string
  isRepeatCustomer: boolean
  original: string
  personalized: string
  subject?: string
  personalizedSubject?: string
  wasPersonalized: boolean
  fallbackReason?: string
  model?: string
}

interface PreviewSampleCardProps {
  sample: PreviewSample
  /** email or sms */
  channel: 'email' | 'sms'
  /** Whether to show diff highlighting */
  showDiff: boolean
  /** Called when user clicks regenerate */
  onRegenerate: (customerId: string) => Promise<void>
  /** Optional className */
  className?: string
}

// ============================================================
// Component
// ============================================================

export function PreviewSampleCard({
  sample,
  channel,
  showDiff,
  onRegenerate,
  className,
}: PreviewSampleCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleRegenerate() {
    startTransition(async () => {
      await onRegenerate(sample.customerId)
    })
  }

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          {/* Customer info */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm truncate">
              {sample.customerName}
            </span>
            <Badge variant="outline" className="text-xs font-normal shrink-0">
              {sample.isRepeatCustomer ? 'Repeat customer' : 'New customer'}
            </Badge>
          </div>

          {/* Status + Regenerate */}
          <div className="flex items-center gap-2 shrink-0">
            {sample.wasPersonalized ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                <CheckCircle className="size-3 mr-1" weight="fill" />
                Personalized
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                <Warning className="size-3 mr-1" weight="fill" />
                Template used
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRegenerate}
              disabled={isPending}
              title="Regenerate this sample"
            >
              <ArrowsClockwise
                className={cn('size-3.5', isPending && 'animate-spin')}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Fallback reason banner */}
        {!sample.wasPersonalized && sample.fallbackReason && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
            <Warning className="size-3 inline mr-1.5" weight="fill" />
            {sample.fallbackReason}
          </div>
        )}

        {/* Subject line (email only) */}
        {channel === 'email' && sample.subject && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Subject
            </span>
            {sample.wasPersonalized && sample.personalizedSubject ? (
              <PreviewDiff
                original={sample.subject}
                personalized={sample.personalizedSubject}
                showDiff={showDiff}
                className="text-sm font-medium"
              />
            ) : (
              <p className="text-sm font-medium">{sample.subject}</p>
            )}
          </div>
        )}

        {/* Message body */}
        <div className="space-y-1">
          {channel === 'email' && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Body
            </span>
          )}
          <PreviewDiff
            original={sample.original}
            personalized={sample.personalized}
            showDiff={showDiff}
          />
        </div>

        {/* Model tag (small, subtle) */}
        {sample.model && (
          <div className="text-[10px] text-muted-foreground/50 font-mono">
            {sample.model}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
