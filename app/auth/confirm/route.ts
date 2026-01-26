import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'signup'
    | 'email'
    | 'recovery'
    | 'invite'
    | 'magiclink'
    | null

  // Construct redirect URLs
  const redirectTo = new URL('/dashboard', request.url)
  const errorRedirect = new URL('/login', request.url)

  if (!token_hash || !type) {
    errorRedirect.searchParams.set('error', 'Invalid confirmation link')
    return NextResponse.redirect(errorRedirect)
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  })

  if (error) {
    console.error('Email confirmation error:', error.message)
    errorRedirect.searchParams.set('error', error.message)
    return NextResponse.redirect(errorRedirect)
  }

  // For recovery (password reset), redirect to update password page
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/update-password', request.url))
  }

  // For signup/email confirmation, redirect to dashboard
  return NextResponse.redirect(redirectTo)
}
