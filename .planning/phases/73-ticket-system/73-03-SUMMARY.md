---
phase: 73-ticket-system
plan: 03
subsystem: ui
tags: [supabase-storage, react-dropzone, signed-urls, file-upload, cross-client-view, next-js]

requires:
  - phase: 73-ticket-system-01
    provides: ProjectTicket, TicketWithContext types; REVISION_LIMITS constants
  - phase: 73-ticket-system-02
    provides: getTicketsAcrossAllProjects data function; lib/actions/ticket.ts server actions
  - phase: 71-web-design-foundation
    provides: web_projects table and WebProject type
  - phase: 72-web-design-crm
    provides: /clients page and client_type discriminator on businesses

provides:
  - AttachmentUploader component: react-dropzone upload to Supabase Storage via signed URLs
  - POST /api/tickets/upload-url: generates signed upload + read URLs, validates auth + ownership + MIME type
  - AllTicketsClient: cross-client ticket table with status + business filters and summary stat chips
  - /clients/tickets Server Component page with skeleton loader

affects:
  - 74 (client portal) — AttachmentUploader pattern reusable; signed URL route can be shared
  - future phases adding ticket features

tech-stack:
  added: []
  patterns:
    - "Signed upload URL pattern: client fetches URL from server, PUTs file directly to Supabase Storage (bypasses Next.js 1MB body limit)"
    - "Cross-client view: server resolves businessIds from auth, passes to getTicketsAcrossAllProjects for RLS-safe scoped query"
    - "Ownership guard in API route: supabase auth-scoped client verifies user owns businessId before issuing storage URL"

key-files:
  created:
    - app/api/tickets/upload-url/route.ts
    - components/tickets/attachment-uploader.tsx
    - components/tickets/all-tickets-client.tsx
    - app/(dashboard)/clients/tickets/page.tsx
    - app/(dashboard)/clients/tickets/loading.tsx
  modified: []

key-decisions:
  - "Signed upload URLs instead of multipart POST through Next.js: preserves ability to upload files up to 10MB without hitting Next.js default 1MB body limit"
  - "Pre-generate 1-year signed read URL at upload time: stores stable URL in attachment_urls column rather than storage path that requires re-signing on each view"
  - "AllTicketsClient does client-side filtering of pre-loaded tickets: avoids server round-trips for filter changes, acceptable for <=200 ticket limit set in getTicketsAcrossAllProjects"
  - "Row click navigates to /clients/[project_id]/tickets instead of opening an inline drawer: keeps the all-tickets page as a navigation surface, avoids complexity of fetching messages inline"

patterns-established:
  - "Storage upload pattern: POST /api/tickets/upload-url (server, tiny payload) → PUT signedUploadUrl (browser, full file)"
  - "businessId ownership guard in API routes: auth-scoped supabase.from('businesses').eq('user_id', user.id) before issuing privileged storage operations"

duration: 18min
completed: 2026-03-19
---

# Phase 73 Plan 03: Ticket System — Attachments and All-Tickets View Summary

**Supabase Storage signed-URL upload flow (bypasses Next.js body limit) and cross-client all-tickets operator view with dual-filter table**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-19T05:49:00Z
- **Completed:** 2026-03-19T06:07:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Built `POST /api/tickets/upload-url` route: authenticates operator, verifies business ownership, validates MIME type server-side, generates signed upload URL (60s expiry) and pre-generates 1-year signed read URL via service-role client
- Built `AttachmentUploader` using react-dropzone v14: drag-and-drop zone with MIME type + 10MB size enforcement, parallel uploads with progress indicator, removable file list — files go directly to Supabase Storage via PUT to signed URL
- Built `AllTicketsClient`: two Radix Select filters (status + business), summary stat chips (total/open/completed), sortable table with overage badges, row click navigates to per-project ticket page
- Built `/clients/tickets` Server Component: resolves web design business IDs from authenticated user, calls `getTicketsAcrossAllProjects`, passes data to `AllTicketsClient` — businessIds resolved server-side so no client-side forgery possible

## Task Commits

Tasks committed as one atomic commit:

1. **Task 1: Signed upload URL API + AttachmentUploader** - `22f3591` (feat)
2. **Task 2: All-tickets cross-client view** - `22f3591` (feat, combined)

## Files Created/Modified

- `app/api/tickets/upload-url/route.ts` — POST handler: auth, ownership guard, MIME validation, signed URL generation via service-role client
- `components/tickets/attachment-uploader.tsx` — react-dropzone component with signed URL upload flow, progress indicator, file list with removal
- `components/tickets/all-tickets-client.tsx` — cross-client ticket table with status + business dual-filter, summary chips, overage badges, navigation
- `app/(dashboard)/clients/tickets/page.tsx` — Server Component: resolves web design businessIds, fetches all tickets, renders AllTicketsClient
- `app/(dashboard)/clients/tickets/loading.tsx` — skeleton loader using TableSkeleton (7 columns, 5 rows)

## Decisions Made

- **Signed URL pattern over direct Next.js upload**: Next.js Route Handlers have a 1MB default body limit. Signed upload URLs route the file directly from browser to Supabase Storage. Server only handles the URL issuance (tiny payload).
- **Pre-generate read URL at upload time**: Rather than storing the storage path and re-signing on each view, we generate a 1-year signed read URL immediately after the signed upload URL. This URL is stored in `ticket_messages.attachment_urls` and is stable across page refreshes without additional server calls.
- **Client-side filtering on pre-loaded data**: `getTicketsAcrossAllProjects` is capped at 200 results. For that volume, client-side filter state changes are instant and avoid server round-trips.
- **Row click navigates to `/clients/[project_id]/tickets`**: The all-tickets page is a navigation surface, not a drawer host. This keeps components simpler and avoids fetching the full message thread outside of the per-project context where it belongs.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as specified.

## Issues Encountered

Pre-existing lint errors in `e2e/tests/12-ai-cron-send.spec.ts` (2 errors) and `e2e/tests/ai-brand-voice-test.ts` (4 errors: unused var + 3 explicit any). These were present in the baseline before this plan and are not caused by these changes. Confirmed by `git stash` verification.

## User Setup Required

**Supabase Storage bucket must be created manually before file uploads work in production:**

1. Open Supabase Dashboard > Storage > New bucket
2. Bucket name: `revision-attachments`
3. Public bucket: NO (private)
4. File size limit: 10485760 bytes (10MB)
5. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf

This step cannot be automated via CLI in the current local dev setup. The route handler and component will fail gracefully (500 from route, toast error in uploader) until the bucket exists.

## Next Phase Readiness

- AttachmentUploader is ready to import into `new-ticket-form.tsx` and `ticket-detail-drawer.tsx` (Plan 73-02 components) — integration wiring is the next step
- `/clients/tickets` all-tickets view is live and protected by `/clients` prefix in APP_ROUTES
- Signed URL route is ready for Phase 74 (client portal) to reuse if portal also needs file attachments
- No blockers

---
*Phase: 73-ticket-system*
*Completed: 2026-03-19*
