import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getBusiness, getEmailTemplates } from '@/lib/actions/business'
import { BusinessSettingsForm } from '@/components/business-settings-form'
import { EmailTemplateForm } from '@/components/email-template-form'
import { TemplateList } from '@/components/template-list'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch existing business data (null if new user)
  const business = await getBusiness()
  const templates = await getEmailTemplates()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your business profile and email templates
        </p>
      </div>

      {/* Section 1: Business Profile */}
      <section className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
        <BusinessSettingsForm initialData={business} templates={templates} />
      </section>

      {/* Section 2: Email Templates */}
      <section className="border rounded-lg p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
        <p className="text-gray-600 mb-4">
          Customize your review request messages. Use variables like
          {' '}{'{{CUSTOMER_NAME}}'}, {'{{BUSINESS_NAME}}'}, {'{{REVIEW_LINK}}'}, {'{{SENDER_NAME}}'}.
        </p>

        {/* Show existing templates */}
        <TemplateList templates={templates} />

        {/* Only show template form if business exists */}
        {business && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium mb-4">Create New Template</h3>
            <EmailTemplateForm />
          </div>
        )}

        {!business && (
          <p className="text-amber-600 text-sm mt-4">
            Save your business profile above before creating custom templates.
          </p>
        )}
      </section>
    </div>
  )
}
