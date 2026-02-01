import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOnboardingStatus, getOnboardingCardStatus } from '@/lib/data/onboarding'
import { getBusiness } from '@/lib/actions/business'
import { getMonthlyUsage, getResponseRate, getNeedsAttentionCount, getRecentActivity } from '@/lib/data/send-logs'
import { getContacts } from '@/lib/actions/contact'
import { MonthlyUsageCard, NeedsAttentionCard, ReviewRateCard } from '@/components/dashboard/stat-cards'
import { RecentActivityTable } from '@/components/dashboard/recent-activity'
import { QuickSendTab } from '@/components/send/quick-send-tab'
import type { EmailTemplate } from '@/lib/types/database'

/**
 * Dashboard page - redesigned to match Figma reference.
 * Shows welcome header, stat cards, Quick Send + When to Send, and Recent Activity.
 */
export default async function DashboardPage() {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status
  const status = await getOnboardingStatus()

  // Redirect to onboarding if not complete
  if (status && !status.completed) {
    redirect('/onboarding')
  }

  // Fetch data in parallel
  const [business, usage, contactsData, responseRate, needsAttention, recentActivity, cardStatus] = await Promise.all([
    getBusiness(),
    getMonthlyUsage(),
    getContacts({ limit: 50 }),
    getResponseRate(),
    getNeedsAttentionCount(),
    getRecentActivity(5),
    getOnboardingCardStatus(),
  ])

  // Get templates for Quick Send
  const templates: EmailTemplate[] = business?.email_templates || []

  // Extract first name from business name or email
  const firstName = business?.name?.split(' ')[0] || user.email?.split('@')[0] || 'there'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">Welcome, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your review requests today.
        </p>
      </div>

      {/* 2. Stat Cards Row (hidden until user has sent at least one request) */}
      {cardStatus.test_sent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MonthlyUsageCard count={usage.count} limit={usage.limit} tier={usage.tier} />
          <NeedsAttentionCard total={needsAttention.total} pending={needsAttention.pending} failed={needsAttention.failed} />
          <ReviewRateCard rate={responseRate.rate} total={responseRate.total} responded={responseRate.responded} />
        </div>
      )}

      {/* 3. Quick Send (always visible) */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">Quick Send</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send a review request to a single contact
        </p>
        <QuickSendTab
          contacts={contactsData.contacts.filter(c => c.status === 'active')}
          business={business}
          templates={templates}
          monthlyUsage={usage}
          hasReviewLink={!!business?.google_review_link}
        />
      </div>

      {/* 4. Recent Activity Table */}
      <RecentActivityTable activities={recentActivity} />
    </div>
  )
}
