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
import { Checkbox } from '@/components/ui/checkbox'
import { CustomerAutocomplete } from './customer-autocomplete'
import { ServiceTypeSelect } from './service-type-select'
import { createJob, type JobActionState } from '@/lib/actions/job'
import { JOB_STATUSES, JOB_STATUS_LABELS, JOB_STATUS_DESCRIPTIONS } from '@/lib/validations/job'
import type { ServiceType, JobStatus } from '@/lib/types/database'

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
}

export function AddJobSheet({ open, onOpenChange, customers, enabledServiceTypes }: AddJobSheetProps) {
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
  const [enrollInCampaign, setEnrollInCampaign] = useState(true)
  const [sendOneOff, setSendOneOff] = useState(false)

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
      setEnrollInCampaign(true)
      setSendOneOff(false)
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

  const handleCreateNew = (name: string) => {
    setMode('create')
    setCustomerName(name)
    setSelectedCustomer(null)
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
    formData.set('status', status)
    formData.set('notes', notes)

    if (status === 'completed') {
      formData.set('enrollInCampaign', enrollInCampaign.toString())
      if (!enrollInCampaign && sendOneOff) {
        formData.set('sendOneOff', 'true')
      }
    }

    formAction(formData)
  }

  const isCustomerValid = selectedCustomer || (mode === 'create' && customerName && customerEmail)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Job</SheetTitle>
          <SheetDescription>
            Create a new job. {status === 'scheduled' ? 'Mark complete later when work is done.' : 'Completed jobs are enrolled in campaigns.'}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-6 space-y-4">
          {/* Customer Section - Autocomplete or Inline Create */}
          <div className="space-y-2">
            <Label>Customer *</Label>

            {mode === 'search' ? (
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
            <ServiceTypeSelect
              value={serviceType}
              onChange={setServiceType}
              error={state?.fieldErrors?.serviceType?.[0]}
              enabledTypes={enabledServiceTypes}
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
              {JOB_STATUS_DESCRIPTIONS[status]}
            </p>
          </div>

          {/* Campaign enrollment checkbox - only for completed status */}
          {status === 'completed' && (
            <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enrollInCampaign"
                  checked={enrollInCampaign}
                  onCheckedChange={(checked) => setEnrollInCampaign(!!checked)}
                />
                <Label htmlFor="enrollInCampaign" className="font-normal cursor-pointer">
                  Enroll in review campaign
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Automatically send review requests based on your active campaign
              </p>
            </div>
          )}

          {/* One-off send toggle - shown when completed and not enrolling in campaign */}
          {status === 'completed' && !enrollInCampaign && (
            <div className="space-y-2 rounded-lg border border-warning-border bg-warning-bg/30 p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendOneOff"
                  checked={sendOneOff}
                  onCheckedChange={(checked) => setSendOneOff(!!checked)}
                />
                <Label htmlFor="sendOneOff" className="font-normal cursor-pointer">
                  Send one-off review request instead
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Sends a single manual request. For recurring follow-up, use campaign enrollment above.
              </p>
            </div>
          )}

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
