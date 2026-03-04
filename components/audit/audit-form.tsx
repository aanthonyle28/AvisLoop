'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  MagnifyingGlass,
  EnvelopeSimple,
  Star,
  ChatCircleDots,
  SpinnerGap,
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScoreBadge } from './score-badge'
import type { Grade } from '@/lib/audit/types'

type Phase = 'search' | 'preview' | 'submitting'

interface SearchResult {
  place: {
    placeId: string
    displayName: string
    formattedAddress: string
  }
  grade: Grade
  score: number
  rating: number | null
  reviewCount: number | null
}

/**
 * Client component managing the 3-phase audit flow:
 *   1. search  — prospect enters business name + city
 *   2. preview — shows grade/score + email capture form
 *   3. submitting — loading state while creating report
 *
 * On success, redirects to /audit/[reportId] (shareable report page).
 */
export function AuditForm() {
  const router = useRouter()

  // Phase state machine
  const [phase, setPhase] = useState<Phase>('search')

  // Search form state
  const [businessName, setBusinessName] = useState('')
  const [city, setCity] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Preview state
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)

  // Email capture state
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  // --- Search phase handler ---
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchError(null)

    if (businessName.trim().length < 2) {
      setSearchError('Business name must be at least 2 characters.')
      return
    }
    if (city.trim().length < 2) {
      setSearchError('City must be at least 2 characters.')
      return
    }

    setSearchLoading(true)
    try {
      const res = await fetch('/api/audit/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: businessName.trim(), city: city.trim() }),
      })

      const data = await res.json()

      if (res.status === 429) {
        toast.error(data.error ?? 'Daily audit limit reached. Try again tomorrow.')
        return
      }

      if (res.status === 404) {
        setSearchError(data.error ?? 'No business found on Google Maps. Check the name and city.')
        return
      }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to look up business. Please try again.')
        return
      }

      setSearchResult(data as SearchResult)
      setPhase('preview')
    } catch {
      toast.error('Failed to look up business. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }

  // --- Email submit handler ---
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailLoading(true)
    setPhase('submitting')

    try {
      const res = await fetch('/api/audit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          businessName: businessName.trim(),
          city: city.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to generate report. Please try again.')
        setPhase('preview')
        return
      }

      router.push(`/audit/${data.reportId}`)
    } catch {
      toast.error('Failed to generate report. Please try again.')
      setPhase('preview')
    } finally {
      setEmailLoading(false)
    }
  }

  // --- Render ---
  return (
    <div className="w-full space-y-4">
      {/* Search phase */}
      {(phase === 'search' || phase === 'preview') && phase === 'search' && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="audit-business-name"
                  className="text-sm font-medium"
                >
                  Business Name
                </label>
                <Input
                  id="audit-business-name"
                  type="text"
                  placeholder="e.g. Smith HVAC & Plumbing"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={searchLoading}
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="audit-city"
                  className="text-sm font-medium"
                >
                  City / Location
                </label>
                <Input
                  id="audit-city"
                  type="text"
                  placeholder="e.g. Austin, TX"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={searchLoading}
                  autoComplete="address-level2"
                />
              </div>

              {searchError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {searchError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={searchLoading}
              >
                {searchLoading ? (
                  <>
                    <SpinnerGap
                      size={16}
                      className="mr-2 animate-spin"
                      aria-hidden
                    />
                    Searching...
                  </>
                ) : (
                  <>
                    <MagnifyingGlass size={16} className="mr-2" aria-hidden />
                    Check My Reputation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Preview phase — shows score + email capture */}
      {phase === 'preview' && searchResult && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <ScoreBadge grade={searchResult.grade} size="lg" />
                <div>
                  <p className="text-2xl font-bold tabular-nums">
                    {searchResult.score}
                    <span className="text-base font-normal text-muted-foreground">
                      /100
                    </span>
                  </p>
                  <h2 className="font-semibold text-lg mt-1">
                    {searchResult.place.displayName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {searchResult.place.formattedAddress}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  {searchResult.rating !== null && (
                    <span className="flex items-center gap-1">
                      <Star
                        size={14}
                        weight="fill"
                        className="text-amber-400"
                        aria-hidden
                      />
                      {searchResult.rating.toFixed(1)} stars
                    </span>
                  )}
                  {searchResult.reviewCount !== null && (
                    <span className="flex items-center gap-1">
                      <ChatCircleDots size={14} aria-hidden />
                      {searchResult.reviewCount.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email capture form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your email to unlock the full report with gap analysis
                  and recommendations.
                </p>

                <div className="space-y-2">
                  <label
                    htmlFor="audit-email"
                    className="text-sm font-medium"
                  >
                    Email Address
                  </label>
                  <Input
                    id="audit-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={emailLoading}
                    autoComplete="email"
                  />
                </div>

                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={emailLoading}
                >
                  {emailLoading ? (
                    <>
                      <SpinnerGap
                        size={16}
                        className="mr-2 animate-spin"
                        aria-hidden
                      />
                      Generating report...
                    </>
                  ) : (
                    <>
                      <EnvelopeSimple size={16} className="mr-2" aria-hidden />
                      Get Full Report
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Option to go back and search again */}
          <button
            type="button"
            onClick={() => {
              setPhase('search')
              setSearchResult(null)
              setSearchError(null)
            }}
            className="w-full text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Search a different business
          </button>
        </div>
      )}

      {/* Submitting phase — brief loading indicator before redirect */}
      {phase === 'submitting' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <SpinnerGap
                size={32}
                className="animate-spin text-primary"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                Generating your reputation report...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
