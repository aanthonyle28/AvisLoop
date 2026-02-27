import type { FeedbackWithCustomer } from '@/lib/types/feedback'
import { FeedbackCard } from './feedback-card'
// SSR subpath required for Server Components — standard import causes hydration mismatch
import { ChatCircle } from '@phosphor-icons/react/dist/ssr'

interface FeedbackListProps {
  feedback: FeedbackWithCustomer[]
  emptyMessage?: string
}

export function FeedbackList({ feedback, emptyMessage }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <ChatCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          No feedback yet
        </h2>
        <p className="text-muted-foreground max-w-md">
          {emptyMessage || 'When customers share feedback through your review funnel, it will appear here.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <FeedbackCard key={item.id} feedback={item} />
      ))}
    </div>
  )
}
