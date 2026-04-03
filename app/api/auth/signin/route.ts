import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { signInSchema } from '@/lib/validations/auth'
import { checkAuthRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/signin — Email/password login via Route Handler.
 *
 * Server Actions don't reliably deliver Set-Cookie headers in all
 * Next.js versions. Route Handlers do (proven by Google OAuth callback).
 * This endpoint mirrors the /auth/callback pattern for email/password.
 */
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rateLimitResult = await checkAuthRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a moment and try again.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = signInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ success: true })
}
