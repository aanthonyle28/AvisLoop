'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuickSendTab } from './quick-send-tab'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'

interface SendPageClientProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  resendReadyContacts: Array<{
    id: string
    name: string
    email: string
    last_sent_at: string
    send_count: number
  }>
  needsAttention: {
    total: number
    pending: number
    failed: number
  }
  responseRate: {
    total: number
    responded: number
    rate: number
  }
  recentActivity: Array<{
    id: string
    contact_name: string
    contact_email: string
    subject: string
    status: string
    created_at: string
  }>
}

export function SendPageClient({
  contacts,
  business,
  templates,
  monthlyUsage,
  resendReadyContacts,
}: SendPageClientProps) {
  return (
    <Tabs defaultValue="quick-send" className="w-full">
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
          resendReadyContacts={resendReadyContacts}
        />
      </TabsContent>

      <TabsContent value="bulk-send">
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Bulk Send coming soon</p>
          <p className="text-sm">Plan 06 will build the bulk send interface</p>
        </div>
      </TabsContent>
    </Tabs>
  )
}
