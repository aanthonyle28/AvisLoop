'use client'

import { useActionState, useRef, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Plus } from 'lucide-react'
import { createCustomer, type CustomerActionState } from '@/lib/actions/customer'

interface AddCustomerSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCustomerSheet({ open, onOpenChange }: AddCustomerSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [addAnother, setAddAnother] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [state, formAction, isPending] = useActionState<CustomerActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await createCustomer(prevState, formData)
      if (result.success) {
        if (addAnother) {
          // Clear form and show success message, keep sheet open
          formRef.current?.reset()
          setSuccessMessage('Contact added! Add another below.')
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
    }
    onOpenChange(isOpen)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side='right' className='w-[400px] sm:w-[540px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Add New Contact</SheetTitle>
          <SheetDescription>
            Add a new customer to your list. They will be available for review requests.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6'>
          {/* Success Message */}
          {successMessage && (
            <div className='mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300'>
              <CheckCircle className='h-4 w-4' />
              {successMessage}
            </div>
          )}

          {/* Add Customer Form */}
          <form ref={formRef} action={formAction} noValidate className='space-y-4'>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.name[0]}</p>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.email[0]}</p>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.phone[0]}</p>
              )}
            </div>

            {state?.error && (
              <p className='text-sm text-red-500'>{state.error}</p>
            )}

            {/* Action Buttons */}
            <div className='flex flex-col gap-2 pt-2'>
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
                <Plus className='mr-2 h-4 w-4' />
                {isPending ? 'Adding...' : 'Save & Add Another'}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
