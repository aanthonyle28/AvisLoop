---
phase: 20-database-migration-customer-enhancement
plan: 05
subsystem: customer-ui
tags: [ui, filtering, phone-formatting, tags, customer-table]
requires: [20-04, 20-03, 20-02]
provides: [customer-phone-display, customer-tags-ui, tag-filtering]
affects: []
tech-stack:
  added: []
  patterns: [tanstack-table-filtering, tag-badge-component]
decisions:
  - ref: "CUST-02"
    summary: "Phone display with US formatting and copy-to-clipboard"
  - ref: "CUST-03"
    summary: "Tags displayed as badges in table with TagList component"
  - ref: "CUST-04"
    summary: "Tag filter using OR logic (show customers with ANY selected tag)"
key-files:
  created:
    - components/ui/tag-badge.tsx
  modified:
    - components/customers/customer-columns.tsx
    - components/customers/customer-filters.tsx
    - components/customers/customer-table.tsx
    - components/customers/csv-preview-table.tsx
metrics:
  duration: 4m
  completed: 2026-02-03
---

# Phase 20 Plan 05: Customer Phone & Tags UI Summary

**One-liner:** Customer table now shows phone numbers with (512) 555-1234 formatting + copy button, tags as filterable badges using TanStack Table column filtering with OR logic

## What Was Built

### Phone Number Display (CUST-02)
- **Phone column** added to customer table with formatting via `formatPhoneDisplay()`
  - US numbers: `(512) 555-1234`
  - International: `+44 20 7946 0958`
- **Copy button** appears on hover with toast feedback ("Phone copied to clipboard")
  - Copies E.164 format to clipboard for backend compatibility
  - Button uses opacity transition for smooth UX
- **Email-only badge** for customers without phone (`phone_status === 'missing'`)
  - Shows Envelope icon + "Email-only" text
  - Visually distinct from phone numbers

### Tag Display & Filtering (CUST-03, CUST-04)
- **TagBadge component** (`components/ui/tag-badge.tsx`)
  - Reusable badge with selection state (`selected` prop)
  - Optional remove button (X icon) for tag management
  - Cursor changes to pointer when clickable
  - Supports dark/light mode via CSS variables
- **TagList component** for rendering tag arrays
  - Wraps tags with gap spacing
  - Max width constraint for table cells
- **Tags column** in customer table
  - Displays customer tags as badges
  - Includes `filterFn` with OR logic
- **Tag filter UI** in CustomerFilters
  - Shows preset tags (VIP, repeat, commercial, residential) + custom tags from customers
  - Multi-select: click to toggle, selected tags highlighted
  - Clear button to reset tag filter
  - Wired to TanStack Table column filter via `useEffect`

### Table Integration
- **TanStack Table column filtering** for tags
  - `table.getColumn('tags')?.setFilterValue(selectedTags)` in `useEffect`
  - Filter triggers on `selectedTags` state change
  - Filter function: `filterValue.some(tag => tags.includes(tag))` (OR logic)
- **Row hover effect** with `group` class for copy button visibility
- **Available tags** computed from all customers via `useMemo`

## Decisions Made

1. **Phone formatting strategy**
   - Display: Human-readable format (`(512) 555-1234` for US)
   - Clipboard: E.164 format (`+15125551234`) for backend compatibility
   - Rationale: Best of both worlds - UX and system interoperability

2. **Tag filter uses OR logic (not AND)**
   - Selecting multiple tags shows customers with ANY tag
   - AND logic would be too restrictive (most customers have 1-2 tags)
   - Clear from plan requirement and verified in filterFn implementation

3. **Tag badge component is reusable**
   - Exported from `components/ui/` (UI library pattern)
   - Supports multiple modes: display-only, clickable, removable
   - Can be used in forms, filters, and table cells

4. **TanStack Table column filtering over custom filtering**
   - Leverages built-in `getFilteredRowModel()` and `filterFn`
   - Clean separation: filter state in parent, filter logic in column definition
   - Plays well with existing search and status filters

## File Changes

### Created Files
| File | Purpose | Exports |
|------|---------|---------|
| `components/ui/tag-badge.tsx` | Reusable tag badge component | `TagBadge`, `TagList`, `PRESET_TAGS` |

### Modified Files
| File | Changes |
|------|---------|
| `components/customers/customer-columns.tsx` | Added phone column (formatted + copy button), tags column (TagList + filterFn) |
| `components/customers/customer-filters.tsx` | Added tag filter chips with multi-select, clear button |
| `components/customers/customer-table.tsx` | Added selectedTags state, useEffect for column filter sync, availableTags computation |
| `components/customers/csv-preview-table.tsx` | Fixed phone type to accept `null \| undefined` (blocking issue) |

## Technical Details

### Phone Column Implementation
```typescript
// In customer-columns.tsx
{
  accessorKey: 'phone',
  header: 'Phone',
  cell: ({ row }) => {
    const phone = row.original.phone
    const phoneStatus = row.original.phone_status

    if (!phone || phoneStatus === 'missing') {
      return <EmailOnlyBadge />
    }

    const formatted = formatPhoneDisplay(phone)  // (512) 555-1234
    const handleCopy = () => {
      navigator.clipboard.writeText(phone)  // Copies E.164
      toast.success('Phone copied to clipboard')
    }

    return (
      <div>
        <span className="font-mono">{formatted}</span>
        <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100">
          <Copy />
        </button>
      </div>
    )
  }
}
```

### Tag Filter Wiring
```typescript
// In customer-table.tsx
const [selectedTags, setSelectedTags] = useState<string[]>([])

// Sync selectedTags to TanStack Table column filter
useEffect(() => {
  const tagsColumn = table.getColumn('tags')
  if (tagsColumn) {
    tagsColumn.setFilterValue(selectedTags.length > 0 ? selectedTags : undefined)
  }
}, [selectedTags, table])

// Filter logic in column definition (customer-columns.tsx)
filterFn: (row, _id, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true
  const tags = row.original.tags || []
  return filterValue.some(tag => tags.includes(tag))  // OR logic
}
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed CSVPreviewRow phone type mismatch**
- **Found during:** Typecheck verification
- **Issue:** `ParsedRow` has `phone: string | null` but `CSVPreviewRow` expected `string | undefined`, causing type error
- **Fix:** Changed CSVPreviewRow phone type to `string | null | undefined`
- **Files modified:** `components/customers/csv-preview-table.tsx`
- **Commit:** a12bc06
- **Rationale:** Blocking typecheck verification, simple type compatibility fix

## Commits

| Hash | Type | Description |
|------|------|-------------|
| d286978 | feat | Create reusable tag badge component |
| 9e94044 | feat | Add phone and tags columns to customer table |
| 2eeafcb | feat | Add tag filter UI with table integration |
| a12bc06 | fix | Fix CSVPreviewRow type to accept null or undefined phone |

## Testing Notes

### Manual Testing Required
1. **Phone display**
   - Create customers with US phone numbers → verify `(512) 555-1234` format
   - Create customers with international numbers → verify `+44 20 7946 0958` format
   - Create customers without phone → verify "Email-only" badge appears
   - Hover over phone → verify copy button appears
   - Click copy button → verify toast shows and phone is in clipboard

2. **Tags display**
   - Create customers with tags (VIP, repeat, commercial, residential)
   - Verify tags appear as badges in table
   - Verify multiple tags wrap correctly

3. **Tag filtering**
   - Click a tag chip → verify only customers with that tag are shown
   - Click multiple tags → verify customers with ANY selected tag are shown (OR logic)
   - Click Clear → verify all customers reappear
   - Verify tag chips highlight when selected

4. **Combined with existing filters**
   - Use search + tag filter together
   - Use status filter + tag filter together
   - Click "Clear filters" → verify all filters reset (search, status, tags)

### Edge Cases
- Customer with no tags → tags column is empty (no badges shown)
- Business with no tags used yet → tag filter section hidden (only shows if `allTags.length > 0`)
- Phone number in invalid format → should show "Email-only" badge (phone_status would be 'missing' or 'invalid')

## Next Phase Readiness

**Blockers:** None

**Concerns:**
- Tag filter UI performance: If business has 100+ unique tags, the filter chips could overflow. Consider pagination or dropdown for large tag sets in future.
- Phone copy button visibility: Relies on row hover (`group-hover`). May not be discoverable on touch devices. Consider always-visible copy icon or long-press gesture.

**Dependencies satisfied:**
- Phone formatting utilities from 20-03 ✓
- Customer schema with tags/phone_status from 20-02 ✓
- Terminology migration from 20-04 ✓

**Next steps:**
- 20-06 (if exists): Additional customer enhancements
- OR: Phase 21 planning

## Key Learnings

1. **TanStack Table column filtering is powerful**
   - Supports custom `filterFn` for complex logic (OR filtering)
   - Clean separation of concerns: filter state in parent, filter logic in column
   - Plays well with `getFilteredRowModel()` for automatic re-filtering

2. **Tag badge component pattern works well**
   - Reusable across table cells, filters, and forms
   - Props-based modes (display, clickable, removable) cover all use cases
   - CSS variable theming ensures dark mode compatibility

3. **Phone formatting UX balance**
   - Users want human-readable formats for scanning
   - Backend needs E.164 for SMS/calling
   - Copy button bridges the gap: display one format, copy another

4. **Group hover pattern for progressive disclosure**
   - Copy button only shows on row hover → cleaner table UI
   - Requires `group` class on parent element
   - Works in React Server Components (no client-side JS required for styling)

## Success Criteria Met

- [x] `components/ui/tag-badge.tsx` exports TagBadge, TagList, PRESET_TAGS
- [x] Customer table has phone column with (512) 555-1234 formatting
- [x] Phone column has copy icon that copies E.164 to clipboard with toast
- [x] Customers without phone show "Email-only" badge
- [x] Customer table has tags column with TagList badges
- [x] Tag filter UI shows preset tags + custom tags from business
- [x] Tag filter uses OR logic (any selected tag matches)
- [x] Clear button resets tag filter
- [x] `customers-client.tsx` has useEffect with `table.getColumn('tags')?.setFilterValue(selectedTags)`
- [x] Clicking tag chip filters table to show only tagged customers
- [x] `pnpm typecheck` passes
- [x] `pnpm lint` passes
