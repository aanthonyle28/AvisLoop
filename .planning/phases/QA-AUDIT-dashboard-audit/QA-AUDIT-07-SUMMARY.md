---
phase: QA-AUDIT
plan: 07
subsystem: ui
tags: [history, billing, settings, legacy-terminology, phosphor-icons, lucide-react]

# Dependency graph
requires:
  - phase: 23
    provides: Message templates and migration
  - phase: 25
    provides: AI personalization section
  - phase: 28
    provides: Email auth and branded links sections
provides:
  - History page legacy terminology audit
  - Billing page terminology and icon audit
  - Settings page section coverage audit
  - Icon consistency audit for all three pages
affects: [QA-AUDIT-09, dashboard-polish, terminology-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "History page has 6+ legacy 'review request' terminology issues requiring fix"
  - "Billing page has 2 lucide-react icons and 1 'review requests' text"
  - "Settings integrations-section uses 4 lucide-react icons instead of Phosphor"
  - "CONTACT_LIMITS constant is internal-only, user-facing text correctly says 'customers'"
  - "Billing page IS accessible via Account menu (not a bug)"

patterns-established: []

# Metrics
duration: 35min
completed: 2026-02-06
---

# Phase QA-AUDIT Plan 07: History, Billing, Settings Page Audit Summary

**Found 6+ legacy "review request" terminology issues on History page, 2 icon library issues on Billing, and 5 icon library issues across Settings components**

## Performance

- **Duration:** 35 min
- **Started:** 2026-02-06T00:31:46Z
- **Completed:** 2026-02-06T01:06:00Z
- **Tasks:** 2/2 (code analysis audit)
- **Files audited:** 15+

## Accomplishments
- Thorough legacy terminology scan on History page
- Billing page usage terminology verification (user-facing text is correct)
- Settings page section completeness audit
- Icon library audit across all three pages
- Navigation access verification (Billing accessible via Account menu)

## Audit Method

This audit was performed via **codebase analysis** using Grep and Read tools. The audit focused on:
- Searching for legacy "review request" and "contact" terminology
- Analyzing icon imports (lucide-react vs @phosphor-icons/react)
- Verifying Settings page has all required sections
- Verifying navigation access to Billing page

---

## Findings Summary

### Critical Findings (Severity: HIGH)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| *None* | - | - | - | No critical findings |

### Moderate Findings (Severity: MEDIUM)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| M07-01 | History | Page description "all your review requests" | history-client.tsx:116 | User-facing legacy terminology |
| M07-02 | History | Success toast "Review request sent" | history-client.tsx:75 | User-facing legacy terminology |
| M07-03 | History | Empty state "first review request" | empty-state.tsx:31 | User-facing legacy terminology |
| M07-04 | History | Button "Send Review Request" | empty-state.tsx:36 | User-facing legacy terminology |
| M07-05 | History | Drawer description "this review request" | request-detail-drawer.tsx:134 | User-facing legacy terminology |
| M07-06 | History | "receiving review requests" | request-detail-drawer.tsx:247 | User-facing legacy terminology |
| M07-07 | History | "This contact is on cooldown" | request-detail-drawer.tsx:244 | Legacy "contact" terminology |
| M07-08 | History | "This contact has opted out" | request-detail-drawer.tsx:247 | Legacy "contact" terminology |
| M07-09 | History | error.tsx uses lucide-react AlertCircle | error.tsx:5 | Icon library inconsistency |
| M07-10 | History | filters uses lucide-react X, Search, Loader2 | history-filters.tsx:8 | Icon library inconsistency |
| M07-11 | History | empty-state uses lucide-react History, Send | empty-state.tsx:1 | Icon library inconsistency |
| M07-12 | Billing | CheckCircle2 from lucide-react | billing/page.tsx:7 | Icon library inconsistency |
| M07-13 | Billing | AlertTriangle from lucide-react | usage-warning-banner.tsx:2 | Icon library inconsistency |
| M07-14 | Billing | "keep sending review requests" text | usage-warning-banner.tsx:69 | Legacy terminology |
| M07-15 | Settings | Key, Copy, Check, RefreshCw from lucide | integrations-section.tsx:4 | Icon library inconsistency |
| M07-16 | Settings | Loader2 from lucide-react | service-types-section.tsx:6 | Icon library inconsistency |

### Low Findings (Severity: LOW)

| ID | Page | Issue | Location | Impact |
|----|------|-------|----------|--------|
| L07-01 | History | Route "/history" vs label "Activity" | sidebar.tsx:39 | Internal URL inconsistency |

---

## Task 1: History Page Detailed Findings

### Legacy Terminology Issues (6 "review request" + 2 "contact")

**M07-01: history-client.tsx:116**
```tsx
<p className="text-muted-foreground mt-1">
  View and manage all your review requests
</p>
```
**Fix:** Change to "View your message history and activity"

**M07-02: history-client.tsx:75**
```tsx
toast.success('Review request sent successfully!', {
  description: 'The recipient will receive your message shortly.',
```
**Fix:** Change to "Message sent successfully!"

**M07-03: empty-state.tsx:31**
```tsx
Once you send your first review request, it will appear here so you can track its status.
```
**Fix:** Change to "Once you send your first message, it will appear here so you can track its status."

**M07-04: empty-state.tsx:36**
```tsx
<Link href="/send">
  <Send className="h-4 w-4" />
  Send Review Request
</Link>
```
**Fix:** Change to "Send Message" or "Get Started"

**M07-05: request-detail-drawer.tsx:134**
```tsx
<SheetDescription>
  View details and take action on this review request
</SheetDescription>
```
**Fix:** Change to "View details and take action on this message"

**M07-06 + M07-08: request-detail-drawer.tsx:247**
```tsx
<p>This contact has opted out of receiving review requests.</p>
```
**Fix:** Change to "This customer has opted out of receiving messages."

**M07-07: request-detail-drawer.tsx:244**
```tsx
<p>This contact is on cooldown. You can resend in a few days.</p>
```
**Fix:** Change to "This customer is on cooldown. You can resend in a few days."

### Icon Library Issues (3 files)

**M07-09: error.tsx**
```tsx
import { AlertCircle } from 'lucide-react'
```
**Fix:** Use `WarningCircle` from `@phosphor-icons/react`

**M07-10: history-filters.tsx**
```tsx
import { X, Search, Loader2 } from 'lucide-react'
```
**Fix:** Use `X`, `MagnifyingGlass`, `SpinnerGap` from Phosphor

**M07-11: empty-state.tsx**
```tsx
import { History, Send } from 'lucide-react'
```
**Fix:** Use `ClockCounterClockwise`, `PaperPlaneTilt` from Phosphor

### Page Heading (CORRECT)
```tsx
<h1 className="text-3xl font-bold tracking-tight">Activity</h1>
```
The page heading is correctly "Activity", not "History" or "Requests".

### Route vs Label Discrepancy

**L07-01:**
- Sidebar label: "Activity" (correct per V2 naming)
- Route: `/history` (legacy naming)

This is a low priority internal inconsistency. The route could be renamed in a future refactor, but it doesn't affect user experience since users see "Activity" in the UI.

---

## Task 2: Billing Page Detailed Findings

### Icon Library Issues (2 instances)

**M07-12: billing/page.tsx:7**
```tsx
import { CheckCircle2 } from 'lucide-react'
```
**Fix:** Use `CheckCircle` from `@phosphor-icons/react`

**M07-13: usage-warning-banner.tsx:2**
```tsx
import { AlertTriangle } from 'lucide-react'
```
**Fix:** Use `WarningCircle` or `Warning` from `@phosphor-icons/react`

### Legacy Terminology (1 instance)

**M07-14: usage-warning-banner.tsx:69**
```tsx
to keep sending review requests.
```
**Fix:** Change to "to keep sending messages."

### CONTACT_LIMITS Constant (VERIFIED CORRECT)

The `CONTACT_LIMITS` constant in `lib/constants/billing.ts` is an **internal-only** constant name. User-facing text correctly uses "customers":

```tsx
// usage-display.tsx:51 - CORRECT
<span className="text-muted-foreground">Customers</span>

// usage-display.tsx:71 - CORRECT
{contactRemaining} customers remaining

// usage-display.tsx:76 - CORRECT
Customer limit reached. You can add more customers...

// usage-warning-banner.tsx:36 - CORRECT
<p className="font-medium text-destructive">Customer limit exceeded</p>

// usage-warning-banner.tsx:38 - CORRECT
You have {contactCount} customers but your Basic plan allows...
```

**No action needed.** The internal constant name `CONTACT_LIMITS` doesn't affect users.

### Navigation Access (VERIFIED)

Billing page IS accessible via the Account menu:
```tsx
// account-menu.tsx:60-65
<DropdownMenuItem asChild>
  <Link href="/billing" className="flex items-center gap-2 cursor-pointer">
    <CreditCard size={16} weight="regular" />
    <span>Billing</span>
  </Link>
</DropdownMenuItem>
```

**No action needed.** Billing is correctly placed in Account menu using Phosphor CreditCard icon.

---

## Task 2: Settings Page Detailed Findings

### Section Completeness (ALL PRESENT)

All required sections are present:

1. **Business Profile** - Line 79-82
2. **Message Templates** - Line 85-108 (correctly named, not "Email Templates")
3. **Service Types** - Line 111-120
4. **AI Personalization** - Line 123-130
5. **Email Authentication** - Line 133-140 (Phase 28)
6. **Branded Review Link** - Line 143-152 (Phase 28)
7. **Integrations** - Line 155-161
8. **Danger Zone** - Line 164-170

### Icon Library Issues (2 files)

**M07-15: integrations-section.tsx:4**
```tsx
import { Key, Copy, Check, RefreshCw } from 'lucide-react'
```
**Fix:** Use Phosphor equivalents:
- Key -> Key
- Copy -> Copy
- Check -> Check
- RefreshCw -> ArrowClockwise

**M07-16: service-types-section.tsx:6**
```tsx
import { Loader2 } from 'lucide-react'
```
**Fix:** Use `SpinnerGap` from Phosphor

### Terminology Assessment (CORRECT)

Settings page correctly uses V2 terminology:
- "Message Templates" (not "Email Templates") - Section heading at line 86
- "customers" in integrations text (line 174) - "create or update customers"
- No "contact" terminology found

### Account Menu Icons (CORRECT)

The account-menu.tsx correctly uses all Phosphor icons:
```tsx
import {
  AppWindow,
  GearSix,
  CreditCard,
  Headset,
  SignOut,
  Sun,
  Moon,
  Desktop,
} from '@phosphor-icons/react'
```

---

## Recommended Fixes by Priority

### Priority 1: Fix User-Facing Terminology (8 changes)

**History page - 8 text changes in 3 files:**
- history-client.tsx (2 changes: description + toast)
- empty-state.tsx (2 changes: text + button)
- request-detail-drawer.tsx (4 changes: description + 3 messages)

**Billing page - 1 text change:**
- usage-warning-banner.tsx (1 change: "review requests")

### Priority 2: Icon Migration (6 files)

**History:**
- error.tsx (1 icon)
- history-filters.tsx (3 icons)
- empty-state.tsx (2 icons)

**Billing:**
- billing/page.tsx (1 icon)
- usage-warning-banner.tsx (1 icon)

**Settings:**
- integrations-section.tsx (4 icons)
- service-types-section.tsx (1 icon)

---

## Positive Findings

### Things Working Correctly

1. **Billing user-facing terminology** - All customer-facing text says "customers" (not "contacts")
2. **Message Templates naming** - Settings correctly labels section "Message Templates" (not "Email Templates")
3. **Billing navigation access** - Billing page accessible via Account menu with Phosphor CreditCard icon
4. **Account menu icons** - 100% Phosphor icons
5. **Sidebar navigation** - Uses "Activity" label (not "History" or "Requests")
6. **Settings section completeness** - All 8 sections present including Phase 28 additions

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Critical findings (blocking) | 0 |
| Moderate findings (should fix) | 16 |
| Low findings (can defer) | 1 |
| Terminology fixes needed | 9 |
| Icon migrations needed | 6 files, 13 icons |

---

## Comparison with Prior Audits

This audit found fewer critical issues than the Customers page audit (QA-AUDIT-06) because:
- History, Billing, Settings are utility pages with less prominent user-facing text
- Billing terminology was proactively checked during Phase 20 migration
- Settings sections use correct V2 naming patterns

The main issues are:
1. Legacy "review request" terminology persisting in History page
2. Scattered lucide-react icon usage (consistent with pattern seen in other audits)

---

*Phase: QA-AUDIT*
*Plan: 07*
*Completed: 2026-02-06*
