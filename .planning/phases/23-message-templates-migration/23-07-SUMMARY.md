---
phase: 23-message-templates-migration
plan: 07
subsystem: data-layer
tags: [migration, templates, typescript, backward-compatibility]
status: complete

requires:
  - 23-01-database-migration
  - 23-02-type-definitions
  - 23-03-server-actions

provides:
  - message_templates usage throughout codebase
  - Deprecated email_templates references
  - Backward compatible template handling

affects:
  - Send page
  - Settings page
  - History page
  - All template-related components

tech-stack:
  added: []
  patterns:
    - Deprecation comments with migration path
    - Backward compatibility via email_templates view
    - Type unification across UI layer

key-files:
  created: []
  modified:
    - lib/actions/business.ts
    - lib/data/business.ts
    - app/(dashboard)/send/page.tsx
    - app/(dashboard)/history/page.tsx
    - app/dashboard/settings/page.tsx
    - components/business-settings-form.tsx
    - components/send/send-page-client.tsx
    - components/send/quick-send-tab.tsx
    - components/send/bulk-send-tab.tsx
    - components/send/message-preview.tsx
    - components/send/email-preview-modal.tsx
    - components/send/send-settings-bar.tsx
    - components/send/bulk-send-action-bar.tsx
    - components/send/bulk-send-confirm-dialog.tsx
    - components/history/history-client.tsx
    - components/history/request-detail-drawer.tsx

decisions:
  - decision: Use @deprecated JSDoc comments for old functions
    rationale: Provides clear migration path in IDE tooltips
    alternatives: []
    impact: low

  - decision: Keep backward compatibility functions in business.ts
    rationale: Allows gradual migration, prevents breaking changes
    alternatives: [hard cutover, adapter pattern]
    impact: medium

  - decision: Filter message_templates by channel='email' in send page
    rationale: SMS sending comes in Phase 21, keep email-only for now
    alternatives: []
    impact: low

metrics:
  duration: ~15 minutes
  files-modified: 16
  commits: 3
  completed: 2026-02-04
---

# Phase 23 Plan 07: Update Template References Summary

**One-liner:** Migrated all template references from email_templates to message_templates with backward compatibility

## What Was Built

### Task 1: Business Actions Layer
Updated `lib/actions/business.ts` to use `message_templates` table:
- Added `@deprecated` comments to `createEmailTemplate`, `deleteEmailTemplate`, `getEmailTemplates`
- Updated `createEmailTemplate` to insert to `message_templates` with `channel='email'`
- Updated `deleteEmailTemplate` to delete from `message_templates`
- Updated `getBusiness` to join `message_templates` instead of `email_templates`
- Updated `getEmailTemplates` to filter `message_templates` by `channel='email'`
- Maintained full backward compatibility for existing code

### Task 2: Business Data Layer
Updated `lib/data/business.ts` to use `message_templates`:
- Updated `getBusiness` to join `message_templates` with all fields (channel, service_type)
- Updated `getEmailTemplates` to query `message_templates` with `channel='email'` filter
- Added `@deprecated` comment pointing to new `getMessageTemplates` function

### Task 3: UI Layer Migration
Updated all template-consuming components to use `MessageTemplate` type:

**Send Page:**
- `app/(dashboard)/send/page.tsx` - Filter `message_templates` for email channel
- `components/send/send-page-client.tsx` - Accept `MessageTemplate[]`
- `components/send/quick-send-tab.tsx` - Use `MessageTemplate` type
- `components/send/bulk-send-tab.tsx` - Use `MessageTemplate` type
- `components/send/message-preview.tsx` - Accept `MessageTemplate`
- `components/send/email-preview-modal.tsx` - Accept `MessageTemplate`
- `components/send/send-settings-bar.tsx` - Accept `MessageTemplate[]`
- `components/send/bulk-send-action-bar.tsx` - Accept `MessageTemplate`
- `components/send/bulk-send-confirm-dialog.tsx` - Accept `MessageTemplate`

**History Page:**
- `app/(dashboard)/history/page.tsx` - Use `message_templates` from business
- `components/history/history-client.tsx` - Accept `MessageTemplate[]`
- `components/history/request-detail-drawer.tsx` - Accept `MessageTemplate[]`

**Settings Page:**
- `app/dashboard/settings/page.tsx` - Query `message_templates`, use unified `templates` variable
- `components/business-settings-form.tsx` - Accept `MessageTemplate[]` for dropdown

## Technical Details

### Migration Pattern
```typescript
// Before (deprecated)
const templates = await supabase
  .from('email_templates')
  .select('*')

// After
const templates = await supabase
  .from('message_templates')
  .select('*')
  .eq('channel', 'email')
```

### Type Migration
```typescript
// Before
import type { EmailTemplate } from '@/lib/types/database'
interface Props {
  templates: EmailTemplate[]
}

// After
import type { MessageTemplate } from '@/lib/types/database'
interface Props {
  templates: MessageTemplate[]
}
```

### Backward Compatibility
The `email_templates` view created in migration 23-01 ensures existing SQL queries continue to work during transition period. Deprecated functions maintain identical behavior while using new table internally.

## Deviations from Plan

None - plan executed exactly as written.

## Testing Performed

✅ `pnpm typecheck` - All type errors resolved
✅ `pnpm lint` - No lint warnings
✅ All 16 files updated consistently
✅ Business actions use message_templates
✅ Data layer uses message_templates
✅ UI layer uses MessageTemplate type

## Next Phase Readiness

**Blockers:** None

**Ready for:**
- Phase 23-08: Backward Compatibility Testing (verify email_templates view works)
- Phase 21: SMS sending (message_templates ready for channel='sms')

**Dependencies satisfied:**
- Database migration (23-01) ✅
- Type definitions (23-02) ✅
- Server actions (23-03) ✅

## Performance Notes

No performance impact - queries identical to before, just using new table name.

## Notes

- All template references now use `MessageTemplate` type
- Email sending functionality completely unchanged (uses `channel='email'` filter)
- SMS support ready when Phase 21 begins (just change filter to `channel='sms'`)
- Deprecation path clear for all old functions
- Settings page now uses unified template list (MessageTemplate form from 23-04)

## Commits

1. `e63467c` - feat(23-07): update business actions to use message_templates
2. `99c46bf` - feat(23-07): update business data layer to use message_templates
3. `32df9e3` - feat(23-07): update send and history pages to use MessageTemplate
