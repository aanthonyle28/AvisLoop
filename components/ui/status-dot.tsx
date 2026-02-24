import { cn } from '@/lib/utils'

interface StatusDotProps {
  dotColor: string
  label: string
  className?: string
}

export function StatusDot({ dotColor, label, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className={cn('h-2 w-2 rounded-full shrink-0', dotColor)} />
      {label}
    </span>
  )
}
