'use client'

import { useActionState, useEffect, useRef } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { updateCustomer, type CustomerActionState } from '@/lib/actions/customer'
import type { Customer } from '@/lib/types/database'

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-[400px] sm:w-[540px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Edit Customer</SheetTitle>
          <SheetDescription>
            Update customer information and view activity history.
          </SheetDescription>
        </SheetHeader>

        <div className='mt-6 space-y-6'>
          {/* Edit Form */}
          <form ref={formRef} action={formAction} className='space-y-4'>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.name[0]}</p>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.email[0]}</p>
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
                <p className='text-sm text-red-500'>{state.fieldErrors.phone[0]}</p>
              )}
            </div>

            {state?.error && (
              <p className='text-sm text-red-500'>{state.error}</p>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>

          <Separator />

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
                  <Badge variant={customer.status === 'archived' ? 'secondary' : 'default'}>
                    {customer.status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
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
      </SheetContent>
    </Sheet>
  )
}
