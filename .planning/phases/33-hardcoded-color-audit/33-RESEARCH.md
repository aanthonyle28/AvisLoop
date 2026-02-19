# Phase 33: Hardcoded Color Audit — Research

**Researched:** 2026-02-18
**Domain:** Design System / Tailwind CSS Token Audit
**Confidence:** HIGH — all findings sourced directly from codebase inspection

---

## Summary

Phase 33 is a pure codebase cleanup phase with no external library dependencies. The goal is to replace every hardcoded color value (hex arbitrary values, `bg-white`, `bg-black` for layout, and inline Tailwind color-scale classes) with semantic CSS custom property tokens before Phase 34 (palette swap) runs.

The codebase has two distinct tiers of color hardcoding:

**Tier 1 — Structural (DS-04 core scope, 10 occurrences in 4 files):** These are hardcoded hex values in layout chrome (sidebar, page-header, app-shell, notification-bell). They are the primary target and the most risky to get wrong because they affect every page. Fixes are straightforward token substitutions.

**Tier 2 — Semantic status colors (206 occurrences, 54 files, excluding marketing):** These are Tailwind color-scale utilities like `bg-amber-50`, `text-red-600`, `border-green-200`. They represent status (success, warning, error, info) and data visualization (chart legend dots, rating stars). The success criteria for Phase 33 says to "replace or document for Phase 35 cleanup." Research recommends documenting rather than bulk-replacing all 206 because: (a) the token system has no `--warning`, `--success`, `--info` tokens yet, (b) creating 12+ new tokens to replace them is Phase 35 scope, and (c) indiscriminate replacement would create new technical debt.

**Primary recommendation:** Fix all 10 hex arbitrary values and `bg-white` layout uses in the 4 DS-04 files. Audit and categorize the 54 files with semantic color classes. Replace the highest-impact subset (notification-bell blue/amber, onboarding green pills, billing warning banner) with tokens where tokens exist; document the rest as Phase 35 candidates.

---

## Full Audit Results

### Tier 1: Hardcoded Hex Values (Arbitrary Tailwind Syntax)

**Total occurrences:** 10 across 4 files
**Grep command to verify zero hits after fix:** `grep -rn "bg-\[#\|text-\[#\|border-\[#" components/`

| File | Line | Current Value | Semantic Meaning | Replacement Token |
|------|------|--------------|-----------------|-------------------|
| `components/layout/app-shell.tsx` | 32 | `bg-[#F9F9F9]` | Page background (off-white shell) | `bg-background` |
| `components/layout/sidebar.tsx` | 89 | `bg-[#F2F2F2]` | Active nav item background | `bg-secondary` |
| `components/layout/sidebar.tsx` | 90 | `hover:bg-[#F2F2F2]/70` | Hover nav item background | `hover:bg-secondary/70` |
| `components/layout/sidebar.tsx` | 120 | `bg-white` | Sidebar panel background | `bg-card` |
| `components/layout/sidebar.tsx` | 120 | `border-[#E2E2E2]` | Sidebar right border | `border-border` |
| `components/layout/sidebar.tsx` | 126 | `border-[#E2E2E2]` | Header bottom border | `border-border` |
| `components/layout/sidebar.tsx` | 164 | `border-[#E2E2E2]` | Add Job section top border | `border-border` |
| `components/layout/sidebar.tsx` | 180 | `border-[#E2E2E2]` | Footer section top border | `border-border` |
| `components/layout/sidebar.tsx` | 195 | `hover:bg-[#F2F2F2]/70` | Account menu hover | `hover:bg-secondary/70` |
| `components/layout/notification-bell.tsx` | 39 | `hover:bg-[#F2F2F2]/70` | Notification trigger hover | `hover:bg-secondary/70` |
| `components/layout/page-header.tsx` | 28 | `bg-white` | Mobile header background | `bg-card` |
| `components/layout/page-header.tsx` | 28 | `border-[#E2E2E2]` | Mobile header bottom border | `border-border` |

**Note:** `sidebar.tsx` line 89 also has the paired dark side `dark:bg-muted` which must be kept (it's already a token). The replacement pattern is:
```
BEFORE: "bg-[#F2F2F2] dark:bg-muted text-foreground"
AFTER:  "bg-secondary dark:bg-muted text-foreground"
```

### Tier 1 Token Verification

The replacement tokens map correctly to existing `globals.css` values:

| Hex | Lightness | Token | Token Lightness | Delta |
|-----|-----------|-------|-----------------|-------|
| `#F9F9F9` | 97.6% | `--background: 0 0% 97.6%` | 97.6% | 0% (exact) |
| `#FFFFFF` (bg-white) | 100% | `--card: 0 0% 100%` | 100% | 0% (exact) |
| `#F2F2F2` | 94.9% | `--secondary: 0 0% 92%` | 92% | 2.9% |
| `#E2E2E2` | 88.6% | `--border: 0 0% 89%` | 89% | 0.4% (imperceptible) |

**The `#F2F2F2` → `bg-secondary` delta (2.9%):** The secondary token (92%) is slightly darker than the current active nav state (94.9%). This makes the active state _more_ visually distinct from the background, which is an improvement. The dark side already correctly uses `bg-muted` (15%) which provides good contrast. The `bg-secondary` token is already used for badge backgrounds and the secondary button variant — using it for the active nav state is semantically correct.

**`bg-white` → `bg-card`:** The card token (`0 0% 100%`) is pure white in light mode, matching `bg-white` exactly. In dark mode, `bg-card` is `0 0% 12%` which is already the dark mode equivalent — the sidebar currently already has `dark:bg-card` paired with `bg-white`, so this is a no-op for dark mode behavior.

---

### Tier 2: Inline Tailwind Color Scale Classes

**Total occurrences in app/components (excluding marketing):** 206 across 54 files

**Marketing pages excluded from scope** (see Scope Boundaries section).

#### Category A: Status Banners / Alert Boxes (replace or tokenize)

These are the highest-priority Tier 2 items because Phase 34 palette changes could make amber banners look wrong if hardcoded. The success criteria specifically names these.

| File | Lines | Colors Used | Current Pattern | Recommended Action |
|------|-------|------------|-----------------|-------------------|
| `components/billing/usage-warning-banner.tsx` | 79, 81, 83, 86 | `bg-amber-50`, `border-amber-200`, `text-amber-600/700/800` | Warning usage banner | Replace with `bg-warning/10 border-warning/30 text-warning-foreground` OR document for Phase 35 |
| `components/billing/subscription-status.tsx` | 59 | `text-amber-600 bg-amber-50` | Subscription warning | Same as above |
| `components/send/send-page-client.tsx` | 99, 102, 104, 107 | `bg-amber-50`, `border-amber-200`, `text-amber-600/700/900` | Manual send deprecation warning | Same |
| `components/settings/integrations-section.tsx` | 128, 129, 133 | `bg-amber-50/950`, `border-amber-200/800`, `text-amber-600/800` | Integrations warning | Same |
| `components/ai/preview-sample-card.tsx` | 81, 104 | `bg-amber-100/50`, `border-amber-200/800`, `text-amber-800/400` | AI model status | Same |
| `app/(dashboard)/campaigns/new/page.tsx` | 31, 33, 35, 38, 44 | `bg-blue-50`, `border-blue-200`, `text-blue-600/700/900` | Tip info box | Replace with `bg-primary/5 border-primary/20` or document |
| `components/onboarding/steps/sms-consent-step.tsx` | 83 | `bg-blue-50`, `border-blue-200` | Info callout | Same |
| `components/onboarding/steps/software-used-step.tsx` | 65, 66, 67 | `bg-blue-50`, `text-blue-600`, `text-blue-900` | Info callout | Same |

#### Category B: Form Validation Errors (keep as-is, document)

**Count:** ~40 occurrences across 12+ files

These are all `text-red-500`, `text-red-600`, `text-red-800` on form field error messages. They directly map to the existing `--destructive` token intent but using a different shade (`destructive` is 0 84% 60% = a specific red).

**Recommendation: Do NOT bulk-replace.** The current `text-red-500` / `text-red-600` for form errors is a common and correct pattern. Replacing them with `text-destructive` would change the shade imperceptibly and risks regressions. Document for Phase 35 cleanup when a proper `--error-text` token can be defined.

Files with form validation red text:
- `components/login-form.tsx` (50, 70, 76)
- `components/sign-up-form.tsx` (40, 54, 66, 69)
- `components/forgot-password-form.tsx` (62, 65)
- `components/update-password-form.tsx` (45, 58, 61)
- `components/business-settings-form.tsx` (23, 38, 50, 68, 89, 115)
- `components/customers/add-customer-sheet.tsx` (108, 123, 137, 158)
- `components/customers/edit-customer-sheet.tsx` (88, 104, 119, 124)
- `components/onboarding/steps/business-basics-step.tsx` (113)
- `components/onboarding/steps/business-step.tsx` (76, 85, 103, 112)
- `components/onboarding/steps/customer-step.tsx` (82, 91, 97, 107, 123, 128)
- `components/onboarding/steps/review-destination-step.tsx` (117)
- `components/onboarding/steps/services-offered-step.tsx` (120)

#### Category C: Status Badges / Inline Data Indicators (keep + document)

These are tight to the data they represent and are correct by design.

| File | Lines | Colors | Purpose | Action |
|------|-------|--------|---------|--------|
| `components/jobs/job-columns.tsx` | 58, 72, 118, 160 | `bg-amber-100`, `bg-emerald-100`, `text-amber-800`, `text-emerald-800` | Job status badges | Document for Phase 35 (need `--status-warning`, `--status-success` tokens) |
| `components/campaigns/campaign-stats.tsx` | 61, 68, 75, 82, 99, 103, 107, 111 | `bg-green-500`, `bg-yellow-500`, `bg-gray-400`, `bg-red-500` | Chart legend dots | Keep — these are data visualization colors, not UI chrome |
| `components/send/bulk-send-columns.tsx` | 111, 120, 129 | `bg-green-500`, `bg-yellow-500` | Status indicator dots | Keep — same rationale |
| `components/dashboard/kpi-widgets.tsx` | 32, 33 | `text-green-600`, `text-red-600` | Trend indicators | Document for Phase 35 |
| `components/dashboard/attention-alerts.tsx` | 27, 29, 31 | `text-red-600`, `text-yellow-600`, `text-blue-600` | Alert type icons | Document for Phase 35 |

#### Category D: SMS Consent / Customer Status Colors (keep + document)

| File | Lines | Colors | Purpose | Action |
|------|-------|--------|---------|--------|
| `components/customers/customer-detail-drawer.tsx` | 195, 214, 222 | `text-green-600`, `text-red-600`, `text-amber-600` | SMS consent status | Document for Phase 35 |
| `components/customers/edit-customer-sheet.tsx` | 139, 157, 163 | Same | SMS consent edit | Document for Phase 35 |

#### Category E: Notification Bell (named in DS-04 success criteria — replace)

| File | Line | Current | Replacement |
|------|------|---------|-------------|
| `components/layout/notification-bell.tsx` | 52 | `bg-red-500 text-white` (badge count) | `bg-destructive text-destructive-foreground` |
| `components/layout/notification-bell.tsx` | 71 | `text-green-500` (all-clear icon) | Document for Phase 35 (no success token) |
| `components/layout/notification-bell.tsx` | 86 | `bg-blue-100 dark:bg-blue-900/30` | Document for Phase 35 (no info token) |
| `components/layout/notification-bell.tsx` | 90 | `text-blue-600 dark:text-blue-400` | Document for Phase 35 |
| `components/layout/notification-bell.tsx` | 111 | `bg-amber-100 dark:bg-amber-900/30` | Document for Phase 35 |
| `components/layout/notification-bell.tsx` | 115 | `text-amber-600 dark:text-amber-400` | Document for Phase 35 |
| `components/layout/sidebar.tsx` | 106, 111 | `bg-red-500 text-white` (nav badge) | `bg-destructive text-destructive-foreground` |

#### Category F: Success/Info Banners (onboarding, settings)

| File | Lines | Colors | Action |
|------|-------|--------|--------|
| `components/onboarding/setup-progress-pill.tsx` | 31, 37 | `bg-green-50/950`, `text-green-700/300`, `border-green-200/800` | Onboarding completion pill | Document for Phase 35 |
| `components/onboarding/setup-progress-drawer.tsx` | 78, 115, 116 | `bg-green-100/900`, `text-green-600/400`, `text-green-700/300` | Setup drawer | Document for Phase 35 |
| `components/business-settings-form.tsx` | 23, 30 | `bg-red-50/950`, `bg-green-50/950`, full error/success blocks | Form submit feedback | Document for Phase 35 |
| `app/(dashboard)/billing/page.tsx` | 70, 71, 73, 74 | `bg-green-50`, `text-green-600/700/800` | Subscription success banner | Document for Phase 35 |
| `app/(dashboard)/settings/page.tsx` | 104, 164, 165 | `text-amber-600`, `border-red-200`, `text-red-600` | Danger zone + warning | Document for Phase 35 |

#### Category G: Chart/Rating Star Colors (intentional, keep)

| File | Lines | Colors | Action |
|------|-------|--------|--------|
| `components/review/satisfaction-rating.tsx` | 23, 24 | `text-yellow-400`, `text-yellow-300` | Star rating widget | Keep — yellow IS the star color, no token equivalent |
| `components/marketing/hero.tsx` | 143 | `fill-yellow-400 text-yellow-400` | Marketing star | Keep — marketing scope |
| `components/marketing/v2/animated-demo.tsx` | 31-33, 120 | Window dots (red/yellow/green), star fills | Keep — decorative |
| `components/feedback/feedback-card.tsx` | 50 | `text-yellow-400` | Star rating | Keep |
| `components/send/stat-strip.tsx` | 105 | `text-yellow-400` | Star ratings | Keep |

#### Category H: Delete Account Dialog Red Buttons

| File | Lines | Current | Replacement |
|------|-------|---------|-------------|
| `components/settings/delete-account-dialog.tsx` | 58, 111 | `bg-red-600 hover:bg-red-700 text-white` | `bg-destructive hover:bg-destructive/90 text-destructive-foreground` |
| `components/settings/delete-account-dialog.tsx` | 87 | `focus:ring-red-500 focus:border-red-500` | `focus:ring-destructive focus:border-destructive` |
| `components/settings/delete-account-dialog.tsx` | 94 | `text-red-600` | `text-destructive` |

**Note:** These are `<button>` elements, not using the `<Button>` component. Phase 33 should migrate them to use the `<Button variant="destructive">` component or at minimum replace the raw colors with `--destructive` tokens.

---

## Existing Token System (Complete Map)

From `app/globals.css` and `tailwind.config.ts`:

### Layout Tokens

| Token | Light Value | Dark Value | Utility Class | Current Use |
|-------|------------|------------|---------------|-------------|
| `--background` | `0 0% 97.6%` (#F8F8F8) | `0 0% 9%` | `bg-background` | Body bg |
| `--foreground` | `0 0% 9%` | `0 0% 98%` | `text-foreground` | Body text |
| `--card` | `0 0% 100%` (#FFF) | `0 0% 12%` | `bg-card` | Card surfaces |
| `--card-foreground` | `0 0% 9%` | `0 0% 98%` | `text-card-foreground` | Card text |
| `--popover` | `0 0% 100%` | `0 0% 12%` | `bg-popover` | Dropdown surfaces |
| `--popover-foreground` | `0 0% 9%` | `0 0% 98%` | `text-popover-foreground` | Dropdown text |
| `--primary` | `224 75% 43%` (blue) | `224 75% 55%` | `bg-primary` | CTAs, focus rings |
| `--secondary` | `0 0% 92%` (#EBEBEB) | `0 0% 15%` | `bg-secondary` | Secondary surfaces |
| `--muted` | `0 0% 97%` (#F7F7F7) | `0 0% 15%` | `bg-muted` | Muted surfaces |
| `--muted-foreground` | `0 0% 45%` | `0 0% 64%` | `text-muted-foreground` | Secondary text |
| `--accent` | Same as primary | Same | `bg-accent` | Accent (= primary) |
| `--destructive` | `0 84% 60%` (red) | Same | `bg-destructive` | Error/delete actions |
| `--border` | `0 0% 89%` (#E3E3E3) | `0 0% 20%` | `border-border` | All borders |
| `--input` | `0 0% 89%` | `0 0% 20%` | — | Input borders |
| `--ring` | `224 75% 43%` | `224 75% 55%` | — | Focus rings |

### Status Tokens (Already Exist)

| Token | Utility Class | Purpose |
|-------|--------------|---------|
| `--status-pending-bg/text` | `bg-status-pending-bg`, `text-status-pending-text` | Send log: pending |
| `--status-delivered-bg/text` | `bg-status-delivered-bg`, `text-status-delivered-text` | Send log: delivered |
| `--status-clicked-bg/text` | `bg-status-clicked-bg`, `text-status-clicked-text` | Send log: clicked |
| `--status-failed-bg/text` | `bg-status-failed-bg`, `text-status-failed-text` | Send log: failed |
| `--status-reviewed-bg/text` | `bg-status-reviewed-bg`, `text-status-reviewed-text` | Send log: reviewed |

### Missing Tokens (Needed for Phase 35)

The following semantic tokens do NOT exist and would need to be added to `globals.css` for full tokenization:

| Missing Token | Would Replace | Used for |
|--------------|--------------|---------|
| `--warning-bg` | `bg-amber-50/amber-950` | Usage warning banners |
| `--warning` | `text-amber-600` | Warning text |
| `--warning-border` | `border-amber-200/amber-800` | Warning box borders |
| `--success-bg` | `bg-green-50/green-950` | Success banners |
| `--success` | `text-green-600/green-400` | Success text |
| `--success-border` | `border-green-200/green-800` | Success box borders |
| `--info-bg` | `bg-blue-50/blue-950/30` | Info callout boxes |
| `--info` | `text-blue-600/blue-400` | Info icon text |
| `--info-border` | `border-blue-200/blue-900` | Info box borders |

**These 9 tokens are NOT in scope for Phase 33** — they belong to Phase 35 as planned.

---

## Per-File Inventory: Tier 1 (Must Fix in Phase 33)

### 1. `components/layout/app-shell.tsx`

**1 occurrence — 1 fix**

| Line | Current | Replacement | Notes |
|------|---------|-------------|-------|
| 32 | `bg-[#F9F9F9]` | `bg-background` | #F9F9F9 is 97.6% = exactly `--background` |

```tsx
// BEFORE:
<div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">

// AFTER:
<div className="flex min-h-screen bg-background">
// dark:bg-background removed — bg-background already uses the CSS var which responds to dark mode
```

**Dark mode note:** The `dark:bg-background` is redundant after this fix. `bg-background` uses `hsl(var(--background))` which automatically picks up the dark mode value from `.dark { --background: 0 0% 9% }`. The `dark:bg-background` override can be dropped.

### 2. `components/layout/sidebar.tsx`

**7 occurrences — 4 distinct patterns**

| Line(s) | Current | Replacement |
|---------|---------|-------------|
| 89 | `bg-[#F2F2F2]` | `bg-secondary` |
| 90, 195 | `hover:bg-[#F2F2F2]/70` | `hover:bg-secondary/70` |
| notification-bell:39 | `hover:bg-[#F2F2F2]/70` | `hover:bg-secondary/70` |
| 120 | `bg-white dark:bg-card` | `bg-card` |
| 120 | `border-[#E2E2E2] dark:border-border` | `border-border` |
| 126 | `border-[#E2E2E2] dark:border-border` | `border-border` |
| 164 | `border-[#E2E2E2] dark:border-border` | `border-border` |
| 180 | `border-[#E2E2E2] dark:border-border` | `border-border` |

**Dark mode notes:**
- `bg-white dark:bg-card` → `bg-card`: card token is white (#FFF) in light mode and `0 0% 12%` in dark. The `dark:bg-card` override becomes redundant since `bg-card` already switches.
- `border-[#E2E2E2] dark:border-border` → `border-border`: same logic — `border-border` is token-driven, automatically dark-mode aware.

### 3. `components/layout/page-header.tsx`

**2 occurrences — 1 line**

| Line | Current | Replacement |
|------|---------|-------------|
| 28 | `bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border` | `bg-card border-b border-border` |

### 4. `components/layout/notification-bell.tsx`

**1 Tier-1 occurrence**

| Line | Current | Replacement |
|------|---------|-------------|
| 39 | `hover:bg-[#F2F2F2]/70` | `hover:bg-secondary/70` |

---

## Per-File Inventory: Tier 2 Priority Items for Phase 33

The DS-04 success criteria (item 4) says "replaced with token-based equivalents **or documented for Phase 35 cleanup**." These items have no current token equivalents, so they should be documented. Only the items in `notification-bell` and `sidebar` that use `bg-red-500` on badge counts map to `--destructive` and should be fixed now.

### notification-bell.tsx — Badge Count (Fix in Phase 33)

| Line | Current | Replacement |
|------|---------|-------------|
| 52 | `bg-red-500 text-white` | `bg-destructive text-destructive-foreground` |

### sidebar.tsx — Nav Badge (Fix in Phase 33)

| Line | Current | Replacement |
|------|---------|-------------|
| 106 | `bg-red-500 text-white text-xs` | `bg-destructive text-destructive-foreground text-xs` |
| 111 | `bg-red-500 rounded-full` (collapsed dot) | `bg-destructive rounded-full` |

### delete-account-dialog.tsx — Destructive Buttons (Fix in Phase 33)

The raw `<button>` elements in delete-account-dialog.tsx bypass the design system. They should be migrated to use the `<Button>` component with `variant="destructive"`, which already uses `--destructive` token.

| Line | Current | Replacement |
|------|---------|-------------|
| 58 | `bg-red-600 hover:bg-red-700 text-white ...` (raw button) | `<Button variant="destructive">` |
| 111 | `bg-red-600 hover:bg-red-700 text-white ...` (raw button) | `<Button variant="destructive">` |
| 87 | `focus:ring-red-500 focus:border-red-500` | `focus:ring-destructive/50 focus:border-destructive` |
| 94 | `text-red-600` (error text) | `text-destructive` |

---

## Scope Boundaries

### In Scope (Phase 33)

1. **All files in `components/layout/`** — sidebar.tsx, app-shell.tsx, page-header.tsx, notification-bell.tsx (DS-04 explicit)
2. **`components/settings/delete-account-dialog.tsx`** — raw red buttons bypass design system; fix is clean
3. **Badge/count `bg-red-500`** in sidebar and notification-bell — maps cleanly to `--destructive`

### Document for Phase 35 (Not In Scope for Phase 33)

Status-color classes (`bg-amber-*`, `bg-green-*`, `bg-blue-*`, etc.) across:
- All form validation error text (`text-red-500/600`)
- All warning banners (`bg-amber-50`, `border-amber-200`)
- All success banners/pills (`bg-green-50`, `text-green-600`)
- All info callouts (`bg-blue-50`, `text-blue-600`)
- All chart legend dots and star rating fills
- Job status badges (`bg-amber-100`, `bg-emerald-100`)

**Rationale:** Phase 35 should define `--warning`, `--success`, `--info`, `--error` semantic tokens in globals.css with proper dark mode calibration, then batch-replace across all 54 files. Doing this piecemeal in Phase 33 without the token foundation would create new inconsistencies.

### Out of Scope (Marketing Pages — Separate Milestone)

Marketing pages (`app/(marketing)/`, `components/marketing/`) use:
- `bg-green-400` / `bg-red-400` / `bg-yellow-400` — macOS window dots (decorative)
- `fill-yellow-400` — star ratings
- `text-yellow-400` — star icons
- Various color treatments for landing page aesthetics

These are intentional design choices for the marketing page, independent of the app design system. They should be addressed in Phase 31 (Landing Page V2 Rewrite) if needed.

### `bg-black/80` Overlays — Intentional, Keep

`components/ui/dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx` all use `bg-black/80` or `bg-black/50` for modal overlays. This is a standard pattern for scrim backgrounds. The `bg-black/80` with opacity is NOT a hardcoded color — the `black` token in Tailwind is a utility, and the `/80` opacity makes it a semi-transparent scrim. This is semantically correct and should not be replaced.

---

## Risk Assessment

### Dark Mode Risks

**Safe replacements (no dark mode risk):**
- `bg-[#F9F9F9] dark:bg-background` → `bg-background` — token is dark-mode aware, remove redundant `dark:` override
- `bg-white dark:bg-card` → `bg-card` — card token handles both modes, remove `dark:` override
- `border-[#E2E2E2] dark:border-border` → `border-border` — border token handles both modes
- `hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70` → `hover:bg-secondary/70 dark:hover:bg-muted/70` — keep the `dark:hover:bg-muted/70` override because `secondary` in dark mode (15%) vs `muted` (also 15%) are the same value, but keeping explicit `dark:` override is fine for clarity

**Moderate risk (visual check required):**
- `bg-[#F2F2F2] dark:bg-muted` → `bg-secondary dark:bg-muted`: In light mode, secondary (92%) is slightly darker than F2F2F2 (94.9%). Active nav item will have slightly more contrast from the background — visually better, but do a visual smoke test to confirm.

**Zero risk:**
- `bg-card` replacing `bg-white dark:bg-card` — the dark side is identical
- `border-border` replacing `border-[#E2E2E2] dark:border-border` — identical to current dark behavior, and 0.4% lighter in light mode (imperceptible)

### Conditional Logic Risks

No hardcoded colors appear in conditional expressions (ternary or switch) for Tier 1. The `dark:` prefixed variants are straightforward paired overrides, not logic.

Tier 2 has conditional color returns in:
- `components/settings/personalization-section.tsx` (lines 133-135, 157-159) — returns `text-green-600`, `text-amber-600`, `text-red-600` based on health score
- `components/dashboard/attention-alerts.tsx` (line 27-31) — returns icon colors based on alert type
- `components/billing/usage-display.tsx` (lines 18, 59) — sets `bg-amber-500` based on usage percentage

These must be replaced **as a complete block** (all cases together) when Phase 35 runs, not partially. Document them as atomic replacement units.

---

## Standard Approach

Phase 33 is a no-library-required phase. No external tools needed — it is:
1. Find-and-replace of specific class strings in TSX files
2. One CSS variable addition (none needed — all replacements use existing tokens)
3. Lint + typecheck verification

**No new CSS variables required for Phase 33.** The existing token system covers all Tier 1 replacements. Phase 34 (palette swap) will modify the token values in `globals.css`, and because all layout chrome will then use tokens, the changes propagate automatically.

---

## Common Pitfalls

### Pitfall 1: Removing `dark:` Overrides Incorrectly

**What goes wrong:** Removing `dark:bg-card` from `bg-white dark:bg-card` without understanding that `bg-card` already handles dark mode.

**How to avoid:** When replacing `bg-white dark:bg-card` with `bg-card`, the `dark:` variant becomes redundant because `bg-card` maps to `hsl(var(--card))` which auto-switches in dark mode. Remove the `dark:` override.

**Exception:** `hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70` — here the dark override `dark:hover:bg-muted/70` should be kept even though `hover:bg-secondary/70` covers light mode. In dark mode, `secondary` (15%) and `muted` (15%) are the same value, but keeping the explicit `dark:` override maintains the previous behavior and makes intent clear.

### Pitfall 2: `bg-secondary` Visual Regression on Active Nav

**What goes wrong:** Active nav item becomes too dark (secondary is 92%, F2F2F2 was 94.9%).

**How to avoid:** Do a visual smoke test after the change. If the active state feels too pronounced, the alternative is to introduce a new `--sidebar-active` token in globals.css. However, at 2.9% lightness difference this is unlikely to be visible.

### Pitfall 3: Grepping Too Narrowly

**What goes wrong:** The success criteria checks `components/` but some hardcoded colors also exist in `app/` and `app/r/` (review funnel). Phase 33 scope is explicitly `components/layout/` for Tier 1, but the verification grep should be run against the full repo.

**How to avoid:** Run the verification grep against the entire codebase, not just `components/`:
```bash
grep -rn "bg-\[#\|text-\[#\|border-\[#" . --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v .next
```

### Pitfall 4: Breaking the Notification Badge

**What goes wrong:** `bg-red-500` on the count badge in sidebar and notification-bell is replaced with something that doesn't render correctly.

**How to avoid:** `bg-destructive text-destructive-foreground` is the correct pair. The `--destructive` token is `0 84% 60%` (a bright red), and `--destructive-foreground` is `0 0% 98%` (near-white). This matches the intent of `bg-red-500 text-white`. Check after replacement that the badge remains visible.

---

## Architecture Patterns

### Pattern: CSS Custom Property → Tailwind Token

The project uses the standard shadcn/ui token architecture:

1. CSS custom properties defined in `globals.css` under `:root` and `.dark`
2. `tailwind.config.ts` maps tokens: `"hsl(var(--token-name))"`
3. Tailwind generates utility classes: `bg-background`, `text-foreground`, etc.

Phase 34 works by changing the HSL values in `globals.css`. Every component using `bg-background` picks up the change automatically. Components still using `bg-[#F9F9F9]` will NOT pick up the change — that's why Phase 33 must run first.

### Pattern: Dark Mode Override Cleanup

When replacing `bg-white dark:bg-card` with `bg-card`:
- The Tailwind utility `bg-card` expands to `background-color: hsl(var(--card))`
- In `:root`, `--card: 0 0% 100%` (white)
- In `.dark`, `--card: 0 0% 12%` (dark surface)
- The `dark:bg-card` override is therefore redundant and should be removed

When the dark override is NOT redundant (keep it):
- `hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70` → `hover:bg-secondary/70 dark:hover:bg-muted/70`
  - Reason: the opacity modifier behavior may differ; keeping explicit dark override is safe

---

## Code Examples

### Replacing `sidebar.tsx` Active Nav State

```tsx
// BEFORE (sidebar.tsx lines 87-92):
className={cn(
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
  isActive
    ? "bg-[#F2F2F2] dark:bg-muted text-foreground"
    : "text-foreground/70 dark:text-muted-foreground hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70",
  collapsed && "justify-center px-2",
  item.badge && "relative"
)}

// AFTER:
className={cn(
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
  isActive
    ? "bg-secondary dark:bg-muted text-foreground"
    : "text-foreground/70 dark:text-muted-foreground hover:bg-secondary/70 dark:hover:bg-muted/70",
  collapsed && "justify-center px-2",
  item.badge && "relative"
)}
```

### Replacing `app-shell.tsx` Background

```tsx
// BEFORE:
<div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">

// AFTER:
<div className="flex min-h-screen bg-background">
```

### Replacing `sidebar.tsx` Panel Container

```tsx
// BEFORE:
"hidden md:flex flex-col h-screen bg-white dark:bg-card border-r border-[#E2E2E2] dark:border-border transition-all duration-300"

// AFTER:
"hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300"
```

### Replacing `page-header.tsx` Mobile Header

```tsx
// BEFORE:
<header className="md:hidden bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border">

// AFTER:
<header className="md:hidden bg-card border-b border-border">
```

### Replacing Nav Badge with Destructive Token

```tsx
// BEFORE (sidebar.tsx line 106):
<span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">

// AFTER:
<span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
```

---

## Verification Commands

**Success criteria grep (must return 0 lines):**
```bash
# Primary check (Phase 33 success criteria)
grep -rn "bg-\[#\|text-\[#\|border-\[#" components/

# Expanded check (full codebase)
grep -rn "bg-\[#\|text-\[#\|border-\[#" . --include="*.tsx" --include="*.ts" --include="*.css" | grep -v node_modules | grep -v .next

# Check layout files specifically
grep -rn "bg-white\b\|bg-black\b" components/layout/
```

**Lint and typecheck:**
```bash
pnpm lint
pnpm typecheck
```

---

## Open Questions

1. **`bg-secondary` for active nav — visual acceptance?**
   - What we know: secondary (92%) is 2.9% darker than F2F2F2 (94.9%)
   - What's unclear: whether this is perceptible in practice
   - Recommendation: Smoke test after change; if too dark, introduce `--sidebar-active: 0 0% 95%` token in globals.css as a narrow-scope token

2. **Should `dark:hover:bg-muted/70` be simplified to `dark:hover:bg-secondary/70`?**
   - What we know: in dark mode, `--secondary: 0 0% 15%` and `--muted: 0 0% 15%` are the same value
   - What's unclear: this is intentional (both are 15% in dark mode)
   - Recommendation: Leave `dark:hover:bg-muted/70` as-is to avoid churn and keep the prior behavior

3. **`delete-account-dialog.tsx` — Button component migration**
   - What we know: raw `<button>` elements don't use the design system
   - Recommendation: Replace with `<Button variant="destructive">` component. This is a small scope change that fixes the design system violation while addressing the color issue.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `app/globals.css` — complete token definitions verified
- Direct codebase inspection: `tailwind.config.ts` — complete token-to-utility mapping verified
- Direct codebase inspection: All 4 DS-04 target files read in full

### Secondary (HIGH confidence — codebase grep)
- `grep -rn "bg-\[#\|text-\[#\|border-\[#"` — exhaustive scan, 10 matches total
- `grep -rn "bg-amber-\|bg-blue-\|bg-green-\|bg-red-\|bg-yellow-"` — 206 matches in 54 files

### Tertiary (LOW confidence — not consulted)
- No external libraries or frameworks researched; phase has no external dependencies

---

## Metadata

**Confidence breakdown:**
- Full hex audit: HIGH — grep-verified against entire codebase
- Token mapping accuracy: HIGH — verified against actual CSS variable values with arithmetic
- Scope boundaries: HIGH — derived directly from DS-04 spec and codebase structure
- Visual regression risk: MEDIUM — lightness delta calculated, but final judgment is visual

**Research date:** 2026-02-18
**Valid until:** Until codebase changes; re-run greps before planning if significant changes made

## RESEARCH COMPLETE
