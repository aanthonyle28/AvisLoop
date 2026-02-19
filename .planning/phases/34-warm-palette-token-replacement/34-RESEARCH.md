# Phase 34: Warm Palette Token Replacement — Research

**Researched:** 2026-02-18
**Domain:** Design System / CSS Custom Properties / WCAG Contrast
**Confidence:** HIGH — all findings sourced from codebase inspection and verified arithmetic

---

## Summary

Phase 34 replaces all CSS custom property values in `globals.css` (`:root` and `.dark`) with warm amber/gold palette values, adds four new semantic tokens (`--highlight`, `--highlight-foreground`, `--surface`, `--surface-foreground`), and verifies WCAG AA contrast across all dashboard pages.

Three critical discoveries that must inform planning:

**Discovery 1 — Status badge component bypasses token system entirely.** `components/history/status-badge.tsx` uses `style={{ backgroundColor: config.bg, color: config.text }}` with hardcoded hex values. It will NOT respond to any CSS variable changes. Phase 34 must include migrating this component to use token-backed Tailwind classes, or the badges will remain cold-neutral on a warm background. This file was missed by Phase 33 (which only audited Tailwind arbitrary-value classes, not inline styles).

**Discovery 2 — All five status badge backgrounds blend into the warm page background.** The current badge BGs are at 88–96% lightness. The new warm background is 96% lightness with warm hue. The contrast ratio between badge BG and page BG drops to 1.0:1 for all five statuses — they become invisible as colored chips. Reducing badge BG lightness to 86–90% only improves this to ~1.1–1.3:1. The fix requires: (a) darkening badge BG tokens by 5–10 lightness points, (b) adding a visible border to each badge (border from the token), and (c) letting text contrast carry the primary distinguishability load.

**Discovery 3 — Chart-4 and Chart-5 fail on warm card surface.** These two chart tokens (43 74% 66% and 27 87% 67%) are amber/orange-adjacent. On the warm cream card background, they produce only 1.64:1 and 2.00:1 contrast respectively — visually washed out. Phase 34 should update these chart tokens to maintain visual distinctiveness.

**Primary recommendation:** Plan 34-01 covers globals.css changes (token values) + tailwind.config.ts additions (new tokens) + status-badge.tsx migration. Plan 34-02 covers visual review of all dashboard pages in both light and dark mode.

---

## Standard Stack

Phase 34 has no external library dependencies. It is pure CSS variable replacement + one component migration.

### Core (No Installation Needed)

| File | Purpose | Change Type |
|------|---------|-------------|
| `app/globals.css` | CSS custom property definitions | Replace all HSL values in `:root` and `.dark` blocks |
| `tailwind.config.ts` | Token-to-utility-class mapping | Add 4 new token entries (`highlight`, `surface`) |
| `components/history/status-badge.tsx` | Status badge component | Migrate from inline style to Tailwind classes |

### Supporting Tools Used in Research

| Tool | Purpose |
|------|---------|
| Node.js WCAG contrast calculator (custom script) | Verified all contrast ratios in this research |
| shadcn/ui theming docs | Confirmed token convention (`background/foreground` pattern) |
| tweakcn.com | No useful warm-palette presets found (uses OKLCH, not HSL) |

---

## Architecture Patterns

### Pattern: shadcn/ui CSS Variable Convention

The project follows the standard shadcn/ui token architecture:
1. CSS custom properties defined in `globals.css` under `:root` (light) and `.dark`
2. `tailwind.config.ts` maps tokens as `"hsl(var(--token-name))"`
3. Tailwind generates utility classes: `bg-background`, `text-foreground`, etc.
4. New tokens follow the `background/foreground` pair convention

**Every new token needs both a CSS variable in `globals.css` AND an entry in `tailwind.config.ts`.**

```css
/* globals.css */
:root {
  --highlight: 38 85% 90%;
  --highlight-foreground: 24 10% 10%;
  --surface: 36 12% 97%;
  --surface-foreground: 24 10% 10%;
}
.dark {
  --highlight: 38 85% 30%;
  --highlight-foreground: 36 15% 96%;
  --surface: 24 8% 15%;
  --surface-foreground: 36 15% 96%;
}
```

```ts
// tailwind.config.ts
highlight: {
  DEFAULT: "hsl(var(--highlight))",
  foreground: "hsl(var(--highlight-foreground))",
},
surface: {
  DEFAULT: "hsl(var(--surface))",
  foreground: "hsl(var(--surface-foreground))",
},
```

### Pattern: Dark Mode Independent Calibration

"Independently calibrated" means dark mode values are NOT lightness-inverted light mode values. Research finding from design system best practices: warm dark backgrounds require deliberate hue tinting with low saturation (5–8%), since pure-gray dark backgrounds look cold next to warm elements. Key calibration differences:

| Property | Light Mode Strategy | Dark Mode Strategy |
|----------|--------------------|--------------------|
| Background hue | H=36 (warm amber) | H=24 (warm brown-black) |
| Background saturation | 20% (visible warmth) | 8% (subtle warmth at low L) |
| Background lightness | 96% (near-white) | 10% (near-black) |
| Primary lightness | 42% (rich blue on cream) | 58% (lighter blue on dark) |
| Amber accent | 50% L (decorative only) | 52% L (AAA contrast on dark) |

### Pattern: status-badge.tsx Migration

The component currently uses a `statusConfig` object with hardcoded hex values passed to inline `style`. The migration converts each badge to Tailwind utility classes using the existing status token names:

```tsx
// BEFORE (bypasses token system):
const statusConfig = {
  pending: { bg: '#F3F4F6', text: '#101828', ... },
  ...
}
<Badge style={{ backgroundColor: config.bg, color: config.text }} ...>

// AFTER (uses token system):
const statusConfig = {
  pending: {
    className: 'bg-status-pending-bg text-status-pending-text border border-status-pending-text/20',
    ...
  },
  ...
}
<Badge className={cn(config.className, 'inline-flex ...')} ...>
```

Note: `border-0` must be removed from the badge base class to allow the border token to show.

---

## WCAG Contrast Analysis (Verified Arithmetic)

All values computed via standard relative luminance formula. Source: WCAG 2.1 specification.

### Success Criteria Values — Contrast Verification

| Pair | Contrast | WCAG Status | Notes |
|------|----------|-------------|-------|
| foreground (24 10% 10%) on background (36 20% 96%) | **16.09:1** | AAA | Far exceeds requirement |
| foreground on card (36 15% 99%) | **17.13:1** | AAA | Card is near-white warm |
| primary-fg (0 0% 98%) on primary (213 60% 42%) | **5.68:1** | **AA PASS** | Meets 4.5:1 requirement |
| primary on background — links | **5.46:1** | **AA PASS** | Usable for link color |
| amber accent (38 92% 50%) on background | **1.97:1** | FAIL | DECORATIVE ONLY — confirmed correct (cannot be used as text color) |
| amber accent on white card | **2.14:1** | FAIL | Same — decorative/icon use only |

### Muted Foreground Options

The current `--muted-foreground: 0 0% 45%` produces 4.38:1 on current background — just below the 4.5:1 AA threshold on card. A warm-shifted replacement at (30 6% 40%) passes comfortably:

| Option | On Warm Bg | On Warm Card | Verdict |
|--------|-----------|-------------|---------|
| Current (0 0% 45%) | 4.38:1 AA-large | 4.66:1 AA | Fails on background alone |
| Warm A (30 5% 40%) | 5.22:1 AA | 5.56:1 AA | Good — slightly dark |
| **Warm B (30 6% 40%)** | **5.21:1 AA** | **5.55:1 AA** | **Recommended** |
| Warm C (36 10% 43%) | 4.50:1 AA-large | 4.79:1 AA | Barely passes on bg |

**Recommendation:** Use `--muted-foreground: 30 6% 40%` — passes AA on both background and card.

### New Token Contrast (Verified)

| Token Pair | Light Mode | Dark Mode |
|-----------|-----------|-----------|
| `--highlight-foreground` on `--highlight` | 14.93:1 AAA | 5.16:1 AA |
| `--surface-foreground` on `--surface` | 16.41:1 AAA | 13.86:1 AAA |

---

## Recommended Complete Token Values

These values are research-derived starting points. The planner should treat them as concrete candidates that require visual verification per Plan 34-02.

### Light Mode (`:root`) — Complete Replacement

```css
:root {
  --background: 36 20% 96%;         /* warm cream — from spec */
  --foreground: 24 10% 10%;         /* warm near-black — from spec */
  --card: 36 15% 99%;               /* near-white warm (not pure white) */
  --card-foreground: 24 10% 10%;
  --popover: 36 15% 99%;
  --popover-foreground: 24 10% 10%;
  --primary: 213 60% 42%;           /* soft blue — from spec */
  --primary-foreground: 0 0% 98%;   /* white (5.68:1 contrast) */
  --secondary: 36 15% 92%;          /* warm gray */
  --secondary-foreground: 24 10% 10%;
  --muted: 36 10% 94%;              /* slightly darker warm muted */
  --muted-foreground: 30 6% 40%;    /* 5.21:1 on bg — PASS AA */
  --accent: 38 92% 50%;             /* amber — from spec (DECORATIVE ONLY) */
  --accent-foreground: 24 10% 10%;  /* dark text for amber contexts */
  --accent-lime: 75 85% 55%;        /* unchanged */
  --accent-coral: 0 85% 65%;        /* unchanged */
  --destructive: 0 84% 60%;         /* unchanged */
  --destructive-foreground: 0 0% 98%;
  --border: 36 12% 87%;             /* warm-tinted border */
  --input: 36 12% 87%;
  --ring: 213 60% 42%;              /* matches primary */
  /* NEW TOKENS */
  --highlight: 38 85% 90%;          /* amber wash for selection, diff view */
  --highlight-foreground: 24 10% 10%; /* dark text (14.93:1 AAA) */
  --surface: 36 12% 97%;            /* warm muted bg for inset panels */
  --surface-foreground: 24 10% 10%; /* (16.41:1 AAA) */
  /* Status tokens — lightness reduced for warm bg distinguishability */
  --status-pending-bg: 220 14% 90%;    /* was 96%, now 90% */
  --status-pending-text: 220 43% 11%;  /* unchanged */
  --status-delivered-bg: 194 38% 87%;  /* was 94%, now 87% */
  --status-delivered-text: 189 57% 40%; /* unchanged (2.91:1 — marginal, needs border) */
  --status-clicked-bg: 43 92% 82%;     /* was 54 96% 88%, shifted warmer + darker */
  --status-clicked-text: 30 100% 27%;  /* unchanged (5.71:1 on new bg — PASS AA) */
  --status-failed-bg: 0 100% 89%;      /* was 94%, now 89% */
  --status-failed-text: 358 100% 38%;  /* unchanged (4.33:1 — AA-large, needs border) */
  --status-reviewed-bg: 138 68% 86%;   /* was 92%, now 86% */
  --status-reviewed-text: 149 100% 25%; /* unchanged (4.15:1 — AA-large, needs border) */
  --radius: 0.5rem;
}
```

**Warning on status badge distinguishability:** Even after darkening badge BGs to 86–90%, the contrast vs warm page background is only 1.1–1.4:1. This means the badge background cannot be the sole visual differentiator. Each badge MUST have a visible border. The `status-badge.tsx` component must add `border border-status-*-text/20` or equivalent to each variant.

### Dark Mode (`.dark`) — Complete Replacement (Independently Calibrated)

```css
.dark {
  --background: 24 8% 10%;          /* warm-tinted near-black (NOT pure gray) */
  --foreground: 36 15% 96%;         /* warm near-white */
  --card: 24 8% 13%;                /* warm dark surface */
  --card-foreground: 36 15% 96%;
  --popover: 24 8% 13%;
  --popover-foreground: 36 15% 96%;
  --primary: 213 60% 58%;           /* lightened soft blue — PASS AA (5.13:1 w/ dark text) */
  --primary-foreground: 24 8% 10%;  /* dark text (better contrast on 58% L primary) */
  --secondary: 24 6% 16%;
  --secondary-foreground: 36 15% 96%;
  --muted: 24 6% 16%;
  --muted-foreground: 30 8% 62%;    /* 6.63:1 on dark bg — PASS AA */
  --accent: 38 85% 52%;             /* amber slightly desaturated for dark */
  --accent-foreground: 24 8% 10%;   /* dark text (8.04:1 AAA on dark bg) */
  --accent-lime: 75 85% 50%;        /* unchanged */
  --accent-coral: 0 85% 60%;        /* unchanged */
  --destructive: 0 84% 60%;         /* unchanged */
  --destructive-foreground: 36 15% 96%;
  --border: 24 6% 20%;
  --input: 24 6% 20%;
  --ring: 213 60% 58%;
  /* NEW TOKENS (dark mode) */
  --highlight: 38 85% 30%;          /* deep amber highlight for dark mode */
  --highlight-foreground: 36 15% 96%; /* light text (5.16:1 AA on dark amber) */
  --surface: 24 8% 15%;             /* slightly lighter than card */
  --surface-foreground: 36 15% 96%; /* (13.86:1 AAA) */
  /* Status tokens dark mode (kept from current where passing, adjusted where needed) */
  --status-pending-bg: 220 14% 20%;
  --status-pending-text: 220 14% 80%;
  --status-delivered-bg: 189 30% 20%;
  --status-delivered-text: 189 57% 55%;
  --status-clicked-bg: 40 40% 20%;
  --status-clicked-text: 30 80% 50%;
  --status-failed-bg: 0 40% 20%;
  --status-failed-text: 358 80% 55%;
  --status-reviewed-bg: 149 30% 20%;
  --status-reviewed-text: 149 80% 45%;
}
```

**Dark mode calibration rationale:**
- Backgrounds use H=24 (warm brown-black) not H=0 (pure gray)
- Saturation 6–8% (imperceptible at 10% lightness but perceptible at 13–16%)
- Primary uses dark text (10%) not white text: at 58% lightness, dark text gives 5.13:1 vs white's 3.36:1
- Amber accent on dark bg is AAA (8.04:1) — can be used for icon accents in dark mode
- Foreground uses H=36 (warm white) not pure H=0 white

---

## Status Badge Component — Critical Migration Plan

**File:** `C:\AvisLoop\components\history\status-badge.tsx`

**Current state:** Uses `statusConfig` with hardcoded hex values, passed via `style={{ backgroundColor, color }}`. Phase 33 did NOT cover this because it only audited Tailwind arbitrary-value syntax; inline styles were out of scope.

**Phase 34 must:**
1. Update CSS token values in `globals.css` for all 5 status pairs
2. Rewrite `status-badge.tsx` to use `bg-status-*-bg text-status-*-text border border-status-*-text/20` classes
3. Remove `border-0` from the Badge base class inside this component to allow the border token

**Pattern for migration:**

```tsx
// BEFORE:
const statusConfig: Record<SendStatus, { label: string; bg: string; text: string; Icon: ... }> = {
  pending: { label: 'Pending', bg: '#F3F4F6', text: '#101828', Icon: CircleNotch },
  ...
}
// Applied as:
<Badge style={{ backgroundColor: config.bg, color: config.text }} className="... border-0 ...">

// AFTER:
const statusConfig: Record<SendStatus, { label: string; className: string; Icon: ... }> = {
  pending: {
    label: 'Pending',
    className: 'bg-status-pending-bg text-status-pending-text border border-status-pending-text/20',
    Icon: CircleNotch
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-status-delivered-bg text-status-delivered-text border border-status-delivered-text/20',
    Icon: CheckCircle
  },
  clicked: {
    label: 'Clicked',
    className: 'bg-status-clicked-bg text-status-clicked-text border border-status-clicked-text/20',
    Icon: Cursor
  },
  failed: {
    label: 'Failed',
    className: 'bg-status-failed-bg text-status-failed-text border border-status-failed-text/20',
    Icon: WarningCircle
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-status-reviewed-bg text-status-reviewed-text border border-status-reviewed-text/20',
    Icon: Star
  },
  scheduled: {
    // No status token exists for scheduled — keep hardcoded or add new token
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    Icon: CheckCircle
  },
}
// Applied as:
<Badge className={cn(config.className, 'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full')}>
```

Note: The `scheduled` status has no CSS token equivalent. It can use hardcoded Tailwind color-scale classes for now (Phase 35 scope to tokenize).

---

## New Semantic Tokens: Use Cases

### `--highlight` / `--highlight-foreground`

**Purpose:** Amber wash for selection states, search result highlighting, AI diff view.

**Current use in codebase:** `components/ai/preview-diff.tsx` uses `bg-primary/15 text-primary` for diff-added spans. With the warm palette, this should shift to `bg-highlight text-highlight-foreground` to create an amber-tinted highlight instead of blue-tinted.

**Also used for:** Autocomplete dropdown hover states in `components/jobs/customer-autocomplete.tsx` (currently `bg-accent`). Since `--accent` is now amber, `bg-accent` hover state becomes amber. This may be too strong — `bg-highlight` (lighter amber wash at 90% L) would be more appropriate.

**Light mode value:** `38 85% 90%` — very light amber wash (14.93:1 text contrast, AAA)
**Dark mode value:** `38 85% 30%` — deep amber (5.16:1 text contrast, AA)

### `--surface` / `--surface-foreground`

**Purpose:** Elevated/inset panel surface, distinct from both `--card` (bright) and `--background` (page).

**Use cases:**
- Inner panels within cards (e.g., code blocks, preview panes)
- Collapsible detail sections (`details/summary` patterns)
- Form field background when distinguishable from card is needed

**Light mode value:** `36 12% 97%` — slightly off-white warm (16.41:1 text contrast, AAA)
**Dark mode value:** `24 8% 15%` — slightly lighter than card's 13% (13.86:1 AAA)

**Tailwind config entry:**

```ts
// In tailwind.config.ts colors section:
highlight: {
  DEFAULT: "hsl(var(--highlight))",
  foreground: "hsl(var(--highlight-foreground))",
},
surface: {
  DEFAULT: "hsl(var(--surface))",
  foreground: "hsl(var(--surface-foreground))",
},
```

---

## Chart Token Analysis

Chart tokens 4 and 5 become problematic on warm backgrounds:

| Token | Value | On Warm Card Contrast | Issue |
|-------|-------|----------------------|-------|
| `--chart-1` | `12 76% 61%` | 3.04:1 | OK for data viz (large) |
| `--chart-2` | `173 58% 39%` | 3.25:1 | OK for data viz (large) |
| `--chart-3` | `197 37% 24%` | 9.73:1 | Excellent |
| `--chart-4` | `43 74% 66%` | **1.64:1** | FAIL — amber-adjacent, washes out |
| `--chart-5` | `27 87% 67%` | **2.00:1** | FAIL — orange-adjacent, washes out |

Chart tokens are for data visualization (bar charts, pie charts, line graphs). On the current neutral background they rely on hue contrast; on a warm background, amber/orange hues merge with the page.

**Recommendation for chart-4 and chart-5:** Shift to hues that maintain contrast on warm surfaces. Options:
- chart-4: `43 74% 66%` → `280 50% 55%` (purple — distinct on warm background)
- chart-5: `27 87% 67%` → `340 65% 55%` (rose/pink — distinct on warm)

This is a planning decision. The planner should include chart token review in Plan 34-01.

---

## `--accent` Usage Impact Analysis

Since `--accent` changes from blue (224 75% 43%) to amber (38 92% 50%), all components using `bg-accent`, `text-accent`, `hover:bg-accent`, or `focus:bg-accent` will change color. The impact is:

| Component | Usage | Impact of Accent → Amber |
|-----------|-------|--------------------------|
| `components/ui/select.tsx` | `focus:bg-accent focus:text-accent-foreground` | Selected item in dropdown turns amber — potentially unexpected |
| `components/ui/dropdown-menu.tsx` | `focus:bg-accent data-[state=open]:bg-accent` | Focused menu items turn amber |
| `components/ui/dialog.tsx` | `data-[state=open]:bg-accent` | Dialog close button open state turns amber |
| `components/ui/button.tsx` | `hover:bg-accent hover:text-accent-foreground` | Outline and ghost buttons hover state turns amber |
| `components/jobs/customer-autocomplete.tsx` | `bg-accent` for hover/highlight | Autocomplete hover turns amber |

**The "focus:bg-accent" usage on dropdowns and selects is the most significant concern.** These focus states currently render as blue (matching the primary color for interactive affordance). Changing them to amber creates a disconnect from the primary color. The planner must decide: either (a) accept amber focus states on these controls, or (b) change these to use `hover:bg-muted` or `hover:bg-secondary` instead of `hover:bg-accent`.

**Research recommendation:** For interactive focus states, `hover:bg-muted` is more semantically neutral than `hover:bg-accent`. The `--accent` token in this project currently duplicates `--primary`. After the change, `--accent` becomes amber (decorative) while `--primary` stays blue (interactive). Interactive focus states should use `bg-primary/10` or `bg-muted`, not `bg-accent`. This is a UI component cleanup that should happen in Plan 34-01.

---

## Dashboard Pages to Review (Plan 34-02)

All 8 dashboard pages must be visually reviewed in both light and dark mode:

| Page | Route | Primary Risk Areas |
|------|-------|-------------------|
| Dashboard | `/dashboard` | KPI widgets, attention alerts (text-red/yellow/blue in alerts) |
| Jobs | `/jobs` | Job status badges (amber/emerald hardcoded in job-columns.tsx) |
| Campaigns | `/campaigns` | Campaign stat bars, active/paused badges |
| Analytics | `/analytics` | Charts (chart-4, chart-5 on warm background), service breakdown |
| Customers | `/customers` | SMS consent colors (green/amber/red hardcoded in detail drawer) |
| Activity/History | `/history` | Status badges (ALL FIVE rendered side-by-side) |
| Feedback | `/feedback` | Star ratings (yellow-400 hardcoded), feedback cards |
| Send | `/send` | Warning banner (amber-50 hardcoded), quick send |
| Billing | `/billing` | Success/warning banners (green/amber hardcoded) |
| Settings | `/settings` | Warning zones (amber/red hardcoded) |

**Pages with highest risk:** History (status badges), Analytics (charts), Dashboard (hardcoded alert colors).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| WCAG contrast verification | Custom contrast checker | Use the arithmetic formula in this research (verified) |
| Status badge migration | New badge component from scratch | Update existing `statusConfig` object pattern |
| Dark mode palette generation | Algorithmic inversion | Manual independent calibration (spec requires this) |
| New tokens | New CSS architecture | Follow existing `hsl(var(--token))` shadcn/ui pattern |

---

## Common Pitfalls

### Pitfall 1: Assuming `--accent` Change Only Affects Decorative Elements

**What goes wrong:** Changing `--accent` from blue to amber without auditing all `bg-accent` usages. The dropdown-menu, select, dialog, and button components all use `focus:bg-accent` for interactive focus states.

**Why it happens:** The current project treats `--accent` as identical to `--primary` (same blue value). After the change, they diverge — primary stays blue, accent becomes amber.

**How to avoid:** Before committing globals.css changes, update the UI components that use `focus:bg-accent` to use `hover:bg-muted` or `focus:bg-primary/10` instead. This maintains interactive blue-affordance while letting amber be purely decorative.

**Warning signs:** Dropdown items turning amber on hover/focus; dialog close button showing amber wash when dialog opens.

### Pitfall 2: Status Badge Backgrounds Invisible on Warm Page

**What goes wrong:** The status badge backgrounds (88–96% lightness) nearly disappear against the warm cream background (96% lightness). The badge colors relied on hue contrast against a neutral gray background. Against a warm hue, the hue contrast is reduced.

**Why it happens:** Perceptual luminance similarity at the same lightness level. Even different hues at 96% L have near-identical relative luminance.

**How to avoid:** (a) Update status token BG values to 86–90% L in globals.css; (b) add a border to each status badge using `border-status-*-text/20`; (c) verify side-by-side in Plan 34-02 visual review.

**Warning signs:** During visual review, if you can't distinguish status badges from the card background without the text/icon, the lightness is still too high.

### Pitfall 3: Dark Mode Primary Foreground Text

**What goes wrong:** Dark mode primary was previously using dark text (`0 0% 9%`) on primary background. At the new primary lightness (58%), dark text gives 5.13:1 (PASS AA) but white text gives only 3.36:1 (FAIL AA). The dark mode primary foreground must stay dark, not flip to white.

**Why it happens:** Assuming primary in dark mode should use light foreground text (as is common for dark primaries). At 58% lightness, a blue is above the 50% perceptual midpoint, so dark text is actually more readable.

**How to avoid:** Keep `--primary-foreground` in dark mode pointing to the warm dark color `24 8% 10%`, not to `0 0% 98%`. The contrast verification table above shows 5.13:1 vs 3.36:1.

### Pitfall 4: chart-4 and chart-5 Wash Out

**What goes wrong:** The amber (43 74% 66%) and orange (27 87% 67%) chart tokens fail to render visibly on the warm cream card surface — only 1.64:1 and 2.00:1 contrast.

**Why it happens:** Chart colors that relied on hue contrast against neutral backgrounds lose their distinctiveness when the background itself is warm.

**How to avoid:** Update chart-4 and chart-5 to hues that contrast well with warm surfaces (purple, rose, or cool green). Check analytically before committing.

### Pitfall 5: status-badge.tsx Not Updated

**What goes wrong:** Developer updates globals.css, verifies visual review in browser — but status badges still show cold colors because the component uses inline `style`, not CSS variables.

**Why it happens:** Phase 33 only audited Tailwind arbitrary-value syntax (`bg-[#hex]`), not inline style props. The file was not flagged.

**How to avoid:** Plan 34-01 must explicitly include `status-badge.tsx` migration as a task. It is NOT optional.

---

## Code Examples

### Complete globals.css Light Mode Block

```css
@layer base {
  :root {
    --background: 36 20% 96%;
    --foreground: 24 10% 10%;
    --card: 36 15% 99%;
    --card-foreground: 24 10% 10%;
    --popover: 36 15% 99%;
    --popover-foreground: 24 10% 10%;
    --primary: 213 60% 42%;
    --primary-foreground: 0 0% 98%;
    --secondary: 36 15% 92%;
    --secondary-foreground: 24 10% 10%;
    --muted: 36 10% 94%;
    --muted-foreground: 30 6% 40%;
    --accent: 38 92% 50%;
    --accent-foreground: 24 10% 10%;
    --accent-lime: 75 85% 55%;
    --accent-coral: 0 85% 65%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 36 12% 87%;
    --input: 36 12% 87%;
    --ring: 213 60% 42%;
    --highlight: 38 85% 90%;
    --highlight-foreground: 24 10% 10%;
    --surface: 36 12% 97%;
    --surface-foreground: 24 10% 10%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;    /* NEEDS UPDATE — see Chart Token Analysis */
    --chart-5: 27 87% 67%;    /* NEEDS UPDATE — see Chart Token Analysis */
    --status-pending-bg: 220 14% 90%;
    --status-pending-text: 220 43% 11%;
    --status-delivered-bg: 194 38% 87%;
    --status-delivered-text: 189 57% 40%;
    --status-clicked-bg: 43 92% 82%;
    --status-clicked-text: 30 100% 27%;
    --status-failed-bg: 0 100% 89%;
    --status-failed-text: 358 100% 38%;
    --status-reviewed-bg: 138 68% 86%;
    --status-reviewed-text: 149 100% 25%;
    --radius: 0.5rem;
  }
```

### tailwind.config.ts Addition

```ts
// Add after existing accent entry:
highlight: {
  DEFAULT: "hsl(var(--highlight))",
  foreground: "hsl(var(--highlight-foreground))",
},
surface: {
  DEFAULT: "hsl(var(--surface))",
  foreground: "hsl(var(--surface-foreground))",
},
```

### UI Components to Update (accent → muted for focus states)

Files where `focus:bg-accent` should become `focus:bg-muted` or `hover:bg-muted`:

```tsx
// components/ui/select.tsx — line 121:
// BEFORE: "focus:bg-accent focus:text-accent-foreground"
// AFTER:  "focus:bg-muted focus:text-foreground"

// components/ui/dropdown-menu.tsx — lines 30, 87, 103, 127:
// BEFORE: "focus:bg-accent data-[state=open]:bg-accent"
// AFTER:  "focus:bg-muted data-[state=open]:bg-muted"

// components/ui/button.tsx — ghost and outline variants:
// BEFORE: "hover:bg-accent hover:text-accent-foreground"
// AFTER:  "hover:bg-muted hover:text-foreground"
// (outline): "hover:bg-secondary hover:text-foreground" may be more appropriate
```

**Note:** This is a semantics judgment call. The planner should document these as deliberate decisions.

---

## Open Questions

1. **Chart-4 and Chart-5 replacement values**
   - What we know: Current values (43 74% 66% and 27 87% 67%) fail on warm card (1.64:1 and 2.00:1)
   - What's unclear: Whether charts actually render on card surface or on white background
   - Recommendation: Investigate where chart tokens are used (recharts? custom SVG?) and what their rendering surface is. If they're SVG strokes on white, the contrast may be moot. If they're legend dots on card bg, they fail.

2. **`focus:bg-accent` in UI primitives — replace or keep**
   - What we know: Changing accent to amber makes all dropdown/select focus states amber
   - What's unclear: Whether amber focus is acceptable UX (it's unusual but not incorrect)
   - Recommendation: Replace with `focus:bg-muted` for semantic correctness. But if the visual result during Plan 34-02 review is acceptable, amber focus states could be kept intentionally as a warm-palette design choice.

3. **`scheduled` status in status-badge.tsx — add token or use Tailwind color-scale**
   - What we know: `scheduled` uses `rgba(159, 44, 134, 0.1)` purple bg and `#9F2C86` text — no token exists
   - What's unclear: Whether Phase 34 should add `--status-scheduled-*` tokens or leave as hardcoded
   - Recommendation: Leave as Tailwind color-scale (`bg-purple-100/10 text-purple-700`) for now; document for Phase 35 which adds the token infrastructure for warning/info/success states.

4. **`--card` warm shift — pure white vs near-white**
   - What we know: current `--card: 0 0% 100%` is pure white; recommended `36 15% 99%` is near-white warm
   - What's unclear: Whether near-white warm (99% L) is visually distinct enough from white at 100% L
   - Recommendation: Use `36 15% 99%` as specified. The warm hue tinting at 99% L creates the warmth without being a visible color at normal viewing.

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection: `C:\AvisLoop\app\globals.css` — current token values verified in full
- Direct codebase inspection: `C:\AvisLoop\tailwind.config.ts` — complete token mapping verified
- Direct codebase inspection: `C:\AvisLoop\components\history\status-badge.tsx` — hardcoded hex confirmed
- Direct codebase inspection: `C:\AvisLoop\components\ai\preview-diff.tsx` — highlight token use case confirmed
- Arithmetic: Custom Node.js WCAG contrast calculator, formula from WCAG 2.1 spec Section 1.4.3

### Secondary (MEDIUM confidence)

- shadcn/ui theming docs (ui.shadcn.com/docs/theming) — confirmed `background/foreground` pair convention
- Dark mode design system best practices (atmos.style) — confirmed "independent calibration" principle: ~20 points lower saturation for accent colors in dark mode; avoid pure black

### Tertiary (LOW confidence)

- tweakcn.com — checked for warm preset values; found OKLCH-based values (different color space than project); not used
- WebSearch on warm palette dark mode design — directional guidance on warm-tinted backgrounds; not specific values

---

## Metadata

**Confidence breakdown:**
- WCAG contrast calculations: HIGH — verified arithmetic
- Token value recommendations: MEDIUM — derived from spec values + arithmetic; visual verification still required per Plan 34-02
- status-badge.tsx diagnosis: HIGH — direct code inspection confirms inline style bypass
- Dark mode calibration: MEDIUM — principles derived from design system research; specific values are starting points for visual validation

**Research date:** 2026-02-18
**Valid until:** Until codebase changes in globals.css, tailwind.config.ts, or status-badge.tsx
