import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPublicRateLimit } from '@/lib/rate-limit'

const BUCKET = 'revision-attachments'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
])

/**
 * POST /api/intake/upload — Generate a signed upload URL for intake form file attachments.
 *
 * Public endpoint (no auth) — uses intake_token for authorization.
 * Files are stored under intake/{token}/{timestamp}/{filename} in Supabase Storage.
 *
 * Body: { token: string, filename: string, contentType: string }
 * Returns: { signedUploadUrl, storagePath, readUrl }
 */
export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
  const rateLimitResult = await checkPublicRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, filename, contentType } = body as Record<string, string>

  if (!token || !filename || !contentType) {
    return NextResponse.json({ error: 'token, filename, and contentType are required' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: 'File type not allowed. Use JPEG, PNG, GIF, WebP, SVG, or PDF.' },
      { status: 400 }
    )
  }

  // Validate intake token
  const supabase = createServiceRoleClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('intake_token', token)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  // Build storage path
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const storagePath = `intake/${token}/${timestamp}/${safeFilename}`

  // Generate signed upload URL
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false })

  if (signedError || !signedData) {
    console.error('[intake-upload] signed URL error:', signedError)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }

  // Pre-generate a read URL (1 year)
  const { data: readUrlData } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

  return NextResponse.json({
    signedUploadUrl: signedData.signedUrl,
    token: signedData.token,
    storagePath,
    readUrl: readUrlData?.signedUrl ?? null,
    maxSizeBytes: MAX_SIZE_BYTES,
  })
}
