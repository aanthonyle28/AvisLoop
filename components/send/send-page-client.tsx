'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickSendTab } from './quick-send-tab'
import { BulkSendTab } from './bulk-send-tab'
import { RecentActivityStrip } from './recent-activity-strip'
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
}

export function SendPageClient({
  contacts,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
  recentActivity,
  resendReadyContactIds,
}: SendPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'quick-send' | 'bulk-send'>('quick-send')

  const handleActivityClick = () => {
    // Plan 07 will add drawer - for now just navigate to history
    router.push('/history')
  }

  return (
    <div>
      {/* Recent Activity Strip - tab-aware */}
      <RecentActivityStrip
        activities={recentActivity}
        mode={activeTab === 'quick-send' ? 'quick' : 'bulk'}
        onItemClick={handleActivityClick}
      />

      <Tabs
        defaultValue="quick-send"
        className="w-full"
        onValueChange={(value) => setActiveTab(value as 'quick-send' | 'bulk-send')}
      >
        <TabsList>
          <TabsTrigger value="quick-send">Quick Send</TabsTrigger>
          <TabsTrigger value="bulk-send">Bulk Send</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-send">
          <QuickSendTab
            contacts={contacts}
            business={business}
            templates={templates}
            monthlyUsage={monthlyUsage}
            hasReviewLink={hasReviewLink}
          />
        </TabsContent>

        <TabsContent value="bulk-send">
          <BulkSendTab
            contacts={contacts}
            templates={templates}
            monthlyUsage={monthlyUsage}
            hasReviewLink={hasReviewLink}
            resendReadyContactIds={resendReadyContactIds}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
