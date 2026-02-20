import { permanentRedirect } from 'next/navigation'

export const metadata = {
  title: 'Redirecting...',
}

export default function SendPage() {
  permanentRedirect('/campaigns')
}
