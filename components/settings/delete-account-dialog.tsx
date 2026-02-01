'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteAccount } from '@/lib/actions/auth'

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (!isDeleting) {
      setOpen(nextOpen)
      if (!nextOpen) {
        setConfirmText('')
        setError(null)
        setIsDeleting(false)
      }
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteAccount()
      if (result?.error) {
        setError(result.error)
        setIsDeleting(false)
      }
      // If no error, the server action redirects to /
    } catch {
      // NEXT_REDIRECT throws an error which is expected behavior
      // If it's a genuine error, we handle it here
      setError('An unexpected error occurred. Please try again.')
      setIsDeleting(false)
    }
  }

  const isConfirmed = confirmText === 'DELETE'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          Delete Account
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone. All your business
            data, contacts, templates, send history, and billing information
            will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="delete-confirm"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="border border-border bg-background text-foreground rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
            className="px-4 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
