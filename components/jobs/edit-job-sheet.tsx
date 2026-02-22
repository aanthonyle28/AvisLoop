'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CircleNotch } from '@phosphor-icons/react'
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
import { CampaignSelector, CAMPAIGN_DO_NOT_SEND, CAMPAIGN_ONE_OFF } from './campaign-selector'
import { updateJob, type JobActionState } from '@/lib/actions/job'
import { JOB_STATUS_LABELS, JOB_STATUS_DESCRIPTIONS } from '@/lib/validations/job'
import type { JobWithCustomer, Customer, ServiceType, JobStatus } from '@/lib/types/database'

// Statuses shown in the Edit Job sheet (do_not_send handled via campaign selector)
const EDIT_JOB_STATUSES: JobStatus[] = ['scheduled', 'completed']

interface EditJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobWithCustomer
  customers: Customer[]
}

export function EditJobSheet({ open, onOpenChange, job, customers }: EditJobSheetProps) {
  const [state, formAction, isPending] = useActionState<JobActionState | null, FormData>(
    updateJob,
    null
  )

  // Local state initialized from job
  const [customerId, setCustomerId] = useState<string | null>(job.customer_id)
  const [serviceType, setServiceType] = useState<ServiceType>(job.service_type)
  const [status, setStatus] = useState<JobStatus>(
    // If the job is do_not_send, default to completed in the dropdown
    // (the campaign selector will be set to "Do not send")
    job.status === 'do_not_send' ? 'completed' : job.status
  )
  const [notes, setNotes] = useState(job.notes || '')
  const [campaignChoice, setCampaignChoice] = useState<string | null>(() => {
    if (job.status === 'do_not_send') return CAMPAIGN_DO_NOT_SEND
    if (job.campaign_override === 'one_off') return CAMPAIGN_ONE_OFF
    if (job.campaign_override) return job.campaign_override
    return null
  })

  // Reset form when job changes
  useEffect(() => {
    setCustomerId(job.customer_id)
    setServiceType(job.service_type)
    setStatus(job.status === 'do_not_send' ? 'completed' : job.status)
    setNotes(job.notes || '')
    if (job.status === 'do_not_send') {
      setCampaignChoice(CAMPAIGN_DO_NOT_SEND)
    } else if (job.campaign_override === 'one_off') {
      setCampaignChoice(CAMPAIGN_ONE_OFF)
    } else if (job.campaign_override) {
      setCampaignChoice(job.campaign_override)
    } else {
      setCampaignChoice(null)
    }
  }, [job])

  // Handle success/error
  useEffect(() => {
    if (state?.success) {
      toast.success('Job updated successfully')
      onOpenChange(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  const handleSubmit = (formData: FormData) => {
    formData.set('jobId', job.id)
    if (customerId) formData.set('customerId', customerId)
    formData.set('serviceType', serviceType)
    formData.set('notes', notes)

    // Determine actual status and enrollment based on campaign choice
    if (campaignChoice === CAMPAIGN_DO_NOT_SEND) {
      formData.set('status', 'do_not_send')
      formData.set('enrollInCampaign', 'false')
    } else if (campaignChoice === CAMPAIGN_ONE_OFF) {
      formData.set('status', status)
      formData.set('enrollInCampaign', 'false')
      formData.set('campaignOverride', 'one_off')
    } else {
      formData.set('status', status)
      if (campaignChoice) {
        formData.set('campaignOverride', campaignChoice)
      }
      if (status === 'completed' && job.status !== 'completed') {
        // Changing to completed — enroll in selected campaign
        formData.set('enrollInCampaign', 'true')
        if (campaignChoice) {
          formData.set('campaignId', campaignChoice)
        }
      }
    }

    formAction(formData)
  }

  // Contextual completion note when transitioning to completed
  const completionNote = (() => {
    if (status !== 'completed' || job.status === 'completed') return ''
    if (campaignChoice === CAMPAIGN_DO_NOT_SEND) return ''
    if (campaignChoice === CAMPAIGN_ONE_OFF) return ' You can send a one-off request after completion.'
    return ' This will enroll the customer in the selected campaign.'
  })()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Job</SheetTitle>
          <SheetDescription>
            Update job details.{completionNote}
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

          {/* Campaign — appears after service type is selected */}
          {serviceType && (
            <div className="space-y-2">
              <Label>Campaign</Label>
              <CampaignSelector
                serviceType={serviceType}
                selectedCampaignId={campaignChoice}
                onCampaignChange={setCampaignChoice}
                showOneOff
                defaultCampaignId={job.campaign_override}
              />
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {EDIT_JOB_STATUSES.map(s => (
                <option key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {JOB_STATUS_DESCRIPTIONS[status]}
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

          {/* Job info (read-only) */}
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            {job.completed_at && (
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{new Date(job.completed_at).toLocaleDateString()}</span>
              </div>
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
              {isPending && <CircleNotch size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
