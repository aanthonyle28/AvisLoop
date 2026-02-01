---
phase: 19
plan: 03
subsystem: send-ux
completed: 2026-02-01
duration: 5m 35s
tags:
  - quick-send
  - message-preview
  - compact-mode
  - send-page
requires:
  - "19-01"
  - "19-02"
provides:
  - compact-message-preview
  - simplified-send-page
affects:
  - "19-06"
tech-stack:
  patterns:
    - compact-expandable-ui
    - read-only-preview
decisions:
  - id: compact-preview-default
    choice: Default to compact mode with expand/collapse toggle
    rationale: Reduces visual clutter on Send page, allows users to see more controls without scrolling
  - id: remove-inline-editing
    choice: Make MessagePreview read-only (no inline subject/body editing)
    rationale: Quick Send flow focuses on template selection, not custom messages
key-files:
  created: []
  modified:
    - components/send/message-preview.tsx
    - app/(dashboard)/send/page.tsx
  deleted:
    - components/send/send-form.tsx
    - components/send/contact-selector.tsx
    - components/send/batch-results.tsx
    - components/send/schedule-selector.tsx
---

# Phase 19 Plan 03: Quick Send Tab with Compact Preview Summary

**One-liner:** Compact message preview with expand/collapse toggle and simplified Send page data fetching

## What Was Built

### Message Preview Redesign
- **Compact mode (default)**: Shows subject + first 2-3 lines with "Show full preview" button
- **Expanded mode**: Full email preview with CTA button, signature, "Collapse preview" link
- **Smooth transitions**: CSS `transition-all duration-300` for mode switching
- **Read-only**: Removed inline editing props (customSubject, customBody, onSubjectChange, onBodyChange)
- **Updated props**: `compact?: boolean` prop controls initial mode (defaults to true)

### Send Page Optimization
- **Simplified data fetching**: Only fetch contacts (limit 200) and monthlyUsage
- **Removed unused fetches**: resendReadyContacts, needsAttention, responseRate, recentActivity
- **Clean imports**: Removed unused data functions from imports

### Code Cleanup
- **Deleted old send components** (replaced by QuickSendTab in plan 19-02):
  - `components/send/send-form.tsx` (308 lines)
  - `components/send/contact-selector.tsx` (220 lines)
  - `components/send/batch-results.tsx` (165 lines)
  - `components/send/schedule-selector.tsx` (224 lines)
- **Total removed**: 917 lines of obsolete code

## Commits

| Commit | Message | Files Changed |
|--------|---------|---------------|
| 8112065 | feat(19-03): rebuild Send page with compact message preview | 6 files changed, 41 insertions(+), 917 deletions(-) |

## Decisions Made

### 1. Compact Preview as Default
**Decision:** MessagePreview defaults to compact mode with expand/collapse toggle

**Rationale:**
- Reduces visual clutter on Send page
- Allows users to see email field, template selector, schedule options, and send button without scrolling
- Users can expand when they need to review full email content
- Aligns with send-first design philosophy (prioritize action over review)

**Alternatives considered:**
- Always show full preview → Too much vertical space, forces scrolling
- No preview at all → Users want to see what they're sending

### 2. Remove Inline Editing from MessagePreview
**Decision:** Make MessagePreview read-only (removed customSubject/customBody props)

**Rationale:**
- Quick Send flow focuses on template selection (via SendSettingsBar)
- Custom messages are rare in single-send flow
- Simplifies component interface and state management
- Users can edit templates separately in settings

**Impact:**
- Cleaner component API (4 fewer props)
- Better separation of concerns (editing happens in settings, not inline)
- Future Bulk Send tab can use same read-only preview

## Technical Details

### MessagePreview Component
**Before:**
```typescript
interface MessagePreviewProps {
  contact: Contact | null
  business: Business
  template: EmailTemplate | null
  customSubject: string
  customBody: string
  onSubjectChange: (subject: string) => void
  onBodyChange: (body: string) => void
}
```

**After:**
```typescript
interface MessagePreviewProps {
  contact: Contact | null
  business: Business
  template: EmailTemplate | null
  compact?: boolean  // NEW: defaults to true
}
```

**State management:**
- `isExpanded` state controls compact/expanded mode
- `showCompact = compact && !isExpanded` computed value
- Conditional rendering based on `showCompact`

**Styling:**
- `line-clamp-3` Tailwind class for compact text truncation
- `transition-all duration-300` for smooth expand/collapse
- "Show full preview" / "Collapse preview" buttons toggle state

### Send Page Data Flow
**Before:**
- Fetched 6 data sources in parallel (contacts, monthlyUsage, resendReadyContacts, needsAttention, responseRate, recentActivity)
- Passed 5 unused props to SendPageClient

**After:**
- Fetches only 2 data sources (contacts, monthlyUsage)
- SendPageClient receives only required props
- Cleaner data pipeline, faster page load

## Testing Checklist

- [x] TypeScript compiles without errors
- [x] ESLint passes with no warnings
- [x] Message preview shows compact mode by default
- [x] "Show full preview" expands to show full email
- [x] "Collapse preview" returns to compact mode
- [x] Transition animation is smooth (300ms)
- [x] Template variables are replaced correctly (contact name, business name)
- [x] Old send component files are deleted from filesystem

## Metrics

- **Code removed**: 917 lines (old send components)
- **Code added**: 41 lines (compact preview logic)
- **Net change**: -876 lines
- **Files deleted**: 4 obsolete components
- **Components simplified**: 2 (MessagePreview, Send page)

## Next Phase Readiness

**Phase 19-04 (Contacts Page Redesign):**
- Ready to proceed
- No dependencies on Send page structure

**Phase 19-06 (Bulk Send Tab):**
- MessagePreview component ready for reuse
- SendPageClient already has Bulk Send tab shell
- Can use same compact preview pattern

## Deviations from Plan

None - plan executed exactly as written.

## Notes

### Why Delete Old Send Components?
These components were created in Phase 11 (Bulk Send) but were replaced by the QuickSendTab approach in plan 19-02:
- `send-form.tsx` → Replaced by QuickSendTab's inline form
- `contact-selector.tsx` → Not needed for single-contact flow
- `batch-results.tsx` → Not used in Quick Send tab
- `schedule-selector.tsx` → Replaced by SendSettingsBar's inline preset buttons

### MessagePreview Usage
- **Quick Send tab**: Uses `compact={true}` (default)
- **Future Bulk Send tab**: Can use `compact={true}` or `compact={false}` as needed
- **Dashboard Quick Send card**: Uses same compact pattern

### Performance Impact
- **Faster Send page load**: Removed 4 unnecessary database queries
- **Smaller bundle**: Deleted 917 lines of unused component code
- **Cleaner component tree**: Simplified prop drilling
