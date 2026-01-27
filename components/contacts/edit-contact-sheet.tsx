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
import { updateContact, type ContactActionState } from '@/lib/actions/contact'
import type { Contact } from '@/lib/types/database'

interface EditContactSheetProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditContactSheet({ contact, open, onOpenChange }: EditContactSheetProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<ContactActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await updateContact(prevState, formData)
      if (result.success) {
        onOpenChange(false)
      }
      return result
    },
    null
  )

  // Reset form when contact changes
  useEffect(() => {
    if (contact && formRef.current) {
      formRef.current.reset()
    }
  }, [contact])

  if (!contact) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Contact</SheetTitle>
          <SheetDescription>
            Update contact information and view activity history.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Edit Form */}
          <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="contactId" value={contact.id} />

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={contact.name}
                placeholder="John Doe"
                required
                disabled={isPending}
              />
              {state?.fieldErrors?.name && (
                <p className="text-sm text-red-500">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contact.email}
                placeholder="john@example.com"
                required
                disabled={isPending}
              />
              {state?.fieldErrors?.email && (
                <p className="text-sm text-red-500">{state.fieldErrors.email[0]}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={contact.phone || ''}
                placeholder="+1 (555) 123-4567"
                disabled={isPending}
              />
              {state?.fieldErrors?.phone && (
                <p className="text-sm text-red-500">{state.fieldErrors.phone[0]}</p>
              )}
            </div>

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h3 className="font-medium mb-4">Activity</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Last sent</dt>
                <dd className="font-medium">
                  {contact.last_sent_at
                    ? format(new Date(contact.last_sent_at), 'MMM d, yyyy')
                    : 'Never'}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Total sent</dt>
                <dd className="font-medium">{contact.send_count || 0}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={contact.status === 'archived' ? 'secondary' : 'default'}>
                    {contact.status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-muted-foreground">Added</dt>
                <dd className="font-medium">
                  {format(new Date(contact.created_at), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
