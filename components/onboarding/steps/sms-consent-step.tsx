'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { acknowledgeSMSConsent } from '@/lib/actions/onboarding'
import { toast } from 'sonner'

interface SMSConsentStepProps {
  onComplete: () => Promise<void>
  onGoBack: () => void
  isSubmitting: boolean
}

/**
 * Step 7: SMS Consent Requirements
 * Explains TCPA requirements and captures acknowledgment via checkbox.
 * This is the final step - completion triggers wizard finish.
 */
export function SMSConsentStep({
  onComplete,
  onGoBack,
  isSubmitting,
}: SMSConsentStepProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!acknowledged) {
      toast.error('You must acknowledge SMS consent requirements to continue')
      return
    }

    startTransition(async () => {
      const result = await acknowledgeSMSConsent({ acknowledged: true })

      if (result.success) {
        // Call onComplete which triggers markOnboardingComplete in wizard
        await onComplete()
      } else if (result.error) {
        toast.error(result.error)
      }
    })
  }

  const isDisabled = isPending || isSubmitting || !acknowledged

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SMS consent requirements</h1>
        <p className="text-muted-foreground text-lg">
          Important information about sending text messages to customers
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info card with TCPA requirements */}
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h3 className="font-semibold text-lg">Key requirements:</h3>
          <ul className="space-y-3 list-disc list-inside text-sm">
            <li>
              You must have written consent from customers before sending SMS messages
            </li>
            <li>
              Customers can opt out at any time by replying STOP
            </li>
            <li>
              You must keep records of when and how consent was obtained (TCPA compliance)
            </li>
            <li>
              Messages will only be sent during business hours (8 AM - 9 PM local time)
            </li>
          </ul>
        </div>

        {/* Acknowledgment checkbox */}
        <div className="border border-info-border bg-info-bg rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="sms-consent-acknowledgment"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="sms-consent-acknowledgment"
              className="text-sm cursor-pointer leading-relaxed"
            >
              I understand that I must obtain written consent from customers before sending them SMS messages, and I will maintain records of consent as required by TCPA regulations.
            </Label>
          </div>
        </div>

        {/* Back button (text link) */}
        <div className="text-center">
          <button
            type="button"
            onClick={onGoBack}
            disabled={isPending || isSubmitting}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Back
          </button>
        </div>

        {/* Complete button */}
        <Button
          type="submit"
          disabled={isDisabled}
          className="w-full h-12 text-base"
        >
          {isPending || isSubmitting ? 'Completing...' : 'Complete Setup'}
        </Button>
      </form>
    </div>
  )
}
