import type { FeedbackWithCustomer } from '@/lib/types/feedback'
import { FeedbackCard } from './feedback-card'
import { ChatCircle } from '@phosphor-icons/react/dist/ssr'

interface FeedbackListProps {
  feedback: FeedbackWithCustomer[]
  emptyMessage?: string
}

export function FeedbackList({ feedback, emptyMessage }: FeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <ChatCircle size={48} weight="regular" className="mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">No feedback yet</h3>
        <p className="text-muted-foreground text-sm">
          {emptyMessage || 'Customer feedback from the review funnel will appear here.'}
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
