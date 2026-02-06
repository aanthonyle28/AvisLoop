'use client'

import { useState, useEffect, useRef } from 'react'
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
import { Separator } from '@/components/ui/separator'
import {
  PaperPlaneRight,
  PencilSimple,
  Archive,
  ClockCounterClockwise,
  Warning,
  CheckCircle,
  Question,
  Copy,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { updateCustomerNotes } from '@/lib/actions/customer'
import { toast } from 'sonner'
import type { Customer } from '@/lib/types/database'
import { SmsConsentForm } from './sms-consent-form'

interface CustomerDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSend: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onArchive: (customerId: string) => void
  onViewHistory: (customerId: string) => void
}

export function CustomerDetailDrawer({
  open,
  onOpenChange,
  customer,
  onSend,
  onEdit,
  onArchive,
  onViewHistory,
}: CustomerDetailDrawerProps) {
  const [notes, setNotes] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesRef = useRef('')
  const initialNotesRef = useRef('')

  // Sync notes when customer changes
  useEffect(() => {
    if (customer) {
      const initial = customer.notes || ''
      setNotes(initial)
      notesRef.current = initial
      initialNotesRef.current = initial
    }
  }, [customer])

  // Keep notesRef in sync with current value
  notesRef.current = notes

  // Flush pending notes on drawer close
  useEffect(() => {
    if (!open && customer && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
      if (notesRef.current !== initialNotesRef.current) {
        updateCustomerNotes(customer.id, notesRef.current)
      }
    }
  }, [open, customer])

  // Handle notes change with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    // Set new timeout
    if (customer) {
      timeoutRef.current = setTimeout(() => {
        updateCustomerNotes(customer.id, value)
        initialNotesRef.current = value
      }, 500)
    }
  }

  if (!customer) return null

  // Get initials for avatar
  const initials = customer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Format consent method for display
  const formatConsentMethod = (method: string): string => {
    const map: Record<string, string> = {
      verbal_in_person: 'Verbal (in-person)',
      phone_call: 'Phone call',
      service_agreement: 'Service agreement',
      website_form: 'Website form',
      other: 'Other',
    }
    return map[method] || method
  }

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    // Simple formatting: +1 (555) 123-4567
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Customer Details</SheetTitle>
          <SheetDescription>
            View customer information, add notes, and take actions
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          {/* Contact Info */}
          <div>
            <div className='flex items-center gap-3 mb-3'>
              <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                <span className='text-sm font-medium text-primary'>{initials}</span>
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-medium truncate'>{customer.name}</p>
                <p className='text-sm text-muted-foreground truncate'>{customer.email}</p>
              </div>
            </div>
            {customer.phone && customer.phone_status === 'valid' && (
              <div className='flex items-center gap-2'>
                <span className='text-sm font-mono'>{formatPhoneDisplay(customer.phone)}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customer.phone!)
                    toast.success('Phone copied')
                  }}
                  className='p-1 hover:bg-muted rounded transition-colors'
                >
                  <Copy className='h-4 w-4 text-muted-foreground' />
                </button>
              </div>
            )}
          </div>

          <Separator />

          {/* Notes Field */}
          <div>
            <div className='space-y-2'>
              <Label htmlFor='customer-notes'>Notes</Label>
              <p className='text-xs text-muted-foreground'>
                Add private notes about this customer (auto-saved)
              </p>
              <Textarea
                id='customer-notes'
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder='Add notes about this customer...'
                className='min-h-[120px] resize-none'
              />
            </div>
          </div>

          <Separator />

          {/* SMS Consent Status */}
          <div>
            <h4 className='text-sm font-medium mb-3'>SMS Consent</h4>

            {customer.sms_consent_status === 'opted_in' && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Consented</span>
                  {customer.sms_consent_at && (
                    <span className='text-muted-foreground'>
                      ({new Date(customer.sms_consent_at).toLocaleDateString()})
                    </span>
                  )}
                </div>
                {customer.sms_consent_method && (
                  <div className='text-xs text-muted-foreground space-y-1'>
                    <p>Method: {formatConsentMethod(customer.sms_consent_method)}</p>
                    {customer.sms_consent_notes && <p>Notes: {customer.sms_consent_notes}</p>}
                  </div>
                )}
              </div>
            )}

            {customer.sms_consent_status === 'opted_out' && (
              <div className='flex items-center gap-2 text-sm text-red-600 dark:text-red-400'>
                <Warning className='h-4 w-4' />
                <span>Opted out</span>
              </div>
            )}

            {customer.sms_consent_status === 'unknown' && (
              <div className='space-y-3'>
                <div className='flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400'>
                  <Question className='h-4 w-4' />
                  <span>SMS: Consent needed</span>
                </div>
                <SmsConsentForm
                  customerId={customer.id}
                  mode='standalone'
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h3 className='text-sm font-medium mb-3'>Activity</h3>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Last sent:</span>
                <span className='font-medium'>
                  {customer.last_sent_at
                    ? format(new Date(customer.last_sent_at), 'MMM d, yyyy')
                    : 'Never'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Total sent:</span>
                <span className='font-medium'>{customer.send_count}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Status:</span>
                <span className='font-medium capitalize'>{customer.status}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className='space-y-2'>
            <Button
              onClick={() => onSend(customer)}
              className='w-full justify-start'
            >
              <PaperPlaneRight className='mr-2 h-4 w-4' />
              Send Request
            </Button>
            <Button
              onClick={() => onEdit(customer)}
              variant='outline'
              className='w-full justify-start'
            >
              <PencilSimple className='mr-2 h-4 w-4' />
              Edit Customer
            </Button>
            <Button
              onClick={() => onArchive(customer.id)}
              variant='outline'
              className='w-full justify-start'
            >
              <Archive className='mr-2 h-4 w-4' />
              Archive
            </Button>
            <Button
              onClick={() => onViewHistory(customer.id)}
              variant='ghost'
              className='w-full justify-start'
            >
              <ClockCounterClockwise className='mr-2 h-4 w-4' />
              View History
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
