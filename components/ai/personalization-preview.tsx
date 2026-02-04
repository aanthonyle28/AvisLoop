'use client'

import { useState, useTransition } from 'react'
import {
  Sparkle,
  ArrowsClockwise,
  CaretDown,
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  PreviewSampleCard,
  type PreviewSample,
} from '@/components/ai/preview-sample-card'
import {
  personalizePreviewBatchAction,
  personalizePreview,
} from '@/lib/actions/personalize'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface PersonalizationPreviewProps {
  /** Template message body */
  templateBody: string
  /** Template subject (email only) */
  templateSubject?: string
  /** Message channel */
  channel: 'email' | 'sms'
  /** Optional service type for context */
  serviceType?: string
  /** Optional className */
  className?: string
}

const DEFAULT_SAMPLE_COUNT = 3
const MAX_SAMPLE_COUNT = 5

// ============================================================
// Component
// ============================================================

export function PersonalizationPreview({
  templateBody,
  templateSubject,
  channel,
  serviceType,
  className,
}: PersonalizationPreviewProps) {
  const [samples, setSamples] = useState<PreviewSample[]>([])
  const [showDiff, setShowDiff] = useState(true)
  const [visibleCount, setVisibleCount] = useState(DEFAULT_SAMPLE_COUNT)
  const [error, setError] = useState<string | null>(null)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isGenerating, startGenerating] = useTransition()

  // Stats
  const personalizedCount = samples.filter((s) => s.wasPersonalized).length
  const totalCount = samples.length

  // ============================================================
  // Generate / Regenerate All
  // ============================================================

  function handleGenerate() {
    startGenerating(async () => {
      setError(null)

      const result = await personalizePreviewBatchAction({
        templateBody,
        templateSubject,
        channel,
        serviceType,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.data?.samples) {
        setSamples(result.data.samples)
        setHasGenerated(true)
        setVisibleCount(DEFAULT_SAMPLE_COUNT)
      }
    })
  }

  // ============================================================
  // Regenerate Single Sample
  // ============================================================

  async function handleRegenerateSingle(customerId: string) {
    setError(null)

    const result = await personalizePreview({
      templateBody,
      templateSubject,
      customerId,
      channel,
      serviceType,
    })

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.data) {
      setSamples((prev) =>
        prev.map((sample) => {
          if (sample.customerId !== customerId) return sample
          return {
            ...sample,
            personalized: result.data!.personalized,
            personalizedSubject: result.data!.personalizedSubject,
            wasPersonalized: result.data!.wasPersonalized,
            fallbackReason: result.data!.fallbackReason,
            model: result.data!.model,
          }
        })
      )
    }
  }

  // ============================================================
  // Show More Samples
  // ============================================================

  function handleShowMore() {
    setVisibleCount(MAX_SAMPLE_COUNT)
  }

  const visibleSamples = samples.slice(0, visibleCount)
  const hasMore = samples.length > visibleCount

  // ============================================================
  // Render
  // ============================================================

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkle className="size-4 text-primary" weight="fill" />
            Personalization Preview
          </CardTitle>

          {/* Diff toggle (only visible when samples exist) */}
          {hasGenerated && samples.length > 0 && (
            <div className="flex items-center gap-2">
              <Label
                htmlFor="show-diff"
                className="text-xs text-muted-foreground font-normal"
              >
                {showDiff ? 'Show changes' : 'Clean view'}
              </Label>
              <Switch
                id="show-diff"
                checked={showDiff}
                onCheckedChange={setShowDiff}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error state */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!hasGenerated && !isGenerating && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <Sparkle className="size-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-4">
              See how your message looks personalized for real customers
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Sparkle className="size-4" weight="fill" />
              Generate Preview
            </Button>
          </div>
        )}

        {/* Loading state */}
        {isGenerating && !hasGenerated && (
          <div className="space-y-3">
            {Array.from({ length: DEFAULT_SAMPLE_COUNT }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-muted/30 p-4 space-y-3 animate-pulse"
              >
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-5 w-20 bg-muted rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-4/5 bg-muted rounded" />
                  <div className="h-3 w-3/5 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Samples */}
        {hasGenerated && samples.length > 0 && (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {personalizedCount} of {totalCount} samples personalized
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <ArrowsClockwise
                  className={cn('size-3.5', isGenerating && 'animate-spin')}
                />
                Regenerate All
              </Button>
            </div>

            {/* Regenerating overlay for existing samples */}
            {isGenerating && (
              <div className="text-xs text-muted-foreground text-center py-2 animate-pulse">
                Regenerating samples...
              </div>
            )}

            {/* Sample cards */}
            <div className="space-y-3">
              {visibleSamples.map((sample) => (
                <PreviewSampleCard
                  key={sample.customerId}
                  sample={sample}
                  channel={channel}
                  showDiff={showDiff}
                  onRegenerate={handleRegenerateSingle}
                />
              ))}
            </div>

            {/* Show more button */}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleShowMore}
              >
                <CaretDown className="size-3.5" />
                Show {samples.length - visibleCount} more sample
                {samples.length - visibleCount > 1 ? 's' : ''}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
