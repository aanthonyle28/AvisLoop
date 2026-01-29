import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'
import { NextActionCard } from '@/components/dashboard/next-action-card'
import { getBusiness } from '@/lib/actions/business'
import { getMonthlyUsage, getResponseRate } from '@/lib/data/send-logs'
import { getContacts } from '@/lib/actions/contact'
import Link from 'next/link'
import { CheckCircle2, Users, Send } from 'lucide-react'
import { ResponseRateCard } from '@/components/dashboard/response-rate-card'

/**
 * Dashboard page - main hub for authenticated users.
 * Shows onboarding progress, next action, and quick stats.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>
}) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch data in parallel
  const [status, business, usage, contactsData, responseRate] = await Promise.all([
    getOnboardingStatus(),
    getBusiness(),
    getMonthlyUsage(),
    getContacts({ limit: 1 }), // Just need the count
    getResponseRate(),
  ])

  const params = await searchParams
  const showOnboardingComplete = params.onboarding === 'complete'

  // Business name for welcome message
  const businessName = business?.name

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Success banner after onboarding completion */}
      {showOnboardingComplete && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 dark:bg-green-950 dark:border-green-900">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Setup complete!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              You&apos;re all set to start collecting reviews.
            </p>
          </div>
        </div>
      )}

      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {businessName ? `Welcome, ${businessName}` : 'Welcome to AvisLoop'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {status?.completed
            ? 'Manage your review requests and track results.'
            : 'Complete your setup to start collecting reviews.'}
        </p>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Next action recommendation */}
          {status && <NextActionCard status={status} />}

          {/* Quick stats cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Sends this month */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Send className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">Sends This Month</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{usage.count}</span>
                <span className="text-muted-foreground">/ {usage.limit}</span>
              </div>
              <Link
                href="/history"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                View history
              </Link>
            </div>

            {/* Contacts */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-medium">Contacts</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{contactsData.total}</span>
                <span className="text-muted-foreground">total</span>
              </div>
              <Link
                href="/contacts"
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                Manage contacts
              </Link>
            </div>

            {/* Response Rate */}
            <ResponseRateCard {...responseRate} />
          </div>

          {/* No business prompt */}
          {!business && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Complete your setup
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                Create your business profile to start sending review requests.
              </p>
              <Link
                href="/onboarding?step=1"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Right column - sidebar */}
        <div className="space-y-6">
          {/* Onboarding checklist (auto-hides when complete) */}
          {status && <OnboardingChecklist status={status} />}

          {/* Usage summary for completed users */}
          {status?.completed && (
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <nav className="space-y-2">
                <Link
                  href="/send"
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium">Send Request</p>
                  <p className="text-sm text-muted-foreground">
                    Send a new review request
                  </p>
                </Link>
                <Link
                  href="/contacts"
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium">Contacts</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your contact list
                  </p>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium">Settings</p>
                  <p className="text-sm text-muted-foreground">
                    Business profile and templates
                  </p>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
