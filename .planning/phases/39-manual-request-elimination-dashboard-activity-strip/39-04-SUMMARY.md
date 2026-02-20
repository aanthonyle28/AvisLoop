---
phase: 39-manual-request-elimination-dashboard-activity-strip
plan: "04"
subsystem: ui
tags: [navigation, redirect, next.js, permanentRedirect, v2-alignment]

# Dependency graph
requires:
  - phase: 39-03
    provides: QuickSendModal + QuickSendForm extracted and wired to Campaigns page
  - phase: 39-02
    provides: Dashboard activity strip replacing pipeline KPI cards

provides:
  - /send permanently redirects to /campaigns (HTTP 308 via permanentRedirect)
  - Sidebar navigation without Manual Request item (7 items)
  - Bottom nav without Manual item (4 items, grid-cols-4)
  - Add Job form with one-off send toggle (shown when completed + campaign unchecked)
  - All /send references cleaned from actions, data, and UI components
  - 8 obsolete send page components deleted

affects:
  - any future nav changes (sidebar/bottom-nav patterns)
  - job completion flow (one-off flag in createJob server action)
  - history page empty state (now links to /jobs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "permanentRedirect() for removed routes: 308 not 307, keeps auth middleware protection"
    - "One-off toggle visibility: status=completed AND !enrollInCampaign gates the sendOneOff UI"

key-files:
  created:
    - app/(dashboard)/send/page.tsx (replaced with permanentRedirect to /campaigns)
  modified:
    - components/layout/sidebar.tsx (Manual Request item removed)
    - components/layout/bottom-nav.tsx (Manual item removed, grid-cols-5 → grid-cols-4)
    - components/jobs/add-job-sheet.tsx (sendOneOff state + toggle JSX + formData flag)
    - components/dashboard/ready-to-send-queue.tsx (/send?jobId → /campaigns)
    - components/history/empty-state.tsx (/send → /jobs, icon + label updated)
    - lib/data/dashboard.ts (retry href /send → /history)
    - lib/actions/contact.ts (revalidatePath /send → /campaigns)
    - lib/actions/customer.ts (revalidatePath /send → /campaigns)
    - lib/actions/schedule.ts (revalidatePath /send → /campaigns)
    - lib/actions/send.ts (revalidatePath /dashboard/send → /campaigns, x2)
    - lib/actions/send-sms.action.ts (revalidatePath /dashboard/send → /campaigns, x3)

key-decisions:
  - "permanentRedirect (308) not redirect (307) — /send is permanently gone, not conditionally redirected"
  - "Keep /send in middleware APP_ROUTES — redirect happens server-side after auth, no auth bypass"
  - "sendOneOff flag passed to createJob action as formData field — server action handles trigger (TODO for full implementation)"
  - "ReadyToSendQueue 'Send one-off' dropdown links to /campaigns, not QuickSendModal — modal is on campaigns page"
  - "History empty state guides to /jobs (V2 philosophy: complete jobs, not send manually)"
  - "AttentionAlert retry href updated to /history?retry — history page is where failed sends live"

patterns-established:
  - "Obsolete page deletion: replace page.tsx with permanentRedirect, delete loading.tsx, keep in middleware"
  - "Conditional toggle pattern: state gates visibility (status=completed + !enrollInCampaign), resets on sheet close"

# Metrics
duration: 5min
completed: 2026-02-20
---

# Phase 39 Plan 04: Manual Request Elimination — Navigation + Redirect + Cleanup Summary

**Removed /send from all navigation, added HTTP 308 permanentRedirect to /campaigns, added one-off send toggle to Add Job, cleaned 8+ stale /send references, and deleted 8 obsolete send page components**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-20T04:56:06Z
- **Completed:** 2026-02-20T05:01:14Z
- **Tasks:** 2
- **Files modified:** 13 modified, 8 deleted, 1 replaced

## Accomplishments

- /send removed from sidebar mainNav and bottom-nav; grid shrinks from 5 to 4 columns
- send/page.tsx replaced with permanentRedirect('/campaigns') — HTTP 308 response; send/loading.tsx deleted
- Add Job sheet shows "Send one-off review request instead" toggle when job is completed and campaign enrollment is unchecked
- All stale /send hrefs and revalidatePath calls (9 total) updated to /campaigns or /history
- 8 obsolete send page files deleted: send-page-client, bulk-send-tab, bulk-send-columns, bulk-send-action-bar, bulk-send-confirm-dialog, stat-strip, recent-activity-strip, quick-send-tab
- pnpm typecheck, pnpm lint, and pnpm build all pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove /send from navigation, replace page with permanent redirect** - `67e0324` (feat)
2. **Task 2: Add one-off toggle, fix /send refs, delete obsolete send components** - `09ec3a7` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `app/(dashboard)/send/page.tsx` — Replaced with permanentRedirect('/campaigns'); HTTP 308
- `app/(dashboard)/send/loading.tsx` — Deleted (no loading state needed for redirect)
- `components/layout/sidebar.tsx` — Removed PaperPlaneTilt import + Manual Request nav item
- `components/layout/bottom-nav.tsx` — Removed PaperPlaneTilt import + Manual item, grid-cols-5 → grid-cols-4
- `components/jobs/add-job-sheet.tsx` — Added sendOneOff state, reset on close, formData flag, toggle JSX
- `components/dashboard/ready-to-send-queue.tsx` — "Send one-off" dropdown link: /send?jobId → /campaigns
- `components/history/empty-state.tsx` — Button: /send → /jobs, PaperPlaneTilt → Briefcase, "Send Message" → "Add a Job"
- `lib/data/dashboard.ts` — AttentionAlerts retry href: /send?retry → /history?retry
- `lib/actions/contact.ts` — revalidatePath('/send') → revalidatePath('/campaigns')
- `lib/actions/customer.ts` — revalidatePath('/send') → revalidatePath('/campaigns')
- `lib/actions/schedule.ts` — revalidatePath('/send') → revalidatePath('/campaigns')
- `lib/actions/send.ts` — revalidatePath('/dashboard/send') → revalidatePath('/campaigns') (x2)
- `lib/actions/send-sms.action.ts` — revalidatePath('/dashboard/send') → revalidatePath('/campaigns') (x3)
- `components/send/send-page-client.tsx` — Deleted
- `components/send/bulk-send-tab.tsx` — Deleted
- `components/send/bulk-send-columns.tsx` — Deleted
- `components/send/bulk-send-action-bar.tsx` — Deleted
- `components/send/bulk-send-confirm-dialog.tsx` — Deleted
- `components/send/stat-strip.tsx` — Deleted
- `components/send/recent-activity-strip.tsx` — Deleted
- `components/send/quick-send-tab.tsx` — Deleted

## Decisions Made

- Used `permanentRedirect` (308) not `redirect` (307) — /send is gone permanently; browsers and crawlers will update cached links
- Kept `/send` in middleware APP_ROUTES — auth check still runs, redirect happens server-side after authentication
- `sendOneOff` toggle passes flag to `createJob` action via formData; full one-off send trigger is a TODO for a follow-up plan (scope boundary respected)
- `ReadyToSendQueue` "Send one-off" dropdown links to `/campaigns` where QuickSendModal lives — not a direct modal trigger
- History empty state directs to `/jobs` not `/campaigns` — V2 flow starts with completing jobs, not sending directly

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Typecheck, lint, and build all passed on first attempt. All file imports verified before deletion.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 39 is now fully complete (4/4 plans done)
- /send is eliminated from the product — navigation, page, and all references cleaned
- QuickSendForm/Modal (39-03) remains at /campaigns as the one-off send escape hatch
- Dashboard activity strip (39-02) is the new home for campaign event history
- Remaining components/send/ files (quick-send-form.tsx, quick-send-modal.tsx, channel-selector.tsx, message-preview.tsx, email-preview-modal.tsx, sms-character-counter.tsx, send-settings-bar.tsx) are kept — they power the QuickSendModal

---
*Phase: 39-manual-request-elimination-dashboard-activity-strip*
*Completed: 2026-02-20*
