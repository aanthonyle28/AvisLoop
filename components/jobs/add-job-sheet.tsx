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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { CustomerAutocomplete } from './customer-autocomplete'
import { ServiceTypeSelect } from './service-type-select'
import { CampaignSelector, CAMPAIGN_DO_NOT_SEND, CAMPAIGN_ONE_OFF } from './campaign-selector'
import { createJob, type JobActionState } from '@/lib/actions/job'
import { JOB_STATUS_LABELS, JOB_STATUS_DESCRIPTIONS } from '@/lib/validations/job'
import type { ServiceType, JobStatus } from '@/lib/types/database'

// Statuses shown in the Add Job sheet (do_not_send is handled via campaign selector)
const ADD_JOB_STATUSES: JobStatus[] = ['scheduled', 'completed']

interface Customer {
  id: string
  name: string
  email: string
  phone?: string | null
}

interface AddJobSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers: Customer[]
  /** Service types enabled for this business (scopes the ServiceTypeSelect options) */
  enabledServiceTypes?: ServiceType[]
  /** Show loading skeletons while data is being fetched */
  isLoadingData?: boolean
}

export function AddJobSheet({ open, onOpenChange, customers, enabledServiceTypes, isLoadingData }: AddJobSheetProps) {
  const [state, formAction, isPending] = useActionState<JobActionState | null, FormData>(
    createJob,
    null
  )

  // Mode: 'search' for autocomplete, 'create' for inline customer creation
  const [mode, setMode] = useState<'search' | 'create'>('search')

  // Selected existing customer (null if creating new)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // New customer fields (used in 'create' mode)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Job fields
  const [serviceType, setServiceType] = useState<ServiceType | ''>('')
  const [status, setStatus] = useState<JobStatus>('scheduled')
  const [notes, setNotes] = useState('')

  // Campaign choice: campaign UUID, CAMPAIGN_DO_NOT_SEND, or CAMPAIGN_ONE_OFF
  const [campaignChoice, setCampaignChoice] = useState<string | null>(null)

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setMode('search')
      setSelectedCustomer(null)
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setServiceType('')
      setStatus('scheduled')
      setNotes('')
      setCampaignChoice(null)
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

  const handleSelectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer)
    if (customer) {
      setMode('search')
    }
  }

  const handleCreateNew = (query: string) => {
    setMode('create')
    setSelectedCustomer(null)
    if (query.includes('@')) {
      setCustomerEmail(query)
      setCustomerName('')
    } else {
      setCustomerName(query)
      setCustomerEmail('')
    }
  }

  const handleBackToSearch = () => {
    setMode('search')
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
  }

  const handleSubmit = (formData: FormData) => {
    // Add form values to FormData
    if (selectedCustomer) {
      formData.set('customerId', selectedCustomer.id)
    } else if (mode === 'create') {
      formData.set('customerName', customerName)
      formData.set('customerEmail', customerEmail)
      formData.set('customerPhone', customerPhone)
    }

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
        formData.set('enrollInCampaign', 'true')
        formData.set('campaignId', campaignChoice)
        formData.set('campaignOverride', campaignChoice)
      } else {
        formData.set('enrollInCampaign', 'true')
      }
    }

    formAction(formData)
  }

  const isCustomerValid = selectedCustomer || (mode === 'create' && customerName && customerEmail)

  // Description changes based on status and campaign choice
  const description = status === 'scheduled'
    ? 'Mark complete later when work is done.'
    : campaignChoice === CAMPAIGN_ONE_OFF
      ? 'You can send a one-off request after saving.'
      : campaignChoice === CAMPAIGN_DO_NOT_SEND
        ? 'No review request will be sent.'
        : 'This job will be enrolled in the selected campaign.'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Job</SheetTitle>
          <SheetDescription>
            Create a new job. {description}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {/* Customer Section - Autocomplete or Inline Create */}
          <div className="space-y-2">
            <Label>Customer *</Label>

            {isLoadingData ? (
              <Skeleton className="h-9 w-full" />
            ) : mode === 'search' ? (
              <CustomerAutocomplete
                customers={customers}
                value={selectedCustomer}
                onChange={handleSelectCustomer}
                onCreateNew={handleCreateNew}
                error={state?.fieldErrors?.customerId?.[0]}
              />
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium">New Customer</p>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone (optional)</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for SMS review requests
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSearch}
                  className="mt-2"
                >
                  Or select existing customer
                </Button>
              </div>
            )}
          </div>

          {/* Service Type */}
          <div className="space-y-2">
            <Label>Service Type *</Label>
            {isLoadingData ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <ServiceTypeSelect
                value={serviceType}
                onChange={setServiceType}
                error={state?.fieldErrors?.serviceType?.[0]}
                enabledTypes={enabledServiceTypes}
              />
            )}
          </div>

          {/* Campaign — appears after service type is selected */}
          {serviceType && (
            <div className="space-y-2">
              <Label>Campaign</Label>
              <CampaignSelector
                serviceType={serviceType as ServiceType}
                selectedCampaignId={campaignChoice}
                onCampaignChange={setCampaignChoice}
                showOneOff
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
              {ADD_JOB_STATUSES.map(s => (
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

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isCustomerValid || !serviceType}>
              {isPending && <CircleNotch className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
