---
phase: 50-code-review-audit
plan: "01"
subsystem: ui
tags: [audit, react, typescript, tanstack-table, phosphor-icons, accessibility, design-system, v2-alignment]

requires:
  - phase: 41-activity-page-overhaul
    provides: History page, HistoryTable, HistoryFilters, HistoryClient, RequestDetailDrawer, StatusBadge
  - phase: 42-dashboard-nav-polish
    provides: AttentionAlerts, ReadyToSendQueue, Sidebar with V2 nav order
  - phase: 43-cross-page-consistency
    provides: loading.tsx skeletons for all pages, empty-state components, page.tsx server components

provides:
  - Severity-rated findings for all 22 files in Phases 41-43 UI layer
  - Confirmed/revised RF-1 through RF-4 red flags with exact line numbers
  - Findings ready for 50-03 consolidated report and 50-02 server layer review

affects:
  - 50-03 (consolidation and fix prioritization)
  - future phase planning for History, Dashboard, Settings pages

tech-stack:
  added: []
  patterns:
    - "Audit plan: read all files first, then compile findings table with severity/file/line/recommendation"

key-files:
  created:
    - .planning/phases/50-code-review-audit/50-01-SUMMARY.md
  modified: []

key-decisions:
  - "RF-1 confirmed: SendLogWithContact is a @deprecated type alias used in history-client.tsx (line 15), history-table.tsx (line 22) and request-detail-drawer.tsx (line 23) — should migrate to SendLogWithCustomer"
  - "RF-2 confirmed: cancel handler in history-client.tsx (lines 235-238) is a stub; RequestDetailDrawer shows full Cancel UI (lines 256-272) but onCancel just closes drawer (lines 104-114) — misleading UX"
  - "RF-3 revised: dismissedIds useState is intentional ephemeral behavior — there IS a server-side acknowledgeAlert action, but dismissedIds is for temporary local hiding (not persistence); these are separate concerns"
  - "RF-4 revised: Ready-to-Send empty state with no history has border border-border bg-card (solid) — this matches the project decision from STATE.md; the dashed border was rejected"
  - "AttentionAlerts skeleton uses raw animate-pulse divs (not Skeleton component) — inconsistent with loading pattern standard"
  - "ReadyToSendQueue skeleton uses raw animate-pulse divs (not Skeleton component) — inconsistent with loading pattern standard"
  - "Settings loading.tsx deviates from container py-6 space-y-8 pattern — uses max-w-4xl mx-auto (intentional, matches settings page own layout)"
  - "Feedback loading.tsx deviates from container py-6 — uses container max-w-4xl py-6 (intentional, matches feedback page)"

patterns-established:
  - "Audit pattern: RF flags confirmed/revised first, then systematic per-file review"
  - "Inline skeleton pattern: AttentionAlerts and ReadyToSendQueue export *Skeleton components co-located in same file"

duration: 35min
completed: 2026-02-26
---

# Phase 50 Plan 01: UI Component Audit (Phases 41-43) Summary

**22 files reviewed across correctness, accessibility, design system, dead code, and V2 alignment — 18 findings totaling 5 High, 8 Medium, 5 Low severity issues; no Critical findings**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-02-26T03:21:44Z
- **Completed:** 2026-02-26T03:57:00Z
- **Tasks:** 2
- **Files reviewed:** 22

## Accomplishments

- Reviewed all 6 Phase 41 history files (history-columns, history-table, history-client, history-filters, request-detail-drawer, history/page)
- Reviewed all 3 Phase 42 files (attention-alerts, ready-to-send-queue, sidebar)
- Reviewed all 13 Phase 43 files (7 loading skeletons, 3 page.tsx server components, 5 empty-state components)
- Confirmed or revised all 4 red flags (RF-1 through RF-4) with exact line numbers
- All 18 findings recorded with severity, file, line number, description, and recommendation

## Task Commits

This plan produces only the SUMMARY artifact (no code changes). Both tasks committed together.

1. **Task 1: Phase 41-42 file review (9 files)** — findings captured below
2. **Task 2: Phase 43 file review (13 files) + SUMMARY compilation** — `50-01-SUMMARY.md` written

**Plan metadata:** (see git log)

---

## Findings Table

All findings from Phases 41, 42, and 43 UI component review.

Severity scale: **Critical** = data loss / security / crash; **High** = incorrect behavior, broken UX, confusing UI; **Medium** = code quality, maintainability, minor UX; **Low** = cleanup, style, nitpick.

| ID | Sev | Phase | File | Line(s) | Category | Description | Recommendation |
|----|-----|-------|------|---------|----------|-------------|----------------|
| F-01 | High | 41 | `components/history/history-client.tsx` | 15 | Dead Code | Imports `SendLogWithContact` which is `@deprecated`. Type alias resolves correctly at runtime, but signals the file hasn't been migrated and makes `@deprecated` warnings unavoidable. | Replace `SendLogWithContact` with `SendLogWithCustomer` in import and all type annotations (lines 15, 31, 63, 94). Mirror change in history-table.tsx and request-detail-drawer.tsx. |
| F-02 | High | 41 | `components/history/history-table.tsx` | 22, 25-28, 30, 33 | Dead Code | Same `@deprecated` alias issue — all prop types use `SendLogWithContact` instead of `SendLogWithCustomer`. | Migrate all 4 occurrences of `SendLogWithContact` → `SendLogWithCustomer`. |
| F-03 | High | 41 | `components/history/request-detail-drawer.tsx` | 23, 27-35 | Dead Code | Same `@deprecated` alias in drawer props and `mockCustomer` construction. | Migrate `SendLogWithContact` → `SendLogWithCustomer` in import (line 23) and props interface (line 27-35). |
| F-04 | High | 41 | `components/history/request-detail-drawer.tsx` | 60-63, 104-114, 256-272 | Correctness | **RF-2 confirmed.** `isOptedOut` is hardcoded `false` (line 61). `onCancel` prop fires `onCancel(request.id)` then closes drawer (lines 104-114) but the caller's stub implementation (history-client.tsx lines 235-238) only calls `setDrawerOpen(false)`. The "Cancel Message" section (lines 256-272) renders full destructive button UI but canceling a pending message does nothing server-side — silently fails. Users see a destructive `variant="destructive"` button that promises cancellation but does nothing. | Either: (a) remove the Cancel section until server-side cancellation is implemented, adding a TODO comment; or (b) show a disabled button with tooltip "Cancellation coming soon". Never show a destructive button that silently no-ops. For `isOptedOut`, fetch `opted_out` from the customer record or derive from `SendLogWithCustomer` if the field is available. |
| F-05 | Medium | 41 | `components/history/history-filters.tsx` | 191-204 | Accessibility | Date preset chips use raw `<button>` elements with no `aria-pressed` attribute. Screen readers cannot tell which preset is active (the `activePreset` state is visual-only via CSS classes). | Add `aria-pressed={activePreset === preset.label}` to each chip button. This communicates toggle state to assistive technology. |
| F-06 | Medium | 41 | `components/history/history-client.tsx` | 154 | Design System | Page section heading uses `text-2xl font-semibold tracking-tight` while the canonical heading pattern for page titles in this app is `text-3xl font-bold tracking-tight` (per layout-level pages like jobs, customers). The history page renders inside `<div className="container py-6 space-y-6">` (page.tsx line 47) which uses `space-y-6` not `space-y-8`. | Evaluate whether `text-2xl`/`space-y-6` is intentional or inconsistently applied. If the heading is a sub-section heading (not page H1), this is fine; if it's the page title, upgrade to `text-3xl font-bold`. Document the decision. (The `space-y-6` vs `space-y-8` discrepancy between history and other pages should also be standardized.) |
| F-07 | Medium | 41 | `components/history/request-detail-drawer.tsx` | 53-58 | Correctness | Cooldown calculation uses `request.created_at` (the send date) and compares to `COOLDOWN_DAYS` (14 days from constants). But the correct anchor for cooldown is `last_sent_at` on the customer, not `created_at` on the send log. A message sent 10 days ago that references a customer whose last message was 20 days ago would incorrectly show "on cooldown." | Extend `SendLogWithCustomer` to include `customers.last_sent_at`, or fetch customer data in the drawer. The comment on line 53 even says "We don't have last_sent_at on SendLogWithContact" — this is a known limitation that needs resolution. |
| F-08 | Low | 41 | `components/history/history-columns.tsx` | 12 | Dead Code | `RESENDABLE_STATUSES` is exported but only consumed internally within history-table.tsx. Review whether the export is intentional for external use, or if it can be unexported. | If no external consumer exists outside the history module, remove the `export` keyword. |
| F-09 | Low | 41 | `app/(dashboard)/history/page.tsx` | 47 | Design System | History page wrapper uses `space-y-6` while all other dashboard pages (customers, jobs) use `space-y-8`. Inconsistency in vertical rhythm. | Standardize to `space-y-8` to match the loading skeleton (`history/loading.tsx` uses `space-y-8`) and other pages. Currently the skeleton shows `space-y-8` spacing but the real page renders `space-y-6` — a layout shift on load. |
| F-10 | High | 42 | `components/dashboard/attention-alerts.tsx` | 253-276 | Design System | `AttentionAlertsSkeleton` uses raw `<div className="... bg-muted animate-pulse rounded" />` divs instead of the `<Skeleton>` component from `components/ui/skeleton`. This violates the project's loading pattern standard: "always use Skeleton component." | Replace raw `animate-pulse` divs with `<Skeleton>` component. Import `Skeleton` from `@/components/ui/skeleton`. |
| F-11 | Medium | 42 | `components/dashboard/attention-alerts.tsx` | 194, 200-202 | Correctness | **RF-3 revised.** `dismissedIds` is `useState` (ephemeral per navigation). The component has access to `acknowledgeAlert` server action (imported line 15) which persists alert acknowledgment. However, the `handleDismiss` callback (lines 200-202) only updates local state and does NOT call `acknowledgeAlert`. If a user dismisses an alert and navigates away, it reappears on return — surprising behavior. | For the dismiss X button (ephemeral, user just hiding noise), local state is acceptable. However, the behavior should be documented. Consider calling `acknowledgeAlert` when dismiss is clicked on `bounced_email` and `stop_request` alerts (same types that show Acknowledge in the overflow menu), so dismissal also persists server-side. This would remove the inconsistency where the overflow menu "Acknowledge" persists but the X button does not. |
| F-12 | Medium | 42 | `components/dashboard/ready-to-send-queue.tsx` | 839-873 | Design System | `ReadyToSendQueueSkeleton` uses raw `animate-pulse` divs instead of `<Skeleton>` component. Same violation as F-10. | Replace raw `animate-pulse` divs with `<Skeleton>` component imports. |
| F-13 | Low | 42 | `components/dashboard/ready-to-send-queue.tsx` | 483-489 | Design System | **RF-4 revised.** The "all caught up" empty state (jobs exist but none pending) renders without a border card container — just `flex flex-col items-center justify-center py-8 text-center`. The "no jobs yet" empty state correctly uses `border border-border bg-card`. The inconsistency between the two empty states within the same component is a minor visual inconsistency. | Either add `rounded-lg border border-border bg-card` to the "all caught up" state for visual consistency, or confirm that the borderless treatment is intentional to de-emphasize the empty state when the user has jobs (not a first-run scenario). Document the decision. |
| F-14 | Low | 42 | `components/layout/sidebar.tsx` | 1-9 | Design System | `ArrowsClockwise` is imported from phosphor (line 14) and used as the logo icon (line 121). This is semantically odd — a "refresh/sync" icon for a brand logo. The actual AvisLoop brand mark should ideally be a dedicated SVG, not a generic utility icon. | This is cosmetic only. Flag for design review: consider a custom SVG logo component. Not blocking. |
| F-15 | Medium | 43 | `app/(dashboard)/settings/loading.tsx` + `app/(dashboard)/settings/page.tsx` | loading: all; page: 19-39 | Design System | Settings loading skeleton is duplicated. `settings/loading.tsx` defines `SettingsLoadingSkeleton` and `settings/page.tsx` defines an identical `SettingsLoadingSkeleton` function internally. Two sources of truth — if one changes, the other won't. The internal one in page.tsx is used (Suspense fallback), making `loading.tsx` dead code in this flow. | Remove the inline `SettingsLoadingSkeleton` from `settings/page.tsx` and import from `settings/loading.tsx` instead (Next.js loading.tsx is automatically used by the framework for route-level loading). Alternatively, keep the explicit Suspense and delete `loading.tsx` since Suspense takes precedence. Pick one approach. |
| F-16 | Medium | 43 | `app/(dashboard)/customers/page.tsx` | 22-24 | Correctness | Inline type annotation `(t: { channel: string })` on the `sendTemplates` filter (line 22) indicates the full `MessageTemplate` type is not being used — suggesting `business.message_templates` may not be properly typed or the filter workaround was added to avoid a type error. | Check the type of `business.message_templates` (should be `MessageTemplate[]`). If it is typed correctly, remove the inline cast and write `(t) => t.channel === 'email'`. If the type is `any` or broader, fix the `getBusiness` return type to include typed templates. |
| F-17 | Low | 43 | `components/history/empty-state.tsx` | 43-44 | Dead Code | File exports `HistoryEmptyState` as both named export and under alias `EmptyState` for "backward compatibility" (line 43-44). The alias `EmptyState` creates confusion since the file is named `history/empty-state.tsx` and history-client.tsx already imports as `EmptyState` (history-client.tsx line 8). | Audit all imports of `EmptyState` from this file. If history-client.tsx is the only consumer, update its import to use `HistoryEmptyState` and remove the alias export. |
| F-18 | Medium | 43 | `components/feedback/feedback-list.tsx` | 3 | Dead Code | Imports `ChatCircle` from `@phosphor-icons/react/dist/ssr` — uses the SSR-specific subpath import rather than the standard `@phosphor-icons/react`. This file is a Server Component (no `'use client'` directive) so the SSR import is intentional, but it's an inconsistency with the rest of the codebase which uses `@phosphor-icons/react`. | Verify that `@phosphor-icons/react` (standard) does not work in Server Components. If it does, normalize to the standard import path. The SSR-specific subpath is an implementation detail that should only be used if required. |

---

## Red Flag Disposition (RF-1 through RF-4)

| Flag | Status | Verdict | Location |
|------|--------|---------|----------|
| RF-1: `SendLogWithContact` deprecated type alias | Confirmed | All 3 files use deprecated alias | history-client.tsx:15, history-table.tsx:22, request-detail-drawer.tsx:23 → F-01, F-02, F-03 |
| RF-2: Stub cancel handler shows full destructive UI | Confirmed (worse than flagged) | `isOptedOut` also hardcoded false; cancel button silently no-ops | request-detail-drawer.tsx:60-63, 104-114, 256-272 → F-04 |
| RF-3: `dismissedIds` ephemeral state | Revised | Ephemeral is OK for local dismiss; the real issue is inconsistency: X dismiss doesn't call acknowledgeAlert but overflow Acknowledge does | attention-alerts.tsx:194, 200-202 → F-11 |
| RF-4: Empty state border solid vs dashed | Revised | Solid border `border border-border bg-card` is correct per project decision; the inconsistency is between the two empty states within the same component (one has border, one does not) | ready-to-send-queue.tsx:483-503 → F-13 |

---

## Loading Skeleton Consistency Check (Phase 43)

| File | Wrapper | Skeleton Component | Raw animate-pulse | Notes |
|------|---------|-------------------|-------------------|-------|
| `analytics/loading.tsx` | `container py-6 space-y-8` | Yes (Skeleton) | No | Correct |
| `billing/loading.tsx` | `container max-w-4xl py-6 space-y-8` | Yes (Skeleton + CardSkeleton) | No | Correct; max-w-4xl intentional to match billing page |
| `customers/loading.tsx` | `container py-6 space-y-8` | Yes (Skeleton + TableSkeleton) | No | Correct |
| `feedback/loading.tsx` | `container max-w-4xl py-6 space-y-8` | Yes (Skeleton) | No | Correct; max-w-4xl intentional |
| `history/loading.tsx` | `container py-6 space-y-8` | Yes (Skeleton + TableSkeleton) | No | Correct; note real page uses space-y-6 → layout shift (F-09) |
| `jobs/loading.tsx` | `container py-6 space-y-8` | Yes (Skeleton + TableSkeleton) | No | Correct |
| `settings/loading.tsx` | `max-w-4xl mx-auto` | Yes (Skeleton) | No | Correct; no container/py-6 matches settings page own layout; duplicate content in page.tsx (F-15) |

All 7 loading skeletons use the `<Skeleton>` component. None use raw `animate-pulse` divs. Pattern is consistent across all 7 files.

Note: The `AttentionAlertsSkeleton` and `ReadyToSendQueueSkeleton` are co-located in their component files (not loading.tsx files) and DO use raw `animate-pulse` divs (F-10, F-12) — a separate finding.

---

## Empty State Pattern Check (Phase 43)

Canonical pattern: `rounded-full bg-muted p-6 mb-6` circle, `h-8 w-8` icon, `text-2xl font-semibold tracking-tight mb-2` title, `max-w-md` subtitle.

| Component | Circle | Icon Size | Title | Subtitle | V2 Aligned | Notes |
|-----------|--------|-----------|-------|----------|------------|-------|
| `customers/empty-state.tsx` (CustomersEmptyState) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | CTA is "Add Your First Job" — fully V2 |
| `customers/empty-state.tsx` (CustomersFilteredEmptyState) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | No CTA needed for filter empty state |
| `jobs/empty-state.tsx` (EmptyState filtered) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | |
| `jobs/empty-state.tsx` (EmptyState no-jobs) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | CTA "Add Job" — V2 aligned |
| `history/empty-state.tsx` (filtered) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | No CTA needed |
| `history/empty-state.tsx` (no history) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | CTA links to `/jobs` — V2 aligned; missing `mr-2` on icon |
| `feedback/feedback-list.tsx` (inline empty) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | No CTA — feedback empty state is passive |
| `analytics-service-breakdown.tsx` (inline empty) | `rounded-full bg-muted p-6 mb-6` ✓ | `h-8 w-8` ✓ | `text-2xl font-semibold tracking-tight mb-2` ✓ | `max-w-md` ✓ | Yes ✓ | CTA "Add your first job" — V2 aligned |

All 8 empty state instances match the canonical pattern exactly. No deviations from the design system.

Minor: `history/empty-state.tsx` line 35 renders the icon as `<Briefcase className="h-4 w-4" weight="regular" />` inside the button — this icon size is fine for inside a Button, distinct from the circle icon which is `h-8 w-8`.

---

## Server Component Check (Phase 43 page.tsx files)

| File | Pattern | Notes |
|------|---------|-------|
| `customers/page.tsx` | `async function`, `Promise.all` for parallel fetches, no inline Suspense | Correct |
| `jobs/page.tsx` | `async function`, `Promise.all` for parallel fetches, no inline Suspense | Correct; 4 data fetches in sequence |
| `settings/page.tsx` | Non-async, wraps `<SettingsContent>` (async) in `<Suspense>` | Intentional for streaming — acceptable; creates duplicate skeleton (F-15) |

---

## V2 Alignment Assessment

| Component | V2 Score | Notes |
|-----------|----------|-------|
| Sidebar | 6/6 ✓ | "Add Job" primary variant (orange accent), correct nav order: Dashboard → Jobs → Campaigns → Analytics → History → Feedback |
| ReadyToSendQueue | 5/6 | Jobs-centric, guides toward "Complete"; "Send One-Off" as secondary escape hatch is acceptable |
| AttentionAlerts | 6/6 ✓ | Alerts are about automation outcomes, not manual sending |
| History page | 5/6 | Shows messages sent, references campaigns; table header "Recipient" is customer-centric but acceptable in a send log context |
| History empty state | 6/6 ✓ | "Complete a job → enroll in campaign → messages appear here" messaging |
| Customers empty state | 6/6 ✓ | "Customers appear as you complete jobs" — fully V2 |
| Jobs empty state | 6/6 ✓ | Directs to "Add Job" as primary action |

No V2 violations found across the reviewed components.

---

## Decisions Made

- RF-3 revised: `dismissedIds` ephemeral state is intentional for local UI dismiss. The real gap is inconsistency between X button (ephemeral) and overflow Acknowledge button (server-persisted) for the same alert types.
- RF-4 revised: Solid border on the "no jobs yet" empty state is the correct implemented decision. The inconsistency is between the two empty states within the component (one has a card border, the other is borderless).
- Settings loading skeleton duplication: `settings/loading.tsx` vs inline in `settings/page.tsx` is a genuine duplication issue (F-15), not intentional.

## Deviations from Plan

None — this is a review-only plan. No code was changed.

## Issues Encountered

None — all 22 files were readable and complete.

## Next Phase Readiness

- All findings ready for 50-03 consolidation
- F-04 (stub cancel handler with destructive UI) is the highest-priority fix — misleading to users
- F-01/F-02/F-03 (deprecated type alias) are mechanical migration, low risk
- F-10/F-12 (raw animate-pulse in skeleton components) are quick fixes
- F-15 (settings skeleton duplication) requires a decision on approach before fixing
- No Critical findings — no data loss, security issues, or crashes identified in UI layer

---
*Phase: 50-code-review-audit*
*Completed: 2026-02-26*
