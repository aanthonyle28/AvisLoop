import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const BUCKET = 'revision-attachments'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
])

/**
 * POST /api/tickets/upload-url
 *
 * Generates a signed Supabase Storage upload URL for the revision-attachments bucket.
 * The client browser uses this URL to PUT the file directly (bypasses Next.js 1MB body limit).
 *
 * PREREQUISITES:
 * - Supabase Storage bucket 'revision-attachments' must be created (private, 10MB limit).
 * - Create in Supabase Dashboard > Storage > New bucket:
 *   - Bucket name: revision-attachments
 *   - Public bucket: NO (private)
 *   - File size limit: 10485760 bytes (10MB)
 *   - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf
 *
 * Flow:
 * 1. Authenticate the operator (auth-scoped client)
 * 2. Validate filename, contentType, projectId, businessId
 * 3. Verify operator owns the businessId
 * 4. Construct storage path: {businessId}/{projectId}/{timestamp}/{safeFilename}
 * 5. Generate signed upload URL via service-role client (expires in 60s)
 * 6. Pre-generate signed read URL (1 year) for displaying the attachment
 * 7. Return signedUploadUrl, storagePath, readUrl
 *
 * Body: { filename: string, contentType: string, projectId: string, businessId: string }
 */
export async function POST(request: NextRequest) {
  // 1. Verify operator is authenticated
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { filename, contentType, projectId, businessId } = body as Record<
    string,
    string
  >

  if (!filename || !contentType || !projectId || !businessId) {
    return NextResponse.json(
      {
        error:
          'filename, contentType, projectId, and businessId are required',
      },
      { status: 400 }
    )
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json(
      {
        error:
          'File type not allowed. Use JPEG, PNG, GIF, WebP, or PDF.',
      },
      { status: 400 }
    )
  }

  // 3. Verify operator owns this business (ownership guard — defence in depth beyond RLS)
  const { data: ownerCheck } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('user_id', user.id)
    .single()

  if (!ownerCheck) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Build storage path — namespaced by businessId/projectId to prevent collisions
  const timestamp = Date.now()
  // Sanitize filename: strip path traversal characters, keep extension, cap at 100 chars
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const storagePath = `${businessId}/${projectId}/${timestamp}/${safeFilename}`

  // 5. Generate signed upload URL using service-role client
  // Service-role is needed to generate upload URLs for private buckets
  const serviceSupabase = createServiceRoleClient()
  const { data: signedData, error: signedError } = await serviceSupabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false })

  if (signedError || !signedData) {
    console.error('[upload-url] signed URL error:', signedError)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }

  // 6. Pre-generate a signed read URL (1 year expiry) for displaying the attachment
  // This URL goes into ticket_messages.attachment_urls
  const { data: readUrlData } = await serviceSupabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 365 * 24 * 60 * 60) // 1 year in seconds

  return NextResponse.json({
    signedUploadUrl: signedData.signedUrl,
    token: signedData.token,
    storagePath,
    readUrl: readUrlData?.signedUrl ?? null,
    maxSizeBytes: MAX_SIZE_BYTES,
  })
}
