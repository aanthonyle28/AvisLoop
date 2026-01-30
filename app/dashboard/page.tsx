import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOnboardingStatus, getOnboardingCardStatus, areAllCardsComplete } from '@/lib/data/onboarding'
import { getBusiness } from '@/lib/actions/business'
import { getMonthlyUsage, getResponseRate, getNeedsAttentionCount, getRecentActivity } from '@/lib/data/send-logs'
import { getContacts } from '@/lib/actions/contact'
import { MonthlyUsageCard, NeedsAttentionCard, ReviewRateCard } from '@/components/dashboard/stat-cards'
import { RecentActivityTable } from '@/components/dashboard/recent-activity'
import { QuickSend } from '@/components/dashboard/quick-send'
import { OnboardingCards } from '@/components/dashboard/onboarding-cards'
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

  // Get recent contacts (by created_at DESC) for Quick Send chips
  const recentContacts = contactsData.contacts
    .filter(c => c.status === 'active')
    .slice(0, 5)

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

      {/* 2. Onboarding Cards (if not all complete) */}
      {!areAllCardsComplete(cardStatus) && (
        <OnboardingCards status={cardStatus} />
      )}

      {/* 3. Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MonthlyUsageCard count={usage.count} limit={usage.limit} tier={usage.tier} />
        <NeedsAttentionCard total={needsAttention.total} pending={needsAttention.pending} failed={needsAttention.failed} />
        <ReviewRateCard rate={responseRate.rate} total={responseRate.total} responded={responseRate.responded} />
      </div>

      {/* 4. Quick Send + When to Send */}
      {contactsData.contacts.length > 0 && templates.length > 0 && (
        <QuickSend
          contacts={contactsData.contacts
            .filter(c => c.status === 'active')
            .map(c => ({ id: c.id, name: c.name, email: c.email }))}
          templates={templates.map((t) => ({ id: t.id, name: t.name, is_default: t.is_default }))}
          recentContacts={recentContacts.map(c => ({ id: c.id, name: c.name }))}
        />
      )}

      {/* 5. Recent Activity Table */}
      <RecentActivityTable activities={recentActivity} />
    </div>
  )
}
