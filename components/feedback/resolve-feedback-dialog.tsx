'use client'

import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { resolveFeedbackAction } from '@/lib/actions/feedback'

interface ResolveFeedbackDialogProps {
  feedbackId: string
  customerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResolveFeedbackDialog({
  feedbackId,
  customerName,
  open,
  onOpenChange,
}: ResolveFeedbackDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    const result = await resolveFeedbackAction(formData)
    setIsLoading(false)

    if (result.success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Feedback</DialogTitle>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit}>
          <input type="hidden" name="id" value={feedbackId} />

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Mark feedback from <strong>{customerName}</strong> as resolved.
            </p>

            <div>
              <label htmlFor="internal_notes" className="text-sm font-medium">
                Internal notes (optional)
              </label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={3}
                placeholder="How was this resolved? (not visible to customer)"
                className="w-full mt-1.5 px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
