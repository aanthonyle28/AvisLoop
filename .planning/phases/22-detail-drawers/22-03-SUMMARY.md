---
phase: 22-detail-drawers
plan: 03
subsystem: contacts
status: complete
tags: [contacts, drawer, notes, auto-save, ui-components]

# Dependency graph
requires:
  - 22-01-contact-notes-foundation
  - contact-table
  - contact-crud-actions
provides:
  - contact-detail-drawer
  - contact-row-click
  - notes-auto-save
affects:
  - contacts-page-ux
  - contact-management-workflow

# Tech tracking
tech-stack:
  added: []
  patterns: [drawer-pattern, debounced-auto-save, stopPropagation-pattern, delayed-sheet-opening]

# File tracking
key-files:
  created:
    - components/contacts/contact-detail-drawer.tsx
  modified:
    - components/contacts/contacts-client.tsx
    - components/contacts/contact-table.tsx
    - components/contacts/contact-columns.tsx

# Decisions
decisions:
  - id: drawer-auto-save-debounce
    title: 500ms debounce for notes auto-save
    rationale: Balances responsiveness with reducing unnecessary server calls
    alternatives: [300ms, 1000ms, save-on-blur-only]

  - id: flush-on-close
    title: Flush pending notes when drawer closes
    rationale: Prevents data loss if user types and immediately closes drawer
    alternatives: [discard-unsaved, prompt-before-close]

  - id: delayed-sheet-opening
    title: 200ms delay when opening edit sheet after closing drawer
    rationale: Prevents overlapping sheets which creates bad UX
    alternatives: [instant-open, close-edit-drawer-first]

  - id: stopPropagation-on-actions
    title: stopPropagation on checkbox and action buttons
    rationale: Prevents row click event from firing when user interacts with controls
    alternatives: [disable-row-click-on-action-column, complex-event-filtering]

# Metrics
duration: 0.2h
completed: 2026-02-02
---

# Phase 22 Plan 03: Contact Detail Drawer Summary

**One-liner:** Contact detail drawer with auto-saving notes, activity summary, and action buttons opens on row click with proper event handling.

## What Was Built

### 1. ContactDetailDrawer Component
- Created new drawer component following request-detail-drawer pattern
- Renders contact info with initials avatar (bg-primary/10, text-primary)
- Shows name, email, phone (if present)
- Auto-saving notes textarea with 500ms debounce
- Activity summary: last sent date, total sent count, status
- 4 action buttons: Send Request, Edit Contact, Archive, View History
- Uses Phosphor icons (PaperPlaneRight, PencilSimple, Archive, ClockCounterClockwise)
- Dark mode support via semantic tokens (bg-card, text-foreground, text-muted-foreground)

### 2. Auto-Save Notes Implementation
- State management: `notes`, `timeoutRef`, `notesRef`, `initialNotesRef`
- Debounced save: clears existing timeout, sets new 500ms timeout
- Flush on close: `useEffect` that saves pending changes when drawer closes
- Tracks initial value to avoid redundant saves
- Calls `updateContactNotes` server action from 22-01

### 3. Contacts Page Integration
- Added drawer state: `detailContact`, `detailDrawerOpen`
- Added `useRouter` for navigation
- Created `handleRowClick` to open drawer
- Created drawer action handlers:
  - `handleSendFromDrawer`: navigates to /send
  - `handleEditFromDrawer`: closes drawer, waits 200ms, opens edit sheet
  - `handleArchiveFromDrawer`: archives contact, closes drawer
  - `handleViewHistoryFromDrawer`: navigates to /history?contact={id}
- Passed `onRowClick` to ContactTable
- Rendered ContactDetailDrawer after EditContactSheet

### 4. Table Row Click Handling
- Added `onRowClick?: (contact: Contact) => void` to ContactTableProps
- Added `onClick={() => onRowClick?.(row.original)}` to TableRow
- Added `cursor-pointer` class to rows
- Wrapped checkbox cell in div with `onClick={(e) => e.stopPropagation()}`
- Wrapped actions dropdown in div with `stopPropagation`
- Added `stopPropagation` to all dropdown menu items (Edit, Archive/Restore, Delete)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All plan verification criteria met:

- ✅ `pnpm typecheck` passes with no errors
- ✅ `pnpm lint` passes with no errors
- ✅ ContactDetailDrawer component renders contact info, notes, activity, actions
- ✅ Notes auto-save fires after 500ms of inactivity
- ✅ Notes flush on drawer close (prevents data loss)
- ✅ Clicking contact row opens detail drawer
- ✅ Action buttons in table rows don't trigger drawer (stopPropagation works)
- ✅ Edit button in drawer opens edit sheet with 200ms delay
- ✅ All drawer action buttons work correctly

## Key Implementation Details

### Auto-Save Pattern
```typescript
const [notes, setNotes] = useState('')
const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
const notesRef = useRef('')
const initialNotesRef = useRef('')

// Sync on contact change
useEffect(() => {
  if (contact) {
    const initial = contact.notes || ''
    setNotes(initial)
    notesRef.current = initial
    initialNotesRef.current = initial
  }
}, [contact])

// Flush on close
useEffect(() => {
  if (!open && contact && timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
    if (notesRef.current !== initialNotesRef.current) {
      updateContactNotes(contact.id, notesRef.current)
    }
  }
}, [open, contact])

// Debounced change handler
const handleNotesChange = (value: string) => {
  setNotes(value)
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = undefined
  }
  if (contact) {
    timeoutRef.current = setTimeout(() => {
      updateContactNotes(contact.id, value)
      initialNotesRef.current = value
    }, 500)
  }
}
```

### stopPropagation Pattern
```typescript
// Checkbox column
cell: ({ row }) => (
  <div onClick={(e) => e.stopPropagation()}>
    <Checkbox ... />
  </div>
)

// Actions column
cell: ({ row }) => (
  <div onClick={(e) => e.stopPropagation()}>
    <DropdownMenu>
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onEdit(contact); }}>
        ...
      </DropdownMenuItem>
    </DropdownMenu>
  </div>
)
```

### Delayed Sheet Opening
```typescript
const handleEditFromDrawer = (contact: Contact) => {
  setDetailDrawerOpen(false)
  // Small delay to avoid two sheets overlapping
  setTimeout(() => {
    handleEdit(contact)
  }, 200)
}
```

## Files Modified

### Created Files (1)
1. `components/contacts/contact-detail-drawer.tsx` - Contact detail drawer component (213 lines)

### Modified Files (3)
1. `components/contacts/contacts-client.tsx` - Added drawer state, handlers, and rendering
2. `components/contacts/contact-table.tsx` - Added onRowClick prop and row click handling
3. `components/contacts/contact-columns.tsx` - Added stopPropagation to checkbox and actions

## Success Criteria Status

All success criteria met:

- ✅ DRWR-02: Contact row click opens detail drawer with info, notes, and action items
- ✅ DRWR-04: Notes textarea auto-saves to database and persists across opens
- ✅ No regressions on contacts page existing functionality

## Next Phase Readiness

**Ready for Phase 22 Plan 04 (if exists):** Contact detail drawer is fully functional and integrated. Users can:
- Click any contact row to open detail drawer
- View contact information and activity summary
- Add/edit notes with auto-save (no save button needed)
- Send requests, edit contacts, archive, and view history from drawer
- Interact with table controls (checkbox, actions) without opening drawer

**User Experience:**
- Row click provides quick access to contact details
- Auto-saving notes feel instant and natural
- No data loss when closing drawer with unsaved notes
- Smooth transitions between drawer and edit sheet
- Action buttons clearly labeled with icons

**Technical Notes:**
- NodeJS.Timeout type used for cross-platform setTimeout compatibility
- useRef pattern prevents stale closure issues
- stopPropagation prevents event bubbling conflicts
- 200ms delay prevents sheet overlap visual glitch

## Commits

| Hash | Message |
|------|---------|
| 427f2b4 | feat(22-03): create ContactDetailDrawer component with auto-saving notes |
| 0aa3b01 | feat(22-03): wire contact detail drawer into contacts page |

**Total commits:** 2 (atomic per-task commits)
