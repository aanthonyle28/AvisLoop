'use client'

import { Star } from 'lucide-react'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { getRatingLabel } from '@/lib/review/routing'

interface SatisfactionRatingProps {
  value: number
  onChange: (rating: number) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

const COLORS = {
  empty: 'text-muted-foreground/30',
  filled: 'text-yellow-400',
  hover: 'text-yellow-300',
}

/**
 * Accessible star rating component for satisfaction surveys.
 * Supports mouse click, hover preview, and keyboard navigation.
 *
 * Accessibility:
 * - Uses radiogroup role with individual radio items
 * - Arrow keys navigate between ratings
 * - Screen reader announces "N star(s)" for each option
 * - aria-checked indicates current selection
 */
export function SatisfactionRating({
  value,
  onChange,
  disabled = false,
  size = 'lg',
}: SatisfactionRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rating: number) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          if (rating < 5) onChange(rating + 1)
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          if (rating > 1) onChange(rating - 1)
          break
        case 'Home':
          e.preventDefault()
          onChange(1)
          break
        case 'End':
          e.preventDefault()
          onChange(5)
          break
      }
    },
    [disabled, onChange]
  )

  const displayRating = hoverRating || value

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="radiogroup"
        aria-label="Rate your satisfaction from 1 to 5 stars"
        className="flex gap-2"
      >
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = displayRating >= rating
          const isSelected = value === rating

          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${rating} star${rating !== 1 ? 's' : ''}, ${getRatingLabel(rating)}`}
              disabled={disabled}
              onClick={() => !disabled && onChange(rating)}
              onMouseEnter={() => !disabled && setHoverRating(rating)}
              onMouseLeave={() => setHoverRating(0)}
              onKeyDown={(e) => handleKeyDown(e, rating)}
              tabIndex={isSelected || (value === 0 && rating === 1) ? 0 : -1}
              className={cn(
                'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full p-1',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110',
                isSelected && 'scale-110'
              )}
            >
              <Star
                className={cn(
                  SIZES[size],
                  'transition-colors duration-150',
                  isFilled
                    ? hoverRating > 0
                      ? COLORS.hover
                      : COLORS.filled
                    : COLORS.empty
                )}
                fill={isFilled ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>

      {/* Rating label */}
      {displayRating > 0 && (
        <p
          className="text-sm text-muted-foreground animate-in fade-in duration-150"
          aria-live="polite"
        >
          {getRatingLabel(displayRating)}
        </p>
      )}
    </div>
  )
}
