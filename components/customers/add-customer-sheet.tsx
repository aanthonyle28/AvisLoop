'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
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
import { CheckCircle, Plus } from '@phosphor-icons/react'
import { createCustomer, type CustomerActionState } from '@/lib/actions/customer'
import { SmsConsentForm } from './sms-consent-form'

interface AddCustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCustomerSheet({ open, onOpenChange }: AddCustomerSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [addAnother, setAddAnother] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [timezone, setTimezone] = useState('America/New_York')
  const [smsConsent, setSmsConsent] = useState({
    consented: false,
    method: '',
    notes: '',
  })

  // Detect timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && tz.includes('/')) {
        setTimezone(tz)
      }
    } catch {
      // Use default
    }
  }, [])

  const [state, formAction, isPending] = useActionState<CustomerActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await createCustomer(prevState, formData)
      if (result.success) {
        if (addAnother) {
          // Clear form and show success message, keep sheet open
          formRef.current?.reset()
          setSuccessMessage('Customer added! Add another below.')
          setTimeout(() => setSuccessMessage(null), 3000)
          setAddAnother(false)
        } else {
          // Close sheet
          onOpenChange(false)
        }
      }
      return result
    },
    null
  )

  // Reset form when sheet opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      formRef.current?.reset()
      setSuccessMessage(null)
      setSmsConsent({ consented: false, method: '', notes: '' })
    }
    onOpenChange(isOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Add New Customer</SheetTitle>
          <SheetDescription>
            Add a new customer to your list. They will be available for review requests.
          </SheetDescription>
        </SheetHeader>

        <form ref={formRef} action={formAction} noValidate className='flex flex-col flex-1 min-h-0'>
          <SheetBody>
            <div className='space-y-4'>
              {/* Success Message */}
              {successMessage && (
                <div className='flex items-center gap-2 rounded-md bg-success-bg p-3 text-sm text-success-foreground'>
                  <CheckCircle size={16} />
                  {successMessage}
                </div>
              )}

              <div className='grid gap-2'>
                <Label htmlFor='add-name'>Name</Label>
                <Input
                  id='add-name'
                  name='name'
                  type='text'
                  placeholder='John Doe'
                  required
                  disabled={isPending}
                />
                {state?.fieldErrors?.name && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.name[0]}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='add-email'>Email</Label>
                <Input
                  id='add-email'
                  name='email'
                  type='email'
                  placeholder='john@example.com'
                  required
                  disabled={isPending}
                />
                {state?.fieldErrors?.email && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.email[0]}</p>
                )}
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='add-phone'>Phone (optional)</Label>
                <Input
                  id='add-phone'
                  name='phone'
                  type='tel'
                  placeholder='+1 (555) 123-4567'
                  disabled={isPending}
                />
                {state?.fieldErrors?.phone && (
                  <p className='text-sm text-error-text'>{state.fieldErrors.phone[0]}</p>
                )}
              </div>

              {/* SMS Consent Section */}
              <div className='pt-2'>
                <SmsConsentForm
                  mode='inline'
                  onConsentChange={(consented, method, notes) => {
                    setSmsConsent({ consented, method: method || '', notes: notes || '' })
                  }}
                />
              </div>

              {/* Hidden fields for timezone and consent data */}
              <input type='hidden' name='timezone' value={timezone} />
              <input type='hidden' name='smsConsented' value={smsConsent.consented ? 'true' : 'false'} />
              <input type='hidden' name='smsConsentMethod' value={smsConsent.method} />
              <input type='hidden' name='smsConsentNotes' value={smsConsent.notes} />

              {state?.error && (
                <p className='text-sm text-error-text'>{state.error}</p>
              )}
            </div>
          </SheetBody>

          <SheetFooter>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Customer'}
            </Button>
            <Button
              type='submit'
              variant='outline'
              className='w-full'
              disabled={isPending}
              onClick={() => setAddAnother(true)}
            >
              <Plus size={16} className='mr-2' />
              {isPending ? 'Adding...' : 'Save & Add Another'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
