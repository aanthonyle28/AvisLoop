'use client'

import { useActionState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateBusiness, type BusinessActionState } from '@/lib/actions/business'

const businessStepSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(100),
  googleReviewLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type BusinessStepData = z.infer<typeof businessStepSchema>

interface BusinessStepProps {
  onComplete: () => void
  onSkip?: () => void
  defaultValues?: { name?: string; google_review_link?: string }
}

export function BusinessStep({ onComplete, defaultValues }: BusinessStepProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<BusinessStepData>({
    resolver: zodResolver(businessStepSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      googleReviewLink: defaultValues?.google_review_link || '',
    },
  })

  const [state, formAction, isPending] = useActionState<BusinessActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await updateBusiness(prevState, formData)
      if (result.success) {
        onComplete()
      }
      return result
    },
    null
  )

  // Map server field errors to form errors
  useEffect(() => {
    if (state?.fieldErrors) {
      Object.entries(state.fieldErrors).forEach(([field, messages]) => {
        if (messages && messages.length > 0) {
          setError(field as keyof BusinessStepData, { message: messages[0] })
        }
      })
    }
  }, [state?.fieldErrors, setError])

  const onSubmit = () => {
    // Form will be submitted via formAction
    formRef.current?.requestSubmit()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Set up your business</h2>
        <p className="text-muted-foreground">
          Let&apos;s start with the basics about your business.
        </p>
      </div>

      <form ref={formRef} action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="business-name">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="business-name"
            {...register('name')}
            placeholder="Acme Coffee Shop"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Your business name will appear in review request emails.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="business-review-link">
            Google Review Link
          </Label>
          <Input
            id="business-review-link"
            {...register('googleReviewLink')}
            placeholder="https://search.google.com/local/writereview?placeid=..."
            disabled={isPending}
          />
          {errors.googleReviewLink && (
            <p className="text-sm text-red-600">{errors.googleReviewLink.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Add your Google review link so customers know where to leave reviews.
            You can add this later in Settings.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
