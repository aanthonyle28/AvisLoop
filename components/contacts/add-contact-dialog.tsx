'use client'

import { useState, useActionState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'
import { createContact, type ContactActionState } from '@/lib/actions/contact'

interface AddContactDialogProps {
  trigger?: React.ReactNode
}

export function AddContactDialog({ trigger }: AddContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<ContactActionState | null, FormData>(
    async (prevState, formData) => {
      const result = await createContact(prevState, formData)
      if (result.success) {
        setOpen(false)
      }
      return result
    },
    null
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your list. They will be available for review requests.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
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
            {isPending ? 'Adding...' : 'Add Contact'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
