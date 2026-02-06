'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickSendTab } from './quick-send-tab'
import { BulkSendTab } from './bulk-send-tab'
import { RecentActivityStrip } from './recent-activity-strip'
import { StatStrip } from './stat-strip'
import { RequestDetailDrawer } from '@/components/history/request-detail-drawer'
import { sendReviewRequest } from '@/lib/actions/send'
import type { Customer, Business, MessageTemplate, SendLogWithCustomer } from '@/lib/types/database'
import type { RecentActivity } from './recent-activity-strip'

interface SendPageClientProps {
  customers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  recentActivity: RecentActivity[]
  recentActivityFull: SendLogWithCustomer[]
  resendReadyCustomerIds: string[]
  displayName: string
  showStats: boolean
  usage: { count: number; limit: number; tier: string }
  responseRate: { rate: number; total: number; responded: number }
  needsAttention: { total: number; pending: number; failed: number }
}

export function SendPageClient({
  customers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
  recentActivity,
  recentActivityFull,
  resendReadyCustomerIds,
  displayName,
  showStats,
  usage,
  responseRate,
  needsAttention,
}: SendPageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'quick-send' | 'bulk-send'>('quick-send')
  const [selectedRequest, setSelectedRequest] = useState<SendLogWithCustomer | null>(null)
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)

  const handleActivityClick = (id: string) => {
    const request = recentActivityFull.find(r => r.id === id)
    if (request) {
      setSelectedRequest(request)
      setRequestDrawerOpen(true)
    }
  }

  const handleResend = async (contactId: string, templateId: string | null) => {
    const formData = new FormData()
    formData.append('contactId', contactId)
    if (templateId) {
      formData.append('templateId', templateId)
    }

    const result = await sendReviewRequest(null, formData)

    if (result.success) {
      toast.success('Review request sent successfully!', {
        description: 'The recipient will receive your message shortly.',
        duration: 6000,
      })
      setRequestDrawerOpen(false)
      router.refresh()
    } else {
      toast.error('Failed to send', {
        description: result.error || 'An error occurred while sending the request.',
        duration: 5000,
      })
    }
  }

  const handleCancel = async () => {
    // For now, we'll show a toast - full cancel logic would need a server action
    toast.info('Cancel pending', {
      description: 'Cancellation for pending requests is not yet implemented.',
      duration: 5000,
    })
    router.refresh()
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
          customers={customers}
          business={business}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
        />
      </TabsContent>

      <TabsContent value="bulk-send" className="mt-0">
        <BulkSendTab
          customers={customers}
          templates={templates}
          monthlyUsage={monthlyUsage}
          hasReviewLink={hasReviewLink}
          resendReadyCustomerIds={resendReadyCustomerIds}
        />
      </TabsContent>

      {/* Request Detail Drawer */}
      <RequestDetailDrawer
        open={requestDrawerOpen}
        onOpenChange={(open) => {
          setRequestDrawerOpen(open)
          if (!open) setSelectedRequest(null)
        }}
        request={selectedRequest}
        business={business}
        templates={templates}
        onResend={handleResend}
        onCancel={handleCancel}
      />
    </Tabs>
  )
}
