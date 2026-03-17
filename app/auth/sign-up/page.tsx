import { redirect } from 'next/navigation'

// Signup disabled — agency-only model, no self-serve signups
export default function Page() {
  redirect('/auth/login')
}
