import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { BusinessSettingsForm } from '@/components/business-settings-form'
import { MessageTemplateForm } from '@/components/templates/message-template-form'
import { TemplateList } from '@/components/template-list'
import { IntegrationsSection } from '@/components/settings/integrations-section'
import { ServiceTypesSection } from '@/components/settings/service-types-section'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { PersonalizationSection } from '@/components/settings/personalization-section'
import { getServiceTypeSettings } from '@/lib/data/business'
import { getAvailableTemplates } from '@/lib/data/message-template'
import { getPersonalizationSummary } from '@/lib/data/personalization'
import type { MessageTemplate } from '@/lib/types/database'

// Loading skeleton for settings content
function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4 animate-pulse">
        <div className="h-9 w-32 bg-muted rounded mb-1" />
        <div className="h-5 w-80 bg-muted rounded" />
      </div>
      <div className="p-6 space-y-8 animate-pulse">
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

  // Fetch business data directly
  // Use explicit FK hint (!inner) to resolve ambiguity from circular relationship
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      email_templates!email_templates_business_id_fkey (
        id,
        name,
        subject,
        body,
        is_default,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  // Get message templates, service types, and personalization stats in parallel
  const [templates, serviceTypeSettings, personalizationSummary] = await Promise.all([
    business ? getAvailableTemplates() : Promise.resolve([] as MessageTemplate[]),
    getServiceTypeSettings(),
    getPersonalizationSummary(),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your business profile and message templates
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Section 1: Business Profile */}
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
          <BusinessSettingsForm initialData={business} templates={templates} />
        </section>

        {/* Section 2: Message Templates */}
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Message Templates</h2>
          <p className="text-muted-foreground mb-4">
            Create templates for email and SMS review requests. Use variables like
            {' '}{'{{CUSTOMER_NAME}}'}, {'{{BUSINESS_NAME}}'}, {'{{REVIEW_LINK}}'}.
          </p>

          {/* Show existing templates */}
          <TemplateList templates={templates} />

          {/* Only show template form if business exists */}
          {business && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-medium mb-4">Create New Template</h3>
              <MessageTemplateForm />
            </div>
          )}

          {!business && (
            <p className="text-amber-600 dark:text-amber-500 text-sm mt-4">
              Save your business profile above before creating custom templates.
            </p>
          )}
        </section>

        {/* Section 3: Service Types */}
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Service Types</h2>
          <ServiceTypesSection
            initialEnabled={serviceTypeSettings?.serviceTypesEnabled || []}
            initialTiming={serviceTypeSettings?.serviceTypeTiming || {
              hvac: 24, plumbing: 48, electrical: 24, cleaning: 4,
              roofing: 72, painting: 48, handyman: 24, other: 24
            }}
          />
        </section>

        {/* Section 4: AI Personalization */}
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">AI Personalization</h2>
          <p className="text-muted-foreground mb-4">
            Messages are automatically personalized using AI before sending. View
            performance stats and LLM usage for your account.
          </p>
          <PersonalizationSection summary={personalizationSummary} />
        </section>

        {/* Section 5: Integrations */}
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Integrations</h2>
          <p className="text-muted-foreground mb-4">
            Connect external tools like Zapier or Make to automatically add contacts.
          </p>
          <IntegrationsSection hasExistingKey={!!business?.api_key_hash} />
        </section>

        {/* Section 6: Danger Zone */}
        <section className="border border-red-200 dark:border-red-800 rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Danger Zone</h2>
          <p className="text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountDialog />
        </section>
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
