'use client'

import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: string
  onRemove?: () => void
  onClick?: () => void
  selected?: boolean
  className?: string
}

const PRESET_TAGS = ['VIP', 'repeat', 'commercial', 'residential']

export function TagBadge({
  tag,
  onRemove,
  onClick,
  selected = false,
  className,
}: TagBadgeProps) {
  const isPreset = PRESET_TAGS.includes(tag)

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-muted text-muted-foreground',
        onClick && 'cursor-pointer hover:bg-muted/80',
        selected && 'bg-primary text-primary-foreground',
        className
      )}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:text-foreground"
          aria-label={`Remove ${tag} tag`}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  )
}

export function TagList({
  tags,
  onRemove,
  className,
}: {
  tags: string[]
  onRemove?: (tag: string) => void
  className?: string
}) {
  if (!tags || tags.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map((tag) => (
        <TagBadge
          key={tag}
          tag={tag}
          onRemove={onRemove ? () => onRemove(tag) : undefined}
        />
      ))}
    </div>
  )
}

export { PRESET_TAGS }
