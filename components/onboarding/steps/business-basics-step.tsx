'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { saveBusinessBasics } from '@/lib/actions/onboarding'

interface BusinessBasicsStepProps {
  onComplete: () => void
  defaultValues?: {
    name?: string
    phone?: string
    google_review_link?: string
  }
}

/**
 * Step 1: Business Basics
 * Collects business name, phone number, and optional Google review link.
 * Name is required, phone and link are optional.
 */
export function BusinessBasicsStep({
  onComplete,
  defaultValues,
}: BusinessBasicsStepProps) {
  const [name, setName] = useState(defaultValues?.name || '')
  const [phone, setPhone] = useState(defaultValues?.phone || '')
  const [googleReviewLink, setGoogleReviewLink] = useState(
    defaultValues?.google_review_link || ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    startTransition(async () => {
      const result = await saveBusinessBasics({
        name: name.trim(),
        phone: phone.trim(),
        googleReviewLink: googleReviewLink.trim(),
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

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Let&apos;s get your business set up</h1>
        <p className="text-muted-foreground text-lg">
          This info appears in your review request messages.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-name">Business name *</Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise HVAC"
            disabled={isPending}
            autoFocus
            className="text-lg h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone-number">Phone number</Label>
          <Input
            id="phone-number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isPending}
            className="text-lg h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="google-review-link">Google review link</Label>
          <Input
            id="google-review-link"
            type="url"
            value={googleReviewLink}
            onChange={(e) => setGoogleReviewLink(e.target.value)}
            placeholder="https://g.page/r/..."
            disabled={isPending}
            className="text-lg h-12"
          />
        </div>

        {error && <p className="text-sm text-error-text">{error}</p>}

        <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
