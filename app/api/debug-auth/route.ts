import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Diagnostic endpoint — DELETE after debugging.
 * Shows the exact auth state: cookies present, getUser result, etc.
 *
 * Hit this in the browser after login to see what's happening:
 *   /api/debug-auth?key=avisloop-debug-2026
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('key') !== 'avisloop-debug-2026') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const hostname = request.headers.get('host') || ''
  const allRequestCookies = request.cookies.getAll()

  // Check auth cookies from the raw request
  const authCookies = allRequestCookies.filter(c =>
    c.name.startsWith('sb-') || c.name.includes('auth')
  )

  // Try reading via Next.js cookies() API
  const cookieStore = await cookies()
  const nextjsCookies = cookieStore.getAll().filter(c =>
    c.name.startsWith('sb-') || c.name.includes('auth')
  )

  // Try getUser via the app's createClient
  let getUserResult: { user: unknown; error: unknown } = { user: null, error: null }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    getUserResult = {
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        provider: data.user.app_metadata?.provider,
        providers: data.user.app_metadata?.providers,
        role: data.user.role,
      } : null,
      error: error ? { message: error.message, status: error.status } : null
    }
  } catch (e) {
    getUserResult = { user: null, error: String(e) }
  }

  // Try getSession to compare
  let getSessionResult: { session: unknown; error: unknown } = { session: null, error: null }
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    getSessionResult = {
      session: data.session ? {
        expires_at: data.session.expires_at,
        token_type: data.session.token_type,
        access_token_preview: data.session.access_token?.substring(0, 20) + '...',
        refresh_token_preview: data.session.refresh_token?.substring(0, 10) + '...',
      } : null,
      error: error ? { message: error.message } : null,
    }
  } catch (e) {
    getSessionResult = { session: null, error: String(e) }
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hostname,
    environment: process.env.NODE_ENV,
    cookieDomainSetting: process.env.NODE_ENV === 'production' ? '.avisloop.com' : undefined,
    requestCookies: {
      total: allRequestCookies.length,
      authCookies: authCookies.map(c => ({
        name: c.name,
        valueLength: c.value.length,
        valuePreview: c.value.substring(0, 30) + '...',
      })),
    },
    nextjsCookies: {
      total: nextjsCookies.length,
      names: nextjsCookies.map(c => c.name),
    },
    getUser: getUserResult,
    getSession: getSessionResult,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  }, { status: 200 })
}
