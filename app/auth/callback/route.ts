import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// Production app domain
const APP_DOMAIN = 'app.avisloop.com'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const hostname = request.headers.get('host') || ''

  // Determine redirect base URL
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')
  const redirectBase = isLocalhost ? origin : `https://${APP_DOMAIN}`

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error.message)
      return NextResponse.redirect(`${origin}/auth/error`)
    }

    // Successful OAuth authentication, redirect to app subdomain
    return NextResponse.redirect(`${redirectBase}${next}`)
  }

  // No code present, redirect to error page
  return NextResponse.redirect(`${origin}/auth/error`)
}
