import { getBusiness } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { getMonthlyUsage } from '@/lib/data/send-logs'
import { SendForm } from '@/components/send/send-form'
import { redirect } from 'next/navigation'

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

  const [{ contacts }, usage] = await Promise.all([
    getContacts({ limit: 200 }),
    getMonthlyUsage(),
  ])

  // Filter to only sendable contacts (active, not opted out)
  const sendableContacts = contacts.filter(
    c => c.status === 'active' && !c.opted_out
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Send Review Request</h1>
        <div className="text-sm text-muted-foreground">
          {usage.count} / {usage.limit} sends this month
        </div>
      </div>

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
        />
      )}
    </div>
  )
}
