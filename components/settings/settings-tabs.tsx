'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BusinessSettingsForm } from '@/components/business-settings-form'
import { MessageTemplateForm } from '@/components/templates/message-template-form'
import { TemplateList } from '@/components/template-list'
import { ServiceTypesSection } from '@/components/settings/service-types-section'
import { PersonalizationSection } from '@/components/settings/personalization-section'
import { BrandVoiceSection } from '@/components/settings/brand-voice-section'
import { IntegrationsSection } from '@/components/settings/integrations-section'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { FormLinkSection } from '@/components/settings/form-link-section'
import { CustomersClient } from '@/components/customers/customers-client'
import type { Business, MessageTemplate, Customer } from '@/lib/types/database'
import type { PersonalizationSummary } from '@/lib/data/personalization'

interface SettingsTabsProps {
  business: Business | null
  templates: MessageTemplate[]
  serviceTypeSettings: {
    serviceTypesEnabled: string[]
    serviceTypeTiming: Record<string, number>
    customServiceNames: string[]
  } | null
  personalizationSummary: PersonalizationSummary
  hasApiKey: boolean
  customers?: Customer[]
  monthlyUsage?: { count: number; limit: number; tier: string }
  hasPasswordAuth?: boolean
  formToken?: string | null
}

export function SettingsTabs({
  business,
  templates,
  serviceTypeSettings,
  personalizationSummary,
  hasApiKey,
  customers,
  monthlyUsage,
  hasPasswordAuth = true,
  formToken,
}: SettingsTabsProps) {
  // Email-only templates for the customers QuickSendModal
  const emailTemplates = templates.filter((t) => t.channel === 'email')

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="templates">Templates</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="messaging">Messaging</TabsTrigger>
        <TabsTrigger value="integrations">Integrations</TabsTrigger>
        <TabsTrigger value="customers">Customers</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      {/* General — Business Profile + Job Completion Form */}
      <TabsContent value="general" className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Business Profile</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Basic info for {business?.name || 'your business'}. This applies to the currently selected client.
          </p>
          <BusinessSettingsForm initialData={business} templates={templates} />
        </div>

        {business && (
          <FormLinkSection
            formToken={formToken ?? null}
            businessName={business.name}
          />
        )}
      </TabsContent>

      {/* Templates — Message Templates */}
      <TabsContent value="templates" className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Message Templates</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Create templates for email and SMS review requests. Use variables like
            {' '}{'{{CUSTOMER_NAME}}'}, {'{{BUSINESS_NAME}}'}, {'{{REVIEW_LINK}}'}.
          </p>

          <TemplateList templates={templates} />

          {business && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-base font-medium mb-4">Create New Template</h3>
              <MessageTemplateForm />
            </div>
          )}

          {!business && (
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-4">
              Save your business profile first (in General tab) before creating custom templates.
            </p>
          )}
        </div>
      </TabsContent>

      {/* Services — Service Types */}
      <TabsContent value="services">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Service Types</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Configure which services this business offers and campaign timing for each.
          </p>
          <ServiceTypesSection
            initialEnabled={serviceTypeSettings?.serviceTypesEnabled || []}
            initialTiming={serviceTypeSettings?.serviceTypeTiming || {
              hvac: 24, plumbing: 48, electrical: 24, cleaning: 4,
              roofing: 72, painting: 48, handyman: 24, other: 24
            }}
            initialCooldownDays={business?.review_cooldown_days ?? 30}
            initialCustomServiceNames={serviceTypeSettings?.customServiceNames || []}
          />
        </div>
      </TabsContent>

      {/* Messaging — Brand Voice + AI Personalization */}
      <TabsContent value="messaging" className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <BrandVoiceSection currentValue={business?.brand_voice ?? null} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">AI Personalization</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Messages are automatically personalized using AI before sending.
          </p>
          <PersonalizationSection summary={personalizationSummary} />
        </div>
      </TabsContent>

      {/* Integrations — API key & webhook */}
      <TabsContent value="integrations">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-1">Integrations</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Connect external tools like Zapier or Make to automatically add customers.
          </p>
          <IntegrationsSection hasExistingKey={hasApiKey} />
        </div>
      </TabsContent>

      {/* Customers — Customer Management */}
      <TabsContent value="customers">
        {business && customers ? (
          <CustomersClient
            initialCustomers={customers}
            business={business as Business & { message_templates?: MessageTemplate[] }}
            templates={emailTemplates}
            monthlyUsage={monthlyUsage || { count: 0, limit: 0, tier: 'none' }}
            hasReviewLink={!!business.google_review_link}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-muted-foreground">
              Save your business profile first (in General tab) to manage customers.
            </p>
          </div>
        )}
      </TabsContent>

      {/* Account — Danger Zone */}
      <TabsContent value="account">
        <div className="rounded-xl border border-destructive/30 bg-card p-6">
          <h2 className="text-lg font-semibold mb-1 text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountDialog hasPasswordAuth={hasPasswordAuth} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
