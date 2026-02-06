"use client"

import { useEffect, useState, type ReactNode } from 'react'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useFirstVisitHint } from '@/lib/hooks/use-first-visit-hint'

interface FirstVisitHintProps {
  /** Unique identifier for this hint */
  hintId: string
  /** The element to attach the hint to */
  children: ReactNode
  /** Hint title */
  title: string
  /** Hint description */
  description: string
  /** Tooltip side positioning */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Delay before showing hint (ms) */
  showDelay?: number
}

/**
 * First Visit Hint - Shows a tooltip hint on first visit
 *
 * Wraps a target element and shows a tooltip on first visit.
 * After user dismisses, hint won't show again (tracked in localStorage).
 *
 * Usage:
 * ```tsx
 * <FirstVisitHint
 *   hintId="jobs-add-button"
 *   title="Add your first job here"
 *   description="Log completed jobs to start collecting reviews automatically."
 *   side="bottom"
 * >
 *   <Button>Add Job</Button>
 * </FirstVisitHint>
 * ```
 */
export function FirstVisitHint({
  hintId,
  children,
  title,
  description,
  side = 'bottom',
  showDelay = 500,
}: FirstVisitHintProps) {
  const { showHint, dismissHint } = useFirstVisitHint(hintId)
  const [isVisible, setIsVisible] = useState(false)

  // Delay showing hint to let page fully render
  useEffect(() => {
    if (!showHint) return

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, showDelay)

    return () => clearTimeout(timer)
  }, [showHint, showDelay])

  // If hint has been seen, just render children without tooltip
  if (!showHint) {
    return <>{children}</>
  }

  return (
    <TooltipProvider>
      <Tooltip open={isVisible} delayDuration={0}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs p-4 bg-card text-card-foreground border shadow-lg"
          sideOffset={8}
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 -mt-1 -mr-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                dismissHint()
                setIsVisible(false)
              }}
            >
              <X size={14} />
              <span className="sr-only">Dismiss hint</span>
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-3"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              dismissHint()
              setIsVisible(false)
            }}
          >
            Got it
          </Button>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
