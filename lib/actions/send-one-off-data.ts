'use server'

import { getBusiness } from '@/lib/data/business'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { getCustomers } from '@/lib/actions/customer'
import type { Business, Customer, MessageTemplate } from '@/lib/types/database'

export interface SendOneOffData {
  business: Business & { message_templates?: MessageTemplate[] }
  customers: Customer[]
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
}

/**
 * Lazy-load data needed for the Send One-Off modal.
 * Called on-demand when user clicks "Send One-Off" in the job table.
 */
export async function getSendOneOffData(): Promise<SendOneOffData | null> {
  const [business, templates, monthlyUsage, customerResult] = await Promise.all([
    getBusiness(),
    getAvailableTemplates('email'),
    getMonthlyUsage(),
    getCustomers({ limit: 200 }),
  ])

  if (!business) return null

  return {
    business: business as Business & { message_templates?: MessageTemplate[] },
    customers: customerResult.customers,
    templates: templates as MessageTemplate[],
    monthlyUsage,
    hasReviewLink: !!business.google_review_link,
  }
}
