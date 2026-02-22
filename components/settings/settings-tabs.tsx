'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { BusinessSettingsForm } from '@/components/business-settings-form'
import { MessageTemplateForm } from '@/components/templates/message-template-form'
import { TemplateList } from '@/components/template-list'
import { ServiceTypesSection } from '@/components/settings/service-types-section'
import { PersonalizationSection } from '@/components/settings/personalization-section'
import { IntegrationsSection } from '@/components/settings/integrations-section'
import { DeleteAccountDialog } from '@/components/settings/delete-account-dialog'
import { CustomersClient } from '@/components/customers/customers-client'
import type { Business, MessageTemplate, Customer } from '@/lib/types/database'
import type { PersonalizationSummary } from '@/lib/data/personalization'

interface SettingsTabsProps {
  business: Business | null
  templates: MessageTemplate[]
  serviceTypeSettings: {
    serviceTypesEnabled: string[]
    serviceTypeTiming: Record<string, number>
  } | null
  personalizationSummary: PersonalizationSummary
  hasApiKey: boolean
  customers?: Customer[]
  monthlyUsage?: { count: number; limit: number; tier: string }
}

export function SettingsTabs({
  business,
  templates,
  serviceTypeSettings,
  personalizationSummary,
  hasApiKey,
  customers,
  monthlyUsage,
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

      {/* General — Business Profile */}
      <TabsContent value="general">
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
          <BusinessSettingsForm initialData={business} templates={templates} />
        </section>
      </TabsContent>

      {/* Templates — Message Templates */}
      <TabsContent value="templates">
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Message Templates</h2>
          <p className="text-muted-foreground mb-4">
            Create templates for email and SMS review requests. Use variables like
            {' '}{'{{CUSTOMER_NAME}}'}, {'{{BUSINESS_NAME}}'}, {'{{REVIEW_LINK}}'}.
          </p>

          <TemplateList templates={templates} />

          {business && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-medium mb-4">Create New Template</h3>
              <MessageTemplateForm />
            </div>
          )}

          {!business && (
            <p className="text-warning text-sm mt-4">
              Save your business profile first (in General tab) before creating custom templates.
            </p>
          )}
        </section>
      </TabsContent>

      {/* Services — Service Types */}
      <TabsContent value="services">
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
      </TabsContent>

      {/* Messaging — AI Personalization */}
      <TabsContent value="messaging">
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">AI Personalization</h2>
          <p className="text-muted-foreground mb-4">
            Messages are automatically personalized using AI before sending. View
            performance stats and LLM usage for your account.
          </p>
          <PersonalizationSection summary={personalizationSummary} />
        </section>
      </TabsContent>

      {/* Integrations — API key & webhook */}
      <TabsContent value="integrations">
        <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Integrations</h2>
          <p className="text-muted-foreground mb-4">
            Connect external tools like Zapier or Make to automatically add customers.
          </p>
          <IntegrationsSection hasExistingKey={hasApiKey} />
        </section>
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
          <section className="border border-border rounded-lg p-6 bg-card shadow-sm">
            <p className="text-muted-foreground">
              Save your business profile first (in General tab) to manage customers.
            </p>
          </section>
        )}
      </TabsContent>

      {/* Account — Danger Zone */}
      <TabsContent value="account">
        <section className="border border-destructive/30 rounded-lg p-6 bg-card shadow-sm">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Danger Zone</h2>
          <p className="text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountDialog />
        </section>
      </TabsContent>
    </Tabs>
  )
}
