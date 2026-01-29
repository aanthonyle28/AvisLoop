'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { saveReviewLink } from '@/lib/actions/business'

interface ReviewLinkModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLink?: string | null
}

export function ReviewLinkModal({ open, onOpenChange, currentLink }: ReviewLinkModalProps) {
  const [link, setLink] = useState(currentLink || '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await saveReviewLink(link)
      if (result.error) {
        setError(result.error)
        return
      }
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add your Google review link</DialogTitle>
          <DialogDescription>
            Paste your Google Business Profile review link below. This is the link your customers will use to leave a review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reviewLink" className="block text-sm font-medium text-gray-700 mb-1">
              Google Review Link
            </label>
            <input
              type="url"
              id="reviewLink"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              You can change this later in Settings.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !link.trim()}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
