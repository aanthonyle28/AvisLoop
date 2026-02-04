---
phase: 23-message-templates-migration
plan: 05
subsystem: ui
tags: [react, templates, preview, sms, email]

# Dependency graph
requires:
  - phase: 23-02
    provides: "MessageChannel type and template validation schema"
  - phase: 23-03
    provides: "Server actions for template CRUD"
provides:
  - "Email preview component with subject/body/CTA rendering"
  - "SMS preview component with phone mockup and character counter"
  - "Unified preview wrapper that routes by channel"
  - "SMS character counter hook with GSM-7/UCS-2 encoding detection"
affects: [23-04-settings-ui, send-flow]

# Tech tracking
tech-stack:
  added: []
  patterns: 
    - "Preview components use resolveTemplate() to substitute {{PLACEHOLDER}} variables"
    - "SMS character counter detects GSM-7 vs UCS-2 encoding and calculates segments"
    - "Preview components use theme tokens for dark mode compatibility"

key-files:
  created:
    - components/templates/email-preview.tsx
    - components/templates/sms-preview.tsx
    - components/templates/message-template-preview.tsx
    - components/templates/use-sms-character-counter.ts
  modified:
    - components/templates/message-template-form.tsx

key-decisions:
  - "Email preview shows full email structure (From/To, subject, body, CTA, footer)"
  - "SMS preview uses phone mockup with rounded corners, notch, and home indicator"
  - "Character counting uses raw template text (not resolved) to show actual cost"
  - "SMS opt-out footer always displayed in preview"
  - "Warning colors (yellow/red) match severity (multi-segment/excessive length)"

patterns-established:
  - "Preview components accept Business | null to handle system templates"
  - "Sample customer data (John Smith) used for placeholder resolution"
  - "Preview wrapper re-exports individual components for direct use"

# Metrics
duration: 3min
completed: 2026-02-04
---

# Phase 23 Plan 05: Message Template Previews Summary

**Dual-channel preview components with live variable substitution - email renders subject/body/CTA, SMS shows phone mockup with character counter and opt-out footer**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-04T02:37:09Z
- **Completed:** 2026-02-04T02:40:30Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Email preview component showing From/To header, subject, body, CTA button, and footer
- SMS preview component with phone mockup, message bubble, opt-out footer, and character info
- SMS character counter hook with GSM-7/UCS-2 encoding detection and segment calculation
- Unified preview wrapper routing by channel type

## Task Commits

Each task was committed atomically:

1. **Task 1: Create email-preview.tsx component** - `cfae740` (feat)
2. **Task 2: Create sms-preview.tsx component** - `84c3296` (feat)
3. **Task 3: Create message-template-preview.tsx wrapper** - `e751453` (feat)

## Files Created/Modified
- `components/templates/email-preview.tsx` - Email preview with subject, body, CTA button
- `components/templates/sms-preview.tsx` - SMS preview with phone mockup and character counter
- `components/templates/message-template-preview.tsx` - Conditional wrapper routing by channel
- `components/templates/use-sms-character-counter.ts` - Hook for SMS character/encoding/segment calculation
- `components/templates/message-template-form.tsx` - Fixed bug: changed 'danger' to 'error' for warning level

## Decisions Made

**Email preview design:**
- Shows full email structure (From/To header, subject, body, CTA button, footer)
- CTA button labeled "Leave a Review" (matches production behavior)
- Footer shows "Sent via AvisLoop" branding

**SMS preview design:**
- Phone mockup with rounded corners, notch at top, home indicator at bottom
- Gray received-style bubble (left-aligned) to simulate customer's view
- Opt-out footer ("Reply STOP to opt out") always shown below message
- Character counter shows encoding type and segment count below phone

**Placeholder resolution:**
- Supports {{CUSTOMER_NAME}}, {{BUSINESS_NAME}}, {{SENDER_NAME}}, {{REVIEW_LINK}}
- Uses sample data (John Smith, john.smith@example.com) for preview
- Character counting uses raw template text (not resolved) to show actual SMS cost

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed warning level comparison in message-template-form.tsx**
- **Found during:** Task 2 (SMS preview implementation)
- **Issue:** message-template-form.tsx was checking for `smsCounter.warning === 'danger'` but the hook returns 'error' not 'danger', causing TypeScript error
- **Fix:** Changed two occurrences of `'danger'` to `'error'` to match SMSCharacterInfo type
- **Files modified:** components/templates/message-template-form.tsx (lines 143, 159)
- **Verification:** `pnpm typecheck` passes with no errors
- **Committed in:** 84c3296 (Task 2 commit)

**2. [Rule 3 - Blocking] Created use-sms-character-counter hook**
- **Found during:** Task 2 (SMS preview implementation)
- **Issue:** Plan assumed hook would be created by 23-04 running in parallel, but it didn't exist yet
- **Fix:** Created minimal implementation with GSM-7/UCS-2 detection and segment calculation
- **Files modified:** components/templates/use-sms-character-counter.ts
- **Verification:** TypeScript compilation succeeds, hook returns proper SMSCharacterInfo
- **Committed in:** 84c3296 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for compilation and functionality. No scope creep.

## Issues Encountered
None - all tasks executed smoothly after auto-fixing the blocking issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Preview components ready for integration into 23-04 Settings UI
- Can be used in send flow to show template previews before sending
- SMS character counter available for any form needing SMS validation
- All components use theme tokens, compatible with dark mode

---
*Phase: 23-message-templates-migration*
*Completed: 2026-02-04*
