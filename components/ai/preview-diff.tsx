'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface PreviewDiffProps {
  /** Original template text */
  original: string
  /** Personalized text */
  personalized: string
  /** Whether to show diff highlighting or clean view */
  showDiff: boolean
  /** Optional className for the container */
  className?: string
}

// ============================================================
// Word-level diff (simple, reader-friendly)
// ============================================================

type DiffSegment = {
  text: string
  type: 'same' | 'added' | 'removed'
}

/**
 * Simple word-level diff using longest common subsequence approach.
 * Optimized for readability, not developer-style patches.
 */
function computeWordDiff(original: string, personalized: string): DiffSegment[] {
  const originalWords = original.split(/(\s+)/)
  const personalizedWords = personalized.split(/(\s+)/)

  // Build LCS table
  const m = originalWords.length
  const n = personalizedWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (originalWords[i - 1] === personalizedWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find diff
  const segments: DiffSegment[] = []
  let i = m
  let j = n

  // We'll build in reverse, then flip
  const reversed: DiffSegment[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalWords[i - 1] === personalizedWords[j - 1]) {
      reversed.push({ text: originalWords[i - 1], type: 'same' })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      reversed.push({ text: personalizedWords[j - 1], type: 'added' })
      j--
    } else {
      reversed.push({ text: originalWords[i - 1], type: 'removed' })
      i--
    }
  }

  // Reverse and merge consecutive segments of the same type
  const raw = reversed.reverse()
  for (const seg of raw) {
    const last = segments[segments.length - 1]
    if (last && last.type === seg.type) {
      last.text += seg.text
    } else {
      segments.push({ ...seg })
    }
  }

  return segments
}

// ============================================================
// Component
// ============================================================

export function PreviewDiff({
  original,
  personalized,
  showDiff,
  className,
}: PreviewDiffProps) {
  const segments = useMemo(
    () => computeWordDiff(original, personalized),
    [original, personalized]
  )

  // Clean view: just show the personalized text
  if (!showDiff) {
    return (
      <div className={cn('text-sm whitespace-pre-wrap leading-relaxed', className)}>
        {personalized}
      </div>
    )
  }

  // Diff view: highlight changes with friendly colors
  return (
    <div className={cn('space-y-3', className)}>
      {/* Personalized text with highlights */}
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {segments.map((segment, index) => {
          if (segment.type === 'same') {
            return <span key={index}>{segment.text}</span>
          }
          if (segment.type === 'added') {
            return (
              <span
                key={index}
                className="bg-primary/15 text-primary rounded px-0.5 dark:bg-primary/25"
              >
                {segment.text}
              </span>
            )
          }
          // removed: show with strikethrough in muted style
          return (
            <span
              key={index}
              className="text-muted-foreground/60 line-through text-xs"
            >
              {segment.text}
            </span>
          )
        })}
      </div>

      {/* Collapsible original template */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
          View original template
        </summary>
        <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed rounded-md bg-muted/50 p-3 border border-dashed">
          {original}
        </div>
      </details>
    </div>
  )
}
