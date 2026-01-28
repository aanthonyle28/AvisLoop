'use client'

import { useActionState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createContact, type ContactActionState } from '@/lib/actions/contact'

const contactStepSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type ContactStepData = z.infer<typeof contactStepSchema>

interface ContactStepProps {
  onComplete: () => void
  onSkip: () => void
}

/**
 * Contact step for onboarding wizard.
 * Note: businessId is NOT needed as a prop - createContact server action
 * derives the business from the authenticated user's session automatically.
 */
export function ContactStep({ onComplete, onSkip }: ContactStepProps) {
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ContactStepData>({
    resolver: zodResolver(contactStepSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  const [state, formAction, isPending] = useActionState<ContactActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await createContact(prevState, formData)
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
          setError(field as keyof ContactStepData, { message: messages[0] })
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
        <h2 className="text-xl font-semibold mb-2">Add your first contact</h2>
        <p className="text-muted-foreground">
          Add a customer you&apos;d like to request a review from.
        </p>
      </div>

      <form ref={formRef} action={formAction} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-name"
            {...register('name')}
            placeholder="John Smith"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact-email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contact-phone">
            Phone (optional)
          </Label>
          <Input
            id="contact-phone"
            type="tel"
            {...register('phone')}
            placeholder="(555) 123-4567"
            disabled={isPending}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add Contact & Continue'}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now - I&apos;ll add contacts later
          </button>
        </div>
      </form>
    </div>
  )
}
