'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createCustomer, type CustomerActionState } from '@/lib/actions/customer'

const customerStepSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required'),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type CustomerStepData = z.infer<typeof customerStepSchema>

interface CustomerStepProps {
  onComplete: () => void
  onSkip: () => void
}

/**
 * Customer step for onboarding wizard.
 * Note: businessId is NOT needed as a prop - createCustomer server action
 * derives the business from the authenticated user's session automatically.
 */
export function CustomerStep({ onComplete, onSkip }: CustomerStepProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CustomerStepData>({
    resolver: zodResolver(customerStepSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  })

  const onSubmit = handleSubmit(() => {
    const formData = new FormData(formRef.current!)
    startTransition(async () => {
      const result: CustomerActionState = await createCustomer(null, formData)
      if (result.success) {
        onComplete()
        return
      }
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            setError(field as keyof CustomerStepData, { message: messages[0] })
          }
        })
      }
      if (result.error) {
        setServerError(result.error)
      }
    })
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Add your first customer</h2>
        <p className="text-muted-foreground">
          Add a customer you&apos;d like to request a review from.
        </p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="customer-name">
            Name <span className="text-error-text">*</span>
          </Label>
          <Input
            id="customer-name"
            {...register('name')}
            placeholder="John Smith"
            disabled={isPending}
          />
          {errors.name && (
            <p className="text-sm text-error-text">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-email">
            Email <span className="text-error-text">*</span>
          </Label>
          <Input
            id="customer-email"
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            disabled={isPending}
          />
          {errors.email && (
            <p className="text-sm text-error-text">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="customer-phone">
            Phone (optional)
          </Label>
          <Input
            id="customer-phone"
            type="tel"
            {...register('phone')}
            placeholder="(555) 123-4567"
            disabled={isPending}
          />
          {errors.phone && (
            <p className="text-sm text-error-text">{errors.phone.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-error-text">{serverError}</p>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add Customer & Continue'}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now - I&apos;ll add customers later
          </button>
        </div>
      </form>
    </div>
  )
}
