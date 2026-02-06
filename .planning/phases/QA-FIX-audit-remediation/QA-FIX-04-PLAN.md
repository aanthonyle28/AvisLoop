---
phase: QA-FIX-audit-remediation
plan: 04
type: execute
wave: 2
depends_on: []
files_modified:
  - app/(dashboard)/history/error.tsx
  - app/(dashboard)/billing/page.tsx
  - app/(dashboard)/feedback/page.tsx
  - components/feedback/feedback-card.tsx
  - components/feedback/feedback-list.tsx
  - components/customers/empty-state.tsx
  - components/customers/csv-import-dialog.tsx
  - components/history/empty-state.tsx
  - components/history/history-filters.tsx
  - components/billing/usage-warning-banner.tsx
  - components/settings/integrations-section.tsx
autonomous: true

must_haves:
  truths:
    - "No lucide-react imports in high-priority user-facing components"
    - "All icons use @phosphor-icons/react consistently"
  artifacts:
    - path: "components/feedback/feedback-card.tsx"
      provides: "Feedback card with Phosphor icons"
      contains: "from '@phosphor-icons/react'"
    - path: "components/billing/usage-warning-banner.tsx"
      provides: "Warning banner with Phosphor icons"
      contains: "from '@phosphor-icons/react'"
  key_links: []
---

<objective>
Migrate 11 high-priority user-facing files from lucide-react to @phosphor-icons/react.

Purpose: Establish consistent icon system using Phosphor throughout dashboard.
Output: All specified files use Phosphor icons exclusively.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@docs/QA-AUDIT.md (icon migration section)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migrate dashboard page icons (3 files)</name>
  <files>
    - app/(dashboard)/history/error.tsx
    - app/(dashboard)/billing/page.tsx
    - app/(dashboard)/feedback/page.tsx
  </files>
  <action>
Migrate lucide-react icons to Phosphor equivalents in dashboard pages.

File: app/(dashboard)/history/error.tsx
- Replace: `import { AlertCircle } from 'lucide-react'`
- With: `import { WarningCircle } from '@phosphor-icons/react'`
- Update usage: `<AlertCircle ...>` -> `<WarningCircle size={...} weight="regular" ...>`

File: app/(dashboard)/billing/page.tsx
- Replace: `import { CheckCircle2 } from 'lucide-react'`
- With: `import { CheckCircle } from '@phosphor-icons/react'`
- Update usage: `<CheckCircle2 ...>` -> `<CheckCircle size={...} weight="regular" ...>`

File: app/(dashboard)/feedback/page.tsx
- Replace: `import { MessageSquare } from 'lucide-react'`
- With: `import { ChatCircle } from '@phosphor-icons/react'`
- Update usage: `<MessageSquare ...>` -> `<ChatCircle size={...} weight="regular" ...>`

Phosphor icons use `size` and `weight` props instead of `className` for sizing.
Common sizes: 16, 20, 24. Default weight: "regular".
  </action>
  <verify>
Run: `grep -l "from 'lucide-react'" app/(dashboard)/history/error.tsx app/(dashboard)/billing/page.tsx app/(dashboard)/feedback/page.tsx` should return no results.
Run: `grep -l "@phosphor-icons/react" app/(dashboard)/history/error.tsx app/(dashboard)/billing/page.tsx app/(dashboard)/feedback/page.tsx` should return all 3 files.
  </verify>
  <done>3 dashboard page files migrated to Phosphor icons.</done>
</task>

<task type="auto">
  <name>Task 2: Migrate feedback component icons (2 files)</name>
  <files>
    - components/feedback/feedback-card.tsx
    - components/feedback/feedback-list.tsx
  </files>
  <action>
Migrate lucide-react icons to Phosphor equivalents in feedback components.

File: components/feedback/feedback-card.tsx
Icons to replace:
- Star -> Star (Phosphor has Star)
- Check -> Check (Phosphor has Check)
- RotateCcw -> ArrowCounterClockwise
- Mail -> Envelope

Update import:
```typescript
import { Star, Check, ArrowCounterClockwise, Envelope } from '@phosphor-icons/react'
```

File: components/feedback/feedback-list.tsx
- MessageSquare -> ChatCircle

Update import:
```typescript
import { ChatCircle } from '@phosphor-icons/react'
```

For each icon usage, update props:
- Remove className sizing (h-4 w-4, etc.)
- Add size={16} or size={20} as appropriate
- Add weight="regular" or "fill" as appropriate
  </action>
  <verify>
Run: `grep -l "from 'lucide-react'" components/feedback/*.tsx` should return no results.
Run: `grep -l "@phosphor-icons/react" components/feedback/*.tsx` should return both files.
  </verify>
  <done>2 feedback component files migrated to Phosphor icons.</done>
</task>

<task type="auto">
  <name>Task 3: Migrate customer component icons (2 files)</name>
  <files>
    - components/customers/empty-state.tsx
    - components/customers/csv-import-dialog.tsx
  </files>
  <action>
Migrate lucide-react icons to Phosphor equivalents in customer components.

File: components/customers/empty-state.tsx
Icons to replace:
- Users -> Users (Phosphor has Users)
- Upload -> Upload (Phosphor has Upload)
- Plus -> Plus (Phosphor has Plus)

Update import:
```typescript
import { Users, Upload, Plus } from '@phosphor-icons/react'
```

File: components/customers/csv-import-dialog.tsx
Icons to replace:
- Upload -> Upload
- FileSpreadsheet -> FileXls
- AlertCircle -> WarningCircle
- CheckCircle -> CheckCircle
- Loader2 -> CircleNotch (with animate-spin class)

Update import:
```typescript
import { Upload, FileXls, WarningCircle, CheckCircle, CircleNotch } from '@phosphor-icons/react'
```

Note: Phosphor's CircleNotch is the equivalent of Lucide's Loader2 for loading spinners.
  </action>
  <verify>
Run: `grep -l "from 'lucide-react'" components/customers/empty-state.tsx components/customers/csv-import-dialog.tsx` should return no results.
Run: `grep -l "@phosphor-icons/react" components/customers/empty-state.tsx components/customers/csv-import-dialog.tsx` should return both files.
  </verify>
  <done>2 customer component files migrated to Phosphor icons.</done>
</task>

<task type="auto">
  <name>Task 4: Migrate history and settings component icons (4 files)</name>
  <files>
    - components/history/empty-state.tsx
    - components/history/history-filters.tsx
    - components/billing/usage-warning-banner.tsx
    - components/settings/integrations-section.tsx
  </files>
  <action>
Migrate lucide-react icons to Phosphor equivalents in remaining components.

File: components/history/empty-state.tsx
Icons to replace:
- History -> ClockCounterClockwise
- Send -> PaperPlaneTilt

Update import:
```typescript
import { ClockCounterClockwise, PaperPlaneTilt } from '@phosphor-icons/react'
```

File: components/history/history-filters.tsx
Icons to replace:
- X -> X (Phosphor has X)
- Search -> MagnifyingGlass
- Loader2 -> CircleNotch

Update import:
```typescript
import { X, MagnifyingGlass, CircleNotch } from '@phosphor-icons/react'
```

File: components/billing/usage-warning-banner.tsx
Icons to replace:
- AlertTriangle -> WarningCircle or Warning

Update import:
```typescript
import { Warning } from '@phosphor-icons/react'
```

File: components/settings/integrations-section.tsx
Icons to replace:
- Key -> Key (Phosphor has Key)
- Copy -> Copy (Phosphor has Copy)
- Check -> Check (Phosphor has Check)
- RefreshCw -> ArrowsClockwise

Update import:
```typescript
import { Key, Copy, Check, ArrowsClockwise } from '@phosphor-icons/react'
```
  </action>
  <verify>
Run: `grep -l "from 'lucide-react'" components/history/empty-state.tsx components/history/history-filters.tsx components/billing/usage-warning-banner.tsx components/settings/integrations-section.tsx` should return no results.
Run: `pnpm typecheck` to ensure no TypeScript errors.
  </verify>
  <done>4 remaining component files migrated to Phosphor icons.</done>
</task>

</tasks>

<verification>
1. `grep -r "from 'lucide-react'" app/(dashboard)/history/error.tsx app/(dashboard)/billing/page.tsx app/(dashboard)/feedback/page.tsx` returns no results
2. `grep -r "from 'lucide-react'" components/feedback/*.tsx components/customers/empty-state.tsx components/customers/csv-import-dialog.tsx components/history/empty-state.tsx components/history/history-filters.tsx components/billing/usage-warning-banner.tsx components/settings/integrations-section.tsx` returns no results
3. All migrated files import from `@phosphor-icons/react`
4. `pnpm typecheck` passes with no errors
5. `pnpm lint` passes with no errors
</verification>

<success_criteria>
- [ ] 3 dashboard page files migrated (history/error.tsx, billing/page.tsx, feedback/page.tsx)
- [ ] 2 feedback component files migrated (feedback-card.tsx, feedback-list.tsx)
- [ ] 2 customer component files migrated (empty-state.tsx, csv-import-dialog.tsx)
- [ ] 4 history/settings/billing files migrated
- [ ] No lucide-react imports in migrated files
- [ ] TypeScript and lint pass
</success_criteria>

<output>
After completion, create `.planning/phases/QA-FIX-audit-remediation/QA-FIX-04-SUMMARY.md`
</output>
