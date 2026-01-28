'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { sendReviewRequest } from '@/lib/actions/send'
import { markOnboardingComplete } from '@/lib/actions/onboarding'
import { useRouter } from 'next/navigation'
import { CheckCircle, Mail, AlertCircle, ArrowLeft } from 'lucide-react'

interface SendStepProps {
  contact?: { id: string; name: string; email: string } | null
  business: { name: string; google_review_link: string | null }
  template?: { id: string; subject: string; body: string } | null
  onComplete: () => void
  onGoToStep?: (step: number) => void
}

export function SendStep({ contact, business, template, onComplete, onGoToStep }: SendStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasContact = !!contact
  const hasReviewLink = !!business.google_review_link

  const handleSend = () => {
    if (!contact) return

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('contactId', contact.id)
      if (template?.id) {
        formData.set('templateId', template.id)
      }

      const result = await sendReviewRequest(null, formData)

      if (result.success) {
        setSuccess(true)
        // Mark onboarding complete
        await markOnboardingComplete()
        // Wait briefly to show success state, then redirect
        setTimeout(() => {
          onComplete()
          router.push('/dashboard')
        }, 2000)
      } else {
        setError(result.error || 'Failed to send review request')
      }
    })
  }

  const handleSkip = () => {
    startTransition(async () => {
      await markOnboardingComplete()
      onComplete()
      router.push('/dashboard')
    })
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Your first review request has been sent!</h2>
          <p className="text-muted-foreground">
            Taking you to your dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Missing review link state
  if (!hasReviewLink) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Send your first review request</h2>
          <p className="text-muted-foreground">
            Before sending, you need to add your Google review link.
          </p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Google review link required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please go back to the first step and add your Google review link.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {onGoToStep && (
            <Button
              onClick={() => onGoToStep(1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back to add review link
            </Button>
          )}
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isPending ? 'Finishing...' : 'Skip - I\'ll send my first request later'}
          </button>
        </div>
      </div>
    )
  }

  // No contact state
  if (!hasContact) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Send your first review request</h2>
          <p className="text-muted-foreground">
            Before sending, you need to add a contact.
          </p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Contact required
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please go back to the previous step and add a contact.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {onGoToStep && (
            <Button
              onClick={() => onGoToStep(2)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back to add contact
            </Button>
          )}
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isPending ? 'Finishing...' : 'Skip - I\'ll send my first request later'}
          </button>
        </div>
      </div>
    )
  }

  // Ready to send state
  const subject = template?.subject || `${business.name} would love your feedback!`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Send your first review request</h2>
        <p className="text-muted-foreground">
          Review the details below and send your first request.
        </p>
      </div>

      {/* Preview Card */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Email Preview</p>
            <p className="text-sm text-muted-foreground">This is what your customer will receive</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">To</p>
            <p className="font-medium">{contact.name} &lt;{contact.email}&gt;</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium">{subject}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">From</p>
            <p className="font-medium">{business.name}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSend}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Sending...' : 'Send First Review Request'}
        </Button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {isPending ? 'Finishing...' : 'Skip - I\'ll send my first request later'}
        </button>
      </div>
    </div>
  )
}
