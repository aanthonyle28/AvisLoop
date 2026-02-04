'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomerSelector } from './customer-selector'
import { ServiceTypeSelect } from './service-type-select'
import { createJob, type JobActionState } from '@/lib/actions/job'
import { JOB_STATUSES, JOB_STATUS_LABELS } from '@/lib/validations/job'
import type { Customer, ServiceType, JobStatus } from '@/lib/types/database'

interface AddJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
}

export function AddJobSheet({ open, onOpenChange, customers }: AddJobSheetProps) {
  const [state, formAction, isPending] = useActionState<JobActionState | null, FormData>(
    createJob,
    null
  )

  // Local state for controlled components
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<ServiceType | ''>('')
  const [status, setStatus] = useState<JobStatus>('completed')
  const [notes, setNotes] = useState('')

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setCustomerId(null)
      setServiceType('')
      setStatus('completed')
      setNotes('')
    }
  }, [open])

  // Handle success/error
  useEffect(() => {
    if (state?.success) {
      toast.success('Job created successfully')
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  const handleSubmit = (formData: FormData) => {
    // Add controlled values to formData
    if (customerId) formData.set('customerId', customerId)
    if (serviceType) formData.set('serviceType', serviceType)
    formData.set('status', status)
    formData.set('notes', notes)
    formAction(formData)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Job</SheetTitle>
          <SheetDescription>
            Create a new job for a customer. Completed jobs will be enrolled in campaigns.
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {/* Customer selector */}
          <div className="space-y-2">
            <Label>Customer *</Label>
            <CustomerSelector
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
              error={state?.fieldErrors?.customerId?.[0]}
            />
          </div>

          {/* Service type */}
          <div className="space-y-2">
            <Label>Service Type *</Label>
            <ServiceTypeSelect
              value={serviceType}
              onChange={setServiceType}
              error={state?.fieldErrors?.serviceType?.[0]}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {status === 'completed'
                ? 'Completed jobs will be enrolled in campaigns automatically.'
                : 'Do Not Send jobs will not trigger review requests.'}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this job..."
              rows={3}
            />
            {state?.fieldErrors?.notes?.[0] && (
              <p className="text-sm text-destructive">{state.fieldErrors.notes[0]}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !customerId || !serviceType}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
