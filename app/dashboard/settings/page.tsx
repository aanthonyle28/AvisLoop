import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
// Data fetching is done inline in SettingsContent
import { BusinessSettingsForm } from '@/components/business-settings-form'
import { EmailTemplateForm } from '@/components/email-template-form'
import { TemplateList } from '@/components/template-list'

// Loading skeleton for settings content
function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
      <div>
        <div className="h-9 w-32 bg-gray-200 rounded mb-2" />
        <div className="h-5 w-80 bg-gray-200 rounded" />
      </div>
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
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
  const { data: business, error: businessError } = await supabase
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

  // Get templates
  let templates: any[] = []
  if (business) {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('business_id', business.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    templates = data || []
  }

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

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  )
}
