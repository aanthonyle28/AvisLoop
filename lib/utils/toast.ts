import { toast } from 'sonner'

/**
 * Toast utility functions for consistent actionable toasts across the app.
 * These wrap sonner's toast() with standardized patterns.
 */

/**
 * Show a success toast for a sent review request with a "View details" action.
 * Auto-dismisses after 6 seconds.
 */
export function toastSendSuccess(contactName: string, onViewDetails: () => void) {
  toast.success(`Message sent to ${contactName}`, {
    duration: 6000,
    action: {
      label: 'View details',
      onClick: onViewDetails,
    },
  })
}

/**
 * Show a success toast for a scheduled review request.
 * Auto-dismisses after 6 seconds.
 */
export function toastScheduleSuccess(contactName: string, scheduledFor: string) {
  toast.success(`Message scheduled for ${contactName}`, {
    description: `Will send ${scheduledFor}`,
    duration: 6000,
  })
}

/**
 * Show an undo toast for destructive actions (delete, archive, etc).
 * Auto-dismisses after 6 seconds.
 */
export function toastWithUndo(
  message: string,
  onUndo: () => void,
  description?: string
) {
  toast.success(message, {
    description,
    duration: 6000,
    action: {
      label: 'Undo',
      onClick: onUndo,
    },
  })
}

/**
 * Show a standardized error toast.
 * Auto-dismisses after 6 seconds.
 */
export function toastError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 6000,
  })
}
