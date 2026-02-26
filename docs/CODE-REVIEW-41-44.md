# Code Review: Phases 41-44 (v2.5.1 Bug Fixes & Polish)

**Review date:** 2026-02-26
**Reviewer:** Claude (automated code review across Plans 50-01, 50-02, 50-03)
**Scope:** 41 files across 4 phases (6,889 lines)
**Methodology:** File-by-file deep review (50-01, 50-02) + cross-cutting pattern audits (50-03)

---

## Executive Summary

The Phases 41-44 codebase is well-structured and follows established project conventions. Code quality is consistently high: all server actions are properly authenticated, RLS remains intact, no new security vulnerabilities were introduced, and V2 philosophy alignment is maintained throughout. The 27 total findings break down as 0 Critical, 5 High, 11 Medium, 10 Low, and 1 Info — with no data-loss or security-critical issues. The highest-priority concern is a stub "Cancel Message" destructive button in the request detail drawer that silently no-ops (F-04), and three files that use a deprecated type alias that must be migrated (F-01, F-02, F-03). Cross-cutting audits found no Lucide icon regressions, no new V2 philosophy violations, and clean empty state and loading skeleton patterns.

---

## Findings by Severity

### Critical

No critical findings. No security vulnerabilities, data loss risks, or production-breaking bugs identified across all 41 files.

---

### High

| ID | File | Line(s) | Description | Recommendation |
|----|------|---------|-------------|----------------|
| F-01 | `components/history/history-client.tsx` | 15, 31, 63, 94 | Imports and uses `SendLogWithContact` which is `@deprecated`. Type resolves correctly at runtime via alias in database.ts, but every usage emits a deprecation warning and signals the file has not been migrated. | Replace all 4 occurrences of `SendLogWithContact` with `SendLogWithCustomer`. |
| F-02 | `components/history/history-table.tsx` | 22, 25–28, 30, 33 | Same `@deprecated` alias — all prop types (`data`, `onRowClick`, `onResend`) use `SendLogWithContact` instead of `SendLogWithCustomer`. | Migrate all 4 occurrences to `SendLogWithCustomer`. |
| F-03 | `components/history/request-detail-drawer.tsx` | 23, 27–35 | Same `@deprecated` alias in drawer import and props interface (`request: SendLogWithContact | null`). The comments in lines 54 and 60 explicitly note the missing fields as limitations of `SendLogWithContact`. | Migrate import (line 23) and props interface (lines 27–35) to `SendLogWithCustomer`. |
| F-04 | `components/history/request-detail-drawer.tsx` | 60–63, 104–114, 256–272 | `isOptedOut` is hardcoded `false` (line 61). The "Cancel Message" section (lines 256–272) renders a full `variant="destructive"` button for pending messages, but the `onCancel` prop (called on line 108) only closes the drawer on the caller side — no server-side cancellation occurs. A destructive UI affordance that silently no-ops is misleading UX and erodes user trust. | Either: (a) remove the Cancel section with a `// TODO: implement server-side cancel` comment; or (b) show a disabled button with tooltip "Cancellation not yet available." Never present a destructive button that takes no action. For `isOptedOut`, extend the data fetch to include `opted_out` from the customer record. |
| F-10 | `components/dashboard/attention-alerts.tsx` | 253–276 | `AttentionAlertsSkeleton` uses raw `<div className="... bg-muted animate-pulse rounded" />` elements instead of the `<Skeleton>` component from `components/ui/skeleton`. Violates the project loading pattern standard ("always use Skeleton component"). | Replace raw animate-pulse divs with `<Skeleton className="..." />` imports. |

---

### Medium

| ID | File | Line(s) | Description | Recommendation |
|----|------|---------|-------------|----------------|
| F-05 | `components/history/history-filters.tsx` | 191–204 | Date preset chips (Today, Past Week, Past Month, Past 3 Months) use raw `<button>` with no `aria-pressed` attribute. Screen readers cannot determine which preset is active — the selected state is visual-only via CSS class changes. | Add `aria-pressed={activePreset === preset.label}` to each chip button. |
| F-06 | `components/history/history-client.tsx` | 154 | Page section heading uses `text-2xl font-semibold tracking-tight` while the canonical page title pattern is `text-3xl font-bold tracking-tight`. The page also uses `space-y-6` but its loading skeleton uses `space-y-8` (layout shift on load). | If this heading is the page H1, upgrade to `text-3xl font-bold tracking-tight`. Standardize to `space-y-8` to eliminate skeleton vs. page layout shift. |
| F-07 | `components/history/request-detail-drawer.tsx` | 53–58 | Cooldown calculation uses `request.created_at` (send date) to estimate cooldown. The correct anchor is `customers.last_sent_at`. The comment at line 53 explicitly acknowledges this: "We don't have `last_sent_at` on `SendLogWithContact`." | Extend `SendLogWithCustomer` to include `customers.last_sent_at`, or add a separate fetch in the drawer for the customer record. Resolves as part of F-03 migration. |
| F-11 | `components/dashboard/attention-alerts.tsx` | 194, 200–202 | `handleDismiss` only updates local `dismissedIds` useState — does NOT call `acknowledgeAlert`. The overflow menu's "Acknowledge" button DOES call `acknowledgeAlert`. The two dismiss surfaces behave inconsistently: X button = ephemeral (resets on navigation), overflow Acknowledge = server-persisted. Users who dismiss via X will see the alert reappear on return. | For `bounced_email` and `stop_request` alerts, call `acknowledgeAlert` in `handleDismiss` so the X button matches the persistence of the overflow menu Acknowledge. Document the intentional distinction if you want ephemeral-only. |
| F-12 | `components/dashboard/ready-to-send-queue.tsx` | 839–873 | `ReadyToSendQueueSkeleton` uses raw animate-pulse divs instead of `<Skeleton>` component. Same violation as F-10. | Replace with `<Skeleton>` component imports. |
| F-15 | `app/(dashboard)/settings/loading.tsx` + `app/(dashboard)/settings/page.tsx` | loading: all; page: 19–39 | `SettingsLoadingSkeleton` is defined in both files — two sources of truth. The one in `page.tsx` is used (as Suspense fallback). The `loading.tsx` version is dead code in the actual page flow because the Suspense boundary takes precedence. | Pick one approach: either (a) remove the inline skeleton from `page.tsx` and import from `loading.tsx` (let Next.js route-level loading handle it), or (b) delete `loading.tsx` since the Suspense pattern takes precedence. |
| F-16 | `app/(dashboard)/customers/page.tsx` | 22–24 | Inline type annotation `(t: { channel: string })` on the `sendTemplates` filter indicates `business.message_templates` is not properly typed — likely typed as `any` or an overly broad type, requiring the workaround cast. | Fix `getBusiness()` return type to include `message_templates: MessageTemplate[]`. Remove the inline cast. |
| F-18 | `components/feedback/feedback-list.tsx` | 3 | Imports from `@phosphor-icons/react/dist/ssr` — the SSR-specific subpath, which is inconsistent with the rest of the codebase that imports from `@phosphor-icons/react`. This file is a Server Component so the SSR import is defensible, but the inconsistency may confuse contributors. | Verify that `@phosphor-icons/react` (standard) works in Server Components. If it does, normalize to the standard import path. If the SSR subpath is required for Server Components, document this convention in a comment. |
| F-44-01 | `lib/actions/business.ts` | 261 | `updateServiceTypeSettings` uses `.eq('user_id', user.id)` directly on the `businesses` table without first fetching the business ID. All other server actions fetch business ID first then scope by `.eq('id', business.id)`. Functionally correct (RLS enforces ownership), but breaks the established defense-in-depth pattern. | Fetch business ID first (`.select('id').eq('user_id', user.id).single()`), then update by `.eq('id', business.id)` — matches the pattern in all other server actions. |
| F-CC-01 | Multiple pages (see below) | Various | Cross-page skeleton/content spacing mismatch: loading skeletons use `space-y-8` but the corresponding page content uses `space-y-6`. This causes a layout shift when the skeleton disappears and the real content renders. Affected: history/page.tsx, analytics/page.tsx, customers/page.tsx, jobs/page.tsx, billing/page.tsx, feedback/page.tsx. | Standardize all page content to `space-y-8` to match their loading skeletons, or change all loading skeletons to `space-y-6`. Recommended: standardize to `space-y-8` (matches canonical pattern). |

---

### Low

| ID | File | Line(s) | Description | Recommendation |
|----|------|---------|-------------|----------------|
| F-08 | `components/history/history-columns.tsx` | 12 | `RESENDABLE_STATUSES` is exported but the only consumer is `history-table.tsx` within the same module. No external consumers found in codebase-wide search. The `export` keyword is dead. | Remove `export` keyword. Keep constant module-private. |
| F-09 | `app/(dashboard)/history/page.tsx` | 47 | History page uses `space-y-6` while the loading skeleton uses `space-y-8`. Addressed more broadly in F-CC-01 but originated here. | Part of F-CC-01 fix — standardize to `space-y-8`. |
| F-13 | `components/dashboard/ready-to-send-queue.tsx` | 483–489 | "All caught up" empty state (jobs exist, none pending) renders without a card border: just `flex flex-col items-center justify-center py-8 text-center`. The "no jobs yet" empty state correctly uses `rounded-lg border border-border bg-card`. Inconsistency within the same component. | Either add `rounded-lg border border-border bg-card` to the "all caught up" state for visual consistency, or document that the borderless treatment is intentional (de-emphasizing when the user has jobs). |
| F-14 | `components/layout/sidebar.tsx` | 1–9 | `ArrowsClockwise` (refresh/sync icon) is used as the brand logo. Semantically odd — a utility icon is not an appropriate brand mark. | Flag for design review: consider a custom SVG logo. Not blocking. |
| F-17 | `components/history/empty-state.tsx` | 43–44 | Dual export: `HistoryEmptyState` (primary) and `EmptyState` (backward-compat alias). The alias perpetuates confusion since `history-client.tsx` imports as `EmptyState`. | Update `history-client.tsx` to import `HistoryEmptyState` directly, then remove the alias export at line 44. |
| F-44-02 | `lib/validations/onboarding.ts` | 58–60 | `softwareUsedSchema` accepts any string with no max length: `z.string().optional()`. Defense should be at the schema level, not only in the UI. | Add `.max(100)` to the schema: `z.string().max(100).optional()`. |
| F-44-03 | `components/onboarding/steps/crm-platform-step.tsx` | 31–39 | When `selected === null` (user continues without selecting), `valueToSave = ''` (empty string) is saved as `software_used = ''` instead of `null`. Empty string ≠ null semantically. | Normalize in the server action: `softwareUsed: valueToSave || null`. Or: disable Continue when nothing is selected. |
| F-44-04 | `lib/types/database.ts` | 42 | `Business.custom_service_names` typed as `string[]` (non-nullable). DB may return `null` for rows created before the column was added. Data layer defensively uses `|| []` but the type is misleading to future callers. | Change to `custom_service_names: string[] \| null`, or add a comment confirming the migration used `DEFAULT '{}'` so null is impossible. |
| F-44-06 | `lib/types/database.ts` | 194–195 | `SendLogWithContact = SendLogWithCustomer` deprecated alias still present. Needed until F-01/F-02/F-03 migration is complete, plus `lib/data/send-logs.ts` (outside 41-44 scope) also uses it. | After migrating all history component usages (F-01, F-02, F-03) and `lib/data/send-logs.ts`, remove this alias. |
| F-44-07 | `components/onboarding/steps/crm-platform-step.tsx` | 194–202 | "Skip for now" button discards any in-progress CRM selection without visual indication. A user who selects "Jobber" then clicks Skip expects either the selection to save or a warning that it won't. | Rename to "Skip without saving" for clarity, or show a brief tooltip. Low UX impact since step is explicitly optional. |

---

### Info

| ID | File | Line(s) | Description | Recommendation |
|----|------|---------|-------------|----------------|
| F-44-09 | `lib/actions/onboarding.ts` | 281–312 | `saveSoftwareUsed` action and `software_used` column are V1-era naming artifacts. The UI now presents this as "CRM Platform," but the underlying names are inconsistent. | Low priority: rename `saveSoftwareUsed` → `saveCRMPlatform` and `software_used` column → `crm_platform` in a future cleanup phase. No urgency. |

---

## Phase-by-Phase Summary

### Phase 41: Activity Page Overhaul

**Assessment:** Solid implementation of the planned changes. The RESENDABLE_STATUSES consolidation is clean. Inline retry via `handleInlineRetry` works correctly. Date preset chips are functional but missing `aria-pressed` (F-05). The main concern is the Request Detail Drawer which was largely pre-existing code: it still uses the deprecated type alias (F-01, F-02, F-03), has a stub cancel button (F-04), and an incorrect cooldown anchor (F-07). These are not regressions introduced by Phase 41 but should be cleaned up.

**Finding IDs:** F-01, F-02, F-03, F-04, F-05, F-06, F-07, F-08, F-09

### Phase 42: Dashboard & Navigation Polish

**Assessment:** The Needs Attention alerting system is well-built. The dismiss pattern is ephemeral by design but inconsistent with the server-persisted Acknowledge action (F-11). Both the AttentionAlerts and ReadyToSendQueue skeletons use raw animate-pulse divs instead of the `<Skeleton>` component (F-10, F-12). The sidebar active state implementation is correct and V2-aligned. The solid border empty state deviation from the 42-01 plan was an improvement and is documented in STATE.md.

**Finding IDs:** F-10, F-11, F-12, F-13, F-14

### Phase 43: Cross-Page Consistency

**Assessment:** All 7 loading skeletons correctly use the `<Skeleton>` component and follow the `container py-6 space-y-8` wrapper pattern. All 5 page empty states match the canonical design exactly. However, the page content wrappers use `space-y-6` while their skeletons use `space-y-8` — causing a layout shift on every page load (F-CC-01, F-09). The Settings page has a skeleton duplication issue (F-15). The customers page has an inline type cast indicating a typing gap (F-16). The history empty state dual export is minor cleanup (F-17). `feedback-list.tsx` uses the SSR-specific Phosphor subpath (F-18).

**Finding IDs:** F-09 (via F-CC-01), F-15, F-16, F-17, F-18, F-CC-01

### Phase 44: Onboarding & Services

**Assessment:** The CRM Platform step is well-built with correct accessibility (role="radiogroup", aria-checked). Custom service names data flow is correct end-to-end, with proper Zod validation and defense-in-depth in the settings server action. The security gap is `updateServiceTypeSettings` using `user_id` directly (F-44-01). Minor issues: empty string vs null (F-44-03), schema missing max length (F-44-02), type nullable mismatch (F-44-04), sequential queries (F-44-05), deprecated alias propagation (F-44-06), and the V1 naming artifact (F-44-09). CRM brand colors are acceptable exceptions to the semantic token rule (F-44-08 — acceptable, documented).

**Finding IDs:** F-44-01, F-44-02, F-44-03, F-44-04, F-44-05, F-44-06, F-44-07, F-44-08 (acceptable), F-44-09

---

## Cross-Cutting Concerns

### Dead Code

**Deprecated type alias (`SendLogWithContact`):**
- In-scope files: `history-client.tsx` (4 usages), `history-table.tsx` (4 usages), `request-detail-drawer.tsx` (3+ usages)
- Out-of-scope file: `lib/data/send-logs.ts` (5 usages) — Phase 39 era, not in Phase 41-44 scope
- The alias definition at `lib/types/database.ts:195` must remain until all consumers are migrated
- **Total migration needed:** 7 usages in 3 in-scope files + 5 in `send-logs.ts` (separate task)

**Dead export (`RESENDABLE_STATUSES`):**
- Exported from `history-columns.tsx` but only consumed within the history module (by `history-table.tsx`)
- No external consumers found in codebase-wide search
- Remove `export` keyword (F-08)

**Dead alias export (`EmptyState`):**
- `history/empty-state.tsx` exports both `HistoryEmptyState` and `EmptyState` alias
- Single consumer (`history-client.tsx`) should import `HistoryEmptyState` directly
- Remove alias after updating import (F-17)

**Deleted files confirmed:**
- `components/onboarding/steps/software-used-step.tsx` — CONFIRMED deleted (not present in filesystem)
- `app/(dashboard)/contacts/loading.tsx` — CONFIRMED deleted (contacts directory contains only `page.tsx`)

**Commented-out code:**
- None found in Phase 41-44 files. Only commented code in `lib/supabase/proxy.ts` (out of scope) are framework guidance comments, not dead code.

### Design System Compliance

**Hardcoded colors (non-semantic tokens):**
- `bg-emerald-500`, `bg-blue-500`, `bg-red-500`, `bg-orange-500`, `bg-violet-500` — `lib/validations/onboarding.ts:46–51` — CRM brand colors, **acceptable exception** (F-44-08). These are third-party brand identifiers that must not change with theme.
- `bg-purple-500` — `components/history/status-badge.tsx:34` — used for "opened" status indicator, **acceptable** (status colors are a known semantic gap in the current token system).
- No other hardcoded color classes found in Phase 41-44 files.

**Spacing mismatch (cross-page):**
All phase-reviewed pages and their loading skeletons have a `space-y-6` vs `space-y-8` inconsistency. See F-CC-01. Affected pages: history, analytics, customers, jobs, billing, feedback. This is a systemic pattern introduced across Phases 41-43, not a one-file fix.

**Button variant usage:**
- All primary actions correctly use `variant="default"`
- Destructive actions correctly use `variant="destructive"` — except F-04 where the destructive button is a stub
- Secondary actions correctly use `variant="outline"`, `variant="ghost"`, or `variant="soft"` where applicable
- No variant misuse found

**Icon library consistency:**
- No Lucide icons introduced in Phases 41-44. All new icons use `@phosphor-icons/react`.
- Four files use the `@phosphor-icons/react/dist/ssr` subpath (F-18 for `feedback-list.tsx`; `campaigns/[id]/page.tsx`, `campaigns/new/page.tsx`, `billing/page.tsx` are outside Phase 41-44 scope but share the same pattern)
- No regressions from the Phosphor migration

### Accessibility

**Missing `aria-pressed` on toggle buttons:**
- `components/history/history-filters.tsx` lines 191–204: date preset chips behave as toggle buttons but lack `aria-pressed` (F-05). Count: 4 buttons.

**Missing `aria-label` on inputs:**
- `components/settings/service-types-section.tsx` line 166: custom service `<Input>` has no `id`, `aria-label`, or `aria-labelledby`. The visual label (`<h4>Custom service names</h4>`) is not associated via `htmlFor`. (From F-44 review — no separate finding ID, rolled into F-44-07 context.)

**Missing keyboard navigation for custom radiogroup:**
- `components/onboarding/steps/crm-platform-step.tsx`: CRM platform cards use `role="radiogroup"` and `role="radio"` correctly, but arrow key navigation between options is not implemented. Screen readers can Tab between buttons but cannot use arrow keys as expected in a true radiogroup. Minor gap — Tab navigation works.

**Touch target sizes:**
- Date preset chips in `history-filters.tsx` have `py-1` (8px vertical padding) + `text-sm` height (~20px) ≈ 36px total height — below the 44px minimum touch target.
- Checkbox elements (`h-4 w-4` = 16px) in history-columns.tsx — existing design system issue, not introduced by Phase 41.

**Well-covered areas:**
- Dismiss button in `attention-alerts.tsx` has `aria-label="Dismiss alert"` — correct
- AlertRow has `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space — correct
- CRM platform cards have `aria-checked` on each `role="radio"` — correct
- Sidebar collapse button has `aria-label` — correct
- All icon-only action buttons in `job-columns.tsx` have `aria-label` — correct

### Security

**All server actions verified secure:**
- All 11 server actions across `lib/actions/onboarding.ts`, `lib/actions/business.ts`, `lib/actions/conflict-resolution.ts`, `lib/actions/job.ts` use `createClient()` (not service role), call `supabase.auth.getUser()`, and reject unauthenticated requests.
- Custom service names are validated at the Zod schema level (max 10 items, max 50 chars each) and again in `updateServiceTypeSettings` with inline sanitization (trim, filter, slice) — defense in depth.
- No XSS vectors: custom service names render as React text content (auto-escaped), CRM labels from hardcoded constants.
- RLS remains intact — no new tables were created, column additions use existing RLS policies.

**One gap (medium):**
- F-44-01: `updateServiceTypeSettings` skips the explicit business-fetch step used by all other actions, weakening the defense-in-depth pattern (functionally correct, architecturally inconsistent).

### Performance

- `getJobs` has two sequential `campaign_enrollments` queries for conflict detection (F-44-05). Acceptable for current scale. Documented as optimization opportunity for when job volume grows.
- `ready-to-send-queue.tsx` correctly uses `useMemo`, `useCallback`, and `displayJobs.slice(0, 5)` to limit rendering — no performance concerns.
- `getOnboardingStatus` fetches `custom_service_names` but does not include it in its return type — minor unnecessary column fetch (negligible, no finding ID assigned).
- All loading skeletons are route-level (Next.js `loading.tsx`) — no double-loading states.

### V2 Alignment

No V2 philosophy regressions found across all 41 files. V2 alignment assessment:

| Area | Score | Notes |
|------|-------|-------|
| Sidebar navigation | 6/6 | Correct order: Dashboard → Jobs → Campaigns → Analytics → History → Feedback. "Add Job" uses primary variant with accent color. |
| ReadyToSendQueue | 5/6 | Jobs-centric, "Send One-Off" is acceptable escape hatch |
| AttentionAlerts | 6/6 | Alerts are automation outcomes, not manual-send prompts |
| History page | 5/6 | Shows campaign sends; "Recipient" column is customer-centric but acceptable in send log context |
| All empty states | 6/6 | "Customers appear as you complete jobs"; CTAs point to Jobs page |
| CRM Platform step | 6/6 | Asking about existing software for future integration awareness, not building V1 customer DB |

---

## Remediation Priority

Phase 51 should address findings in this order:

### Group 1: Quick Wins (< 1 hour each)

1. **F-08** — Remove `export` from `RESENDABLE_STATUSES` in history-columns.tsx (1-line change)
2. **F-17** — Remove `EmptyState` alias from history/empty-state.tsx, update import in history-client.tsx (2-line change)
3. **F-10** — Replace raw animate-pulse divs in `AttentionAlertsSkeleton` with `<Skeleton>` component
4. **F-12** — Replace raw animate-pulse divs in `ReadyToSendQueueSkeleton` with `<Skeleton>` component
5. **F-09/F-CC-01** — Standardize all page content wrappers from `space-y-6` to `space-y-8` (6 files: history, analytics, customers, jobs, billing, feedback pages)

### Group 2: Type Migration (coordinated, ~2 hours)

6. **F-01, F-02, F-03, F-44-06** — Migrate all `SendLogWithContact` → `SendLogWithCustomer` in history-client.tsx, history-table.tsx, request-detail-drawer.tsx. Then migrate `lib/data/send-logs.ts` (out of Phase 41-44 scope but must be done together). Once all consumers are migrated, remove the deprecated alias from database.ts line 195.

### Group 3: UI Correctness (30–60 min each)

7. **F-04** — Remove or disable the "Cancel Message" section in request-detail-drawer.tsx. Add a TODO for server-side cancellation. Fix `isOptedOut` hardcode to derive from customer data.
8. **F-07** — Resolve cooldown anchor issue in request-detail-drawer.tsx (requires F-03 migration first — extend `SendLogWithCustomer` to include `customers.last_sent_at`).
9. **F-15** — Resolve settings skeleton duplication: delete the inline `SettingsLoadingSkeleton` from `settings/page.tsx` and import from `settings/loading.tsx`.
10. **F-11** — Make `handleDismiss` in attention-alerts.tsx call `acknowledgeAlert` for persistent alert types (bounced_email, stop_request).

### Group 4: Security & Validation (~1 hour)

11. **F-44-01** — Refactor `updateServiceTypeSettings` to fetch business ID first before the update.
12. **F-44-02** — Add `.max(100)` to `softwareUsedSchema` in validations/onboarding.ts.
13. **F-44-03** — Normalize empty string to null in `saveSoftwareUsed` server action.
14. **F-44-04** — Fix `Business.custom_service_names` type to `string[] | null` in database.ts.

### Group 5: Accessibility (~1 hour)

15. **F-05** — Add `aria-pressed={activePreset === preset.label}` to date preset chip buttons in history-filters.tsx.
16. **F-18** — Verify if `@phosphor-icons/react` (standard) works in Server Components; if so, normalize `feedback-list.tsx` import.
17. **service-types-section.tsx input** — Add `aria-label="Custom service name"` or `id` + `htmlFor` to the custom service Input element.

### Group 6: Code Quality (low urgency)

18. **F-06** — Evaluate history page heading: upgrade `text-2xl` to `text-3xl font-bold` if it's the page H1.
19. **F-13** — Add border to "all caught up" empty state in ReadyToSendQueue for visual consistency.
20. **F-16** — Fix `getBusiness()` return type to include typed `message_templates` array.
21. **F-44-07** — Rename "Skip for now" to "Skip without saving" in crm-platform-step.tsx.

### Defer (rename/refactor, not urgent)

22. **F-44-09** — Rename `saveSoftwareUsed` → `saveCRMPlatform` in a future cleanup phase.
23. **F-14** — Replace `ArrowsClockwise` logo with a custom SVG brand mark (design decision needed).
24. **F-44-05** — Optimize sequential conflict queries in `getJobs` (performance improvement only needed at scale).
25. **F-44-08** — CRM brand colors are documented acceptable exception; no action required.

---

## Appendix: Files Reviewed

### Phase 41: Activity Page Overhaul (6 files, ~1,067 lines)

| File | Lines | Review Status |
|------|-------|---------------|
| `components/history/history-columns.tsx` | 136 | Reviewed — F-08 |
| `components/history/history-table.tsx` | 107 | Reviewed — F-02 |
| `components/history/history-client.tsx` | 242 | Reviewed — F-01, F-06 |
| `components/history/history-filters.tsx` | 247 | Reviewed — F-05 |
| `components/history/request-detail-drawer.tsx` | 291 | Reviewed — F-03, F-04, F-07 |
| `app/(dashboard)/history/page.tsx` | 58 | Reviewed — F-09 |

### Phase 42: Dashboard & Navigation Polish (3 files, ~1,340 lines)

| File | Lines | Review Status |
|------|-------|---------------|
| `components/dashboard/attention-alerts.tsx` | 276 | Reviewed — F-10, F-11 |
| `components/dashboard/ready-to-send-queue.tsx` | 873 | Reviewed — F-12, F-13 |
| `components/layout/sidebar.tsx` | 191 | Reviewed — F-14 |

### Phase 43: Cross-Page Consistency (18 files, ~578 lines)

| File | Lines | Review Status |
|------|-------|---------------|
| `app/(dashboard)/analytics/loading.tsx` | 20 | Reviewed — Clean |
| `app/(dashboard)/billing/loading.tsx` | 38 | Reviewed — Clean |
| `app/(dashboard)/contacts/loading.tsx` | DELETED | Confirmed deleted |
| `app/(dashboard)/customers/loading.tsx` | 29 | Reviewed — Clean |
| `app/(dashboard)/customers/page.tsx` | 37 | Reviewed — F-16 |
| `app/(dashboard)/feedback/loading.tsx` | 27 | Reviewed — Clean |
| `app/(dashboard)/history/loading.tsx` | 25 | Reviewed — Clean |
| `app/(dashboard)/history/page.tsx` | 58 | Reviewed — (see Phase 41) |
| `app/(dashboard)/jobs/loading.tsx` | 26 | Reviewed — Clean |
| `app/(dashboard)/jobs/page.tsx` | 47 | Reviewed — F-CC-01 |
| `app/(dashboard)/settings/loading.tsx` | 29 | Reviewed — F-15 |
| `app/(dashboard)/settings/page.tsx` | 103 | Reviewed — F-15 |
| `components/customers/empty-state.tsx` | 51 | Reviewed — Clean |
| `components/dashboard/analytics-service-breakdown.tsx` | 132 | Reviewed — Clean |
| `components/feedback/feedback-list.tsx` | 34 | Reviewed — F-18 |
| `components/history/empty-state.tsx` | 44 | Reviewed — F-17 |
| `components/history/history-columns.tsx` | 136 | (Also in Phase 41) |
| `components/jobs/empty-state.tsx` | 45 | Reviewed — Clean |

### Phase 44: Onboarding & Services (19 files, ~2,794 lines)

| File | Lines | Review Status |
|------|-------|---------------|
| `app/onboarding/page.tsx` | 79 | Reviewed — Clean |
| `components/onboarding/onboarding-wizard.tsx` | 146 | Reviewed — Clean |
| `components/onboarding/onboarding-steps.tsx` | 78 | Reviewed — Clean |
| `components/onboarding/steps/crm-platform-step.tsx` | 206 | Reviewed — F-44-03, F-44-07 |
| `components/onboarding/steps/business-setup-step.tsx` | 265 | Reviewed — Clean |
| `components/onboarding/steps/software-used-step.tsx` | DELETED | Confirmed deleted |
| `components/settings/service-types-section.tsx` | 273 | Reviewed — accessibility gap (no finding ID) |
| `components/settings/settings-tabs.tsx` | 159 | Reviewed — Clean |
| `components/jobs/edit-job-sheet.tsx` | ~260 | Reviewed — Clean |
| `components/jobs/job-columns.tsx` | ~487 | Reviewed — Clean |
| `lib/actions/onboarding.ts` | 366 | Reviewed — F-44-09 |
| `lib/actions/business.ts` | 302 | Reviewed — F-44-01 |
| `lib/actions/conflict-resolution.ts` | 215 | Reviewed — Clean |
| `lib/actions/job.ts` | 683 | Reviewed — Clean |
| `lib/data/business.ts` | 105 | Reviewed — Clean |
| `lib/data/jobs.ts` | 233 | Reviewed — F-44-05 |
| `lib/data/onboarding.ts` | 194 | Reviewed — Clean |
| `lib/types/database.ts` | 379 | Reviewed — F-44-04, F-44-06 |
| `lib/types/onboarding.ts` | 24 | Reviewed — Clean |
| `lib/validations/onboarding.ts` | 74 | Reviewed — F-44-02, F-44-08 |

---

## Finding Index

For quick reference by Phase 51 planning:

| ID | Phase | Severity | Category | File (short) | One-line |
|----|-------|----------|----------|--------------|----------|
| F-01 | 41 | High | Dead Code | history-client.tsx | Deprecated `SendLogWithContact` import |
| F-02 | 41 | High | Dead Code | history-table.tsx | Deprecated `SendLogWithContact` props |
| F-03 | 41 | High | Dead Code | request-detail-drawer.tsx | Deprecated `SendLogWithContact` import/props |
| F-04 | 41 | High | Correctness | request-detail-drawer.tsx | Stub cancel button with destructive UI |
| F-05 | 41 | Medium | Accessibility | history-filters.tsx | Date chips missing `aria-pressed` |
| F-06 | 41 | Medium | Design System | history-client.tsx | Heading size + space-y mismatch |
| F-07 | 41 | Medium | Correctness | request-detail-drawer.tsx | Cooldown anchored to wrong timestamp |
| F-08 | 41 | Low | Dead Code | history-columns.tsx | Unnecessary `export` on RESENDABLE_STATUSES |
| F-09 | 41 | Low | Design System | history/page.tsx | space-y-6 vs space-y-8 skeleton mismatch |
| F-10 | 42 | High | Design System | attention-alerts.tsx | Skeleton uses raw animate-pulse, not Skeleton component |
| F-11 | 42 | Medium | Correctness | attention-alerts.tsx | Dismiss X inconsistent with Acknowledge (not persisted) |
| F-12 | 42 | Medium | Design System | ready-to-send-queue.tsx | Skeleton uses raw animate-pulse, not Skeleton component |
| F-13 | 42 | Low | Design System | ready-to-send-queue.tsx | "All caught up" empty state missing border |
| F-14 | 42 | Low | Design System | sidebar.tsx | Brand logo is a generic utility icon |
| F-15 | 43 | Medium | Design System | settings/loading.tsx + page.tsx | Skeleton defined in two places |
| F-16 | 43 | Medium | Correctness | customers/page.tsx | Inline type cast signals typing gap |
| F-17 | 43 | Low | Dead Code | history/empty-state.tsx | Dual export alias for backward compat |
| F-18 | 43 | Medium | Dead Code | feedback-list.tsx | Non-standard Phosphor SSR subpath import |
| F-44-01 | 44 | Medium | Security | lib/actions/business.ts | Skips business-fetch defense-in-depth pattern |
| F-44-02 | 44 | Low | Security | lib/validations/onboarding.ts | No max length on softwareUsedSchema |
| F-44-03 | 44 | Low | Correctness | crm-platform-step.tsx | Empty string saved instead of null |
| F-44-04 | 44 | Low | Correctness | lib/types/database.ts | custom_service_names typed non-nullable |
| F-44-05 | 44 | Low | Performance | lib/data/jobs.ts | Sequential conflict queries |
| F-44-06 | 44 | Low | Dead Code | lib/types/database.ts | Deprecated alias still present |
| F-44-07 | 44 | Low | Accessibility | crm-platform-step.tsx | Skip silently discards selection |
| F-44-08 | 44 | Low | Design System | lib/validations/onboarding.ts | CRM brand colors hardcoded (acceptable exception) |
| F-44-09 | 44 | Info | V2 Alignment | lib/actions/onboarding.ts | V1-era naming artifact |
| F-CC-01 | 41–43 | Medium | Design System | 6 page files | Cross-page space-y-6/space-y-8 mismatch |

**Total:** 0 Critical, 5 High, 11 Medium, 10 Low, 1 Info = **27 findings**

---

*Code review completed: 2026-02-26*
*Plans: 50-01 (Phases 41-43 UI), 50-02 (Phase 44 data layer), 50-03 (cross-cutting audit)*
*Next: Phase 51 (Audit Remediation) consumes this report directly*
