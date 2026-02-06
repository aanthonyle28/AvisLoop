---
phase: 30-v2-alignment
plan: 01
status: complete
completed_at: 2026-02-06
commit: cd2a0f8

artifacts_created:
  - lib/data/customer.ts
  - components/jobs/customer-autocomplete.tsx

tech_added:
  - CustomerAutocomplete component with smart matching
  - getCustomersForAutocomplete server function

key_decisions:
  - Match on both name AND email for better UX
  - Trigger autocomplete at 2+ characters
  - Limit to 6 suggestions for readability
  - Full keyboard navigation (ArrowUp/Down, Enter, Escape)
  - "Create new" fallback when no matches found
---

## Summary

Created the smart customer autocomplete component and supporting data function for the Add Job form. This enables V2's inline customer creation flow.

## What Was Built

### lib/data/customer.ts
- `getCustomersForAutocomplete()` - Server function that returns minimal customer data (id, name, email, phone)
- Filters to active customers only
- Ordered by name for consistent display
- RLS-protected via business_id scope

### components/jobs/customer-autocomplete.tsx
- Smart autocomplete matching on name AND email
- Triggers at 2+ characters, limits to 6 suggestions
- Full keyboard navigation (arrows, Enter, Escape)
- "Create new customer" option when no matches found
- ARIA attributes for accessibility
- Error state display support

## Key Patterns

```typescript
// Autocomplete filtering
const filtered = useMemo(() => {
  if (query.length < 2) return []
  const lowerQuery = query.toLowerCase()
  return customers
    .filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 6)
}, [query, customers])
```

## Dependencies

- Used by: Plan 30-03 (Add Job form redesign)
- Requires: @phosphor-icons/react (already installed)

## Verification

- [x] TypeScript compiles without errors
- [x] Component exports CustomerAutocomplete
- [x] Data function returns Pick<Customer, 'id' | 'name' | 'email' | 'phone'>[]
- [x] Keyboard navigation implemented
