import { getBusiness } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { getMonthlyUsage, getResendReadyContacts } from '@/lib/data/send-logs'
import { SendForm } from '@/components/send/send-form'
import { UsageWarningBanner } from '@/components/billing/usage-warning-banner'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SendPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/dashboard/settings')
  }

  if (!business.google_review_link) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Send Review Request</h1>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="font-semibold text-yellow-800 mb-2">Setup Required</h2>
          <p className="text-yellow-700 mb-4">
            Please add your Google review link in settings before sending review requests.
          </p>
          <a
            href="/dashboard/settings"
            className="text-sm font-medium text-yellow-800 underline hover:no-underline"
          >
            Go to Settings
          </a>
        </div>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ contacts }, usage, { count: contactCount }, resendReadyContacts] = await Promise.all([
    getContacts({ limit: 200 }),
    getMonthlyUsage(),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('status', 'active'),
    getResendReadyContacts(supabase, business.id),
  ])

  // Contact limits by tier (BILL-07)
  const CONTACT_LIMITS: Record<string, number | undefined> = {
    trial: undefined,
    basic: 200,
    pro: undefined,
  }
  const contactLimit = CONTACT_LIMITS[usage.tier]

  // Filter to only sendable contacts (active, not opted out)
  const sendableContacts = contacts.filter(
    c => c.status === 'active' && !c.opted_out
  )

  // Extract IDs from resend-ready contacts
  const resendReadyContactIds = resendReadyContacts.map(c => c.id)

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Send Review Request</h1>
        <Link
          href="/billing"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {usage.count} / {usage.limit} sends this month
        </Link>
      </div>

      <UsageWarningBanner
        count={usage.count}
        limit={usage.limit}
        tier={usage.tier}
        contactCount={contactCount ?? undefined}
        contactLimit={contactLimit}
      />

      {sendableContacts.length === 0 ? (
        <div className="rounded-lg border border-muted p-6 text-center">
          <p className="text-muted-foreground mb-4">
            No contacts available to send to. Add some contacts first!
          </p>
          <a
            href="/dashboard/contacts"
            className="text-sm font-medium text-primary underline hover:no-underline"
          >
            Go to Contacts
          </a>
        </div>
      ) : (
        <SendForm
          contacts={sendableContacts}
          business={business}
          templates={business.email_templates || []}
          monthlyUsage={usage}
          contactCount={contactCount ?? 0}
          contactLimit={contactLimit}
          resendReadyContactIds={resendReadyContactIds}
        />
      )}
    </div>
  )
}
