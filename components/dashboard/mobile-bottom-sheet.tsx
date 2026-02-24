'use client'

import { useEffect, useRef } from 'react'
import { X } from '@phosphor-icons/react'

interface MobileBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}

/**
 * MobileBottomSheet — slides up from the bottom on mobile to show right panel content.
 *
 * Used on screens below lg breakpoint as a replacement for the desktop right panel.
 * Supports:
 * - Slide-up animation
 * - X close button
 * - Swipe-down dismiss gesture (deltaY > 100px)
 * - Overlay click to dismiss
 * - Body scroll lock when open
 */
export function MobileBottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: MobileBottomSheetProps) {
  const touchStartY = useRef<number | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Handle swipe-down to dismiss
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (deltaY > 100) {
      onOpenChange(false)
    }
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Don't render anything when closed (not just hidden)
  // We use a CSS transition approach: render but animate in/out
  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label={title ?? 'Details'}
      className={[
        'fixed inset-0 z-50 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      ].join(' ')}
    >
      {/* Backdrop */}
      <div
        className={[
          'absolute inset-0 bg-black/50 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={[
          'absolute bottom-0 left-0 right-0',
          'flex flex-col',
          'bg-card rounded-t-xl border-t border-border',
          'max-h-[85vh]',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground">
            {title ?? 'Details'}
          </span>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
