'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetBody,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusDot } from '@/components/ui/status-dot'
import { format } from 'date-fns'
import { updateCustomer, type CustomerActionState } from '@/lib/actions/customer'
import type { Customer } from '@/lib/types/database'
import { CheckCircle, Warning, Question } from '@phosphor-icons/react'

interface EditCustomerSheetProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCustomerSheet({ customer, open, onOpenChange }: EditCustomerSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<CustomerActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await updateCustomer(prevState, formData)
      if (result.success) {
        onOpenChange(false)
      }
      return result
    },
    null
  )

  // Reset form when customer changes
  useEffect(() => {
    if (customer && formRef.current) {
      formRef.current.reset()
    }
  }, [customer])

  if (!customer) return null

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Edit Customer</SheetTitle>
          <SheetDescription>
            Update customer information and view activity history.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className='space-y-6'>
            {/* Edit Form */}
            <form ref={formRef} action={formAction} id='edit-customer-form' className='space-y-4'>
              <input type='hidden' name='customerId' value={customer.id} />

              <div className='grid gap-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  defaultValue={customer.name}
                  placeholder='John Doe'
                  required
                  disabled={isPending}
                />
                {state?.fieldErrors?.name && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.name[0]}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  defaultValue={customer.email}
                  placeholder='john@example.com'
                  required
                  disabled={isPending}
                />
                {state?.fieldErrors?.email && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.email[0]}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='phone'>Phone (optional)</Label>
                <Input
                  id='phone'
                  name='phone'
                  type='tel'
                  defaultValue={customer.phone || ''}
                  placeholder='+1 (555) 123-4567'
                  disabled={isPending}
                />
                {state?.fieldErrors?.phone && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.phone[0]}</p>
                )}
              </div>

              {state?.error && (
                <p className='text-sm text-error-text'>{state.error}</p>
              )}
            </form>

            {/* SMS Consent Status (Read-only) */}
            <div>
              <h3 className='font-medium mb-3'>SMS Consent</h3>
              {customer.sms_consent_status === 'opted_in' && (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm text-success'>
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
                <div className='flex items-center gap-2 text-sm text-destructive'>
                  <Warning className='h-4 w-4' />
                  <span>Opted out</span>
                </div>
              )}
              {customer.sms_consent_status === 'unknown' && (
                <div className='flex items-center gap-2 text-sm text-warning'>
                  <Question className='h-4 w-4' />
                  <span>SMS: Consent needed</span>
                </div>
              )}
              <p className='text-xs text-muted-foreground mt-2'>
                To update SMS consent, use the customer detail drawer.
              </p>
            </div>

            {/* Activity Summary */}
            <div>
              <h3 className='font-medium mb-4'>Activity</h3>
              <dl className='space-y-3 text-sm'>
                <div className='flex justify-between items-center'>
                  <dt className='text-muted-foreground'>Last sent</dt>
                  <dd className='font-medium'>
                    {customer.last_sent_at
                      ? format(new Date(customer.last_sent_at), 'MMM d, yyyy')
                      : 'Never'}
                  </dd>
                </div>
                <div className='flex justify-between items-center'>
                  <dt className='text-muted-foreground'>Total sent</dt>
                  <dd className='font-medium'>{customer.send_count || 0}</dd>
                </div>
                <div className='flex justify-between items-center'>
                  <dt className='text-muted-foreground'>Status</dt>
                  <dd>
                    <StatusDot
                      dotColor={customer.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}
                      label={customer.status === 'active' ? 'Active' : 'Archived'}
                    />
                  </dd>
                </div>
                <div className='flex justify-between items-center'>
                  <dt className='text-muted-foreground'>Added</dt>
                  <dd className='font-medium'>
                    {format(new Date(customer.created_at), 'MMM d, yyyy')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button type='submit' form='edit-customer-form' className='w-full' disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
