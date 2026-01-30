import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScheduledSends } from '@/lib/actions/schedule'
import { ScheduledTable } from '@/components/scheduled/scheduled-table'
import { Calendar, Send } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Scheduled Sends | AvisLoop',
  description: 'Manage your scheduled review requests',
}

export default async function ScheduledPage() {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch scheduled sends
  const scheduledSends = await getScheduledSends()

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Sends</h1>
        <p className="text-muted-foreground mt-2">
          Manage your scheduled review requests
        </p>
      </div>

      {scheduledSends.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No scheduled sends</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Schedule review requests from the Send page to see them here. You can schedule sends for later and manage them in one place.
          </p>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Schedule a Send
          </Link>
        </div>
      ) : (
        <ScheduledTable sends={scheduledSends} />
      )}
    </div>
  )
}
