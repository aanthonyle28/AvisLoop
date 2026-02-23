import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SettingsTabs } from '@/components/settings/settings-tabs'
import { getServiceTypeSettings } from '@/lib/data/business'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getPersonalizationSummary } from '@/lib/data/personalization'
import { hasApiKey } from '@/lib/actions/api-key'
import { getCustomers } from '@/lib/actions/customer'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import type { MessageTemplate } from '@/lib/types/database'

export const metadata = {
  title: 'Settings',
}

// Loading skeleton for settings content
function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4 animate-pulse">
        <div className="h-9 w-32 bg-muted rounded mb-1" />
        <div className="h-5 w-80 bg-muted rounded" />
      </div>
      <div className="p-6 space-y-8 animate-pulse">
        <div className="h-10 w-full bg-muted rounded-md" />
        <div className="border rounded-lg p-6 bg-card shadow-sm">
          <div className="h-6 w-40 bg-muted rounded mb-4" />
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Async component that fetches and renders settings content
async function SettingsContent() {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch business data
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get message templates, service types, personalization stats, API key status, and customers in parallel
  const [templates, serviceTypeSettings, personalizationSummary, hasKey, customersResult, monthlyUsage] = await Promise.all([
    business ? getAvailableTemplates() : Promise.resolve([] as MessageTemplate[]),
    getServiceTypeSettings(),
    getPersonalizationSummary(),
    hasApiKey(),
    getCustomers(),
    getMonthlyUsage(),
  ])

  // Check if user signed in with email/password (vs OAuth-only)
  const hasPasswordAuth = user.app_metadata?.providers?.includes('email') ||
    user.identities?.some((i) => i.provider === 'email') || false

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your business profile and message templates
        </p>
      </div>

      <div className="p-6">
        <SettingsTabs
          business={business}
          templates={templates}
          serviceTypeSettings={serviceTypeSettings}
          personalizationSummary={personalizationSummary}
          hasApiKey={hasKey}
          customers={customersResult.customers}
          monthlyUsage={monthlyUsage}
          hasPasswordAuth={hasPasswordAuth}
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
