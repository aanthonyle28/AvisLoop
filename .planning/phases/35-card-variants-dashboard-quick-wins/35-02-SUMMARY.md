---
phase: 35
plan: 02
subsystem: design-system
tags: [css-tokens, tailwind, semantic-colors, design-tokens]

dependency-graph:
  requires:
    - "34-02: Warm palette token replacement verified"
    - "33: Tier 2 hardcoded color audit completed (210 occurrences identified)"
  provides:
    - "13 new semantic CSS custom properties (warning, success, info, error-text) in globals.css"
    - "4 Tailwind color groups (warning, success, info, error) in tailwind.config.ts"
    - "All utility classes: bg-warning-bg, text-warning, border-warning-border, text-warning-foreground, bg-success-bg, text-success, border-success-border, text-success-foreground, bg-info-bg, text-info, border-info-border, text-info-foreground, text-error-text"
  affects:
    - "35-04: Batch replacement of 210 hardcoded color occurrences (warning/success/info categories)"
    - "35-05: Error-text token replacement for form validation classes"

tech-stack:
  added: []
  patterns:
    - "Semantic token layering: CSS custom property → Tailwind color map → utility class"
    - "Light/dark token pairs with higher saturation for dark mode warm hues"

key-files:
  created: []
  modified:
    - "app/globals.css"
    - "tailwind.config.ts"

decisions:
  - "Token placement: after --status-reviewed-text, before --radius — maintains logical grouping order"
  - "Error group only exposes `text` key (not DEFAULT/bg/border) — error-text is form validation only, not a full badge color family"
  - "Info blue uses H=217 (distinct from --primary H=21) — prevents info states from visually conflating with primary actions"

metrics:
  duration: "< 5 minutes"
  completed: "2026-02-19"
---

# Phase 35 Plan 02: Semantic Token Infrastructure Summary

**One-liner:** Added 13 CSS custom properties and 13 Tailwind utility class mappings for warning, success, info, and error-text semantic color groups — prerequisite infrastructure for Plans 04 and 05 batch replacements.

## What Was Built

### globals.css — 13 new CSS custom properties

**Light mode (:root) additions:**

```css
/* Warning (amber — warm hue family) */
--warning-bg: 45 100% 96%;
--warning: 32 95% 44%;
--warning-border: 43 96% 77%;
--warning-foreground: 26 83% 14%;

/* Success (green) */
--success-bg: 138 76% 97%;
--success: 142 71% 45%;
--success-border: 141 84% 85%;
--success-foreground: 140 84% 10%;

/* Info (blue — distinct from --primary H=21) */
--info-bg: 214 100% 97%;
--info: 217 91% 60%;
--info-border: 213 97% 87%;
--info-foreground: 224 64% 33%;

/* Error text (form validation) */
--error-text: 0 72% 51%;
```

**Dark mode (.dark) additions:**

```css
/* Warning (amber) */
--warning-bg: 38 40% 14%;
--warning: 38 90% 56%;
--warning-border: 38 50% 25%;
--warning-foreground: 45 80% 85%;

/* Success (green) */
--success-bg: 142 30% 14%;
--success: 142 60% 50%;
--success-border: 142 40% 22%;
--success-foreground: 142 60% 85%;

/* Info (blue) */
--info-bg: 217 30% 14%;
--info: 217 80% 65%;
--info-border: 217 40% 25%;
--info-foreground: 217 60% 85%;

/* Error text */
--error-text: 0 80% 65%;
```

### tailwind.config.ts — 4 new color groups

```ts
warning: {
  DEFAULT: "hsl(var(--warning))",
  bg: "hsl(var(--warning-bg))",
  border: "hsl(var(--warning-border))",
  foreground: "hsl(var(--warning-foreground))",
},
success: {
  DEFAULT: "hsl(var(--success))",
  bg: "hsl(var(--success-bg))",
  border: "hsl(var(--success-border))",
  foreground: "hsl(var(--success-foreground))",
},
info: {
  DEFAULT: "hsl(var(--info))",
  bg: "hsl(var(--info-bg))",
  border: "hsl(var(--info-border))",
  foreground: "hsl(var(--info-foreground))",
},
error: {
  text: "hsl(var(--error-text))",
},
```

## Utility Classes Now Available

| Token Group | Utility Classes |
|-------------|----------------|
| Warning | `bg-warning-bg`, `text-warning`, `border-warning-border`, `text-warning-foreground` |
| Success | `bg-success-bg`, `text-success`, `border-success-border`, `text-success-foreground` |
| Info | `bg-info-bg`, `text-info`, `border-info-border`, `text-info-foreground` |
| Error | `text-error-text` |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add 13 semantic CSS custom properties | ccc7130 | app/globals.css |
| 2 | Add Tailwind color mappings | 1e6ea1d | tailwind.config.ts |

## Verification

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `grep "warning-bg" app/globals.css`: present in both :root and .dark sections
- `grep "success-bg" app/globals.css`: present in both :root and .dark sections
- `grep "info-bg" app/globals.css`: present in both :root and .dark sections
- `grep "error-text" app/globals.css`: present in both :root and .dark sections
- `grep "warning" tailwind.config.ts`: color group definition confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

Plans 04 and 05 can now proceed. All 13 semantic token groups are defined and mapped. The batch replacement of 210 hardcoded color-scale occurrences across 51 files can use these utility classes directly.
