import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getFeedbackForBusiness, getFeedbackStats } from '@/lib/data/feedback'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { ChatCircle } from '@phosphor-icons/react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feedback',
}

export default async function FeedbackPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding')
  }

  // Fetch feedback and stats
  const [feedbackResult, stats] = await Promise.all([
    getFeedbackForBusiness(business.id, { resolved: undefined }, 1, 50),
    getFeedbackStats(business.id),
  ])

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ChatCircle size={24} weight="regular" />
          <h1 className="text-2xl font-bold">Customer Feedback</h1>
        </div>
        <p className="text-muted-foreground">
          Private feedback from customers collected through your review funnel.
        </p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Unresolved</p>
            <p className="text-2xl font-semibold text-amber-600">{stats.unresolved}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-semibold text-green-600">{stats.total - stats.unresolved}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg Rating</p>
            <p className="text-2xl font-semibold">{stats.averageRating.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Feedback list */}
      <FeedbackList
        feedback={feedbackResult.data}
        emptyMessage="When customers share feedback through your review funnel, it will appear here."
      />
    </div>
  )
}
