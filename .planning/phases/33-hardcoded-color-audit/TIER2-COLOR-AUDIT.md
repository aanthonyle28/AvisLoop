# Tier 2 Color Audit: Inline Tailwind Color-Scale Classes

**Audited:** 2026-02-19
**Scope:** `components/` directory (all subdirectories)
**Method:** `grep -rn` for all Tailwind color-scale utilities (bg-, text-, border- with named color scales)
**Purpose:** Input document for Phase 35 semantic token creation. No component files were modified.

---

## Executive Summary

**Total occurrences:** 210 across 51 files
**Action split:**
- 6 occurrences in 2 files: **Replace now** (existing `--destructive` and `--warning` map exists in plan-01)
- ~45 occurrences in 12 files: **Form validation red** — document for Phase 35 (`--error-text` token)
- ~159 occurrences in 37 files: **Status / warning / success / info / data-viz** — document for Phase 35

---

## Category Summary Table

| Category | Files | Occurrences | Phase 33 Action | Phase 35 Tokens Needed |
|----------|-------|-------------|-----------------|------------------------|
| A: Status Banners / Warning Boxes | 8 | 31 | Document | `--warning-bg`, `--warning`, `--warning-border` |
| B: Form Validation Errors | 12 | 44 | Document | `--error-text` |
| C: Status Badges / Job Indicators | 5 | 14 | Document | `--status-warning-bg/text`, `--status-success-bg/text` |
| D: SMS Consent / Customer Status | 2 | 6 | Document | Part of `--warning`, `--success`, `--destructive` |
| E: Notification Bell (red badge) | 1 | 1 | **Replace** (Phase 33 plan-01) | — |
| F: Success / Info Callouts | 10 | 28 | Document | `--success-bg`, `--success`, `--success-border`, `--info-bg`, `--info`, `--info-border` |
| G: Chart / Data Visualization | 4 | 12 | Keep inline | None — data-viz stays inline |
| H: Star Rating | 3 | 6 | Keep inline | None — yellow IS stars |
| I: Destructive Action Buttons | 1 | 4 | **Replace** (Phase 33 plan-01) | — |
| J: Danger Zone / Settings Warnings | 2 | 7 | Document | `--warning`, `--destructive` already exists |
| K: AI / Personalization Indicators | 2 | 5 | Document | `--warning`, `--success` (amber = AI quality) |
| L: Onboarding Completion States | 4 | 15 | Document | `--success-bg`, `--success`, `--success-border` |
| M: Marketing / Decorative | 2 | 11 | Keep inline | None — marketing scope, not app chrome |
| N: CSV Import Results | 3 | 17 | Document | `--success`, `--warning`, `--info` text colors |
| O: SMS Character Counter | 2 | 7 | Document | `--warning`, `--destructive` |
| P: Template Channel Badge | 1 | 2 | Document | `--info-bg/text` for email badge |

---

## Phase 35 Token Recommendations

### New Tokens to Create

These tokens do NOT exist in `globals.css` and are the primary Phase 35 deliverable:

```css
/* globals.css — add to :root and .dark */

/* Warning (amber) */
--warning-bg: 45 100% 96%;        /* Light: ~amber-50  | Dark: amber-950 equivalent */
--warning: 32 95% 44%;             /* Light: ~amber-600 | Dark: amber-400 */
--warning-border: 43 96% 77%;      /* Light: ~amber-200 | Dark: amber-800 */
--warning-foreground: 26 83% 14%; /* Light: ~amber-900 | Dark: amber-100 */

/* Success (green) */
--success-bg: 138 76% 97%;         /* Light: ~green-50  | Dark: green-950 */
--success: 142 71% 45%;            /* Light: ~green-600 | Dark: green-400 */
--success-border: 141 84% 85%;     /* Light: ~green-200 | Dark: green-800 */
--success-foreground: 140 84% 10%; /* Light: ~green-950 | Dark: green-100 */

/* Info (blue — distinct from primary which is already blue) */
--info-bg: 214 100% 97%;           /* Light: ~blue-50   | Dark: blue-950/30 */
--info: 217 91% 60%;               /* Light: ~blue-600  | Dark: blue-400 */
--info-border: 213 97% 87%;        /* Light: ~blue-200  | Dark: blue-900 */
--info-foreground: 224 64% 33%;    /* Light: ~blue-900  | Dark: blue-100 */

/* Error text (form validation — distinct from bg-destructive for buttons) */
--error-text: 0 72% 51%;           /* Light: ~red-600   | Dark: red-400 */
--error-text-muted: 0 84% 60%;     /* = --destructive   (same root) */
```

### Tailwind Config Additions

```js
// tailwind.config.ts — extend theme.extend.colors
{
  "warning": {
    DEFAULT: "hsl(var(--warning))",
    bg: "hsl(var(--warning-bg))",
    border: "hsl(var(--warning-border))",
    foreground: "hsl(var(--warning-foreground))"
  },
  "success": {
    DEFAULT: "hsl(var(--success))",
    bg: "hsl(var(--success-bg))",
    border: "hsl(var(--success-border))",
    foreground: "hsl(var(--success-foreground))"
  },
  "info": {
    DEFAULT: "hsl(var(--info))",
    bg: "hsl(var(--info-bg))",
    border: "hsl(var(--info-border))",
    foreground: "hsl(var(--info-foreground))"
  },
  "error": {
    text: "hsl(var(--error-text))"
  }
}
```

### Token Utility Classes (Phase 35 will use)

| Token | Utility Class | Replaces |
|-------|--------------|---------|
| `--warning-bg` | `bg-warning-bg` | `bg-amber-50 dark:bg-amber-950` |
| `--warning` | `text-warning` | `text-amber-600 dark:text-amber-400` |
| `--warning-border` | `border-warning-border` | `border-amber-200 dark:border-amber-800` |
| `--warning-foreground` | `text-warning-foreground` | `text-amber-800 dark:text-amber-300` |
| `--success-bg` | `bg-success-bg` | `bg-green-50 dark:bg-green-950` |
| `--success` | `text-success` | `text-green-600 dark:text-green-400` |
| `--success-border` | `border-success-border` | `border-green-200 dark:border-green-800` |
| `--success-foreground` | `text-success-foreground` | `text-green-800 dark:text-green-300` |
| `--info-bg` | `bg-info-bg` | `bg-blue-50 dark:bg-blue-950/30` |
| `--info` | `text-info` | `text-blue-600 dark:text-blue-400` |
| `--info-border` | `border-info-border` | `border-blue-200 dark:border-blue-900` |
| `--error-text` | `text-error-text` | `text-red-500`, `text-red-600` (form errors) |

### Quick-Win Replacements (existing tokens, no new token needed)

These can be replaced using **already-existing** tokens without waiting for Phase 35:

| File | Current | Replace With | Token Exists |
|------|---------|--------------|-------------|
| `components/layout/notification-bell.tsx:52` | `bg-red-500 text-white` | `bg-destructive text-destructive-foreground` | Yes |
| `components/settings/delete-account-dialog.tsx:58,111` | `bg-red-600 hover:bg-red-700 text-white` | `<Button variant="destructive">` | Yes |
| `components/settings/delete-account-dialog.tsx:87` | `focus:ring-red-500 focus:border-red-500` | `focus:ring-destructive/50 focus:border-destructive` | Yes |
| `components/settings/delete-account-dialog.tsx:94` | `text-red-600` | `text-destructive` | Yes |

Note: These quick-wins are already scheduled in Phase 33 plan-01 as part of the Tier 1+notification fixes.

---

## Per-Category File Inventory

### Category A: Status Banners / Warning Boxes

**Pattern:** `bg-amber-50 border border-amber-200 text-amber-600/700/800/900`
**Semantic meaning:** "Warning" — usage limits, deprecated features, missing configuration
**Phase 35 tokens:** `bg-warning-bg border-warning-border text-warning text-warning-foreground`

| File | Lines | Colors Used | Dark Mode | Notes |
|------|-------|-------------|-----------|-------|
| `components/billing/usage-warning-banner.tsx` | 79, 81, 83, 86 | `bg-amber-50`, `border-amber-200`, `text-amber-600`, `text-amber-800`, `text-amber-700` | None | Full warning banner — 4 different amber shades |
| `components/billing/subscription-status.tsx` | 59 | `text-amber-600 bg-amber-50` | None | Subscription warning inline |
| `components/billing/usage-display.tsx` | 18, 35, 59, 70 | `bg-amber-500`, `text-amber-600` | None | Progress bar color + warning text |
| `components/send/send-page-client.tsx` | 99, 102, 104, 107 | `bg-amber-50`, `border-amber-200`, `text-amber-600`, `text-amber-900`, `text-amber-700` | `dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 dark:text-amber-300 dark:text-amber-400` | Manual send deprecation banner — full dark mode pair |
| `components/settings/integrations-section.tsx` | 120, 128, 129, 133 | `bg-amber-50`, `border-amber-200`, `text-amber-600`, `text-amber-800`, `border-amber-300` | `dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300 dark:border-amber-700` | API key setup warning — full dark mode pair |
| `components/campaigns/campaign-form.tsx` | 167, 176 | `text-amber-500`, `text-amber-600` | `dark:text-amber-400` | AI personalization sparkle icon + tip text |

**Atomic replacement note:** `usage-display.tsx` has conditional logic (lines 18, 59) — `bg-amber-500` is set dynamically when usage >= 80%. Replace the full `if/else` block together.

---

### Category B: Form Validation Errors

**Pattern:** `text-red-500` or `text-red-600` on `<p>` elements under form fields
**Semantic meaning:** Field-level form validation error text
**Phase 35 tokens:** `text-error-text` (new token `--error-text: 0 72% 51%`)
**Why not `text-destructive` directly:** `--destructive` is `0 84% 60%` (lighter, for button backgrounds). Form error text needs a slightly darker shade for readability on white backgrounds. Phase 35 should decide: unify at `--destructive` or introduce `--error-text`.

| File | Lines | Colors Used | Occurrence Count |
|------|-------|-------------|-----------------|
| `components/login-form.tsx` | 50, 70, 76 | `text-red-500`, `text-red-700` | 3 |
| `components/sign-up-form.tsx` | 40, 54, 66, 69 | `text-red-500` | 4 |
| `components/forgot-password-form.tsx` | 62, 65 | `text-red-500` | 2 |
| `components/update-password-form.tsx` | 45, 58, 61 | `text-red-500` | 3 |
| `components/business-settings-form.tsx` | 38, 50, 68, 89, 115 | `text-red-500`, `text-red-600` | 5 (+ 2 banner lines in Cat F) |
| `components/customers/add-customer-sheet.tsx` | 108, 123, 137, 158 | `text-red-500` | 4 |
| `components/customers/edit-customer-sheet.tsx` | 88, 104, 119, 124 | `text-red-500` | 4 |
| `components/onboarding/steps/business-basics-step.tsx` | 113 | `text-red-600` | 1 |
| `components/onboarding/steps/business-step.tsx` | 76, 85, 103, 112 | `text-red-500`, `text-red-600` | 4 |
| `components/onboarding/steps/customer-step.tsx` | 82, 91, 97, 107, 123, 128 | `text-red-500`, `text-red-600` | 6 |
| `components/onboarding/steps/review-destination-step.tsx` | 117 | `text-red-600` | 1 |
| `components/onboarding/steps/services-offered-step.tsx` | 120 | `text-red-600` | 1 |

**Total:** ~38 occurrences across 12 files

**Required asterisk note:** `text-red-500` on `<span>*</span>` (required field indicator) appears in:
- `components/business-settings-form.tsx:38`
- `components/onboarding/steps/business-step.tsx:76`
- `components/onboarding/steps/customer-step.tsx:82, 97`

These asterisks should also use `text-error-text` or `text-destructive`.

---

### Category C: Status Badges / Job Indicators

**Pattern:** `bg-amber-100 text-amber-800` (scheduled/pending) or `bg-emerald-100 text-emerald-800` (completed/success)
**Semantic meaning:** Job status, enrollment status, active/inactive states
**Phase 35 tokens:** `--status-warning-bg/text` and `--status-success-bg/text` (distinct from existing `--status-*` tokens which are for send log status)

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/jobs/job-columns.tsx` | 58, 72, 118, 160 | `bg-amber-100 text-amber-800`, `bg-emerald-100 text-emerald-800`, `text-emerald-600`, `text-amber-600` | Job status badges, campaign enrollment status | Dark mode pairs present |
| `components/dashboard/kpi-widgets.tsx` | 32, 33 | `text-green-600`, `text-red-600` | KPI trend indicator (up = green, down = red) | Dark mode pairs present; conditional ternary |
| `components/dashboard/attention-alerts.tsx` | 27, 29, 31, 142 | `text-red-600`, `text-yellow-600`, `text-blue-600`, `text-green-600` | Alert type icon colors (error/warning/info/success) | Dark mode pairs; 4-case switch — replace atomically |
| `components/templates/template-list-item.tsx` | 69, 70 | `bg-blue-100 text-blue-700`, `bg-green-100 text-green-700` | Email vs SMS channel badge | Dark mode pairs present |
| `components/dashboard/ready-to-send-queue.tsx` | 76, 120 | `text-green-500`, `text-yellow-500` | Queue empty state checkmark, clock icon | Single-use decorative status icons |

**Atomic replacement note:** `attention-alerts.tsx` (lines 27-31) is a 4-case switch returning different colors per alert type. Must be replaced as a complete unit when a `--info`, `--warning`, `--success` token set exists. `kpi-widgets.tsx` (lines 32-33) is a ternary — replace both arms together.

---

### Category D: SMS Consent / Customer Status Colors

**Pattern:** `text-green-600` (opted in), `text-red-600` (opted out), `text-amber-600` (unknown)
**Semantic meaning:** Three-state SMS consent status display
**Phase 35 tokens:** Map to `text-success`, `text-destructive`, `text-warning` respectively

| File | Lines | Colors Used | Purpose |
|------|-------|-------------|---------|
| `components/customers/customer-detail-drawer.tsx` | 195, 214, 222 | `text-green-600`, `text-red-600`, `text-amber-600` | SMS consent status in detail view |
| `components/customers/edit-customer-sheet.tsx` | 139, 157, 163 | `text-green-600`, `text-red-600`, `text-amber-600` | SMS consent status in edit form |

**All have dark mode pairs:** `dark:text-green-400`, `dark:text-red-400`, `dark:text-amber-400`

**Atomic replacement note:** These are 3-state conditional returns — replace all 3 arms together when `text-success`, `text-destructive`, and `text-warning` tokens exist.

---

### Category E: Notification Bell Red Badge

**Status: REPLACE IN PHASE 33 PLAN-01 (already scheduled)**

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| `components/layout/notification-bell.tsx` | 52 | `bg-red-500 text-white` | `bg-destructive text-destructive-foreground` |

The remaining notification-bell colors (lines 71, 86, 90, 111, 115) are Category F (info/success) — document for Phase 35.

---

### Category F: Success / Info Callouts

**Pattern:** Green banners for completion states; blue boxes for informational callouts
**Semantic meaning:** Non-critical positive feedback (success) and contextual help (info)
**Phase 35 tokens:** `bg-success-bg border-success-border text-success text-success-foreground` and `bg-info-bg border-info-border text-info text-info-foreground`

#### F1: Success / Completion States

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/business-settings-form.tsx` | 23, 30 | `bg-red-50 border-red-200 text-red-800` (error), `bg-green-50 border-green-200 text-green-800` (success) | Form submit feedback banner | Two paired states — replace both arms together |
| `components/onboarding/setup-progress-pill.tsx` | 31, 37 | `bg-green-50 text-green-700 border-green-200`, `hover:bg-green-100` | Setup checklist pill | Dark mode pairs present |
| `components/onboarding/setup-progress-drawer.tsx` | 78, 115, 116 | `bg-green-100 text-green-600`, `bg-green-50`, `text-green-700` | Setup drawer completed item + footer tip | Dark mode pairs present |
| `components/review/thank-you-card.tsx` | 24, 25 | `bg-green-100`, `text-green-600` | Post-review success icon container | Dark mode pair present |
| `components/layout/notification-bell.tsx` | 71 | `text-green-500` | All-clear icon when no alerts | No dark mode pair |
| `components/customers/add-customer-sheet.tsx` | 89 | `bg-green-50 text-green-700` | Campaign enrollment info banner | Dark mode pair present |
| `components/onboarding/steps/review-destination-step.tsx` | 133 | `text-green-600` | Verified Google link checkmark | No dark mode pair |
| `components/onboarding/steps/send-step.tsx` | 68, 69 | `bg-green-100`, `text-green-600` | Onboarding complete success icon | Dark mode pair present |

#### F2: Info (Blue) Callout Boxes

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/onboarding/steps/sms-consent-step.tsx` | 83 | `border-blue-200 bg-blue-50` | SMS consent info callout | Dark mode: `dark:border-blue-900 dark:bg-blue-950/30` |
| `components/onboarding/steps/software-used-step.tsx` | 65, 66, 67 | `bg-blue-50 border-blue-200`, `text-blue-600`, `text-blue-900` | Software integration info box | Dark mode pairs present |
| `components/layout/notification-bell.tsx` | 86, 90 | `bg-blue-100`, `text-blue-600` | Info-type notification item icon | Dark mode pairs: `dark:bg-blue-900/30 dark:text-blue-400` |

---

### Category G: Chart / Data Visualization

**Status: KEEP INLINE — these are intentional data visualization colors, not UI chrome**

**Rationale:** Chart legend dots and data series colors are semantic data representations, not status colors. Tokenizing them would add indirection without benefit. If colors need changing, they should change as a deliberate data visualization choice, not a theme change.

| File | Lines | Colors Used | Purpose | Keep Reason |
|------|-------|-------------|---------|-------------|
| `components/campaigns/campaign-stats.tsx` | 61, 68, 75, 82, 99, 103, 107, 111 | `bg-green-500`, `bg-yellow-500`, `bg-gray-400`, `bg-red-500` | Campaign stats chart legend dots (sent/clicked/pending/failed) | Fixed data visualization palette |
| `components/send/bulk-send-columns.tsx` | 111, 120, 129 | `bg-green-500`, `bg-yellow-500` | Bulk send status indicator dots (success/pending) | Same dot pattern — keep consistent with campaign-stats |
| `components/send/bulk-send-confirm-dialog.tsx` | 213, 218 | `text-green-600`, `text-yellow-600` | Eligible/skipped count numbers | Data results summary |
| `components/billing/usage-display.tsx` | 18, 59 | `bg-amber-500` (conditional) | Usage bar threshold color | Threshold-based color (0-80% = primary, >80% = amber) — conditional data-driven |

**Note on `usage-display.tsx`:** The progress bar color IS data-driven (changes based on usage %) but also serves a warning function. This is a borderline case. Document as Category A (Warning) for Phase 35 — the amber progress bar communicates urgency, not just data.

---

### Category H: Star Ratings

**Status: KEEP INLINE — yellow is the universal star color, no token would add semantic value**

| File | Lines | Colors Used | Purpose |
|------|-------|-------------|---------|
| `components/review/satisfaction-rating.tsx` | 23, 24 | `text-yellow-400`, `text-yellow-300` | Interactive star rating widget (filled/hover states) |
| `components/feedback/feedback-card.tsx` | 50 | `text-yellow-400` | Star rating display in feedback cards |
| `components/send/stat-strip.tsx` | 105 | `text-yellow-400` | Average rating display stars |

---

### Category I: Destructive Action Buttons

**Status: REPLACE IN PHASE 33 PLAN-01 (already scheduled)**

| File | Lines | Current | Replacement |
|------|-------|---------|-------------|
| `components/settings/delete-account-dialog.tsx` | 58 | `bg-red-600 hover:bg-red-700 text-white` (raw `<button>`) | `<Button variant="destructive">` |
| `components/settings/delete-account-dialog.tsx` | 87 | `focus:ring-red-500 focus:border-red-500` | `focus:ring-destructive/50 focus:border-destructive` |
| `components/settings/delete-account-dialog.tsx` | 94 | `text-red-600` | `text-destructive` |
| `components/settings/delete-account-dialog.tsx` | 111 | `bg-red-600 hover:bg-red-700 text-white` (raw `<button>`) | `<Button variant="destructive">` |

---

### Category J: Danger Zone / Settings Warnings

**Pattern:** Red for danger zone section borders/headings; amber for settings-level warnings
**Phase 35 tokens:** `--destructive` already exists for the danger zone; `--warning` needed for amber

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/settings/settings-tabs.tsx` | 70 | `text-amber-600` | Danger zone pre-warning text ("Irreversible. Careful.") | `dark:text-amber-500` present |
| `components/settings/settings-tabs.tsx` | 116, 117 | `border-red-200`, `text-red-600` | Danger zone section border + heading | `dark:border-red-800 dark:text-red-400` present |

**Note:** `settings-tabs.tsx:116-117` could use `border-destructive/30 text-destructive` since `--destructive` already exists. This is a Phase 35 quick-win.

---

### Category K: AI / Personalization Indicators

**Pattern:** `text-amber-500` / `text-amber-600` for AI sparkle icon (amber = AI quality signal)
**Semantic meaning:** AI feature availability / quality indicator — amber is intentional (warm AI branding)
**Phase 35 tokens:** Could use `--warning` (amber) or establish a dedicated `--ai-accent` token

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/campaigns/campaign-form.tsx` | 167, 176 | `text-amber-500`, `text-amber-600` | AI personalization sparkle icon + "AI personalized" tip text | Dark mode: `dark:text-amber-400` |
| `components/settings/personalization-section.tsx` | 28, 133–135, 140–142, 148–150, 157–159 | `text-amber-500`, `text-amber-600`, `bg-amber-500`, `text-green-600`, `text-red-600`, `bg-green-500`, `bg-red-500` | AI health score display + sparkle icon | Conditional logic — 3-state health score (great/good/degraded) |

**Atomic replacement note:** `personalization-section.tsx` lines 133-135, 140-142, 148-150, 157-159 are four separate conditional functions, each with 3 cases. Replace all four as a complete unit in Phase 35.

---

### Category L: Onboarding Completion States

**Pattern:** Green checkmarks, green icon containers, green completion pills
**Semantic meaning:** Step completed / all done / user has finished an action
**Phase 35 tokens:** `bg-success-bg text-success` and `bg-success/10 border-success/20`

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/onboarding/setup-progress-pill.tsx` | 31, 37 | `bg-green-50 text-green-700 border-green-200`, `hover:bg-green-100` | Checklist pill (compact) | Dark mode pairs present |
| `components/onboarding/setup-progress-drawer.tsx` | 78, 115, 116 | `bg-green-100 text-green-600`, `bg-green-50`, `text-green-700` | Checklist drawer (expanded) | Dark mode pairs present |
| `components/onboarding/steps/send-step.tsx` | 68, 69, 93, 95, 97, 100, 142, 144, 146, 149, 221, 222 | `bg-green-100 text-green-600`, `bg-yellow-50 border-yellow-200 text-yellow-600/700/800`, `bg-red-50 border-red-200 text-red-600` | Multi-state onboarding step: success / warning / error | Full 3-state — replace atomically |
| `components/onboarding/steps/customer-import-step.tsx` | 180, 194, 198, 239 | `text-green-600`, `bg-red-50`, `text-green-600` | CSV import result states | Mix of success + error |

**Atomic replacement note:** `send-step.tsx` has all three states (green success, yellow warning, red error) in the same component. Replace all simultaneously.

---

### Category M: Marketing / Decorative

**Status: KEEP INLINE — marketing scope; not part of app design system**

| File | Lines | Colors Used | Purpose |
|------|-------|-------------|---------|
| `components/marketing/hero.tsx` | 98, 99, 100, 143 | `bg-red-400`, `bg-yellow-400`, `bg-green-400`, `fill-yellow-400 text-yellow-400` | macOS window dots (decorative), hero stars |
| `components/marketing/v2/animated-demo.tsx` | 31–33, 87–88, 116, 120, 123–125, 161 | `bg-red-400`, `bg-yellow-400`, `bg-green-400`, green success states, yellow stars | macOS window dots, animated success screen |

**Note:** The animated-demo green success states (lines 87-88, 116, 123-125) overlap with Category L semantically — they show campaign enrollment success. However, because they are marketing components demonstrating the product rather than app chrome, they should remain inline. If the app success colors change via tokens, update the marketing demo separately as a deliberate copy of those colors.

---

### Category N: CSV Import Results

**Pattern:** Green = created/valid, amber/yellow = needs review/skipped, red = invalid/error
**Semantic meaning:** Import operation outcome breakdown
**Phase 35 tokens:** `text-success`, `text-warning`, `text-destructive` for result counts

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/customers/csv-import-dialog.tsx` | 254, 258, 259, 261, 269, 272, 275 | `text-green-600`, `text-yellow-600`, `text-amber-600`, `bg-amber-50 border-amber-200 text-amber-700 text-amber-600` | Import result summary + phone review callout | Dark mode pairs present on banner |
| `components/customers/csv-preview-table.tsx` | 60, 61, 63, 74, 95, 97, 105, 107 | `text-yellow-600`, `bg-yellow-50`, `text-green-600`, `bg-yellow-50 text-yellow-800 border-yellow-300` | CSV row validity indicators + summary counts | Mixed yellow/green indicators |
| `components/jobs/csv-job-import-dialog.tsx` | 184, 188, 207, 214, 216, 260, 264, 265, 268 | `text-green-600`, `text-red-600`, `bg-red-50`, `text-blue-600`, `text-amber-600` | Job import result summary | Note: `text-blue-600` for "new customers" count — info color |

**Note on `csv-job-import-dialog.tsx:265`:** Uses `text-blue-600` for "New customers" count — this is informational data, not a status. Could use `text-info` when that token exists, or `text-foreground`. The current usage is defensible.

---

### Category O: SMS Character Counter

**Pattern:** `text-amber-600` (approaching limit) → `text-red-600` (over limit)
**Semantic meaning:** Progressive warning threshold for SMS character limits
**Phase 35 tokens:** `text-warning` (soft limit), `text-error-text` or `text-destructive` (hard limit)

| File | Lines | Colors Used | Purpose | Notes |
|------|-------|-------------|---------|-------|
| `components/send/sms-character-counter.tsx` | 48, 50, 62, 91 | `text-red-600`, `text-amber-600` | Character count threshold indicator | Dark mode pairs: `dark:text-red-400 dark:text-amber-400` |
| `components/templates/sms-preview.tsx` | 94, 95, 103, 111 | `text-red-600`, `text-yellow-600` | Template SMS character warning | No dark mode pairs |
| `components/templates/message-template-form.tsx` | 146, 161 | `text-yellow-600` | Template form character count | Dark mode: `dark:text-yellow-500` |

**Atomic replacement note:** `sms-character-counter.tsx` has two threshold levels (soft warning = amber, hard limit = red). Both must be replaced together to maintain the progressive warning UX. Same applies to `sms-preview.tsx`.

**Also affects stat-strip.tsx (send quota):**
| `components/send/stat-strip.tsx` | 43, 59, 66, 91, 128, 134 | `text-red-600`, `bg-red-600/primary`, `bg-red-50 text-red-600 border-red-200` | Send quota limit indicator + DNS warning badges | Dark mode pairs present |

---

### Category P: Template Channel Badge

**Pattern:** Blue for email, green for SMS — channel type indicator
**Phase 35 tokens:** Could use `bg-info-bg text-info` (email) and `bg-success-bg text-success` (SMS), or create `--channel-email` / `--channel-sms` tokens

| File | Lines | Colors Used | Purpose |
|------|-------|-------------|---------|
| `components/templates/template-list-item.tsx` | 69, 70 | `bg-blue-100 text-blue-700` (email), `bg-green-100 text-green-700` (SMS) | Template channel type badge |

**Dark mode pairs:** `dark:bg-blue-950 dark:text-blue-300` and `dark:bg-green-950 dark:text-green-300`

---

## Files That Can Use Existing Tokens (No New Token Needed)

These replacements can be made using tokens that already exist in `globals.css`:

| File | Current | Existing Token | Notes |
|------|---------|----------------|-------|
| `components/layout/notification-bell.tsx:52` | `bg-red-500 text-white` | `bg-destructive text-destructive-foreground` | Scheduled Phase 33 plan-01 |
| `components/settings/delete-account-dialog.tsx:58,111` | raw `bg-red-600` buttons | `<Button variant="destructive">` | Scheduled Phase 33 plan-01 |
| `components/settings/delete-account-dialog.tsx:94` | `text-red-600` | `text-destructive` | Scheduled Phase 33 plan-01 |
| `components/settings/settings-tabs.tsx:116-117` | `border-red-200 text-red-600` | `border-destructive/30 text-destructive` | Quick-win in Phase 35 |
| `components/send/stat-strip.tsx:59` | `bg-red-600` (at-limit bar) | `bg-destructive` | Quick-win in Phase 35 |

---

## Files to Leave Inline (Permanent — No Token Planned)

| File | Category | Reason |
|------|----------|--------|
| `components/campaigns/campaign-stats.tsx` | G: Data viz | Chart legend dots — fixed palette |
| `components/send/bulk-send-columns.tsx` | G: Data viz | Status dots matching chart-stats palette |
| `components/send/bulk-send-confirm-dialog.tsx` | G: Data viz | Result count colors |
| `components/review/satisfaction-rating.tsx` | H: Stars | Yellow IS the star color |
| `components/feedback/feedback-card.tsx` | H: Stars | Star display |
| `components/send/stat-strip.tsx:105` | H: Stars | Average rating stars |
| `components/marketing/hero.tsx` | M: Marketing | macOS dots + hero stars |
| `components/marketing/v2/animated-demo.tsx` | M: Marketing | Decorative demo colors |
| `components/ui/geometric-marker.tsx:17` | — | `lime` token already exists in tailwind config as accent-lime |

---

## Atomic Replacement Units (Phase 35 Must Replace Together)

These cannot be replaced piecemeal — all cases in each block must be updated simultaneously:

| Component | Lines | States | Replacement Approach |
|-----------|-------|--------|---------------------|
| `personalization-section.tsx` | 133-135, 140-142, 148-150, 157-159 | great/good/degraded (3-state) | 4 functions, 3 values each → `text-success/warning/destructive` + `bg-success/warning/destructive` |
| `attention-alerts.tsx` | 27-31 | error/warning/info/all-clear (4-state) | Replace 4-case switch returning icon color → `text-destructive/warning/info/success` |
| `send-step.tsx` | 68-69, 93-100, 142-149, 221-222 | success/warning/error (3-state) | Three banner types in one component → replace all together |
| `sms-character-counter.tsx` | 48-91 | soft-warning/hard-limit (2-state) | Both threshold colors → `text-warning/destructive` |
| `sms-preview.tsx` | 94-111 | warning/error (2-state) | Both threshold colors → `text-warning/destructive` |
| `customer-detail-drawer.tsx` | 195, 214, 222 | opted-in/opted-out/unknown (3-state) | All 3 arms → `text-success/destructive/warning` |
| `edit-customer-sheet.tsx` | 139, 157, 163 | opted-in/opted-out/unknown (3-state) | All 3 arms → `text-success/destructive/warning` |
| `kpi-widgets.tsx` | 32-33 | positive/negative (2-state) | Both arms of ternary → `text-success/destructive` |
| `business-settings-form.tsx` | 23, 30 | error/success (2-state) | Both banner divs → `bg-destructive/10 text-destructive` + `bg-success-bg text-success` |

---

## Phase 35 Execution Order Recommendation

1. **Define tokens** in `globals.css` (light + dark values for all 4 new token groups)
2. **Add to `tailwind.config.ts`** (utility class mapping)
3. **Batch replace by category** (not by file — category consistency matters more):
   - Category A (Warning banners) — highest visual impact, most common pattern
   - Category B (Form validation) — most file-count, low visual impact
   - Category F (Success/Info callouts) — medium impact
   - Category L (Onboarding states) — contained scope
   - Category C (Status badges) — wait until `--status-warning` naming is finalized
   - Category D (SMS consent) — small, replace as part of customer component pass
   - Category J (Danger zone) — quick-wins using existing `--destructive`
   - Category K (AI indicators) — decide on `--warning` vs dedicated `--ai-accent` first
   - Categories N, O, P (CSV results, char counter, channel badge) — last pass

4. **Leave Categories G, H, M inline** (data viz, stars, marketing)

---

## Verification Commands (for Phase 35 completion check)

```bash
# After Phase 35 completes — should return 0 lines for replaced categories
grep -rn "bg-amber-\|border-amber-\|text-amber-" components/ | grep -v "marketing/"
grep -rn "bg-green-\|border-green-\|text-green-" components/ | grep -v "marketing/" | grep -v "text-yellow-400"
grep -rn "bg-blue-[0-9]\|border-blue-[0-9]\|text-blue-[0-9]" components/ | grep -v "marketing/"
grep -rn "text-red-[0-9]\|bg-red-[0-9]\|border-red-[0-9]" components/ | grep -v "destructive"

# Data-viz / star colors that should remain
grep -rn "bg-green-500\|bg-yellow-500\|bg-gray-400\|bg-red-500" components/campaigns/
grep -rn "text-yellow-400" components/review/ components/feedback/ components/send/stat-strip.tsx
```

---

## Metadata

**Research base:** 33-RESEARCH.md (Phase 33 pre-plan research, 2026-02-19)
**Grep verified:** 210 occurrences across 51 files (components/ only)
**Not included:** `app/(dashboard)/` page-level inline colors (out of scope for component audit)
**App-level files with inline colors (for completeness):**
- `app/(dashboard)/campaigns/new/page.tsx:31-44` — `bg-blue-50 border-blue-200 text-blue-600/700/900` info tip box
- `app/(dashboard)/billing/page.tsx:70-74` — `bg-green-50 text-green-600/700/800` subscription success banner
- `app/(dashboard)/settings/page.tsx:104,164,165` — `text-amber-600 border-red-200 text-red-600` settings warnings

These app-level files should be included in Phase 35's file list but were excluded from this components-focused audit per the plan scope.

**Valid through:** Next significant component additions. Re-run grep commands before Phase 35 planning if > 2 weeks elapse.
