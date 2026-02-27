'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ServiceTypeSelect } from '@/components/jobs/service-type-select'
import { SERVICE_TYPES } from '@/lib/validations/job'
import type { ServiceType } from '@/lib/types/database'

// ─── Form schema (no token field — injected at submit time) ───────────────────

const formSchema = z
  .object({
    customerName: z.string().min(1, 'Name is required').max(200),
    customerEmail: z
      .string()
      .email('Invalid email address')
      .optional()
      .or(z.literal('')),
    customerPhone: z.string().optional().or(z.literal('')),
    serviceType: z.string().min(1, 'Please select a service type'),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (data) =>
      (data.customerEmail && data.customerEmail.trim() !== '') ||
      (data.customerPhone && data.customerPhone.trim() !== ''),
    {
      message: 'Please provide an email address or phone number',
      path: ['customerEmail'],
    }
  )

type FormValues = z.infer<typeof formSchema>

// ─── Component ────────────────────────────────────────────────────────────────

interface JobCompletionFormProps {
  businessName: string
  enabledServiceTypes: string[]
  customServiceNames: string[]
  token: string
}

type FormState = 'form' | 'submitting' | 'success'

export function JobCompletionForm({
  businessName,
  enabledServiceTypes,
  customServiceNames,
  token,
}: JobCompletionFormProps) {
  const [formState, setFormState] = useState<FormState>('form')

  // Determine which service types to show
  const availableTypes =
    enabledServiceTypes.length > 0
      ? (enabledServiceTypes as ServiceType[])
      : (SERVICE_TYPES as unknown as ServiceType[])

  // Pre-select the service type if only one is enabled
  const defaultServiceType = availableTypes.length === 1 ? availableTypes[0] : ''

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceType: defaultServiceType,
      notes: '',
    },
  })

  async function onSubmit(data: FormValues) {
    setFormState('submitting')

    try {
      const response = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          token, // Inject token from props — not a user-controlled field
        }),
      })

      if (response.ok) {
        setFormState('success')
      } else {
        const errorData = await response.json().catch(() => null)
        if (response.status === 429) {
          toast.error('Too many submissions. Please wait a moment and try again.')
        } else {
          toast.error(
            (errorData as { error?: string } | null)?.error ||
              'Failed to submit job. Please try again.'
          )
        }
        setFormState('form')
      }
    } catch {
      toast.error('Network error. Please check your connection and try again.')
      setFormState('form')
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────

  if (formState === 'success') {
    return (
      <div className="bg-card rounded-2xl shadow-xl border p-8 text-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" weight="fill" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Job Submitted</h2>
        <p className="text-muted-foreground mb-6">
          Customer will be enrolled in the review campaign for{' '}
          <span className="font-medium text-foreground">{businessName}</span>.
        </p>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-12"
          onClick={() => {
            form.reset()
            setFormState('form')
          }}
        >
          Submit Another Job
        </Button>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-card rounded-2xl shadow-xl border p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Complete Job</h1>
        <p className="text-muted-foreground mt-1">{businessName}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Customer Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customerName" className="text-base font-medium">
            Customer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="customerName"
            placeholder="e.g. Patricia Johnson"
            className="h-12 text-base"
            autoComplete="off"
            {...form.register('customerName')}
          />
          {form.formState.errors.customerName && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.customerName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="customerEmail" className="text-base font-medium">
            Email
          </Label>
          <Input
            id="customerEmail"
            type="email"
            inputMode="email"
            placeholder="customer@email.com"
            className="h-12 text-base"
            autoComplete="off"
            {...form.register('customerEmail')}
          />
          {form.formState.errors.customerEmail && (
            <p className="text-sm text-destructive" role="alert">
              {form.formState.errors.customerEmail.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="customerPhone" className="text-base font-medium">
            Phone
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            inputMode="tel"
            placeholder="(512) 555-1234"
            className="h-12 text-base"
            autoComplete="off"
            {...form.register('customerPhone')}
          />
        </div>

        {/* Email/Phone hint */}
        <p className="text-xs text-muted-foreground -mt-2">
          At least one of email or phone is required.
        </p>

        {/* Service Type — only show if more than 1 enabled type */}
        {availableTypes.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-base font-medium">
              Service Type <span className="text-destructive">*</span>
            </Label>
            <ServiceTypeSelect
              value={(form.watch('serviceType') as ServiceType) || ''}
              onChange={(val) =>
                form.setValue('serviceType', val, { shouldValidate: true })
              }
              error={form.formState.errors.serviceType?.message}
              enabledTypes={availableTypes}
              customServiceNames={customServiceNames}
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-base font-medium">
            Notes{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <textarea
            id="notes"
            placeholder="Quick note about the job..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            maxLength={500}
            {...form.register('notes')}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          disabled={formState === 'submitting'}
        >
          {formState === 'submitting' ? (
            <>
              <SpinnerGap className="animate-spin" size={20} />
              Submitting...
            </>
          ) : (
            'Submit Job'
          )}
        </Button>
      </form>
    </div>
  )
}
