---
phase: 23-message-templates-migration
plan: 04
type: execute
status: complete
subsystem: templates-ui
tags: [react, forms, sms, character-counter, tabs, radix-ui]

requires:
  - 23-02-type-definitions
  - 23-03-server-actions

provides:
  - message-template-form-component
  - sms-character-counter-hook
  - channel-selector-ui

affects:
  - 23-05-send-flow-integration
  - settings-page

tech_stack:
  added:
    - "@radix-ui/react-tabs"
  patterns:
    - discriminated-union-forms
    - live-character-counting
    - gsm7-encoding-detection

key_files:
  created:
    - components/templates/message-template-form.tsx
    - components/templates/use-sms-character-counter.ts
  modified: []

decisions:
  - id: sms-encoding-detection
    choice: GSM-7 vs UCS-2 detection in client hook
    rationale: Real-time feedback for users about message segmentation
  - id: warning-thresholds
    choice: Yellow at multi-segment, red at 3+ segments
    rationale: Alert users to cost implications of long messages
  - id: opt-out-footer-ui
    choice: Read-only notice instead of editable field
    rationale: Opt-out text is automatic and cannot be customized

metrics:
  duration: 5m
  completed: 2026-02-04
  tasks: 2
  commits: 2
---

# Phase 23 Plan 04: Settings UI - Template Form Summary

**One-liner:** Tab-based message template form with Email/SMS channel selector and GSM-7 aware SMS character counter

## What Was Built

Created a client-side form component for creating message templates with channel-specific fields:

1. **SMS Character Counter Hook** (`use-sms-character-counter.ts`)
   - GSM-7 character set detection (160 chars/segment)
   - UCS-2 (Unicode) fallback for emojis/accents (70 chars/segment)
   - Multi-segment calculation with concatenation overhead
   - Warning levels: yellow for 2 segments, red for 3+
   - Returns: length, limit, segments, remaining, encoding, warning, warningMessage

2. **Message Template Form** (`message-template-form.tsx`)
   - Radix UI Tabs component for Email/SMS channel selection
   - Email tab: name, subject, body fields with variable help text
   - SMS tab: name, body with live character counter
   - Character counter displays encoding type and segment count
   - Warning colors (yellow/red) based on segment thresholds
   - Read-only notice for automatic opt-out footer
   - Channel-specific variable suggestions (no REVIEW_LINK for SMS)
   - Hidden input sends channel value to createMessageTemplate action
   - Form state management with useFormState hook
   - Field-level and global error display

## Technical Implementation

### SMS Character Counting

```typescript
// GSM-7 detection regex
const GSM7_REGEX = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-.\/0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà\^{}\\\[~\]|€]*$/

// Segment limits
GSM-7: 160 chars (single) / 153 chars (multi)
UCS-2: 70 chars (single) / 67 chars (multi)
```

### Form Architecture

- Client component with local state for SMS body (needed for live counting)
- Tab state controls which fields are shown
- Hidden input ensures channel value is submitted with form data
- useFormState hook manages server action state
- Discriminated union validation on server side

### Warning Levels

| Segments | Warning | Color | Message |
|----------|---------|-------|---------|
| 1 | none | muted | - |
| 2 | warning | yellow | "Message will be split into multiple SMS segments" |
| 3+ | error | red | "Message exceeds 2 segments (may incur extra charges)" |

## Files Changed

**Created:**
- `components/templates/message-template-form.tsx` (191 lines) - Tab-based form component
- `components/templates/use-sms-character-counter.ts` (107 lines) - Character counter hook

**No files modified** - All new code

## Integration Points

**Imports from:**
- `lib/actions/message-template.ts` - createMessageTemplate action
- `components/ui/tabs.tsx` - Radix Tabs components
- `components/ui/input.tsx`, `label.tsx`, `textarea.tsx`, `button.tsx`, `card.tsx` - Form UI

**Will be used by:**
- Settings page template management section (23-04 continuation)
- Template browser/editor (future)

## Decisions Made

### 1. GSM-7 Encoding Detection

**Decision:** Implement client-side GSM-7 character set detection

**Options considered:**
- Client-side detection (chosen)
- Server-side validation only
- Simple byte count without encoding awareness

**Rationale:** Real-time feedback is critical for SMS UX. Users need immediate visibility into whether emojis/accents will trigger Unicode encoding and reduce character limits from 160 to 70. Server validation alone would require round-trip and delay feedback.

**Trade-offs:**
- Pro: Instant feedback, better UX
- Pro: Prevents user surprise at reduced limits
- Con: Duplicate logic (also validated server-side)
- Con: Regex must be maintained if GSM-7 spec changes

### 2. Warning Thresholds

**Decision:** Yellow warning at 2 segments, red error at 3+ segments

**Options considered:**
- No visual warnings (chosen against)
- Single threshold at 160 chars (chosen against)
- Two-tier warnings (chosen)

**Rationale:** SMS costs scale with segments. Most users are familiar with 160-char limit but unaware of multi-segment implications. Two-tier warnings:
- Yellow (2 segments): "Heads up, this will be 2 messages"
- Red (3+ segments): "Warning, this is getting expensive"

Validation allows up to 320 chars (2 segments) as soft limit, blocking at 321+.

### 3. Opt-out Footer Display

**Decision:** Show opt-out footer as read-only notice, not editable field

**Options considered:**
- Editable footer text (chosen against)
- Hidden (assume user knows) (chosen against)
- Read-only notice (chosen)

**Rationale:** TCPA compliance requires "Reply STOP to opt out" footer on all SMS. Making it editable:
- Risks non-compliant customization
- Implies user control when they have none
- Adds unnecessary form field

Read-only notice educates user without implying configurability.

## Testing Performed

1. ✅ `pnpm typecheck` - No type errors
2. ✅ `pnpm lint` - No lint errors
3. ✅ Component renders without errors
4. ✅ Tab switching updates visible fields
5. ✅ Character counter updates on SMS input
6. ✅ GSM-7 vs UCS-2 detection (tested with emoji)
7. ✅ Warning colors appear at thresholds

## Next Phase Readiness

**Ready for 23-05 (Send Flow Integration):** Yes

**Blockers:** None

**Recommendations for next phase:**
1. Add template management list view to settings page
2. Integrate template selector into send flow
3. Add template preview component
4. Test template rendering with variable substitution

## Known Issues / Tech Debt

1. **Variable list maintenance:** Long inline variable lists in help text. Consider extracting to constant or component.

2. **Character counter hook complexity:** GSM-7 detection is non-trivial. Consider:
   - Unit tests for edge cases (extended chars, mixed encoding)
   - Server-side parity check (ensure client/server agree)

3. **Form reset after success:** Currently relies on parent handling onSuccess callback. Consider internal reset logic.

4. **Email variable validation:** No client-side check that variables are properly formatted (e.g., typo in `{{CUSTOMER_NAMEE}}`). Could add real-time variable highlighting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed type error in useFormState**
- **Found during:** Task 2 implementation
- **Issue:** useFormState initial value `null` not assignable to `MessageTemplateActionState`
- **Fix:** Changed type to `MessageTemplateActionState | null` to allow null initial state
- **Files modified:** `components/templates/message-template-form.tsx` (line 22)
- **Commit:** Inline fix during task

**2. [Rule 1 - Bug] Fixed ESLint quote escaping error**
- **Found during:** Task 2 linting
- **Issue:** Unescaped quotes in JSX string `"Reply STOP to opt out"`
- **Fix:** Changed to `&quot;Reply STOP to opt out&quot;`
- **Files modified:** `components/templates/message-template-form.tsx` (line 178)
- **Commit:** Inline fix during task

### Note on Execution Timeline

This plan (23-04) was partially executed in a previous session that was labeled as 23-05. The following commits contain 23-04 work:

- `407709f` - SMS character counter hook (correctly labeled 23-04)
- `84c3296` - Message template form (mislabeled as 23-05, actually 23-04 work)

This summary documents the work as 23-04 completion for clarity in phase progression.

## Session Notes

**Execution context:** Plan executed after previous session completed Tasks 1-2 but never created 23-04-SUMMARY.md. This session verified existing work meets plan requirements and created official completion documentation.

**Duration:** 5 minutes (verification and documentation)

**Work completed:**
- Task 1: SMS character counter hook ✓
- Task 2: Message template form ✓
- Verification: TypeScript, ESLint, functional requirements ✓
- Documentation: This summary ✓
