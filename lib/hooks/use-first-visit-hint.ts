"use client"

import { useCallback } from 'react'
import { useLocalStorage } from './use-local-storage'

/**
 * Hook for tracking first-visit hints
 *
 * Stores seen state in localStorage so hints only show once per page.
 * Per-device is acceptable for hints (vs database for checklist).
 *
 * @param hintId - Unique identifier for the hint (e.g., 'jobs-add-button')
 * @returns { showHint, dismissHint, resetHint }
 */
export function useFirstVisitHint(hintId: string) {
  const storageKey = `hint-${hintId}-seen`
  const [hasSeen, setHasSeen] = useLocalStorage(storageKey, false)

  const dismissHint = useCallback(() => {
    setHasSeen(true)
  }, [setHasSeen])

  const resetHint = useCallback(() => {
    setHasSeen(false)
  }, [setHasSeen])

  return {
    /** Whether to show the hint (false if user has seen it) */
    showHint: !hasSeen,
    /** Call to mark hint as seen and hide it */
    dismissHint,
    /** Call to reset hint (for testing/debugging) */
    resetHint,
  }
}
