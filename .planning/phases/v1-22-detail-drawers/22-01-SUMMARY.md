---
phase: 22-detail-drawers
plan: 01
subsystem: contacts
status: complete
tags: [database, ui-components, server-actions, notes]

# Dependency graph
requires:
  - contact-table
  - contact-crud-actions
provides:
  - contact-notes-column
  - contact-notes-action
  - textarea-component
affects:
  - contact-detail-drawer
  - contact-editing

# Tech tracking
tech-stack:
  added: []
  patterns: [server-action-validation, optional-field-pattern]

# File tracking
key-files:
  created:
    - supabase/migrations/20260201_add_contact_notes.sql
    - components/ui/textarea.tsx
  modified:
    - lib/types/database.ts
    - lib/actions/contact.ts
    - app/(dashboard)/send/page.tsx
    - components/send/send-page-client.tsx

# Decisions
decisions:
  - id: notes-optional-field
    title: Notes field is optional in Contact type
    rationale: Existing rows won't have notes until migration runs, and Supabase returns empty string by default
    alternatives: [required-field-with-default]

  - id: notes-character-limit
    title: 10,000 character limit on notes
    rationale: Prevents abuse while allowing substantial contact notes
    alternatives: [no-limit, smaller-limit]

  - id: textarea-follows-input-pattern
    title: Textarea component follows Input component pattern exactly
    rationale: Maintains design consistency across form components
    alternatives: [custom-styling]

# Metrics
duration: 0.1h
completed: 2026-02-01
---

# Phase 22 Plan 01: Contact Notes Foundation Summary

**One-liner:** Added notes column to contacts table, Textarea UI component, and updateContactNotes server action for persisting contact notes.

## What Was Built

### 1. Database Migration
- Created migration `20260201_add_contact_notes.sql`
- Adds `notes TEXT DEFAULT '' NOT NULL` column to contacts table
- No new RLS policies needed - inherits existing table policies

### 2. Type Updates
- Updated `Contact` interface in `lib/types/database.ts`
- Added optional `notes?: string` field (optional because existing rows don't have it)
- Maintains backward compatibility with existing data

### 3. Textarea Component
- Created `components/ui/textarea.tsx` following Input component pattern
- Uses consistent styling: rounded-md border, focus ring, disabled state
- Key differences from Input: `min-h-[60px]`, `py-2` instead of `py-1`, no file styles
- Properly forwards ref for React Hook Form integration

### 4. Server Action
- Added `updateContactNotes(contactId, notes)` to `lib/actions/contact.ts`
- Validates authentication with `getUser()` (not getSession - security best practice)
- Validates input: contactId type check, notes max length 10,000 characters
- RLS handles ownership check automatically
- Revalidates `/dashboard/contacts` after update
- Returns `{ success: true }` or `{ error: string }`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused parameter lint error in send-page-client.tsx**
- **Found during:** Task 2 verification
- **Issue:** Parameter `requestId` in `handleCancel` was defined but never used
- **Fix:** Linter automatically removed the parameter (stub implementation doesn't need it yet)
- **Files modified:** `components/send/send-page-client.tsx`
- **Commit:** Included in 78927b7

## Verification

All plan verification criteria met:

- ✅ `pnpm typecheck` passes with no errors
- ✅ `pnpm lint` passes with no errors
- ✅ Migration file exists at `supabase/migrations/20260201_add_contact_notes.sql`
- ✅ `components/ui/textarea.tsx` exports `Textarea` component
- ✅ `lib/actions/contact.ts` exports `updateContactNotes` action
- ✅ Contact type includes `notes` field

## Key Implementation Details

### Migration Safety
- Default value of empty string ensures no NULL values
- NOT NULL constraint prevents inconsistent data
- No index added yet - can add GIN index later if search needed

### Textarea Styling
```typescript
// Consistent with Input component
"flex min-h-[60px] w-full rounded-md border border-input bg-transparent
 px-3 py-2 text-base shadow-sm transition-colors
 placeholder:text-muted-foreground
 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
 disabled:cursor-not-allowed disabled:opacity-50
 md:text-sm"
```

### Server Action Pattern
```typescript
// 1. Auth check
const { data: { user }, error: authError } = await supabase.auth.getUser()

// 2. Input validation
if (!contactId || typeof contactId !== 'string') return { error: '...' }
if (typeof notes !== 'string' || notes.length > 10000) return { error: '...' }

// 3. Update (RLS handles ownership)
await supabase.from('contacts').update({ notes }).eq('id', contactId)

// 4. Revalidate
revalidatePath('/dashboard/contacts')
```

## Files Modified

### Created Files (3)
1. `supabase/migrations/20260201_add_contact_notes.sql` - DB migration
2. `components/ui/textarea.tsx` - Textarea UI component

### Modified Files (2)
1. `lib/types/database.ts` - Added notes field to Contact interface
2. `lib/actions/contact.ts` - Added updateContactNotes server action

### Bug Fix Files (2)
1. `app/(dashboard)/send/page.tsx` - No changes needed (linter handled)
2. `components/send/send-page-client.tsx` - Fixed unused parameter

## Success Criteria Status

All success criteria met:

- ✅ DB migration ready to apply (adds notes TEXT column to contacts)
- ✅ Contact type updated with notes field
- ✅ Textarea UI component created following Input pattern
- ✅ updateContactNotes server action validates and persists notes
- ✅ All lint + typecheck clean

## Next Phase Readiness

**Ready for Phase 22 Plan 02:** Contact detail drawer can now:
- Display notes field in drawer UI
- Allow editing notes via Textarea component
- Persist notes via updateContactNotes server action
- After migration runs, all contacts will have notes column

**Migration Required:** Run `supabase db reset` or `supabase db push` to apply migration before testing drawer.

## Commits

| Hash | Message |
|------|---------|
| d3947c1 | feat(22-01): add notes column, Contact type, and Textarea component |
| 78927b7 | feat(22-01): add updateContactNotes server action |

**Total commits:** 2 (atomic per-task commits)
