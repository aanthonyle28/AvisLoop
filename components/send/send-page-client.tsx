'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickSendTab } from './quick-send-tab'
import { BulkSendTab } from './bulk-send-tab'
import { RecentActivityStrip } from './recent-activity-strip'
import { StatStrip } from './stat-strip'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'
import type { RecentActivity } from './recent-activity-strip'

interface SendPageClientProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  recentActivity: RecentActivity[]
  resendReadyContactIds: string[]
  displayName: string
  showStats: boolean
  usage: { count: number; limit: number; tier: string }
  responseRate: { rate: number; total: number; responded: number }
  needsAttention: { total: number; pending: number; failed: number }
}

export function SendPageClient({
  contacts,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
  recentActivity,
  resendReadyContactIds,
  displayName,
  showStats,
  usage,
  responseRate,
  needsAttention,
}: SendPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'quick-send' | 'bulk-send'>('quick-send')

  const handleActivityClick = (id: string) => {
    // Navigate to history with request ID to open the drawer
    router.push(`/history?open=${id}`)
  }

  return (
    <Tabs
      defaultValue="quick-send"
      className="w-full"
      onValueChange={(value) => setActiveTab(value as 'quick-send' | 'bulk-send')}
    >
      {/* Header row: title left, tabs right */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome {displayName}!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your review requests today.
          </p>
        </div>
        <TabsList className="shrink-0">
          <TabsTrigger value="quick-send">Quick Send</TabsTrigger>
          <TabsTrigger value="bulk-send">Bulk Send</TabsTrigger>
        </TabsList>
      </div>

      {/* Stat strip - below header, hidden until user has sent at least one request */}
      {showStats && (
        <StatStrip
          usage={usage}
          responseRate={responseRate}
          needsAttention={needsAttention}
        />
      )}

      {/* Recent Activity Strip - tab-aware */}
      <RecentActivityStrip
        activities={recentActivity}
        mode={activeTab === 'quick-send' ? 'quick' : 'bulk'}
        onItemClick={handleActivityClick}
      />

      <TabsContent value="quick-send" className="mt-0">
        <QuickSendTab
          contacts={contacts}
          business={business}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
        />
      </TabsContent>

      <TabsContent value="bulk-send" className="mt-0">
        <BulkSendTab
          contacts={contacts}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
          resendReadyContactIds={resendReadyContactIds}
        />
      </TabsContent>
    </Tabs>
  )
}
