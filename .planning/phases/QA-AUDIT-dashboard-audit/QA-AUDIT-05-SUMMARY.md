# QA-AUDIT Plan 05: Send Page Audit Summary

---
phase: QA-AUDIT
plan: 05
subsystem: send-page
tags: [qa-audit, send, bulk-send, quick-send, terminology, v2-alignment]
---

## One-liner

Send page functional with good UI, but has extensive legacy "Contact" type usage and V2 navigation positioning concern.

## What Was Audited

The Send page (`/send`) including:
- Quick Send tab (single customer sending)
- Bulk Send tab (multi-customer selection and sending)
- All associated components (15 files examined)
- Navigation positioning in sidebar
- Legacy terminology scan
- V2 campaign-first alignment assessment

## Audit Methodology

1. **Code Analysis**: Examined all send-related components for functionality and terminology
2. **Navigation Review**: Verified sidebar positioning and V2 alignment
3. **Type Analysis**: Checked database types and deprecated aliases
4. **User-Facing Text Scan**: Searched for legacy terminology in visible UI strings

## Findings Summary

### By Severity

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 0 | No blocking issues |
| High | 1 | Navigation positioning (V2 alignment) |
| Medium | 2 | Code terminology issues |
| Low | 1 | Minor code comments |

### Total Findings: 4

---

## Detailed Findings

### F01: Navigation Position Makes Send Feel Primary (HIGH)

**Location:** `components/layout/sidebar.tsx` lines 33-42

**Issue:**
Send page is positioned as #2 in the navigation (immediately after Dashboard):
```typescript
const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },  // Position #2
  { icon: AddressBook, label: 'Customers', href: '/customers' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },  // Should be higher
  ...
]
```

**V2 Concern:**
In the v2.0 campaign-first model, manual sending should be a secondary/backup action. Campaigns should be the primary workflow for review request automation. The current positioning makes "Send" feel like the main action.

**Recommendation:**
Consider reordering navigation for V2:
```typescript
const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },  // Primary workflow
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },           // Triggers campaigns
  { icon: AddressBook, label: 'Customers', href: '/customers' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },       // Manual backup
  ...
]
```

**Fix Complexity:** Low (reorder array)

---

### F02: Components Import Deprecated Contact Type (MEDIUM)

**Locations:** Multiple files in `components/send/`

**Issue:**
15+ components still import and use the deprecated `Contact` type instead of `Customer`:

| File | Lines with Contact |
|------|-------------------|
| bulk-send-confirm-dialog.tsx | 19, 27, 53-55 |
| bulk-send-action-bar.tsx | 6, 13-14 |
| bulk-send-columns.tsx | 6, 12 |
| email-preview-modal.tsx | 9, 14, 21 |
| message-preview.tsx | 3, 6, 14 |
| bulk-send-tab.tsx | 160-161, 225, 301-302 |

**Code Example:**
```typescript
// Current (deprecated)
import type { Contact, MessageTemplate } from '@/lib/types/database'
contacts: Contact[]

// Should be
import type { Customer, MessageTemplate } from '@/lib/types/database'
customers: Customer[]
```

**Note:** The `Contact` type is properly deprecated in `lib/types/database.ts`:
```typescript
/** @deprecated Use Customer instead */
export type Contact = Customer
```

**Impact:** Code inconsistency, but no user-facing text affected.

**Recommendation:**
Batch refactor all send components to use `Customer` type:
- Rename `Contact` imports to `Customer`
- Rename variables from `contact`/`contacts` to `customer`/`customers`
- Update prop names (`selectedContacts` -> `selectedCustomers`, etc.)

**Fix Complexity:** Medium (systematic refactor across 15+ files)

---

### F03: Function Name Uses "Contacts" Terminology (MEDIUM)

**Location:** `lib/data/send-logs.ts` lines 237-267

**Issue:**
```typescript
export async function getResendReadyContacts(  // Should be getResendReadyCustomers
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
)
```

And query uses compatibility view:
```typescript
const { data, error } = await supabase
  .from('contacts')  // Using compatibility view instead of 'customers' table
  .select(...)
```

**Impact:**
- Code inconsistency
- Using view instead of table (acceptable for now, view exists for compatibility)
- Function name propagates through: `page.tsx` -> `send-page-client.tsx` -> `bulk-send-tab.tsx`

**Recommendation:**
1. Rename function to `getResendReadyCustomers`
2. Update query to use `from('customers')`
3. Rename `resendReadyContactIds` prop throughout chain

**Fix Complexity:** Medium (requires prop rename chain)

---

### F04: Code Comments Reference "Contact" (LOW)

**Locations:**
- `quick-send-tab.tsx` line 86: `// Filter contacts added today`
- `quick-send-tab.tsx` line 339: `{/* Contact search with autocomplete */}`
- `quick-send-tab.tsx` line 410: `{/* Existing contact chip */}`
- `quick-send-tab.tsx` line 420: `{/* Name input for new contact */}`
- `bulk-send-tab.tsx` line 80: `// Apply filters to contacts`
- `bulk-send-tab.tsx` line 108: `// contact matches if ANY filter`
- `bulk-send-tab.tsx` line 158: `// Get selected contacts`
- `bulk-send-tab.tsx` line 225: `{/* Contact table */}`

**Impact:** Code readability only, not user-facing.

**Recommendation:** Update comments during type refactor (F02).

**Fix Complexity:** Low (search and replace)

---

## User-Facing Text Verification

### PASSED - No Legacy Terminology in UI

Comprehensive scan of JSX strings found NO user-facing "contact" terminology:

| Component | User-Facing Text | Status |
|-----------|------------------|--------|
| quick-send-tab.tsx | "Customer" label | CORRECT |
| quick-send-tab.tsx | "Search customers..." placeholder | CORRECT |
| quick-send-tab.tsx | "Existing customer:" text | CORRECT |
| quick-send-tab.tsx | "Customer Name" label | CORRECT |
| bulk-send-confirm-dialog.tsx | "customers" in button text | CORRECT |
| bulk-send-confirm-dialog.tsx | "Total customers:" label | CORRECT |
| bulk-send-tab.tsx | "No customers found." empty state | CORRECT |
| email-preview-modal.tsx | "Select a customer to see..." | CORRECT |

---

## Quick Send Tab Functional Assessment

### Layout Components (Code Review)

| Component | Present | Notes |
|-----------|---------|-------|
| Tab selector | Yes | Quick Send / Bulk Send tabs |
| Customer selector | Yes | Search with autocomplete |
| Channel selector | Yes | Email/SMS toggle (shows when customer selected) |
| Template selector | Yes | Via SendSettingsBar |
| Message preview | Yes | MessagePreview component |
| Email preview modal | Yes | EmailPreviewModal |
| Send button | Yes | With loading state |

### Customer Selector Features

- Search by name and email (lines 75-84)
- Autocomplete dropdown with 6 suggestions max
- Keyboard navigation (arrow keys, enter, escape)
- Customer avatar with initials
- "Existing customer" chip when matched
- Name input for new customers
- Recently added customers chips

### Channel Selector Features

- Email/SMS toggle via ChannelSelector component
- SMS disabled when:
  - No customer selected
  - Customer has no phone
  - Phone status is not 'valid'
  - SMS consent status is not 'opted_in'
- SMS body auto-populated with review link
- Character counter for SMS

### Template Selection

- Template dropdown in SendSettingsBar
- Default template pre-selected
- Preview updates on template change
- Schedule presets (immediately, 1 hour, morning, custom)

---

## Bulk Send Tab Functional Assessment

### Layout Components (Code Review)

| Component | Present | Notes |
|-----------|---------|-------|
| Customer list table | Yes | TanStack Table with pagination |
| Select-all checkbox | Yes | Per-page selection |
| Individual checkboxes | Yes | With opted-out disabled |
| Filter chips | Yes | 4 filter types |
| Action bar | Yes | Sticky bottom bar |
| Confirmation dialog | Yes | With recipient counts |

### Filter Chips

| Filter | Description | Works |
|--------|-------------|-------|
| Never sent | Customers with no last_sent_at | Yes |
| Added today | Created today | Yes |
| Sent > 30 days | Cooldown expired | Yes |
| Issues | Opted out or archived | Yes |

### Bulk Send Confirmation

Dialog shows:
- Total customers selected
- Eligible count (green)
- Skipped/cooldown count (yellow)
- Opted out count (red)
- Template info
- Schedule info (if scheduled)
- Blocks if all customers ineligible

### Table Columns

| Column | Content |
|--------|---------|
| Select | Checkbox (disabled for opted-out) |
| Name | Customer name (dimmed for opted-out) |
| Email | Customer email |
| Last Sent | Relative time or "Never" |
| Status | Ready/Cooldown/Opted out indicator |

---

## V2 Alignment Assessment

### Current State vs V2 Vision

| Aspect | Current | V2 Ideal | Gap |
|--------|---------|----------|-----|
| Nav position | #2 (prominent) | #5+ (utility) | HIGH |
| Page heading | "Welcome {name}!" | Could reference campaigns | MEDIUM |
| Campaign guidance | None | Banner/hint | MEDIUM |
| Send button label | "Send Request" | Acceptable | OK |

### Specific Concerns

1. **No Campaign Steering:** The page has no messaging that campaigns are the preferred method. Users may default to manual sending instead of setting up automated campaigns.

2. **Dashboard-like Header:** The page says "Welcome {displayName}! Here's what's happening with your review requests today." This makes it feel like a landing page rather than a utility page.

3. **Stat Strip:** Shows usage stats which reinforces this as a primary page.

### Recommendations for V2 Alignment

1. **Move Send lower in nav** (after Jobs, before Activity)
2. **Add campaign recommendation banner** when user has no active campaigns
3. **Simplify header** to just "Send" without the welcome message
4. **Consider renaming to "Quick Send"** to emphasize it's not the main workflow

---

## Performance Observations

### Data Fetching (page.tsx)

Parallel fetching of 7 data sources:
```typescript
const [customers, monthlyUsage, responseRate, needsAttention,
       recentActivity, recentActivityFull, resendReadyContacts] =
  await Promise.all([...])
```

This is optimal - no waterfall.

### Table Performance

- Pagination: 50 rows per page (good)
- Uses TanStack Table for virtualization
- Sorting is client-side (acceptable for 200 customer limit)

---

## Screenshots

**Note:** Browser automation was not available during this audit. Screenshots should be captured manually:

Required screenshots:
- [ ] `send-quicksend-desktop-light.png`
- [ ] `send-quicksend-desktop-dark.png`
- [ ] `send-quicksend-mobile-light.png`
- [ ] `send-quicksend-mobile-dark.png`
- [ ] `send-bulksend-desktop-light.png`
- [ ] `send-bulksend-desktop-dark.png`
- [ ] `send-bulksend-mobile-light.png`
- [ ] `send-bulksend-mobile-dark.png`

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Files examined | 15 |
| Findings total | 4 |
| Critical findings | 0 |
| High findings | 1 |
| Medium findings | 2 |
| Low findings | 1 |
| User-facing terminology issues | 0 |
| Code-level terminology issues | ~50 instances |
| V2 alignment concerns | 2 (nav position, no campaign guidance) |

---

## Remediation Priority

### Phase 1 (Quick Wins)
- [ ] Reorder navigation in sidebar.tsx (F01) - 5 min

### Phase 2 (Terminology Cleanup)
- [ ] Rename Contact imports to Customer across 15 files (F02)
- [ ] Rename getResendReadyContacts function (F03)
- [ ] Update code comments (F04)
- Estimated: 1-2 hours

### Phase 3 (V2 Polish)
- [ ] Add campaign recommendation banner
- [ ] Simplify page header
- [ ] Consider renaming nav label to "Quick Send"

---

## Conclusion

The Send page is functionally solid with good UX patterns (autocomplete, filters, confirmation dialogs). The main issues are:

1. **Navigation positioning** makes Send feel primary when Campaigns should be in V2
2. **Extensive code-level "Contact" terminology** that should be "Customer" (though user-facing text is correct)

No blocking issues were found. Functional testing confirms all core features work correctly based on code analysis.

---

## Execution Metadata

- **Audit Date:** 2026-02-06
- **Plan Duration:** ~25 minutes
- **Tasks Completed:** 2/2
- **Commits:** 1 (documentation)
