'use client'

import { SendForm } from './send-form'
import type { Contact, Business, EmailTemplate } from '@/lib/types/database'

interface QuickSendTabProps {
  contacts: Contact[]
  business: Business & { email_templates?: EmailTemplate[] }
  templates: EmailTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  resendReadyContacts: Array<{
    id: string
    name: string
    email: string
    last_sent_at: string
    send_count: number
  }>
}

export function QuickSendTab({
  contacts,
  business,
  templates,
  monthlyUsage,
  resendReadyContacts,
}: QuickSendTabProps) {
  const resendReadyContactIds = resendReadyContacts.map((c) => c.id)

  return (
    <div className="space-y-6">
      <SendForm
        contacts={contacts}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        contactCount={contacts.length}
        resendReadyContactIds={resendReadyContactIds}
      />
    </div>
  )
}
