# Phase 61: Dashboard QA Audit - Research

**Researched:** 2026-02-27
**Domain:** QA E2E testing of the AvisLoop dashboard — verifying data accuracy, rendering, interactivity, loading states, mobile layout, and dark mode
**Confidence:** HIGH (all findings from direct source code reading)

---

## Summary

Phase 61 is a **QA E2E audit** — no new features to build. The dashboard already exists and is production-ready. The goal is to verify all 11 DASH requirements (DASH-01 through DASH-11) using Playwright MCP browser tools and Supabase MCP SQL queries.

The dashboard is a two-column Server Component page (`app/(dashboard)/dashboard/page.tsx`) that fetches all data server-side in parallel and passes it as props to a Client Component (`DashboardClient`). The right panel is desktop-only (`lg:` breakpoint); mobile uses a compact `KPISummaryBar` + `MobileBottomSheet`. There is NO `loading.tsx` for the dashboard route (unlike other pages such as jobs, campaigns, etc.) — this means the dashboard data is NOT streaming; it's fetched entirely server-side before the page renders. Loading skeletons are defined in each component (`KPIWidgetsSkeleton`, `ReadyToSendQueueSkeleton`, `AttentionAlertsSkeleton`) but are NOT automatically displayed unless the page uses Suspense boundaries — and the dashboard page does NOT use Suspense. This is a critical finding for DASH-09.

The Getting Started card is **hard-disabled** in code (two separate `const ... = undefined/false` assignments in `dashboard-client.tsx`) regardless of setup progress state. It should never appear.

**Primary recommendation:** Structure the plan as one PLAN file with tasks mapping to requirement groups. Use direct SQL queries to establish ground-truth counts for KPI verification (DASH-01). Document the loading state situation honestly (DASH-09 is partial — skeleton components exist but are not rendered on first-load because there is no loading.tsx and no Suspense).

---

## Standard Stack

### This Is a QA Phase — No Libraries to Install

All testing uses Playwright MCP tools + Supabase MCP.

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `browser_navigate` | Navigate to dashboard | Every test start |
| `browser_snapshot` | Get accessible page structure for selectors | Before every assertion |
| `browser_click` | Click KPI cards, alert dismiss, job rows | Navigation/interaction tests |
| `browser_take_screenshot` | Capture evidence | Every finding, every viewport |
| `browser_resize` | Change to 375px viewport | DASH-10 mobile test |
| `browser_wait_for` | Wait for navigation after KPI click | DASH-06 nav test |
| `browser_console_messages` | Check for JS errors | DASH-08 empty state, all page loads |
| `browser_evaluate` | Check for horizontal scroll | DASH-10 overflow check |
| `mcp__supabase__execute_sql` | Verify DB counts against displayed KPIs | DASH-01 |

---

## Architecture: Dashboard Component Tree

```
DashboardPage (server component — app/(dashboard)/dashboard/page.tsx)
  │ Fetches: getActiveBusiness, getServiceTypeSettings, getDashboardKPIs,
  │          getReadyToSendJobs, getAttentionAlerts, getJobCounts,
  │          getRecentCampaignEvents, getSetupProgress
  │ All data in parallel via Promise.all
  │
  └── DashboardClient (client component — components/dashboard/dashboard-client.tsx)
        │ Props: greeting, firstName, businessId, kpiData, pipelineSummary,
        │        events, readyJobs, alerts, hasJobHistory, setupProgress
        │
        └── DashboardShell (components/dashboard/dashboard-shell.tsx)
              │ Creates DashboardPanelContext (panelView state)
              │ Two-column flex layout: left (flex-1) + right (fixed 360px)
              │
              ├── LEFT COLUMN: DashboardContent
              │     ├── Header (greeting + subtitle)
              │     ├── KPISummaryBar (MOBILE ONLY — lg:hidden)
              │     ├── ReadyToSendQueue
              │     └── AttentionAlerts
              │
              └── RIGHT PANEL: RightPanel (hidden on mobile — hidden lg:flex)
                    ├── DEFAULT view: RightPanelDefault
                    │     ├── Compact KPI cards (3 cards with Sparkline)
                    │     ├── Pipeline counters (3-column grid)
                    │     └── Recent Activity Feed (5 events max)
                    │
                    ├── JOB-DETAIL view: RightPanelJobDetail
                    └── ATTENTION-DETAIL view: RightPanelAttentionDetail
```

### Mobile Architecture

- Right panel (`aside.hidden.lg:flex`) is hidden on mobile
- `KPISummaryBar` (tappable row showing 3 KPIs) is shown on mobile only (`lg:hidden`)
- `MobileBottomSheet` slides up from bottom when KPI bar is tapped or a job/alert row is tapped
- Sheet content: full KPI+activity (if KPI bar tap) or job/alert detail
- Getting Started is conditionally rendered mobile-only (`lg:hidden`) but `showGettingStartedMobile = false` hard-disables it

---

## Architecture: Data Sources for Each Requirement

### DASH-01: KPI Numbers Match Database

All KPIs come from `getDashboardKPIs(businessId)` in `lib/data/dashboard.ts`.

| KPI | Table | Query Logic |
|-----|-------|-------------|
| Reviews This Month | `send_logs` | `WHERE business_id = X AND reviewed_at IS NOT NULL AND created_at >= first-of-month` |
| Average Rating | `customer_feedback` | `SELECT AVG(rating) WHERE business_id = X AND submitted_at >= first-of-month` |
| Conversion Rate | `send_logs` | `(reviews_this_month / sent_this_month) * 100`, sent = status IN ('sent','delivered','opened') |
| Requests Sent This Week | `send_logs` | `WHERE status IN ('sent','delivered','opened') AND created_at >= 7d ago` |
| Active Sequences | `campaign_enrollments` | `WHERE status IN ('active','frozen')` |
| Pending/Queued | `send_logs` | `WHERE status = 'pending'` |

**SQL to verify DASH-01** (run these against the test account's business):

```sql
-- Reviews this month (matches "Reviews This Month" KPI)
SELECT COUNT(*)
FROM send_logs
WHERE business_id = '[business_id]'
  AND reviewed_at IS NOT NULL
  AND created_at >= date_trunc('month', NOW());

-- Active sequences (matches "Active" pipeline counter)
SELECT COUNT(*)
FROM campaign_enrollments
WHERE business_id = '[business_id]'
  AND status IN ('active', 'frozen');

-- Sent this week (matches "Sent" pipeline counter)
SELECT COUNT(*)
FROM send_logs
WHERE business_id = '[business_id]'
  AND status IN ('sent', 'delivered', 'opened')
  AND created_at >= NOW() - INTERVAL '7 days';
```

### DASH-02: Sparklines

Sparklines live in `RightPanelDefault` (right panel, not the main KPI cards in the left column).

- Implemented as SVG polyline — custom component at `components/dashboard/sparkline.tsx`
- Data format: `number[]` ordered oldest → newest (14 daily buckets)
- If `data.length < 2`: renders a dashed flat line (graceful empty state)
- If `data.length >= 2`: renders polyline + gradient fill path
- "Not enough data" text appears below sparkline when `history.length < 2`
- `aria-hidden="true"` on all sparkline SVGs (decorative only)

**Selector for sparkline SVG**: `svg[aria-hidden="true"]` within the right panel KPI cards

### DASH-03: Ready-to-Send Queue

Source: `getReadyToSendJobs(businessId, serviceTypeTiming)` in `lib/data/dashboard.ts`

**What qualifies for the queue:**
- Jobs with `status IN ('scheduled', 'completed')` for this business
- Excludes: `campaign_override = 'dismissed'` or `'one_off_sent'`
- Excludes: `enrollment_resolution = 'skipped'` or `'suppressed'`
- Includes: conflict, queue_after, replace_on_complete (shown for resolution)
- Includes: `campaign_override = 'one_off'` (manual send needed)
- Excludes completed jobs that have ANY enrollment record

**UI identifiers:**
- Section heading: `h2` with text "Ready to Send"
- Badge showing count: `<Badge variant="secondary">{jobs.length}</Badge>`
- Container `id`: `id="ready-to-send-queue"` on the outer div
- Empty state (no job history): contains text "No jobs yet — add a completed job to get started"
- Empty state (job history, all caught up): contains text "All caught up — no jobs waiting for enrollment"
- Job rows: flex rows with customer name, service type, time ago

### DASH-04: Attention Alerts

Source: `getAttentionAlerts(businessId)` in `lib/data/dashboard.ts`

**What qualifies:**
- Failed sends: `send_logs` with `status IN ('failed', 'bounced')` AND `error_message NOT LIKE '[ACK]%'`
- Unresolved feedback: `customer_feedback` with `resolved_at IS NULL`

**Dismiss mechanism (two paths):**
1. Client-side immediate: `dismissedIds` state set — removes from visible list instantly (no server round-trip for the hide)
2. Server-side persist: calls `acknowledgeAlert(sendLogId)` (for failed/bounced) or `dismissFeedbackAlert(feedbackId)` (for feedback)
   - `acknowledgeAlert` prefixes `error_message` with `[ACK]` so it won't reappear on next page load
   - `dismissFeedbackAlert` presumably marks the feedback alert as dismissed

**UI identifiers:**
- Section heading: `h2` with text "Needs Attention"
- Container `id`: `id="attention-alerts"`
- Dismiss button: `aria-label="Dismiss alert"` (desktop `<Button>` with X icon)
- Mobile: dismiss via dropdown menu `<DropdownMenuItem>` with text "Dismiss"
- Severity icons: `XCircle` (critical/failed), `WarningCircle` (warning/bounced), `Info` (info/feedback)
- Empty state: "No issues — everything is running smoothly"

### DASH-05: Recent Activity Feed

Source: `getRecentCampaignEvents(businessId, 5)` in `lib/data/dashboard.ts`

**4 event types:**
| Type | Source | Description Pattern | Icon | Color |
|------|--------|--------------------|----|------|
| `touch_sent` | `send_logs` (with campaign_id) | "Touch N email/sms → CustomerName" | PaperPlaneTilt | blue (info) |
| `review_click` | `send_logs` (with reviewed_at) | "CustomerName clicked review link" | Star | green (success) |
| `feedback_submitted` | `customer_feedback` | "CustomerName left N-star feedback" | ChatCircleText | amber (warning) |
| `enrollment` | `campaign_enrollments` | "CustomerName enrolled in CampaignName" | UserPlus | muted |

**Timestamps:** `formatDistanceToNow(timestamp, { addSuffix: true })` — e.g., "3 hours ago"

**UI location:** Right panel only (not in left column). In `RightPanelDefault`.
- Section label: "Recent Activity" (uppercase, text-xs)
- Empty state: "No activity yet — complete a job to get started"
- Each event is a `Link` with rounded-md hover styling

### DASH-06: KPI Cards Navigate to /analytics

The 3 main KPI cards (left column, large cards) are all `<Link href="/analytics">` wrappers:
- Reviews This Month → `/analytics`
- Average Rating → `/analytics`
- Conversion Rate → `/analytics`

**The right panel compact KPI cards link elsewhere:**
- Right panel "Reviews This Month" → `/history?status=reviewed`
- Right panel "Average Rating" → `/feedback`
- Right panel "Conversion Rate" → `/history`

**DASH-06 tests the left-column large KPI cards.** These all go to `/analytics`.

### DASH-07: Getting Started Card NOT Visible

Hard-disabled in two places in `dashboard-client.tsx`:
```typescript
// Line 206 in DashboardContent:
const showGettingStartedMobile = false

// Line 406 in DashboardClient outer:
const gettingStartedContent = undefined
```

The `RightPanelGettingStarted` and `WelcomeCard` components exist but are never rendered because:
- Desktop: `gettingStartedContent={undefined}` passed to DashboardShell → RightPanel shows nothing for getting-started slot
- Mobile: `showGettingStartedMobile = false` guards the `lg:hidden` block

**What to verify:** No element with text "Getting Started", "Welcome to AvisLoop", "Complete these steps", no sparkle icon in the dashboard context.

### DASH-08: Empty State for Zero-Data Business

When a business has no jobs, no sends, no feedback, no enrollments:
- `readyJobs = []`, `hasJobHistory = false` → `ReadyToSendQueue` shows "No jobs yet" empty state
- `alerts = []` → `AttentionAlerts` shows "No issues — everything is running smoothly" empty state
- `kpiData` all zeros → KPI widgets show "0", "0.0", "0%", trend shows "—" (muted dash)
- `events = []` → Right panel activity feed shows "No activity yet" text
- No JS errors expected since all zero/empty states are handled

**Key empty state selectors:**
- `"No jobs yet — add a completed job to get started"` (Ready queue)
- `"No issues — everything is running smoothly"` (Attention)
- `"No activity yet — complete a job to get started"` (Activity feed)

### DASH-09: Loading Skeletons

**CRITICAL FINDING: There is NO `loading.tsx` for the dashboard route.**

Other pages (`/jobs`, `/campaigns`, `/analytics`, `/settings`, etc.) all have `loading.tsx` files. The dashboard does NOT. This means:
- On direct navigation to `/dashboard`, Next.js has no loading UI to show while the server component fetches data
- The skeleton components (`KPIWidgetsSkeleton`, `ReadyToSendQueueSkeleton`, `AttentionAlertsSkeleton`) are defined but NOT auto-rendered during page load
- The dashboard relies on the server rendering everything before returning HTML — there may be a brief blank state rather than skeletons

**Skeleton components that exist (but must be manually invoked):**
- `KPIWidgetsSkeleton` (in `kpi-widgets.tsx`) — used only if explicitly rendered
- `ReadyToSendQueueSkeleton` (in `ready-to-send-queue.tsx`) — used only if explicitly rendered
- `AttentionAlertsSkeleton` (in `attention-alerts.tsx`) — used only if explicitly rendered

**What to test for DASH-09:**
- On initial load from cold (no SSR cache), take a screenshot during loading
- The experience is likely a flash of blank content → full page render (no skeleton)
- Document the actual behavior honestly — if no skeletons appear, document that finding
- The test should verify: no permanent blank screen (page does render), no JS errors during load

**Note:** The dashboard layout (`app/(dashboard)/layout.tsx`) also fetches data before rendering. If the layout is already cached and only the page component loads fresh, behavior may differ.

### DASH-10: Mobile Layout

Viewport to test: 375px width (standard mobile).

**What to verify:**
- No horizontal overflow (use `browser_evaluate` to check `document.documentElement.scrollWidth <= window.innerWidth`)
- Right panel (`aside.hidden.lg:flex`) is NOT visible (hidden on mobile)
- `KPISummaryBar` IS visible (has class `lg:hidden`, so visible below lg = 1024px)
- Tap on KPISummaryBar → MobileBottomSheet opens (slides up from bottom)
- Sheet shows "Dashboard Stats" title
- Sheet can be closed (X button or overlay click)
- Bottom navigation is visible (64-72px fixed footer with 5 nav items)

**Mobile selectors:**
- KPI summary bar: `button[aria-label="View full dashboard stats"]`
- Mobile bottom sheet: `div[role="dialog"]`
- Bottom sheet close: `button[aria-label="Close"]`

### DASH-11: Dark Mode

No dashboard-specific dark mode CSS beyond the global token overrides in `globals.css`. Dark mode uses CSS variables:
- Background: `--background: 24 8% 10%` (dark warm charcoal)
- Card: `--card: 24 8% 13%`
- Muted: `--muted: 24 6% 16%`
- Accent: `--accent: 21 58% 63%` (slightly lighter orange in dark)
- Success: `--success: 142 60% 50%`
- Warning: `--warning: 38 90% 56%`

**Sparkline colors are hardcoded hex:**
- Reviews: `#F59E0B` (amber) — should be visible on dark bg
- Rating: `#008236` (green) — may be dark on dark; dark override: `#00B84B`
- Conversion: `#2C879F` (teal) — dark override: `#38A9C5`

**What to verify:**
- Toggle dark mode (via theme toggle in sidebar or Settings)
- KPI cards readable: white text on dark background
- Sparklines visible (not invisible due to color contrast)
- Attention alert icons (red critical, amber warning, blue info) visible on dark cards
- Ready-to-send queue rows: white text on dark card backgrounds
- No "muddy" appearance (check bg-card, bg-muted contrast ratios)

**Dark mode toggle location:** In the sidebar navigation (theme-switcher component at bottom of sidebar).

---

## Architecture: Loading States Detail

### What Creates the Loading Experience

1. **No loading.tsx** → No Next.js streaming skeleton for dashboard route
2. **DashboardPage is a server component** → Full data fetch before render
3. **Parallel data fetching** via `Promise.all` in `dashboard/page.tsx`
4. **Skeleton components exist** in each component but are not auto-rendered

The dashboard layout (`layout.tsx`) also does data fetching (getActiveBusiness, getUserBusinesses, getServiceTypeSettings, getDashboardCounts). This happens before any dashboard page content renders. The layout is typically cached (React Server Component cache), so repeat visits may be faster.

**Important:** The skeleton components will render correctly if wrapped in a `<Suspense>` boundary with a fallback. But in the current implementation, there are no Suspense boundaries on the dashboard page. This means the test for DASH-09 should document whether users see a blank flash or if Next.js handles this at the router level.

---

## Architecture: Getting Started Card — Suppression Mechanism

The `RightPanelGettingStarted` and `WelcomeCard` components both exist in the codebase but are inactive:

In `DashboardClient` (line ~406):
```typescript
// Getting Started hidden for now — re-enable by restoring the setupProgress checks
const gettingStartedContent = undefined
```

In `DashboardContent` (line ~206):
```typescript
// Getting Started hidden for now — re-enable by restoring the setupProgress checks
const showGettingStartedMobile = false
```

The `setupProgress` prop is still passed (fetched via `getSetupProgress(business.id)`) but never consumed. The display is 100% suppressed regardless of setup state. There is no environment variable, feature flag, or database toggle — it's a hardcoded `false`/`undefined` in the component.

---

## Architecture: Navigation Flows from KPI Cards

**Left column KPI cards (large, 3-column grid):**
All 3 are `<Link href="/analytics">` wrappers. Clicking any of the 3 large KPI cards navigates to `/analytics`.

**Right panel compact KPI cards:**
- "Reviews This Month" → `/history?status=reviewed`
- "Average Rating" → `/feedback`
- "Conversion Rate" → `/history`

**DASH-06 requirement** says "Clicking any KPI card navigates to /analytics". This applies to the 3 large left-column KPI cards. The right panel cards link elsewhere, but that is expected behavior.

---

## Architecture: Dismiss Alert — Exact Mechanism

Dismiss works client-side first, then server-side:

1. User clicks X button (desktop) or "Dismiss" in dropdown (mobile)
2. `handleDismiss(id)` adds `id` to `dismissedIds` Set → instant UI removal
3. Fire-and-forget server call:
   - If `type === 'failed_send'` or `'bounced_email'` or `'stop_request'`: calls `acknowledgeAlert(sendLogId)` which prefixes `error_message` with `[ACK]`
   - If `type === 'unresolved_feedback'`: calls `dismissFeedbackAlert(feedbackId)`
4. On next page load, the `getAttentionAlerts()` query filters out `[ACK]` prefixed errors, so dismissed alerts don't reappear

**Important test behavior:** After dismiss, the alert disappears IMMEDIATELY (client-side state update). No server roundtrip delay needed in the assertion. However, if the page is refreshed, the alert should still be gone (server-side persisted).

---

## Common Pitfalls

### Pitfall 1: Phase 62 (Jobs) Runs AFTER Phase 61

Phase 61 tests the dashboard in its post-Phase-60 (onboarding) state. At this point, the test account has:
- A business created via onboarding
- Possibly a campaign preset (from onboarding step 5)
- NO jobs yet (jobs are Phase 62+)

This means for Phase 61:
- Ready-to-send queue will show "No jobs yet" empty state
- KPI widgets will show mostly zeros (0 reviews, 0.0 avg rating, 0% conversion)
- Attention alerts will likely be empty
- Activity feed will be empty

**DASH-01 (KPI accuracy) should be verified in the zero-data state.** Zeros must match zeros in the DB — not showing phantom data.

**DASH-08 (empty state) IS the same as DASH-01 in this context.** Both test the freshly-onboarded account.

### Pitfall 2: KPI Summary Bar (Mobile) vs KPI Widgets (Desktop)

The `KPIWidgets` component renders the 3 large cards in the LEFT COLUMN and is visible on all screen sizes (including mobile). The `KPISummaryBar` is the compact mobile-only row. On desktop, the right panel has its own compact KPI cards.

For DASH-06 (KPI card navigation), test the left-column `KPIWidgets` — they use `<Link>` to `/analytics`. Do NOT confuse with the `KPISummaryBar` which opens a bottom sheet, not a page navigation.

### Pitfall 3: Sparklines Are in the RIGHT PANEL, Not the Main KPI Cards

The 3 main KPI cards in the left column (KPIWidgets component) do NOT have sparklines. Sparklines appear only in the right panel's compact KPI cards (`RightPanelDefault`). Since the right panel is hidden on mobile (`hidden lg:flex`), sparklines are desktop-only.

For DASH-02, testing must be done at desktop viewport (≥1024px wide) to see the right panel.

### Pitfall 4: "Not enough data" Text Below Sparklines for New Account

For a freshly-onboarded account with no data, the sparkline history arrays will have 14 DayBucket entries but all with `value: 0`. Since `data.length` will be 14 (≥2), the Sparkline will render the polyline (a flat line at the bottom). The "Not enough data" text appears only when `history.length < 2`. So for a zero-data account:
- Sparkline WILL render (flat line at bottom, not dashed)
- "Not enough data" text will NOT appear
- The dashed flat line only appears for `data.length < 2` (which would only happen on an error/empty history)

### Pitfall 5: Dismiss Persists Across Refresh

After dismissing an alert, if the page is refreshed, the alert should NOT reappear (because the server-side `acknowledgeAlert` was called). However, there is a timing window: the dismiss button fires two things in parallel (state update + server action). If the server action hasn't completed before the refresh, the alert may briefly reappear. This is an edge case; the normal test (dismiss then wait, then observe) should pass.

### Pitfall 6: "Ready to Send" Queue Shows at Most 5 Items, Capped at 20 in Data

`displayJobs = jobs.slice(0, 5)` — UI shows max 5 jobs. The data function returns max 20. If `jobs.length > 5`, a "Show all" link appears. For Phase 61 (no jobs), this is not relevant.

---

## Code Examples

### Playwright: Verify KPI Numbers Match DB

```
1. mcp__supabase__execute_sql: Get business_id for audit-test@avisloop.com
   SELECT b.id, b.name FROM businesses b
   JOIN auth.users u ON u.id = b.user_id
   WHERE u.email = 'audit-test@avisloop.com'

2. mcp__supabase__execute_sql: Get review count this month
   SELECT COUNT(*) FROM send_logs
   WHERE business_id = '[id]'
   AND reviewed_at IS NOT NULL
   AND created_at >= date_trunc('month', NOW())

3. browser_navigate → http://localhost:3000/dashboard
4. browser_snapshot → Get KPI card text
5. Assert displayed value matches DB count
```

### Playwright: Verify Getting Started NOT Visible

```
1. browser_navigate → http://localhost:3000/dashboard
2. browser_snapshot → Check for absence of "Getting Started", "Welcome to AvisLoop", "Complete these steps"
3. browser_take_screenshot → Evidence
```

### Playwright: Verify KPI Card Navigates to /analytics

```
1. browser_navigate → http://localhost:3000/dashboard
2. browser_snapshot → Find "Reviews This Month" card (the large left-column one)
3. browser_click → the card/link
4. browser_wait_for → text: "Analytics" (page heading) OR URL contains "/analytics"
5. browser_snapshot → Verify analytics page loaded
6. browser_take_screenshot → Evidence
```

### Playwright: Mobile Layout Test

```
1. browser_resize → { width: 375, height: 812 }
2. browser_navigate → http://localhost:3000/dashboard
3. browser_snapshot → Verify KPISummaryBar visible, right panel NOT visible
4. browser_evaluate → "document.documentElement.scrollWidth <= window.innerWidth"
   Expected: true (no horizontal overflow)
5. browser_click → KPISummaryBar (aria-label: "View full dashboard stats")
6. browser_snapshot → Verify MobileBottomSheet is open with "Dashboard Stats" title
7. browser_click → Close button (aria-label: "Close")
8. browser_snapshot → Verify sheet closed
9. browser_take_screenshot → Evidence
```

### Playwright: Dark Mode Test

```
1. browser_navigate → http://localhost:3000/dashboard
2. browser_snapshot → Find theme toggle in sidebar
3. browser_click → dark mode toggle
4. browser_wait_for → body has class "dark" or data-theme attribute
5. browser_snapshot → Verify dashboard renders in dark mode
6. browser_take_screenshot → Evidence (compare colors visually)
7. browser_console_messages → Verify no errors after theme toggle
```

### Playwright: Verify Empty State Renders Without JS Errors

```
1. browser_navigate → http://localhost:3000/dashboard
2. browser_console_messages → Record before any interaction
3. browser_snapshot → Verify empty state messages present:
   - "No jobs yet — add a completed job to get started" (Ready queue)
   - "No issues — everything is running smoothly" (Attention)
4. browser_evaluate → Check for no console.error calls
5. browser_take_screenshot → Evidence
```

---

## Selectors Reference

### Dashboard Page Structure

| Element | Strategy | Expected Text / Selector |
|---------|----------|--------------------------|
| Page heading | getByRole | h1 with greeting text ("Good morning/afternoon/evening") |
| Ready to Send heading | getByRole | h2 "Ready to Send" |
| Needs Attention heading | getByRole | h2 "Needs Attention" |
| KPI card - Reviews | getByText | "Reviews This Month" (appears in both left and right panel) |
| KPI card - Avg Rating | getByText | "Average Rating" |
| KPI card - Conversion | getByText | "Conversion Rate" |
| Ready queue empty (no history) | getByText | "No jobs yet — add a completed job to get started" |
| Ready queue empty (all caught up) | getByText | "All caught up — no jobs waiting for enrollment" |
| Attention alerts empty | getByText | "No issues — everything is running smoothly" |
| Activity feed empty | getByText | "No activity yet — complete a job to get started" |
| Add Job button | getByRole | button "Add Job" |
| Getting Started (should NOT exist) | getByText | "Getting Started" — assert NOT present |
| KPI Summary Bar (mobile) | button[aria-label="View full dashboard stats"] | — |
| Mobile bottom sheet | div[role="dialog"] | — |
| Dismiss alert button | button[aria-label="Dismiss alert"] | — |
| Sparkline SVG | svg[aria-hidden="true"] | within right panel |
| Right panel | aside.hidden.lg:flex | CSS selector |
| Recent Activity heading | getByText | "Recent Activity" (uppercase) |

---

## Requirements → Test Mapping

### DASH-01: KPI numbers match database counts

**Context for Phase 61:** Fresh account, likely all zeros. Test zero-match: DB shows 0 reviews, UI shows "0".

**Steps:**
1. SQL: Get business_id for audit-test account
2. SQL: Count reviews this month (should be 0)
3. SQL: Count active enrollments (should be 0 or small number from onboarding campaign)
4. SQL: Count sent this week (should be 0)
5. Navigate to dashboard → snapshot KPI values
6. Assert displayed values match SQL results

### DASH-02: Sparkline charts render correctly

**Context:** Sparklines only visible in right panel (desktop only). For zero-data: all 14 daily buckets = 0, polyline renders as flat line.

**Steps:**
1. Ensure desktop viewport (≥1024px)
2. Navigate to dashboard → snapshot right panel
3. Locate 3 KPI compact cards in right panel
4. Verify SVG elements present (svg[aria-hidden="true"])
5. For zero-data: verify flat polyline renders (not missing/broken)
6. Verify "Not enough data" text does NOT appear (14 data points exist, just all zeros)

### DASH-03: Ready-to-Send queue populates

**Context for Phase 61:** No jobs exist → empty state shown.

**Steps:**
1. Navigate to dashboard → snapshot
2. Verify "Ready to Send" heading visible
3. Verify "No jobs yet" empty state visible (hasJobHistory=false)
4. Verify no JS errors
5. Screenshot evidence

**Note:** Full positive testing (queue with actual jobs) happens in Phase 62+.

### DASH-04: Attention alerts with dismiss

**Context for Phase 61:** No failed sends, no feedback → empty state shown.

**Steps for empty state:**
1. Navigate to dashboard → snapshot
2. Verify "Needs Attention" heading visible
3. Verify "No issues — everything is running smoothly" text

**Steps for dismiss (if alerts exist):**
1. Find an alert row
2. Click dismiss button (aria-label="Dismiss alert")
3. Verify alert disappears immediately from UI (no page reload)
4. Navigate away and back → verify alert still gone (server persistence)

### DASH-05: Recent activity feed

**Context for Phase 61:** No activity yet → empty state shown.

**Steps:**
1. Navigate to dashboard at desktop viewport
2. Snapshot right panel → find "Recent Activity" section
3. Verify "No activity yet — complete a job to get started" OR event list renders
4. If events exist: verify timestamp format ("X hours/days ago")

### DASH-06: KPI cards navigate to /analytics

**Steps:**
1. Navigate to dashboard at desktop viewport
2. Snapshot → find "Reviews This Month" large card
3. Click the card → wait for navigation
4. Verify URL is /analytics (or page heading matches "Analytics")
5. Repeat for "Average Rating" and "Conversion Rate" cards
6. Screenshot at /analytics page

### DASH-07: Getting Started card NOT visible

**Steps:**
1. Navigate to dashboard → snapshot full page
2. Assert no element contains "Getting Started"
3. Assert no element contains "Welcome to AvisLoop!"
4. Assert no element contains "Complete these steps"
5. Screenshot evidence confirming absence

### DASH-08: Empty state renders without JS errors

**Steps:**
1. Navigate to dashboard (post-onboarding, zero jobs)
2. browser_console_messages → check for errors
3. Verify all 4 empty states show appropriate text:
   - Ready queue: "No jobs yet"
   - Attention: "No issues"
   - KPI numbers: "0", "0.0", "0%"
   - Activity feed: "No activity yet"
4. Verify trend indicators: muted dash "—" when both current and previous = 0
5. Screenshot

### DASH-09: Loading skeletons

**Expected actual behavior:** NO loading.tsx exists for /dashboard. The skeleton components exist in code but are NOT rendered during page load because there are no Suspense boundaries.

**What to test:**
1. Navigate to dashboard with cold browser (no cache) and observe loading behavior
2. Document what actually happens: blank flash vs instant content vs skeleton
3. Report finding accurately: skeleton components exist but may not display due to architecture

**Pass/Fail:** Pass if page loads with data visible (no permanent blank), no JS errors. Document loading UX honestly even if no skeletons appear.

### DASH-10: Mobile layout

**Steps:**
1. browser_resize → { width: 375, height: 812 }
2. Navigate to /dashboard
3. browser_evaluate → check `document.documentElement.scrollWidth <= window.innerWidth`
4. Verify right panel NOT in DOM / hidden
5. Verify KPISummaryBar button visible
6. Tap KPISummaryBar → verify bottom sheet opens
7. Verify sheet title "Dashboard Stats"
8. Close sheet → verify dismiss
9. Screenshot evidence

### DASH-11: Dark mode

**Steps:**
1. Navigate to /dashboard at desktop viewport
2. Find theme toggle in sidebar (bottom area)
3. Click dark mode toggle
4. browser_snapshot → verify dark background applied
5. Verify KPI card text readable on dark background
6. Verify sparklines visible in right panel
7. Verify severity icons visible (red/amber/blue on dark)
8. browser_console_messages → no errors after theme change
9. Screenshots in dark mode

---

## State of the Art

| Architecture Detail | Current Implementation | Test Implication |
|--------------------|----------------------|-----------------|
| Loading | No loading.tsx, server component | No skeletons on first load — document honestly |
| Data fetching | Promise.all parallel (8 queries) | Fast load, but no streaming |
| Getting Started | Hard-disabled in code (two false/undefined) | DASH-07: simple assertion |
| Right panel | Desktop only (lg:flex), hidden on mobile | DASH-02 and DASH-05 require desktop viewport |
| Mobile KPIs | KPISummaryBar (compact bar, tappable) | DASH-10: verify tap-to-open-sheet flow |
| Alert dismiss | Client-side instant + server-side async | DASH-04: assert immediate DOM removal |
| Sparklines | Custom SVG polyline, no external chart library | DASH-02: verify SVG elements present |

---

## Open Questions

### 1. Loading Behavior Without loading.tsx

- **What we know:** No `loading.tsx` for `/dashboard`. Skeleton components exist but aren't rendered.
- **What's unclear:** Does Next.js App Router show any loading state for server components without loading.tsx? Or is it completely instant (SSR)?
- **Recommendation:** Navigate to dashboard from scratch, observe behavior, document faithfully. DASH-09 may be a partial pass (components exist) with a finding note.

### 2. Test Account State Post-Phase-60

- **What we know:** Phase 60 (Onboarding) completed — business exists with a campaign preset.
- **What's unclear:** Were any test jobs or data created during Phase 60 that would affect dashboard KPIs?
- **Recommendation:** Run SQL before testing to survey current state: `SELECT COUNT(*) FROM jobs WHERE business_id = X` and `SELECT COUNT(*) FROM campaign_enrollments WHERE business_id = X`.

### 3. Dark Mode Toggle Location

- **What we know:** A theme-switcher component exists (`theme-switcher.tsx` in the sidebar).
- **What's unclear:** The exact UI text/label for the dark/light toggle buttons.
- **Recommendation:** Snapshot the sidebar first to discover the exact toggle selector before clicking.

---

## Sources

### Primary (HIGH confidence)

All findings from direct source code reading:

- `app/(dashboard)/dashboard/page.tsx` — Server component, data fetching, parallel queries
- `components/dashboard/dashboard-client.tsx` — Client wrapper, Getting Started suppression
- `components/dashboard/dashboard-shell.tsx` — DashboardPanelContext, two-column layout
- `components/dashboard/kpi-widgets.tsx` — KPI cards, all link to /analytics, KPIWidgetsSkeleton
- `components/dashboard/right-panel-default.tsx` — Sparklines, activity feed, KPISummaryBar
- `components/dashboard/sparkline.tsx` — SVG implementation, graceful empty state
- `components/dashboard/ready-to-send-queue.tsx` — Queue logic, empty states, ReadyToSendQueueSkeleton
- `components/dashboard/attention-alerts.tsx` — Alert display, dismiss mechanism, AttentionAlertsSkeleton
- `components/dashboard/right-panel.tsx` — Desktop-only right panel structure
- `components/dashboard/mobile-bottom-sheet.tsx` — Mobile sheet implementation
- `components/dashboard/right-panel-getting-started.tsx` — Getting Started (currently unused)
- `components/dashboard/welcome-card.tsx` — Welcome card (currently unused)
- `lib/data/dashboard.ts` — All 5 data functions + exact SQL queries used
- `lib/types/dashboard.ts` — Type definitions for all dashboard data
- `app/(dashboard)/layout.tsx` — Layout data fetching (badge count, service settings)
- `app/globals.css` — Light/dark mode CSS variables
- Phase 59 RESEARCH.md — QA methodology reference (Playwright MCP patterns, selector priority)

---

## Metadata

**Confidence breakdown:**
- Component structure: HIGH — all components read in full
- Data sources / SQL queries: HIGH — lib/data/dashboard.ts read completely
- Loading state situation: HIGH — confirmed no loading.tsx via directory listing
- Getting Started suppression: HIGH — hardcoded false/undefined in component code
- Empty state text: HIGH — read from JSX source
- Selector strategy: HIGH — derived from rendered JSX structure
- Mobile/dark mode behavior: HIGH — component code and CSS read

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (stable — dashboard architecture unlikely to change during QA audit)
