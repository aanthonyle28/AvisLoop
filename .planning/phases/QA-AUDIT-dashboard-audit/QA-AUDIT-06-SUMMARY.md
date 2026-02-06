---
phase: QA-AUDIT
plan: 06
subsystem: ui
tags: [customers, feedback, legacy-terminology, phosphor-icons, lucide-react]

# Dependency graph
requires:
  - phase: 20
    provides: Customers table rename from contacts
  - phase: 26
    provides: Feedback page and resolution workflow
provides:
  - Customers page legacy terminology audit
  - Feedback page icon consistency audit
  - V2 alignment assessment for both pages
affects: [QA-AUDIT-09, dashboard-polish, terminology-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Customers page has 7+ legacy 'contact' terminology issues requiring fix"
  - "Feedback page uses only lucide-react icons, inconsistent with Phosphor standard"
  - "Legacy /components/contacts/ folder should be removed"

patterns-established: []

# Metrics
duration: 25min
completed: 2026-02-06
---

# Phase QA-AUDIT Plan 06: Customers + Feedback Page Audit Summary

**Found 7+ legacy "contact" terminology issues on Customers page and 100% icon inconsistency on Feedback page (all lucide-react instead of Phosphor)**

## Performance

- **Duration:** 25 min
- **Started:** 2026-02-06T00:27:10Z
- **Completed:** 2026-02-06T00:52:00Z
- **Tasks:** 2/2 (code analysis audit - no browser testing due to MCP unavailability)
- **Files audited:** 20+

## Accomplishments
- Thorough legacy terminology scan on Customers page (highest risk area)
- Complete icon library audit for both pages
- V2 alignment assessment for both pages
- Identified legacy folder cleanup opportunity

## Audit Method

This audit was performed via **codebase analysis** using Grep and Read tools. Browser-based testing was not available due to Playwright MCP tool unavailability. The audit focused on:
- Searching for legacy "contact" terminology
- Analyzing icon imports (lucide-react vs @phosphor-icons/react)
- Reading component code for V2 alignment

## Findings Summary

### Critical Findings (Severity: HIGH)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| C06-01 | Customers | Sheet title says "Add New Contact" | add-customer-sheet.tsx:80 | User-facing incorrect terminology |
| C06-02 | Customers | Success message "Contact added!" | add-customer-sheet.tsx:53 | User-facing incorrect terminology |
| C06-03 | Customers | Empty state "No contacts found" | customer-table.tsx:218 | User-facing incorrect terminology |
| C06-04 | Customers | Bulk selection "contacts selected" | customer-table.tsx:154 | User-facing incorrect terminology |
| C06-05 | Customers | Filtered empty "No contacts found" | empty-state.tsx:44 | User-facing incorrect terminology |
| C06-06 | Customers | Import loading "Importing contacts" | csv-import-dialog.tsx:244 | User-facing incorrect terminology |
| C06-07 | Feedback | Uses lucide-react MessageSquare | feedback/page.tsx:5,46 | Icon library inconsistency |

### Moderate Findings (Severity: MEDIUM)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| M06-01 | Customers | Legacy folder exists | components/contacts/ | 10 duplicate files, maintenance burden |
| M06-02 | Customers | 8 files use lucide-react | Multiple | Icon library fragmentation |
| M06-03 | Feedback | All components use lucide-react | feedback-card.tsx, feedback-list.tsx | Inconsistent with Phosphor standard |
| M06-04 | Customers | Comment says "Contact Detail Drawer" | customers-client.tsx:191 | Code comment legacy terminology |
| M06-05 | Customers | Prop named `onAddContact` | empty-state.tsx:5,9,20,21 | API legacy terminology |

### Low Findings (Severity: LOW)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| L06-01 | Customers | Mixed Phosphor + lucide in columns | customer-columns.tsx | Single file mixing both libraries |

---

## Task 1: Customers Page Detailed Findings

### Legacy Terminology Issues (7 User-Facing)

**C06-01: add-customer-sheet.tsx:80**
```tsx
<SheetTitle>Add New Contact</SheetTitle>
```
**Fix:** Change to "Add New Customer"

**C06-02: add-customer-sheet.tsx:53**
```tsx
setSuccessMessage('Contact added! Add another below.')
```
**Fix:** Change to "Customer added! Add another below."

**C06-03: customer-table.tsx:218**
```tsx
No contacts found.
```
**Fix:** Change to "No customers found."

**C06-04: customer-table.tsx:154**
```tsx
{selectedIds.length} {selectedIds.length === 1 ? 'customer' : 'contacts'} selected
```
**Fix:** Change to `'customer' : 'customers'`

**C06-05: empty-state.tsx:44**
```tsx
<h3 className='text-lg font-semibold mb-2'>No contacts found</h3>
```
**Fix:** Change to "No customers found"

**C06-06: csv-import-dialog.tsx:244**
```tsx
<p className='text-lg font-medium'>Importing contacts...</p>
```
**Fix:** Change to "Importing customers..."

### Icon Library Usage

Files using **lucide-react** (should migrate to Phosphor):
- `customers-client.tsx:11` - Plus, Users
- `customer-table.tsx:24` - Archive, Trash2
- `customer-filters.tsx:5` - X, Search
- `customer-columns.tsx:7` - MoreHorizontal, Archive, RotateCcw, Trash2, Pencil
- `add-customer-sheet.tsx:14` - CheckCircle, Plus
- `empty-state.tsx:2` - Users, Upload, Plus
- `csv-import-dialog.tsx:15` - Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2
- `csv-preview-table.tsx:12` - CheckCircle, XCircle, AlertTriangle

Files correctly using **Phosphor**:
- `customer-detail-drawer.tsx:16-24` - All icons from Phosphor
- `customer-columns.tsx:18` - Copy, Envelope (mixed file)
- `edit-customer-sheet.tsx:19` - CheckCircle, Warning, Question
- `sms-consent-form.tsx:10` - CaretDown, CaretUp, Info

### Legacy Folder Cleanup

The `/components/contacts/` folder contains 10 files that are duplicates of the `/components/customers/` folder:
- add-contact-sheet.tsx
- contact-columns.tsx
- contact-detail-drawer.tsx
- contact-filters.tsx
- contact-table.tsx
- contacts-client.tsx
- csv-import-dialog.tsx
- csv-preview-table.tsx
- edit-contact-sheet.tsx
- empty-state.tsx

**Recommendation:** Delete entire `/components/contacts/` folder after verifying no imports reference it.

### V2 Alignment Assessment

**Status: NEEDS IMPROVEMENT**

The Customers page is positioned as a primary CRM destination with prominent "Add Customer" button. In V2 model:
- Customers should be created implicitly via Jobs completion
- The page should feel secondary/supporting, not a main entry point
- There's no guidance steering users to add customers via jobs

**Suggestions:**
1. Add helper text: "Customers are automatically added when you complete a job"
2. Consider reducing prominence of "Add Customer" button
3. Add link to Jobs page for new customer creation flow

---

## Task 2: Feedback Page Detailed Findings

### Icon Consistency Issues (100% lucide-react)

**C06-07: feedback/page.tsx**
```tsx
import { MessageSquare } from 'lucide-react'
...
<MessageSquare className="w-6 h-6" />
```
**Fix:** Use `ChatCircleText` from `@phosphor-icons/react`

**M06-03: feedback-list.tsx**
```tsx
import { MessageSquare } from 'lucide-react'
```
**Fix:** Use `ChatCircleText` from `@phosphor-icons/react`

**M06-03: feedback-card.tsx**
```tsx
import { Star, Check, RotateCcw, Mail } from 'lucide-react'
```
**Fix:** Use Phosphor equivalents:
- Star -> Star
- Check -> Check
- RotateCcw -> ArrowCounterClockwise
- Mail -> Envelope

### Navigation Icon (CORRECT)

The sidebar correctly uses Phosphor:
```tsx
// sidebar.tsx:18
import { ChatCircleText } from '@phosphor-icons/react'
// sidebar.tsx:40
{ icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
```

### Terminology Assessment (GOOD)

The Feedback page correctly uses "Customer Feedback" language throughout:
- Page heading: "Customer Feedback"
- Empty state: "When customers share feedback through your review funnel..."
- No "contact" terminology found

### V2 Alignment Assessment

**Status: GOOD**

The Feedback page aligns well with V2 vision:
- Positioned as a "response" page, not a "complaints inbox"
- Clear connection to review funnel: "Private feedback from customers collected through your review funnel"
- Shows review funnel stats (Total, Unresolved, Resolved, Avg Rating)
- Resolution workflow with internal notes

---

## Recommended Fixes by Priority

### Priority 1: Fix User-Facing Terminology (6 changes)
Quick text changes in 4 files to replace "contact" with "customer":
- add-customer-sheet.tsx (2 changes)
- customer-table.tsx (2 changes)
- empty-state.tsx (1 change)
- csv-import-dialog.tsx (1 change)

### Priority 2: Feedback Page Icon Migration (3 files)
Replace lucide-react imports with Phosphor:
- feedback/page.tsx
- feedback-list.tsx
- feedback-card.tsx

### Priority 3: Customers Page Icon Migration (8 files)
Replace lucide-react imports with Phosphor in all customer components.

### Priority 4: Legacy Folder Cleanup
- Verify no imports reference `/components/contacts/`
- Delete entire folder

### Priority 5: V2 Alignment Enhancement
- Add helper text about implicit customer creation via jobs
- Consider UX changes to make Customers feel secondary

---

## Issues Encountered

**Playwright MCP Unavailable:** Browser-based testing was not possible due to MCP tool unavailability. This audit was completed via codebase analysis only. Visual testing and interactive flow verification should be performed manually or in a future audit when tools are available.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Critical findings (user-facing) | 7 |
| Moderate findings | 5 |
| Low findings | 1 |
| Files needing terminology fix | 4 |
| Files needing icon migration | 11 |
| Legacy files to delete | 10 |

---

*Phase: QA-AUDIT*
*Plan: 06*
*Completed: 2026-02-06*
