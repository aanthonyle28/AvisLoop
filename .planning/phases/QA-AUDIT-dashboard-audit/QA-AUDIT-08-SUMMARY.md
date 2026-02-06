---
phase: QA-AUDIT
plan: 08
subsystem: ui
tags: [qa-audit, legacy-terminology, navigation, icon-system, cross-cutting]

# Dependency graph
requires:
  - phase: QA-AUDIT-07
    provides: "History, Billing, Settings page audit findings"
provides:
  - "Orphaned route analysis (/scheduled, /contacts)"
  - "Comprehensive legacy terminology sweep results"
  - "Navigation order V2 alignment assessment"
  - "Cross-cutting design consistency findings"
  - "lucide-react icon inventory"
affects: [QA-AUDIT-09-final-report]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - ".planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-08-SUMMARY.md"
  modified: []

key-decisions:
  - "/scheduled route should be REMOVED (orphaned v1 feature, not V2 aligned)"
  - "/contacts redirect is correct and should be KEPT (backward compatibility)"
  - "Navigation order should be reordered for V2 alignment"
  - "All lucide-react imports should migrate to Phosphor icons"
  - "/components/contacts/ folder should be DELETED (legacy duplicate)"

patterns-established:
  - "V2 navigation order: Dashboard > Jobs > Campaigns > Analytics > Customers > Send > Activity > Feedback"

# Metrics
duration: 25min
completed: 2026-02-06
---

# Phase QA-AUDIT Plan 08: Cross-Cutting Concerns Summary

**Comprehensive audit of orphaned routes, legacy terminology sweep across entire codebase, V2 navigation alignment assessment, and icon system consistency check revealing 40+ lucide-react imports needing migration.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-02-06T00:36:24Z
- **Completed:** 2026-02-06T01:01:00Z
- **Tasks:** 3
- **Files modified:** 0 (QA audit - no code changes)

## Accomplishments

- Documented /scheduled route as orphaned V1 feature (recommend removal)
- Verified /contacts redirect functions correctly (keep for backward compat)
- Assessed navigation order for V2 alignment with specific reorder recommendation
- Completed comprehensive legacy terminology sweep with 406 "contact" hits, 81 "review request" hits
- Identified 40+ lucide-react imports requiring Phosphor migration
- Confirmed /components/contacts/ folder is legacy duplicate (10 files)

## Task Commits

This is a QA audit plan - no code commits were made. All findings are documented below.

## Findings

### Task 1: Orphaned Routes and Navigation

#### /scheduled Route - ORPHANED (Recommend REMOVAL)

**Current State:**
- Route exists at `app/(dashboard)/scheduled/page.tsx`
- Page renders correctly (no 404)
- Shows "Scheduled Sends" management interface
- Uses `getScheduledSendsWithDetails()` from `lib/data/scheduled.ts`
- References `scheduled_sends` table in database

**Linked From:** NOWHERE
- Not in sidebar navigation (checked `components/layout/sidebar.tsx`)
- Not in bottom navigation (checked `components/layout/bottom-nav.tsx`)
- Not in account menu (checked `components/layout/account-menu.tsx`)
- No internal links found pointing to `/scheduled`

**V2 Alignment:**
- V2 model uses campaigns for automated timing
- Manual scheduling was V1.1 feature for "schedule sends for later"
- With campaigns, scheduled manual sends are obsolete
- The page references "review requests" terminology (v1 language)

**Verdict:** **REMOVE** - Orphaned V1 feature that conflicts with V2 campaign model

**Severity:** MEDIUM (orphaned code, not user-facing since unlinkable)

---

#### /contacts Route - REDIRECT (Keep)

**Current State:**
- Route exists at `app/(dashboard)/contacts/page.tsx`
- Correctly redirects to `/customers` via Next.js `redirect()` function
- Server-side redirect (HTTP 307 temporary redirect)

**Code:**
```typescript
import { redirect } from 'next/navigation'

export default function ContactsRedirect() {
  redirect('/customers')
}
```

**Verdict:** **KEEP** - Proper backward compatibility for old bookmarks/links

**Severity:** LOW (working as intended)

---

#### Navigation Order Assessment

**Current Sidebar Order (sidebar.tsx lines 33-42):**
1. Dashboard (House) - `/dashboard`
2. Send (PaperPlaneTilt) - `/send`
3. Customers (AddressBook) - `/customers`
4. Jobs (Briefcase) - `/jobs`
5. Campaigns (Megaphone) - `/campaigns`
6. Activity (ClockCounterClockwise) - `/history`
7. Feedback (ChatCircleText) - `/feedback`
8. Analytics (ChartBar) - `/analytics`

**V2-Aligned Suggested Order:**
1. Dashboard - command center (CORRECT)
2. Jobs - where work is logged (should be #2)
3. Campaigns - where automation runs (should be #3)
4. Analytics - where outcomes are measured (should be #4)
5. Customers - supporting data (move down)
6. Send - manual override (move down)
7. Activity - audit trail (keep as utility)
8. Feedback - response workflow (keep as utility)

**Assessment:**
- Send at #2 is too prominent for V2 (campaigns handle most sends)
- Jobs at #4 is too buried (core V2 workflow starts here)
- Campaigns at #5 is too buried (core V2 automation)
- Analytics should be more prominent (business outcomes)

**Severity:** MEDIUM (UX improvement, not broken)

**Fix:** Reorder mainNav array in `components/layout/sidebar.tsx`

---

#### Account Menu - VERIFIED OK

**Contents (account-menu.tsx):**
- Apps / Integrations -> `/dashboard/settings`
- Settings -> `/dashboard/settings`
- Billing -> `/billing`
- Help & Support (disabled)
- Theme toggle (Light/Dark/System cycle)
- Logout

**Issues Found:**
- "Apps / Integrations" and "Settings" both link to same URL (`/dashboard/settings`)
- This is intentional (apps/integrations is a section within settings)

**Verdict:** Acceptable, though could be cleaner UX

---

#### Mobile Navigation - VERIFIED OK

**BottomNav (bottom-nav.tsx) Shows 5 Items:**
1. Dashboard
2. Send
3. Jobs
4. Campaigns
5. Activity

**Missing from Mobile:**
- Customers
- Feedback
- Analytics

**Assessment:** Mobile shows primary workflow items. Secondary pages accessible via account menu. This is acceptable for mobile UX.

---

#### Sidebar Collapse Behavior - CODE VERIFIED

- Collapse button toggles `isCollapsed` state
- Icons remain visible when collapsed (icon only, no labels)
- Tooltips via `title={collapsed ? item.label : undefined}`
- "Add Job" button remains visible
- Badge dot indicator works when collapsed (line 101-103)

---

### Task 2: Legacy Terminology Sweep

#### Search 1: "contact" (Case-Insensitive)

**Total Hits:** 406 occurrences across app/(dashboard) and components

**Classification by Severity:**

**CRITICAL (User-Facing Text) - 47 instances:**

| File | Line | Text | Fix |
|------|------|------|-----|
| `components/contacts/contacts-client.tsx` | 120 | `<h1>Contacts</h1>` | "Customers" |
| `components/contacts/contacts-client.tsx` | 122 | "Manage your customer contacts" | "Manage your customers" |
| `components/contacts/contacts-client.tsx` | 130 | "Add Contact" button | "Add Customer" |
| `components/contacts/contacts-client.tsx` | 156 | "No contacts yet" | "No customers yet" |
| `components/contacts/contacts-client.tsx` | 160 | "Add your first contact" | "Add your first customer" |
| `components/contacts/contacts-client.tsx` | 166 | "Add Contact" button | "Add Customer" |
| `components/contacts/add-contact-sheet.tsx` | 60 | "Add New Contact" title | "Add New Customer" |
| `components/contacts/add-contact-sheet.tsx` | 62 | "Add a new contact to your list" | "Add a new customer" |
| `components/contacts/add-contact-sheet.tsx` | 34 | "Contact added!" toast | "Customer added!" |
| `components/contacts/add-contact-sheet.tsx` | 128 | "Add Contact" button | "Add Customer" |
| `components/contacts/contact-detail-drawer.tsx` | 134-142 | "contact-notes" id, placeholder | "customer-notes" |
| `components/contacts/contact-detail-drawer.tsx` | 196 | "Add notes about this contact" | "Add notes about this customer" |
| `components/contacts/contact-detail-drawer.tsx` | 204 | "Edit Contact" button | "Edit Customer" |
| `components/contacts/edit-contact-sheet.tsx` | 52 | "Edit Contact" title | "Edit Customer" |
| `components/contacts/edit-contact-sheet.tsx` | 54 | "Update contact information" | "Update customer information" |
| `components/contacts/empty-state.tsx` | 15 | "No contacts yet" | "No customers yet" |
| `components/contacts/empty-state.tsx` | 17 | "Add your first contact" | "Add your first customer" |
| `components/contacts/empty-state.tsx` | 23 | "Add Contact" button | "Add Customer" |
| `components/contacts/empty-state.tsx` | 44-45 | "No contacts found" | "No customers found" |
| `components/contacts/contact-table.tsx` | 132 | "{N} contact(s) selected" | "{N} customer(s) selected" |
| `components/contacts/contact-table.tsx` | 196 | "No contacts found" | "No customers found" |
| `components/contacts/csv-import-dialog.tsx` | 160 | "Import Contacts from CSV" | "Import Customers from CSV" |
| `components/contacts/csv-import-dialog.tsx` | 205 | "Import {N} contact(s)" | "Import {N} customer(s)" |
| `components/contacts/csv-import-dialog.tsx` | 215 | "Importing contacts..." | "Importing customers..." |
| `components/customers/empty-state.tsx` | 44 | "No contacts found" | "No customers found" |
| `components/customers/customer-table.tsx` | 154 | "{N} contacts selected" | "{N} customers selected" |
| `components/customers/customer-table.tsx` | 218 | "No contacts found" | "No customers found" |
| `components/customers/add-customer-sheet.tsx` | 53 | "Contact added!" toast | "Customer added!" |
| `components/customers/add-customer-sheet.tsx` | 80 | "Add New Contact" title | "Add New Customer" |
| `components/customers/csv-import-dialog.tsx` | 244 | "Importing contacts..." | "Importing customers..." |
| `components/onboarding/setup-progress-drawer.tsx` | 46 | "Add first contact" | "Add first customer" |
| `components/onboarding/setup-progress-drawer.tsx` | 180 | "Add Contact" button | "Add Customer" |
| `components/onboarding/steps/send-step.tsx` | 138 | "add a contact" | "add a customer" |
| `components/onboarding/steps/send-step.tsx` | 148 | "Contact required" | "Customer required" |
| `components/onboarding/steps/send-step.tsx` | 150 | "add a contact" | "add a customer" |
| `components/onboarding/steps/send-step.tsx` | 164 | "Go back to add contact" | "Go back to add customer" |
| `components/marketing/v2/how-it-works.tsx` | 9-10 | "Add Contact" step | "Add Customer" |
| `components/marketing/v2/animated-demo.tsx` | 8 | "Select Contact" step | "Select Customer" |
| `components/marketing/pricing-table.tsx` | 48 | "200 contacts" | "200 customers" |
| `components/marketing/pricing-table.tsx` | 64 | "Unlimited contacts" | "Unlimited customers" |
| `components/marketing/features.tsx` | 111 | "Keep all your contacts" | "Keep all your customers" |
| `components/marketing/features.tsx` | 113 | "add contacts one by one" | "add customers one by one" |
| `components/marketing/features.tsx` | 117 | "Archive inactive contacts" | "Archive inactive customers" |
| `components/marketing/features.tsx` | 119 | "500+ Contacts supported" | "500+ Customers supported" |
| `components/marketing/faq-section.tsx` | 11 | "One contact, one click" | "One customer, one click" |
| `components/marketing/faq-section.tsx` | 16 | "contact management" | "customer management" |
| `components/scheduled/*.tsx` | Multiple | Various "contact" references | See scheduled route removal |

**MEDIUM (Code Comments, ARIA, Internal) - 20+ instances:**
- Various code comments with "contact"
- ARIA labels like "contact-notes"
- Internal function names

**LOW (Variable Names, Types, Internal) - 300+ instances:**
- Type aliases (`Contact`, `ContactActionState`)
- Variable names (`contactId`, `selectedContacts`)
- Import paths (`@/lib/actions/contact`)
- Database column references (`contact_id`)

**Acceptable Uses (False Positives) - Filtered Out:**
- "contact support" phrases
- Database column names (legacy compat)
- Type alias `Contact` (deprecated marker exists)

---

#### Search 2: "review request" / "send request"

**Total Hits:** 81 occurrences

**Analysis:** "Review request" is acceptable V2 terminology in most contexts. It describes what the customer receives. The concern is with "send request" as imperative action.

**Potentially Update:**

| File | Line | Context | Assessment |
|------|------|---------|------------|
| `app/(dashboard)/scheduled/page.tsx` | 10 | "Manage your scheduled review requests" | Remove with /scheduled |
| `app/(dashboard)/billing/page.tsx` | 29, 41 | "200 review requests/month" | ACCEPTABLE (quota description) |
| `components/customers/customer-detail-drawer.tsx` | 268 | "Send Request" button | CONSIDER: "Send Message" |
| `components/contacts/contact-detail-drawer.tsx` | 182 | "Send Request" button | CONSIDER: "Send Message" |
| `components/send/quick-send-tab.tsx` | 532 | "Send Request" button | CONSIDER: "Send Message" |
| `components/send/bulk-send-action-bar.tsx` | 90 | "Send request" button | CONSIDER: "Send Message" |
| `components/history/request-detail-drawer.tsx` | 198, 233 | "Resend Request" | ACCEPTABLE (action description) |

**Verdict:** Most "review request" uses are acceptable. "Send Request" as button text could be "Send Message" for consistency with V2 multi-channel model.

**Severity:** LOW (mostly acceptable terminology)

---

#### Search 3: "email template"

**Total Hits:** 9 occurrences

| File | Line | Text | Fix |
|------|------|------|-----|
| `components/business-settings-form.tsx` | 99 | "Default Email Template" label | "Default Message Template" |
| `components/marketing/faq-section.tsx` | 16 | "customizable email template" | "customizable message templates" |
| `components/marketing/pricing-table.tsx` | 49 | "Custom email templates" | "Custom message templates" |
| `components/template-list.tsx` | 25, 28 | "Email Templates" section header | ACCEPTABLE (filtering email channel) |
| `app/(dashboard)/send/page.tsx` | 41 | Code comment "email templates" | ACCEPTABLE (internal comment) |

**Severity:** LOW (3 user-facing, rest acceptable)

---

#### Search 4: CONTACT_LIMITS Constant

**Previously Verified in QA-AUDIT-07:** The `CONTACT_LIMITS` constant in `lib/constants/billing.ts` is internal-only. User-facing text correctly says "customers" (e.g., "You have {N} customers but your Basic plan allows {limit}").

**No action needed.**

---

### Task 3: Cross-Cutting Design Consistency

#### Icon System - lucide-react Imports

**Total lucide-react imports found: 41 files**

**Dashboard Pages (3 files):**
| File | Icons | Phosphor Equivalent |
|------|-------|---------------------|
| `app/(dashboard)/history/error.tsx` | AlertCircle | WarningCircle |
| `app/(dashboard)/billing/page.tsx` | CheckCircle2 | CheckCircle |
| `app/(dashboard)/feedback/page.tsx` | MessageSquare | ChatSquare |

**Components (38 files):**
| File | Icons | Notes |
|------|-------|-------|
| `components/feedback/feedback-list.tsx` | MessageSquare | Already noted Plan 06 |
| `components/feedback/feedback-card.tsx` | Star, Check, RotateCcw, Mail | 4 icons |
| `components/contacts/empty-state.tsx` | Users, Upload, Plus | 3 icons |
| `components/contacts/csv-import-dialog.tsx` | Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 | 5 icons |
| `components/contacts/contacts-client.tsx` | Plus, Users | 2 icons |
| `components/contacts/add-contact-sheet.tsx` | CheckCircle, Plus | 2 icons |
| `components/contacts/contact-columns.tsx` | MoreHorizontal, Archive, RotateCcw, Trash2, Pencil | 5 icons |
| `components/contacts/contact-filters.tsx` | X, Search | 2 icons |
| `components/contacts/contact-table.tsx` | Archive, Trash2 | 2 icons |
| `components/contacts/csv-preview-table.tsx` | CheckCircle, XCircle, AlertTriangle | 3 icons |
| `components/customers/empty-state.tsx` | Users, Upload, Plus | 3 icons |
| `components/customers/csv-import-dialog.tsx` | Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 | 5 icons |
| `components/customers/customers-client.tsx` | Plus, Users | 2 icons |
| `components/customers/add-customer-sheet.tsx` | CheckCircle, Plus | 2 icons |
| `components/customers/customer-columns.tsx` | MoreHorizontal, Archive, RotateCcw, Trash2, Pencil | 5 icons |
| `components/customers/customer-filters.tsx` | X, Search | 2 icons |
| `components/customers/customer-table.tsx` | Archive, Trash2 | 2 icons |
| `components/customers/csv-preview-table.tsx` | CheckCircle, XCircle, AlertTriangle | 3 icons |
| `components/billing/usage-warning-banner.tsx` | AlertTriangle | 1 icon |
| `components/history/empty-state.tsx` | History, Send | 2 icons |
| `components/history/history-filters.tsx` | X, Search, Loader2 | 3 icons |
| `components/jobs/add-job-sheet.tsx` | Loader2 | 1 icon |
| `components/jobs/edit-job-sheet.tsx` | Loader2 | 1 icon |
| `components/settings/service-types-section.tsx` | Loader2 | 1 icon |
| `components/settings/integrations-section.tsx` | Key, Copy, Check, RefreshCw | 4 icons |
| `components/onboarding/steps/send-step.tsx` | CheckCircle, Mail, AlertCircle, ArrowLeft | 4 icons |
| `components/review/satisfaction-rating.tsx` | Star | 1 icon |
| `components/review/thank-you-card.tsx` | CheckCircle | 1 icon |
| `components/send/quick-send-tab.tsx` | Loader2 | 1 icon |
| `components/theme-switcher.tsx` | Laptop, Moon, Sun | 3 icons |
| `components/ui/dialog.tsx` | X | 1 icon |
| `components/ui/checkbox.tsx` | Check | 1 icon |
| `components/ui/dropdown-menu.tsx` | Check, ChevronRight, Circle | 3 icons |
| `components/ui/select.tsx` | Check, ChevronDown, ChevronUp | 3 icons |
| `components/ui/sheet.tsx` | XIcon | 1 icon |
| `components/ui/sonner.tsx` | Multiple | Toast icons |
| `components/marketing/hero.tsx` | Star, Send | 2 icons |
| `components/marketing/faq-section.tsx` | ChevronDown | 1 icon |
| `components/marketing/mobile-nav.tsx` | Menu, X | 2 icons |
| `components/marketing/pricing-table.tsx` | Check | 1 icon |
| `components/marketing/user-menu.tsx` | CreditCard, LayoutDashboard, Settings | 3 icons |
| `components/marketing/v2/animated-demo.tsx` | CheckCircle, Star | 2 icons |

**Severity:** MEDIUM (design system inconsistency, functional)

**Fix:** Create migration task to replace all lucide-react with Phosphor equivalents

---

#### Legacy /components/contacts/ Folder

**Status:** EXISTS (10 files, duplicate of /components/customers/)

**Files:**
1. `add-contact-sheet.tsx`
2. `contact-columns.tsx`
3. `contact-detail-drawer.tsx`
4. `contact-filters.tsx`
5. `contact-table.tsx`
6. `contacts-client.tsx`
7. `csv-import-dialog.tsx`
8. `csv-preview-table.tsx`
9. `edit-contact-sheet.tsx`
10. `empty-state.tsx`

**Usage:** Only referenced by the `/contacts` redirect page (which redirects to `/customers`)

**Severity:** MEDIUM (orphaned code, maintenance burden)

**Fix:** Delete entire `/components/contacts/` folder after removing `/scheduled` and `/contacts` pages

---

#### Hardcoded Colors

**Findings:** Hardcoded colors exist but ALL have dark mode variants:

| File | Light | Dark |
|------|-------|------|
| `sidebar.tsx` | `bg-[#F2F2F2]` | `dark:bg-muted` |
| `sidebar.tsx` | `border-[#E2E2E2]` | `dark:border-border` |
| `app-shell.tsx` | `bg-[#F9F9F9]` | `dark:bg-background` |
| `page-header.tsx` | `bg-white` | `dark:bg-card` |

**Assessment:** Intentional design choices with proper dark mode handling.

**Severity:** LOW (acceptable, dark mode works)

---

#### Theme Toggle - VERIFIED OK

**Location:** Account menu (bottom of sidebar, or top-right on mobile)
**Behavior:** Cycles Light -> Dark -> System
**Persistence:** Uses next-themes, persists via localStorage
**Coverage:** Works on all pages

---

## Findings Summary by Severity

### CRITICAL (0)
None - no blocking issues found.

### HIGH (0)
None - no high-severity issues found.

### MEDIUM (5 categories)

| ID | Category | Count | Description |
|----|----------|-------|-------------|
| M08-01 | Orphaned Route | 1 | /scheduled route should be removed |
| M08-02 | Navigation Order | 1 | Sidebar order not V2-aligned |
| M08-03 | Legacy Terminology | 47 | User-facing "contact" text |
| M08-04 | Icon System | 41 | lucide-react imports (files) |
| M08-05 | Legacy Folder | 10 | /components/contacts/ files |

### LOW (3 categories)

| ID | Category | Count | Description |
|----|----------|-------|-------------|
| L08-01 | Redirect | 1 | /contacts redirect (keep for compat) |
| L08-02 | Terminology | 3 | "email template" user-facing |
| L08-03 | Button Text | 6 | "Send Request" could be "Send Message" |

---

## Recommended Actions

### Immediate (Phase QA-AUDIT remediation)

1. **Remove /scheduled route**
   - Delete `app/(dashboard)/scheduled/page.tsx`
   - Delete `components/scheduled/` folder
   - Delete `lib/data/scheduled.ts`
   - Keep `scheduled_sends` table for data retention

2. **Reorder navigation** in `components/layout/sidebar.tsx`:
   ```typescript
   const mainNav: NavItem[] = [
     { icon: House, label: 'Dashboard', href: '/dashboard' },
     { icon: Briefcase, label: 'Jobs', href: '/jobs' },
     { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
     { icon: ChartBar, label: 'Analytics', href: '/analytics' },
     { icon: AddressBook, label: 'Customers', href: '/customers' },
     { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
     { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
     { icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
   ]
   ```

3. **Delete /components/contacts/ folder** (10 files)

4. **Fix legacy terminology** (47 user-facing instances)

5. **Migrate lucide-react to Phosphor** (41 files)

### Deferred

- Keep /contacts redirect for backward compatibility
- "Send Request" -> "Send Message" (low priority)
- "email template" -> "message template" (3 instances, low priority)

---

## Decisions Made

- /scheduled determined to be orphaned V1 feature not aligned with V2 campaign model
- Navigation order assessed based on V2 workflow: Job -> Campaign -> Analytics as primary flow
- Legacy /components/contacts/ confirmed duplicate of /components/customers/
- lucide-react migration scoped to all dashboard and component files

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all searches and verifications completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All cross-cutting findings documented
- Ready for QA-AUDIT-09 final report compilation
- Remediation work items clearly prioritized

---
*Phase: QA-AUDIT*
*Completed: 2026-02-06*
