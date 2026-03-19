import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPortalRateLimit } from '@/lib/rate-limit'

const BUCKET = 'revision-attachments'
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
])

/**
 * POST /api/portal/upload-url
 *
 * Portal-specific upload URL generator. Validates via portal token (no auth required).
 * Body: { token, filename, contentType }
 */
export async function POST(request: NextRequest) {
  // C-1: Rate limit portal upload URL generation
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitResult = await checkPortalRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: Record<string, string>
  try {
    body = (await request.json()) as Record<string, string>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, filename, contentType } = body
  if (!token || !filename || !contentType) {
    return NextResponse.json({ error: 'token, filename, and contentType are required' }, { status: 400 })
  }

  // C-2: Validate token format (randomBytes(24) produces 32-char base64url)
  if (token.length < 32) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'File type not allowed. Use JPEG, PNG, GIF, WebP, or PDF.' }, { status: 400 })
  }

  // Resolve token to project via service-role
  const serviceSupabase = createServiceRoleClient()
  const { data: project } = await serviceSupabase
    .from('web_projects')
    .select('id, business_id')
    .eq('portal_token', token)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Invalid portal token' }, { status: 404 })
  }

  // Build storage path
  const timestamp = Date.now()
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const storagePath = `${project.business_id}/${project.id}/${timestamp}/${safeFilename}`

  // Generate signed upload URL
  const { data: signedData, error: signedError } = await serviceSupabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false })

  if (signedError || !signedData) {
    console.error('[portal/upload-url] signed URL error:', signedError)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }

  // Pre-generate read URL (1 year)
  const { data: readUrlData } = await serviceSupabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 365 * 24 * 60 * 60)

  return NextResponse.json({
    signedUploadUrl: signedData.signedUrl,
    storagePath,
    readUrl: readUrlData?.signedUrl ?? null,
  })
}
