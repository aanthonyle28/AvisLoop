import { redirect } from 'next/navigation'

/**
 * Dashboard page redirects to Send page (new home page).
 * Settings are still available at /dashboard/settings.
 */
export default function DashboardPage() {
  redirect('/send')
}
