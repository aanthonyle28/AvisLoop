'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { WarningCircle } from '@phosphor-icons/react'

export default function HistoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('History page error:', error)
  }, [error])

  return (
    <div className="container py-6">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <WarningCircle size={48} weight="regular" className="text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t load your message history.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}
