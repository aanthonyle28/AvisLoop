'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { LinkSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateBrandedLink } from '@/lib/actions/branded-links'

interface BrandedLinksSectionProps {
  googleReviewLink?: string | null
  brandedReviewLink?: string | null
}

export function BrandedLinksSection({ googleReviewLink, brandedReviewLink }: BrandedLinksSectionProps) {
  const [shortLink, setShortLink] = useState(brandedReviewLink || '')
  const [isPending, startTransition] = useTransition()

  const handleGenerate = () => {
    if (!googleReviewLink) return

    startTransition(async () => {
      const result = await generateBrandedLink(googleReviewLink)

      if (result.success && result.shortUrl) {
        setShortLink(result.shortUrl)
        toast.success('Short link created!')
      } else {
        toast.error(result.error || 'Failed to create short link')
      }
    })
  }

  const handleRegenerate = () => {
    if (!googleReviewLink) return

    if (confirm('This will replace your existing short link. Are you sure?')) {
      handleGenerate()
    }
  }

  const handleCopy = async () => {
    if (!shortLink) return

    try {
      await navigator.clipboard.writeText(shortLink)
      toast.success('Short link copied to clipboard!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  // No Google review link set yet
  if (!googleReviewLink) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Set up your Google review link first (in Business Profile above) before creating a branded short link.
        </p>
      </div>
    )
  }

  // Short link exists
  if (shortLink) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={shortLink}
            readOnly
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
          >
            Copy
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleRegenerate}
          disabled={isPending}
        >
          <LinkSimple className="h-4 w-4 mr-2" />
          {isPending ? 'Generating...' : 'Regenerate'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Powered by Bitly. Free tier supports up to 1,500 links/month.
        </p>
      </div>
    )
  }

  // No short link yet, show generate button
  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
      >
        <LinkSimple className="h-4 w-4 mr-2" />
        {isPending ? 'Generating...' : 'Generate Short Link'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Powered by Bitly. Free tier supports up to 1,500 links/month.
      </p>
    </div>
  )
}
