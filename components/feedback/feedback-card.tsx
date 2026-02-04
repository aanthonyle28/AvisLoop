'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Star, Check, RotateCcw, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FeedbackWithCustomer } from '@/lib/types/feedback'
import { ResolveFeedbackDialog } from './resolve-feedback-dialog'
import { unresolveFeedbackAction } from '@/lib/actions/feedback'

interface FeedbackCardProps {
  feedback: FeedbackWithCustomer
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isResolved = !!feedback.resolved_at

  const handleUnresolve = async () => {
    setIsLoading(true)
    await unresolveFeedbackAction(feedback.id)
    setIsLoading(false)
  }

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-5 transition-all',
        isResolved ? 'border-muted bg-muted/30' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-medium">{feedback.customer.name}</h3>
          <p className="text-sm text-muted-foreground">{feedback.customer.email}</p>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-4 h-4',
                star <= feedback.rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* Feedback text */}
      {feedback.feedback_text && (
        <p className="text-sm mb-4 whitespace-pre-wrap">{feedback.feedback_text}</p>
      )}

      {/* Internal notes (if resolved) */}
      {isResolved && feedback.internal_notes && (
        <div className="bg-muted/50 rounded-md p-3 mb-4 text-sm">
          <p className="font-medium text-xs text-muted-foreground mb-1">Internal notes:</p>
          <p>{feedback.internal_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(feedback.submitted_at), { addSuffix: true })}
        </span>

        <div className="flex items-center gap-2">
          {/* Email customer button */}
          <Button variant="ghost" size="sm" asChild>
            <a href={`mailto:${feedback.customer.email}`}>
              <Mail className="w-4 h-4 mr-1" />
              Email
            </a>
          </Button>

          {isResolved ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnresolve}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reopen
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResolveOpen(true)}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark Resolved
            </Button>
          )}
        </div>
      </div>

      {/* Resolve status indicator */}
      {isResolved && (
        <div className="mt-3 pt-3 border-t border-muted text-xs text-muted-foreground">
          Resolved {formatDistanceToNow(new Date(feedback.resolved_at!), { addSuffix: true })}
        </div>
      )}

      <ResolveFeedbackDialog
        feedbackId={feedback.id}
        customerName={feedback.customer.name}
        open={isResolveOpen}
        onOpenChange={setIsResolveOpen}
      />
    </div>
  )
}
