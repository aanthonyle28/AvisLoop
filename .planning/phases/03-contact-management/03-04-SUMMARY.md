---
phase: 03
plan: 04
subsystem: contact-management
tags: [ui, forms, shadcn, dialog, sheet, react]
dependencies:
  requires: [03-01-database-schema, 03-02-server-actions]
  provides: [contact-add-ui, contact-edit-ui]
  affects: [03-05-contact-list]
tech_stack:
  added: [shadcn-dialog, shadcn-sheet, shadcn-separator]
  patterns: [controlled-dialog, slide-out-sheet, activity-summary]
key_files:
  created:
    - components/contacts/add-contact-dialog.tsx
    - components/contacts/edit-contact-sheet.tsx
    - components/ui/dialog.tsx
    - components/ui/sheet.tsx
    - components/ui/separator.tsx
  modified: []
decisions:
  - slug: modal-dialog-for-add
    summary: Use Dialog for add (not Sheet) for focused, blocking interaction
  - slug: sheet-for-edit-with-activity
    summary: Sheet slides from right, shows edit form + activity summary
  - slug: auto-close-on-success
    summary: Both components close automatically when Server Action succeeds
  - slug: form-reset-on-contact-change
    summary: Edit form resets when contact prop changes (useEffect + formRef)
metrics:
  duration: 2 min
  completed: 2026-01-27
---

# Phase 3 Plan 4: Contact Forms (Add/Edit UI) Summary

**One-liner:** Modal dialog for adding contacts and slide-out sheet for editing with activity summary

## Objective

Create UI components for adding and editing individual contacts with forms wired to Server Actions.

## What Was Built

### 1. Add Contact Dialog (Task 1)
**File:** `components/contacts/add-contact-dialog.tsx`

- Modal dialog component using shadcn/ui Dialog
- Form fields:
  - Name (required)
  - Email (required)
  - Phone (optional)
- Integrated with `createContact` Server Action via `useActionState`
- Props: `trigger?: React.ReactNode` for custom trigger button
- Features:
  - Closes automatically on successful submit
  - Shows per-field validation errors from `fieldErrors`
  - Shows general error from `error`
  - Disables form while pending
  - Default trigger: Button with Plus icon
- Pattern: Controlled dialog with `open` state, wrapped Server Action checks `result.success` to close

### 2. Edit Contact Sheet (Task 2)
**File:** `components/contacts/edit-contact-sheet.tsx`

- Slide-out sheet component using shadcn/ui Sheet (right side)
- Form section:
  - Hidden input for `contactId`
  - Name, Email, Phone fields (pre-filled)
  - Save button with pending state
- Activity summary section (below separator):
  - Last sent: formatted date or "Never"
  - Total sent: `send_count` number
  - Status: Active/Archived badge (color-coded)
  - Added: `created_at` date
- Integrated with `updateContact` Server Action via `useActionState`
- Props: `contact: Contact | null`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- Features:
  - Pre-fills form with `defaultValue` from contact
  - Resets form when contact changes (`useEffect` + `formRef`)
  - Closes automatically on successful update
  - Shows per-field validation errors
  - Responsive width: `w-[400px] sm:w-[540px]`
  - Scrollable content for overflow

### 3. shadcn/ui Components Added
- **Dialog:** Modal dialog primitive for add contact
- **Sheet:** Slide-out panel primitive for edit contact
- **Separator:** Visual divider between form and activity sections

## Technical Implementation

### Form Pattern
Both components follow the established `useActionState` pattern from Phase 1:

```typescript
const [state, formAction, isPending] = useActionState<ContactActionState | null, FormData>(
  async (prevState, formData) => {
    const result = await createContact(prevState, formData) // or updateContact
    if (result.success) {
      setOpen(false) // or onOpenChange(false)
    }
    return result
  },
  null
)
```

**Why this works:**
- Wraps Server Action to intercept result
- Checks `result.success` before closing dialog/sheet
- Returns result for error display
- `isPending` from hook provides loading state

### Form Reset Strategy
Edit sheet uses `useRef` + `useEffect` to reset form when contact changes:

```typescript
const formRef = useRef<HTMLFormElement>(null)

useEffect(() => {
  if (contact && formRef.current) {
    formRef.current.reset()
  }
}, [contact])
```

**Why:** Ensures form shows fresh data when editing different contacts in sequence.

### Date Formatting
Uses `date-fns` for consistent date display:
- Format: `MMM d, yyyy` (e.g., "Jan 27, 2026")
- Handles `null` values with fallback ("Never")

### Status Badge
Activity summary shows status with color-coded badge:
- `variant="default"` for Active (blue)
- `variant="secondary"` for Archived (gray)

## Links to Other Systems

### Consumes
- **Server Actions:** `createContact`, `updateContact` from `lib/actions/contact.ts`
- **Types:** `Contact`, `ContactActionState` from `lib/types/database.ts` and actions
- **Validation:** Zod schemas in `lib/validations/contact.ts` (server-side)

### Used By
- **Next plan (03-05):** Contact list page will use these components for add/edit buttons

### Integration Points
- Both components accept custom triggers/props for flexible integration
- Server Actions handle all business logic (duplicate check, RLS, revalidation)
- Forms use native `FormData` for progressive enhancement

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

**To test after 03-05 (Contact List) is complete:**

1. **Add Contact Dialog:**
   - Click "Add Contact" button
   - Dialog opens centered
   - Fill required fields (Name, Email)
   - Optional phone field works
   - Submit with missing fields shows validation errors
   - Submit with duplicate email shows error
   - Successful submit closes dialog and shows new contact in list

2. **Edit Contact Sheet:**
   - Click contact row or edit button
   - Sheet slides in from right
   - Form pre-fills with contact data
   - Edit fields and save
   - Activity section shows correct data (last sent, count, status, added date)
   - Update with duplicate email shows error
   - Successful save closes sheet and updates list

3. **Error Handling:**
   - Network errors show general error message
   - Field validation errors show per-field
   - Forms disable during pending state
   - Multiple rapid submits handled gracefully

## Next Phase Readiness

**Ready for 03-05 (Contact List page):**
- Add and Edit UI components available for import
- Props designed for flexible integration
- Both components handle own state (dialog open, sheet open)
- Parent page only needs to pass contact data to edit sheet

**Blockers:** None

**Integration requirements for 03-05:**
- Import `AddContactDialog` and place in page header
- Import `EditContactSheet` and wire to row click/edit button
- Manage `selectedContact` and `editSheetOpen` state in page
- Revalidation handled automatically by Server Actions

## Key Learnings

1. **Controlled Dialog Pattern:** Wrapping Server Action in `useActionState` callback allows checking `result.success` before closing dialog - clean separation of concerns.

2. **Sheet for Context-Rich Edits:** Sheet is superior to Dialog for edits because:
   - More horizontal space for form + activity side-by-side
   - Feels less blocking (user can see list in background)
   - Natural place for activity summary without cramping form

3. **Form Reset Gotcha:** Using `defaultValue` alone doesn't reset form when contact changes - need explicit `formRef.current.reset()` in `useEffect`.

4. **Date Formatting:** `date-fns` format is simpler than `Intl.DateTimeFormat` for basic formatting, already in project dependencies.

5. **Hidden Input for ID:** Edit form uses hidden input for `contactId` to pass to Server Action - keeps FormData pattern consistent.
