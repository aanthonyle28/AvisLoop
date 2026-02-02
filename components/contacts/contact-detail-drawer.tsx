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
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { updateContactNotes } from '@/lib/actions/contact'
import type { Contact } from '@/lib/types/database'

interface ContactDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  onSend: (contact: Contact) => void
  onEdit: (contact: Contact) => void
  onArchive: (contactId: string) => void
  onViewHistory: (contactId: string) => void
}

export function ContactDetailDrawer({
  open,
  onOpenChange,
  contact,
  onSend,
  onEdit,
  onArchive,
  onViewHistory,
}: ContactDetailDrawerProps) {
  const [notes, setNotes] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesRef = useRef('')
  const initialNotesRef = useRef('')

  // Sync notes when contact changes
  useEffect(() => {
    if (contact) {
      const initial = contact.notes || ''
      setNotes(initial)
      notesRef.current = initial
      initialNotesRef.current = initial
    }
  }, [contact])

  // Keep notesRef in sync with current value
  notesRef.current = notes

  // Flush pending notes on drawer close
  useEffect(() => {
    if (!open && contact && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
      if (notesRef.current !== initialNotesRef.current) {
        updateContactNotes(contact.id, notesRef.current)
      }
    }
  }, [open, contact])

  // Handle notes change with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    // Set new timeout
    if (contact) {
      timeoutRef.current = setTimeout(() => {
        updateContactNotes(contact.id, value)
        initialNotesRef.current = value
      }, 500)
    }
  }

  if (!contact) return null

  // Get initials for avatar
  const initials = contact.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contact Details</SheetTitle>
          <SheetDescription>
            View contact information, add notes, and take actions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{contact.name}</p>
                <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                {contact.phone && (
                  <p className="text-sm text-muted-foreground truncate">{contact.phone}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes Field */}
          <div>
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <p className="text-xs text-muted-foreground">
                Add private notes about this contact (auto-saved)
              </p>
              <Textarea
                id="contact-notes"
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add notes about this contact..."
                className="min-h-[120px] resize-none"
              />
            </div>
          </div>

          <Separator />

          {/* Activity Summary */}
          <div>
            <h3 className="text-sm font-medium mb-3">Activity</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last sent:</span>
                <span className="font-medium">
                  {contact.last_sent_at
                    ? format(new Date(contact.last_sent_at), 'MMM d, yyyy')
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total sent:</span>
                <span className="font-medium">{contact.send_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{contact.status}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => onSend(contact)}
              className="w-full justify-start"
            >
              <PaperPlaneRight className="mr-2 h-4 w-4" />
              Send Request
            </Button>
            <Button
              onClick={() => onEdit(contact)}
              variant="outline"
              className="w-full justify-start"
            >
              <PencilSimple className="mr-2 h-4 w-4" />
              Edit Contact
            </Button>
            <Button
              onClick={() => onArchive(contact.id)}
              variant="outline"
              className="w-full justify-start"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button
              onClick={() => onViewHistory(contact.id)}
              variant="ghost"
              className="w-full justify-start"
            >
              <ClockCounterClockwise className="mr-2 h-4 w-4" />
              View History
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
