'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Star,
  ChatCircleDots,
  Lightbulb,
  Rocket,
  ArrowRight,
  Link as LinkIcon,
} from '@phosphor-icons/react'
import { ScoreBadge } from '@/components/audit/score-badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AuditReport, GapAnalysis } from '@/lib/audit/types'

interface AuditResultsProps {
  report: AuditReport
}

/**
 * Full audit results display component.
 * Shown on the shareable /audit/[reportId] report page.
 *
 * Sections:
 * 1. Hero — business name, address, score badge, score out of 100
 * 2. Key Metrics — Google rating + review count
 * 3. Gap Analysis — only shown if gaps exist
 * 4. CTA — Book a Call + Learn More
 * 5. Data disclosure — audited_at timestamp + link to re-audit
 * 6. Share — copy-to-clipboard share button
 */
export function AuditResults({ report }: AuditResultsProps) {
  const [copied, setCopied] = useState(false)

  const gaps: GapAnalysis[] = Array.isArray(report.gaps_json)
    ? report.gaps_json
    : []

  function handleCopyLink() {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Hero section */}
      <div className="flex flex-col items-center text-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {report.business_name}
        </h1>
        {report.place_address && (
          <p className="text-muted-foreground text-sm">
            {report.place_address}
          </p>
        )}
        <ScoreBadge grade={report.grade} size="lg" />
        <p className="text-lg font-semibold text-foreground">
          {report.score}/100
        </p>
      </div>

      {/* 2. Key Metrics row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Google Rating */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Star
              size={24}
              weight="fill"
              className="text-amber-500"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Google Rating
            </p>
            {report.rating_snapshot != null ? (
              <p className="text-2xl font-bold">
                {Number(report.rating_snapshot).toFixed(1)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No rating</p>
            )}
          </CardContent>
        </Card>

        {/* Review Count */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <ChatCircleDots
              size={24}
              weight="fill"
              className="text-blue-500"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Review Count
            </p>
            {report.review_count_snapshot != null ? (
              <p className="text-2xl font-bold">
                {report.review_count_snapshot.toLocaleString()} reviews
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Gap Analysis — only shown if gaps exist */}
      {gaps.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Where You Can Improve</h2>
          <div className="space-y-3">
            {gaps.map((gap, index) => (
              <Card
                key={index}
                className="bg-muted border-border/60"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">
                    {gap.area}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    Current: {gap.current}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Benchmark: {gap.benchmark}
                  </p>
                  <div className="flex items-start gap-2 pt-1">
                    <Lightbulb
                      size={16}
                      weight="fill"
                      className="text-amber-500 shrink-0 mt-0.5"
                      aria-hidden
                    />
                    <p className="text-sm">{gap.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 4. CTA section */}
      <Card variant="amber">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">
            Want to improve your score?
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AvisLoop automates review collection for home service businesses.
            Complete a job, and our system handles the rest — multi-touch
            follow-ups, review funnels, and reputation monitoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/#pricing">
                <Rocket size={16} weight="bold" aria-hidden />
                Book a Call
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                Learn More
                <ArrowRight size={16} weight="bold" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. Data disclosure footer */}
      <p className="text-xs text-muted-foreground text-center">
        Rating data retrieved on{' '}
        {format(new Date(report.audited_at), 'MMMM d, yyyy')}. Run a{' '}
        <Link
          href="/audit"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          new audit
        </Link>{' '}
        for current data.
      </p>

      {/* 6. Share section */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Share this report
        </p>
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          <LinkIcon size={16} weight="bold" aria-hidden />
          {copied ? 'Copied!' : 'Copy share link'}
        </Button>
      </div>
    </div>
  )
}
