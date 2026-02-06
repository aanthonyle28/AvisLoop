import { cn } from '@/lib/utils'

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        // Positioning: absolute, off-screen by default
        "absolute left-0 top-0 z-[100]",
        "-translate-y-full",
        // Styling when visible (on :focus)
        "focus:translate-y-0",
        "bg-primary text-primary-foreground",
        "px-4 py-3 text-sm font-medium",
        // Ensure high contrast and visibility
        "focus:outline-none focus:ring-2 focus:ring-ring",
        // Transition
        "transition-transform duration-200"
      )}
    >
      Skip to main content
    </a>
  )
}
