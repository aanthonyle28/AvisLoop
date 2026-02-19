---
phase: 35-card-variants-dashboard-quick-wins
plan: "04"
subsystem: ui
tags: [semantic-tokens, design-system, tailwind, dark-mode, color-audit]

requires:
  - phase: 35-02
    provides: "13 CSS custom properties (--warning-*, --success-*, --info-*, --error-text) + Tailwind utility classes"

provides:
  - "~100 hardcoded amber/red color-scale classes replaced with semantic tokens across 24 files"
  - "Categories A (warning banners), B (form validation), J (danger zone), K (AI indicators), O (SMS counters) fully tokenized"
  - "All dark: overrides removed where semantic tokens now handle mode-switching"

affects:
  - 35-05

tech-stack:
  added: []
  patterns:
    - "bg-warning-bg + border-warning-border + text-warning + text-warning-foreground for warning banners (not amber-*)"
    - "text-error-text for all form validation error messages and required asterisks"
    - "border-destructive/30 + text-destructive for danger zone sections"
    - "text-warning (soft) + text-destructive (hard) for SMS character counter thresholds"
    - "text-success/text-warning/text-destructive for three-state health indicators"

key-files:
  created: []
  modified:
    - components/billing/usage-warning-banner.tsx
    - components/billing/subscription-status.tsx
    - components/billing/usage-display.tsx
    - components/send/send-page-client.tsx
    - components/settings/integrations-section.tsx
    - components/campaigns/campaign-form.tsx
    - components/settings/personalization-section.tsx
    - components/login-form.tsx
    - components/sign-up-form.tsx
    - components/forgot-password-form.tsx
    - components/update-password-form.tsx
    - components/business-settings-form.tsx
    - components/customers/add-customer-sheet.tsx
    - components/customers/edit-customer-sheet.tsx
    - components/onboarding/steps/business-basics-step.tsx
    - components/onboarding/steps/business-step.tsx
    - components/onboarding/steps/customer-step.tsx
    - components/onboarding/steps/review-destination-step.tsx
    - components/onboarding/steps/services-offered-step.tsx
    - components/settings/settings-tabs.tsx
    - components/send/sms-character-counter.tsx
    - components/templates/sms-preview.tsx
    - components/templates/message-template-form.tsx
    - components/send/stat-strip.tsx

key-decisions:
  - "text-error-text (not text-destructive) for form validation — error-text is a darker shade calibrated for inline text readability vs button contrast"
  - "text-yellow-400 for star rating icons left inline — data-viz/decorative stars are intentionally exempt from tokenization"
  - "text-green-600 for positive trend percentage (stat-strip review rate) left inline — data-viz positive indicators exempt"
  - "SMS counter uses two-level threshold: text-warning (soft, >160 chars) → text-destructive (hard, >320 chars)"

patterns-established:
  - "personalization-section helper functions (getRateColor, getBarColor, getHealthDotColor, getHealthTextColor) return semantic token class strings instead of hardcoded color-scale"
  - "Danger zone section: border-destructive/30 opacity modifier for subtle boundary, text-destructive for heading"
  - "Warning banners: bg-warning-bg + border-warning-border container, text-warning for body/icon, text-warning-foreground for heading"

duration: 5min
completed: 2026-02-19
---

# Phase 35 Plan 04: Semantic Token Replacement (Cat A/B/J/K/O) Summary

**~100 hardcoded amber/red Tailwind color-scale classes replaced with semantic tokens across 24 files — warning banners, form validation errors, danger zone, AI indicators, and SMS counters now theme-aware via CSS custom properties**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-19T04:47:11Z
- **Completed:** 2026-02-19T04:52:31Z
- **Tasks:** 2
- **Files modified:** 24

## Accomplishments

- Warning banners (billing, send, integrations) use bg-warning-bg/border-warning-border/text-warning/text-warning-foreground instead of hardcoded amber-50/amber-200/amber-600/amber-800
- Form validation error text in auth forms, customer sheets, onboarding steps, and settings forms all use text-error-text
- Danger zone section in settings-tabs uses border-destructive/30 and text-destructive instead of hardcoded red-200/red-600
- AI personalization sparkle and disabled-state text use text-warning instead of text-amber-500/amber-600
- SMS character counters (sms-character-counter, sms-preview, message-template-form) use text-warning (soft) and text-destructive (hard) thresholds
- personalization-section helper functions (getRateColor, getBarColor, getHealthDotColor, getHealthTextColor) all return semantic token classes
- All associated dark: overrides removed — tokens are mode-aware by design

## Task Commits

Each task was committed atomically:

1. **Task 1: Warning banners (Cat A) and AI indicators (Cat K)** - `53e5e48` (feat)
2. **Task 2: Form validation (Cat B), danger zone (Cat J), SMS counters (Cat O), stat-strip** - `e3862c4` (feat)

**Plan metadata:** (docs commit follows)

## Files Modified

- `components/billing/usage-warning-banner.tsx` - 80%+ warning banner: amber → warning tokens
- `components/billing/subscription-status.tsx` - Payment failed banner: amber → warning tokens
- `components/billing/usage-display.tsx` - Usage progress bar: bg-amber-500 → bg-warning, text-amber-600 → text-warning
- `components/send/send-page-client.tsx` - V2 friction warning banner: fully tokenized, dark: overrides removed
- `components/settings/integrations-section.tsx` - API key reveal banner + regen warning: amber → warning tokens
- `components/campaigns/campaign-form.tsx` - Sparkle icon + disabled personalization text: amber → warning tokens
- `components/settings/personalization-section.tsx` - getRateColor/getBarColor/getHealthDotColor/getHealthTextColor helper functions: hardcoded → semantic tokens
- `components/login-form.tsx` - Field errors + dismiss button: text-red-500 → text-error-text
- `components/sign-up-form.tsx` - Field errors: text-red-500 → text-error-text
- `components/forgot-password-form.tsx` - Field errors: text-red-500 → text-error-text
- `components/update-password-form.tsx` - Field errors: text-red-500 → text-error-text
- `components/business-settings-form.tsx` - Error banner → bg-destructive/10; success banner → bg-success-bg; field errors + asterisk → text-error-text
- `components/customers/add-customer-sheet.tsx` - Field errors: text-red-500 → text-error-text
- `components/customers/edit-customer-sheet.tsx` - Field errors: text-red-500 → text-error-text
- `components/onboarding/steps/business-basics-step.tsx` - Error text: text-red-600 → text-error-text
- `components/onboarding/steps/business-step.tsx` - Required asterisk + field errors: red → text-error-text
- `components/onboarding/steps/customer-step.tsx` - Required asterisks + field errors: red → text-error-text
- `components/onboarding/steps/review-destination-step.tsx` - Error text: text-red-600 → text-error-text
- `components/onboarding/steps/services-offered-step.tsx` - Error text: text-red-600 → text-error-text
- `components/settings/settings-tabs.tsx` - Template warning → text-warning; danger zone section → border-destructive/30 + text-destructive
- `components/send/sms-character-counter.tsx` - Counter thresholds: amber/red → text-warning/text-destructive, dark: overrides removed
- `components/templates/sms-preview.tsx` - Character count display: yellow/red → text-warning/text-destructive
- `components/templates/message-template-form.tsx` - SMS counter: yellow → text-warning, dark: removed
- `components/send/stat-strip.tsx` - Limit indicators: red-600 → text-destructive/bg-destructive, badge chips → bg-destructive/10

## Decisions Made

- text-error-text (not text-destructive) used for inline form validation — --error-text is a darker shade calibrated for small text readability vs the button-optimized --destructive token
- text-yellow-400 on star rating icons in stat-strip left as-is (data-viz stars are intentionally exempt from tokenization per Phase 33 audit decisions)
- text-green-600 on positive review rate trend (+X% from last month) left as-is — data-viz positive indicators exempt
- SMS counters use two-level threshold: text-warning for soft limit (161-320 chars, 2 segments), text-destructive for hard limit (320+ chars, 3+ segments)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The linter automatically converted some additional green/red/amber classes in files it touched (e.g., SMS consent status in edit-customer-sheet, success message in add-customer-sheet, success indicator in review-destination-step) — all aligned with the token spec and kept.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 35-05 (Cat C/D/F/L) can continue with the same token infrastructure
- All files listed as modified in 35-04 are complete — no partial state
- Build passes (lint + typecheck confirmed)

---
*Phase: 35-card-variants-dashboard-quick-wins*
*Completed: 2026-02-19*
