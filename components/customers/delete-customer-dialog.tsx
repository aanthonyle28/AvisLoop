'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerCount: number
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteCustomerDialog({
  open,
  onOpenChange,
  customerCount,
  onConfirm,
  isDeleting = false,
}: DeleteCustomerDialogProps) {
  const isBulk = customerCount > 1
  const title = isBulk
    ? `Delete ${customerCount} customers?`
    : 'Delete customer?'
  const description = isBulk
    ? `This will permanently delete ${customerCount} customers and all their associated data. This action cannot be undone.`
    : 'This will permanently delete this customer and all their associated data. This action cannot be undone.'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
