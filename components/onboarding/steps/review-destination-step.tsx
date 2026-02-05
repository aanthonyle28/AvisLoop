'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { saveReviewDestination } from '@/lib/actions/onboarding'
import { CheckCircle } from '@phosphor-icons/react'

interface ReviewDestinationStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultLink?: string
}

/**
 * Step 2: Review Destination
 * Validates and saves Google review link with test-open functionality.
 * This step is skippable.
 */
export function ReviewDestinationStep({
  onComplete,
  onGoBack,
  defaultLink,
}: ReviewDestinationStepProps) {
  const [link, setLink] = useState(defaultLink || '')
  const [error, setError] = useState<string | null>(null)
  const [tested, setTested] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleTest = () => {
    setError(null)

    if (!link.trim()) {
      setError('Please enter a link to test')
      return
    }

    try {
      const url = new URL(link.trim())
      if (!url.href.includes('google')) {
        setError('Must be a Google URL')
        return
      }
      window.open(link.trim(), '_blank')
      setTested(true)
    } catch {
      setError('Please enter a valid URL')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate URL if provided
    if (link.trim()) {
      try {
        const url = new URL(link.trim())
        if (!url.href.includes('google')) {
          setError('Must be a Google URL')
          return
        }
      } catch {
        setError('Please enter a valid URL')
        return
      }
    }

    startTransition(async () => {
      const result = await saveReviewDestination({
        googleReviewLink: link.trim(),
      })

      if (result.success) {
        onComplete()
        return
      }

      if (result.error) {
        setError(result.error)
      }
    })
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Verify your Google review link</h1>
        <p className="text-muted-foreground text-lg">
          Make sure the link opens your Google review page.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google-review-link">Google review link</Label>
          <Input
            id="google-review-link"
            type="url"
            value={link}
            onChange={(e) => {
              setLink(e.target.value)
              setTested(false)
            }}
            placeholder="https://g.page/r/..."
            disabled={isPending}
            autoFocus
            className="text-lg h-12"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Test button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isPending || !link.trim()}
          className="w-full h-12 text-base"
        >
          Test your link
        </Button>

        {/* Success indicator */}
        {tested && !error && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={20} weight="fill" />
            <span>Link opens correctly</span>
          </div>
        )}

        {/* Button row */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onGoBack}
            disabled={isPending}
            className="flex-1 h-12 text-base"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 h-12 text-base"
          >
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  )
}
