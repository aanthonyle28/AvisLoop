# Phase 66: Businesses Page and Data Isolation - Research

**Researched:** 2026-03-02
**Domain:** QA audit -- Businesses page UI + multi-business data isolation + cross-user isolation
**Confidence:** HIGH -- all findings from direct codebase inspection of implemented components

---

## Summary

Phase 66 is the highest-risk QA audit in the v3.1 milestone. It tests two fundamentally different things: (1) the Businesses (Clients) page UI (card grid, detail drawer, metadata editing, notes auto-save), and (2) multi-business data isolation under switching. The isolation testing is the most complex scenario in the entire audit because it requires creating a SECOND business, switching between them, and verifying zero data cross-contamination across jobs, customers, campaigns, and send logs.

The codebase is well-architected for multi-business support. Phase 52 introduced cookie-based active business resolution, Phase 53 refactored all 22 `lib/data/` functions to accept explicit `businessId` parameters, and RLS policies enforce `business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())` on all tenant tables. However, none of this has been tested end-to-end with actual multi-business switching in the running app. The PITFALLS.md research document explicitly flags this as the #1 audit risk ("Testing Single-Business Flows and Calling It Multi-Tenant Verified").

The third dimension is cross-user isolation (MULTI-09), which requires a second test user account. This tests RLS at the user level -- User B must not see User A's businesses, jobs, or customers even via direct DB query.

**Primary recommendation:** Split into three plans: (1) Businesses page UI audit, (2) Business switcher + data refresh, (3) Data isolation with SQL verification. Create the second business via the CreateBusinessWizard UI flow (`/onboarding?mode=new`), NOT via direct SQL -- this validates BIZ-07 simultaneously. Create a second user via Supabase admin for cross-user isolation (MULTI-09).

---

## Standard Stack

This phase uses no new libraries. It audits existing pages using the project's established stack.

### Core (already installed)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `playwright` | ^1.58.1 | Browser automation for QA | ES module import via `./node_modules/playwright/index.mjs` |
| `@supabase/supabase-js` | latest | Direct DB queries for verification | Service role client for SQL-level checks |
| `sonner` | ^2.0.7 | Toast notifications (verify switch/save toasts) | Existing dependency |

### No New Dependencies

This is a QA audit phase. All components under test already exist.

---

## Architecture Patterns

### Multi-Business Resolution Chain

The full resolution chain when a user loads any dashboard page:

```
1. DashboardGroupLayout (app/(dashboard)/layout.tsx)
   ├── getActiveBusiness()  →  reads active_business_id cookie
   │   ├── Cookie present?  →  query businesses WHERE id=cookieId AND user_id=auth.uid()
   │   │   └── Found?  →  return business
   │   │   └── Not found?  →  fall through to fallback
   │   └── Cookie absent?  →  fall through to fallback
   │       └── Fallback: SELECT * FROM businesses WHERE user_id=auth.uid() ORDER BY created_at LIMIT 1
   │           └── Returns array[0] ?? null
   ├── getUserBusinesses()  →  returns ALL {id, name} pairs for user
   └── BusinessSettingsProvider wraps children with:
       ├── businessId (active business UUID)
       ├── businessName (active business name)
       └── businesses[] (all user businesses for switcher dropdown)
```

### Business Switcher Flow

```
User clicks dropdown item
  └── handleSelect(newBusinessId)
      └── startTransition(async () => {
            switchBusiness(newBusinessId)  // server action
          })
              ├── Verify auth + ownership
              ├── Set httpOnly cookie: active_business_id = newBusinessId
              ├── revalidatePath('/', 'layout')  // full layout re-render
              └── return {}  // success
```

**Critical for testing:** `revalidatePath('/', 'layout')` triggers a full server-side re-render. All server components re-fetch with the new businessId. The BusinessSettingsProvider gets new values. Client components re-render with new context.

### Businesses Page Component Tree

```
/businesses (server component)
  ├── getActiveBusiness()
  ├── getUserBusinessesWithMetadata()  →  SELECT * FROM businesses WHERE user_id=auth.uid()
  └── BusinessesClient (client component)
      ├── localBusinesses state (optimistic updates)
      ├── Card grid: localBusinesses.map(b => BusinessCard)
      │   └── BusinessCard: InteractiveCard with name, service types, rating, reviews gained, competitor gap
      └── BusinessDetailDrawer (Sheet component)
          ├── View mode: Google Performance, Competitive Analysis, Agency Details, Notes
          ├── Edit mode: Number inputs for ratings/reviews/fees, date, GBP switch, competitor fields
          ├── Notes: Always editable, 500ms debounce auto-save via updateBusinessNotes()
          └── Footer: Edit Details / Save+Cancel, Switch to this business (if not active)
```

### Businesses Page Selectors (for Playwright)

| Element | Selector Strategy | Notes |
|---------|-------------------|-------|
| Page heading | `getByRole('heading', { name: 'Businesses' })` | H1 |
| Add Business button | `getByRole('link', { name: /Add Business/i })` | Links to `/onboarding?mode=new` |
| Business card | `getByText(businessName)` then parent InteractiveCard | Cards are div wrappers with onClick |
| Active badge | `getByText('Active')` within card | Visible only for active business |
| Drawer title | SheetTitle contains business name | `getByRole('dialog')` then heading |
| Edit Details button | `getByRole('button', { name: /Edit Details/i })` | In drawer footer |
| Save button | `getByRole('button', { name: /Save/i })` | In drawer footer during edit mode |
| Cancel button | `getByRole('button', { name: /Cancel/i })` | In drawer footer during edit mode |
| Switch button | `getByRole('button', { name: /Switch to this business/i })` | Only visible when not active |
| Notes textarea | `getByLabel(/Notes/i)` or `#business-notes` | Always editable |
| Rating Start input | `#google-rating-start` | In edit mode |
| Rating Current input | `#google-rating-current` | In edit mode |
| Reviews Start input | `#review-count-start` | In edit mode |
| Reviews Current input | `#review-count-current` | In edit mode |
| Monthly Fee input | `#monthly-fee` | In edit mode |
| Start Date input | `#start-date` | In edit mode |
| GBP Access switch | `#gbp-access` | In edit mode |
| Competitor Name input | `#competitor-name` | In edit mode |
| Competitor Reviews input | `#competitor-review-count` | In edit mode |

### Business Switcher Selectors

| Element | Selector Strategy | Notes |
|---------|-------------------|-------|
| Desktop switcher trigger | `getByLabel(/Current business.*Click to switch/i)` | aria-label on button |
| Single-business text | Plain span, no interactive affordance | `businesses.length <= 1` shows text only |
| Dropdown menu | `DropdownMenuContent` with `w-56` class | Radix component |
| Business option | `getByRole('menuitem')` with business name text | Each has cursor-pointer |
| Active check mark | `Check` icon within the active business option | `biz.id === businessId` |
| View all clients link | `getByRole('menuitem', { name: /View all clients/i })` | Links to `/businesses` |
| Mobile switcher | Same `BusinessSwitcher` component in PageHeader | `md:hidden` header |
| Mobile header | `header.md\\:hidden` | PageHeader wraps BusinessSwitcher |

### CreateBusinessWizard Flow (for BIZ-07)

```
/onboarding?mode=new
  └── CreateBusinessWizard (2-step)
      ├── Step 1: BusinessSetupStep
      │   ├── Business name (required)
      │   ├── Phone number (optional)
      │   ├── Google review link (optional)
      │   ├── Service types (at least 1 required)
      │   └── Custom service names (if "other" selected)
      │   └── Continue → createAdditionalBusiness() + saveNewBusinessServices()
      └── Step 2: CampaignPresetStep
          ├── 3 campaign preset cards (conservative/standard/aggressive)
          └── Continue → createNewBusinessCampaign() + completeNewBusinessOnboarding() + switchBusiness()
              └── Redirects to /dashboard (now on new business)
```

### Data Isolation Architecture

All data functions in `lib/data/` accept explicit `businessId` and use `.eq('business_id', businessId)`:

| Data Function | File | Business Scope |
|---------------|------|---------------|
| `getJobs()` | lib/data/jobs.ts | `.eq('business_id', businessId)` |
| `getSendLogs()` | lib/data/send-logs.ts | `.eq('business_id', businessId)` |
| `getCampaigns()` | lib/data/campaign.ts | `.or(business_id.eq.${businessId},is_preset.eq.true)` |
| `getDashboardCounts()` | lib/data/dashboard.ts | `.eq('business_id', businessId)` on all sub-queries |
| `getCustomersByBusiness()` | lib/actions/customer.ts | `.eq('business_id', businessId)` |
| `getFeedback()` | lib/data/feedback.ts | `.eq('business_id', businessId)` |
| `getServiceTypeAnalytics()` | lib/data/analytics.ts | RPC param `p_business_id` |

RLS policies on all tenant tables add a second layer:
```sql
-- Pattern used across all tenant tables
business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
```

### Anti-Patterns to Avoid

- **Direct SQL INSERT for test business:** Use the UI wizard (`/onboarding?mode=new`) to validate BIZ-07 simultaneously. Only use SQL for verification queries.
- **Testing isolation via UI only:** Must also verify with SQL queries using the Supabase service role client to confirm data truly doesn't exist (not just hidden by UI).
- **Skipping mobile viewport:** The business switcher renders differently on mobile (PageHeader vs Sidebar). Both must be tested.
- **Assuming revalidatePath is instant:** After switching, wait for navigation/network idle before asserting page content changed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Second business creation | SQL INSERT | CreateBusinessWizard UI at `/onboarding?mode=new` | Tests BIZ-07 simultaneously; ensures onboarding_completed_at is set |
| Second user for MULTI-09 | Playwright signup flow | Supabase admin API / service role INSERT | Faster, avoids email verification; or use Supabase dashboard |
| Cookie manipulation | Direct cookie editing | `switchBusiness()` server action via UI click | Tests the real flow; cookie is httpOnly so can't be set from client JS |
| Data isolation verification | UI-only checks | SQL queries with service role client | UI could hide data via filtering; SQL confirms true isolation |

**Key insight:** The test must exercise the exact same code paths users exercise. UI-first testing with SQL verification is the correct approach, not SQL-first with UI verification.

---

## Common Pitfalls

### Pitfall 1: Cookie-Based Switching Race Condition

**What goes wrong:** After clicking "Switch to this business", the `revalidatePath('/', 'layout')` triggers a full re-render. If the test script navigates to a new page before the re-render completes, the old businessId may still be active (stale cookie read by server component).
**Why it happens:** `switchBusiness()` sets the cookie synchronously but `revalidatePath` is async. The page content may not reflect the new business immediately.
**How to avoid:** After any switch action, wait for the toast ("Switched to {name}") to appear, then wait for `networkidle`, then verify the sidebar/header shows the new business name before navigating.
**Warning signs:** Test assertions fail intermittently; data from old business appears briefly.

### Pitfall 2: BusinessSwitcher Shows Plain Text for Single Business

**What goes wrong:** The test account starts with one business. The BusinessSwitcher renders a plain `<span>` (not a dropdown trigger) when `businesses.length <= 1`. Tests looking for the dropdown trigger will fail.
**Why it happens:** The component checks `if (businesses.length <= 1)` before rendering the dropdown.
**How to avoid:** For Plans 66-02 and 66-03, ensure the second business is created FIRST (via 66-01 BIZ-07 test). The switcher dropdown only appears when the user has 2+ businesses. Run 66-01 first.
**Warning signs:** `getByLabel(/Current business/)` times out.

### Pitfall 3: Notes Auto-Save Verification Timing

**What goes wrong:** Notes use a 500ms debounce. If the test types and immediately refreshes, the debounce may not have fired yet, so notes are lost.
**Why it happens:** The `handleNotesChange` uses `setTimeout(500ms)` before calling `updateBusinessNotes()`. Additionally, drawer close flushes pending notes (line 68-74), but page refresh does not.
**How to avoid:** After typing notes, either (a) wait at least 600ms, or (b) close the drawer (which flushes pending notes), then reopen to verify. The safest approach is: type notes, wait 1 second, refresh page, reopen drawer, verify notes.
**Warning signs:** Notes appear blank after refresh if debounce didn't complete.

### Pitfall 4: Metadata Edit Optimistic Update Masking DB Failure

**What goes wrong:** `BusinessesClient` uses `handleBusinessUpdated` for optimistic updates. The local state is updated immediately via `setLocalBusinesses(prev => prev.map(...))`. If the server action fails, the UI shows success but the DB has stale data.
**How to avoid:** Always verify metadata persistence with a SQL query against the `businesses` table, not just by checking the UI after save.
**Warning signs:** UI shows updated values but DB query returns old values.

### Pitfall 5: Cross-User Isolation Test Requires a Second Auth Session

**What goes wrong:** Playwright shares cookies across pages in the same browser context. If User A and User B are tested in the same context, session cookies will conflict.
**Why it happens:** Supabase auth uses cookies for session management. A single browser context can only hold one session.
**How to avoid:** Create a SEPARATE browser context (or incognito context) for User B. Do not reuse User A's context. Alternatively, test cross-user isolation via SQL only (using service role client to simulate User B's queries with RLS).
**Warning signs:** User B sees User A's data because they share the same session cookie.

### Pitfall 6: Rapid Switching State Corruption

**What goes wrong:** MULTI-08 requires 5+ switches in 10 seconds. Each `switchBusiness()` call triggers `revalidatePath('/', 'layout')`. If multiple revalidations overlap, React may apply them out of order, leaving the UI showing Business A's name but Business B's data.
**Why it happens:** `useTransition` defers updates but doesn't cancel in-flight ones. Stale server renders may resolve after newer ones.
**How to avoid:** After rapid switching, wait for all transitions to settle (isPending becomes false), then verify consistency: sidebar business name matches dashboard data matches the expected final business.
**Warning signs:** Business name in sidebar doesn't match data shown on page.

---

## Code Examples

### Playwright Login Pattern (from existing QA scripts)

```javascript
// Source: qa-scripts/campaigns-qa-task1.js
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Login
await page.goto('http://localhost:3000/auth/login');
await page.waitForLoadState('networkidle');
await page.getByRole('textbox', { name: /email/i }).fill('audit-test@avisloop.com');
await page.getByRole('textbox', { name: /password/i }).fill('AuditTest123!');
const loginBtn = page.getByRole('button', { name: /sign in|log in|^login$/i }).first();
await loginBtn.click();
await page.waitForURL(/dashboard|jobs|campaigns/, { timeout: 15000 });
```

### Supabase Service Role Client for DB Verification

```javascript
// Source: qa-scripts/campaigns-db-prereqs.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://fejcjippksmsgpesgidc.supabase.co',
  '<SERVICE_ROLE_KEY>'
);
const BUSINESS_ID = '6ed94b54-6f35-4ede-8dcb-28f562052042';
```

### Switching Business via UI

```javascript
// Click the business switcher dropdown trigger in sidebar
const switcherTrigger = page.locator('button[aria-label*="Current business"]');
await switcherTrigger.click();

// Select the target business from dropdown
await page.getByRole('menuitem', { name: 'AUDIT_ Test Plumbing' }).click();

// Wait for switch to complete
await page.waitForTimeout(2000); // Allow revalidatePath to complete
await page.waitForLoadState('networkidle');

// Verify: sidebar now shows new business name
await expect(page.locator('button[aria-label*="Current business"]')).toContainText('AUDIT_ Test Plumbing');
```

### Switching via Detail Drawer

```javascript
// Open business card drawer
await page.getByText('AUDIT_ Test Plumbing').click();
await page.waitForSelector('[role="dialog"]');

// Click "Switch to this business"
await page.getByRole('button', { name: /Switch to this business/i }).click();

// Wait for toast and navigation
await expect(page.locator('[data-sonner-toaster]')).toContainText('Switched to');
await page.waitForLoadState('networkidle');
```

### Data Isolation SQL Verification

```javascript
// Verify no cross-business contamination
// After switching to Business A, verify Business B's data is absent

// Check jobs isolation
const { data: jobsA } = await supabase
  .from('jobs')
  .select('id, business_id, customers!inner(name)')
  .eq('business_id', BUSINESS_A_ID);

const { data: jobsB } = await supabase
  .from('jobs')
  .select('id, business_id, customers!inner(name)')
  .eq('business_id', BUSINESS_B_ID);

// Verify no job from B appears in A's result
const bJobIdsInA = jobsA.filter(j => j.business_id === BUSINESS_B_ID);
console.assert(bJobIdsInA.length === 0, 'Cross-contamination: B jobs in A query');
```

### Create Second Business via UI (BIZ-07)

```javascript
// Navigate to onboarding in new-business mode
await page.goto('http://localhost:3000/onboarding?mode=new');
await page.waitForLoadState('networkidle');

// Step 1: Business setup
await page.getByLabel(/Business name/i).fill('AUDIT_ Test Plumbing');
await page.getByLabel(/Phone number/i).fill('(555) 987-6543');

// Select service types
const plumbingBtn = page.getByRole('button', { name: /Plumbing/i });
await plumbingBtn.click();

// Continue to step 2
await page.getByRole('button', { name: /Continue/i }).click();
await page.waitForTimeout(2000);

// Step 2: Campaign preset selection
// Select a preset (e.g., Standard)
await page.getByText(/Standard/i).click();
await page.getByRole('button', { name: /Continue/i }).click();

// Wizard completes, switches to new business, redirects to dashboard
await page.waitForURL(/dashboard/, { timeout: 15000 });
```

---

## Test Data Strategy

### Existing Test Data (from prior phases)

| Entity | Business | Details |
|--------|----------|---------|
| Business A | Audit Test HVAC | ID: `6ed94b54-6f35-4ede-8dcb-28f562052042` |
| Customer | AUDIT_Patricia Johnson | Created in Phase 62 |
| Customer | AUDIT_Marcus Rodriguez | Created in Phase 62 |
| Customer | AUDIT_Sarah Chen | Created in Phase 62 |
| Jobs | 3 AUDIT_ jobs | HVAC service type, all completed |
| Campaign | HVAC Follow-up | Active, with enrollments for AUDIT_ customers |

### New Test Data Needed

| Entity | Purpose | Creation Method |
|--------|---------|----------------|
| Business B | "AUDIT_ Test Plumbing" | Via CreateBusinessWizard UI (`/onboarding?mode=new`) |
| Job in Business B | Isolation verification | Via Add Job UI while Business B is active |
| Customer in Business B | Isolation verification | Created as side effect of job |
| Campaign in Business B | Isolation verification | Created by wizard during Business B onboarding |
| User B | Cross-user isolation (MULTI-09) | Via Supabase admin / service role SQL |
| Business for User B | Cross-user isolation | Via SQL INSERT |

### Test User Details

| User | Email | Password | Purpose |
|------|-------|----------|---------|
| User A (existing) | audit-test@avisloop.com | AuditTest123! | Primary test account |
| User B (new) | audit-test-b@avisloop.com | AuditTestB123! | Cross-user isolation only |

### Plan Execution Order (CRITICAL)

**66-01 MUST run before 66-02 and 66-03.**

66-01 creates the second business via UI (BIZ-07). The switcher dropdown only appears when `businesses.length > 1`. Without the second business, 66-02 cannot test the switcher and 66-03 cannot test isolation.

---

## Component-Level Test Matrix

### Plan 66-01: Businesses Page Audit

| Requirement | What to Test | How to Verify |
|-------------|--------------|---------------|
| BIZ-01 | Card grid shows all businesses | Count cards = count from `getUserBusinessesWithMetadata()` |
| BIZ-02 | Card shows name, service type, rating, reviews | Read card content, compare to DB values |
| BIZ-03 | Detail drawer opens with all fields | Click card, verify all 4 sections visible |
| BIZ-04 | Metadata edit persists | Edit fields, save, verify via DB query |
| BIZ-05 | Notes auto-save | Type notes, wait 1s, refresh, verify retained |
| BIZ-06 | "Switch to this business" works | Click switch button, verify toast + sidebar name change |
| BIZ-07 | "Add Business" initiates wizard | Click button, verify `/onboarding?mode=new` loads wizard |

### Plan 66-02: Business Switcher Audit

| Requirement | What to Test | How to Verify |
|-------------|--------------|---------------|
| MULTI-01 | Dropdown shows all businesses | Open dropdown, count items = total businesses |
| MULTI-02 | Switch updates all page data | Switch, navigate to dashboard/jobs/campaigns, verify data matches active business |
| MULTI-03 | Mobile switcher works | Set viewport 375px, verify switcher in PageHeader |

### Plan 66-03: Data Isolation Audit

| Requirement | What to Test | How to Verify |
|-------------|--------------|---------------|
| MULTI-04 | Jobs isolation | Create job in B, switch to A, verify absent in UI + SQL |
| MULTI-05 | Customers isolation | Verify B's customer absent in Settings > Customers when A active |
| MULTI-06 | Campaigns isolation | Verify B's campaign absent in /campaigns when A active |
| MULTI-07 | Send logs isolation | Verify B's logs absent in /history when A active |
| MULTI-08 | Rapid switching | 5+ switches in 10s, verify final state is consistent |
| MULTI-09 | Cross-user isolation | User B cannot see User A's data via SQL |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.eq('user_id').single()` in data layer | Explicit `businessId` param on all data functions | Phase 53 (2026-02-27) | Eliminated PGRST116 crash risk for multi-business users |
| Per-business send counting | Pooled usage via `getPooledMonthlyUsage(userId)` | Phase 57 (2026-02-27) | Agency loophole closed |
| Business context in URL params | httpOnly cookie (`active_business_id`) | Phase 52 (2026-02-27) | Survives navigation, tab switches, page refreshes |

---

## Open Questions

1. **Second user creation method**
   - What we know: MULTI-09 requires a second user account that owns a different business
   - What's unclear: Whether Supabase allows creating users via service role without email verification
   - Recommendation: Use `supabase.auth.admin.createUser()` with `email_confirm: true` to skip verification. If that fails, create the user through the signup flow and confirm via Supabase dashboard.

2. **Customers page location for isolation test (MULTI-05)**
   - What we know: Customers were moved to Settings > Customers tab (not main nav)
   - What's unclear: Exact URL/tab to navigate to for the customers list
   - Recommendation: Navigate to `/settings`, click "Customers" tab, then verify business B's customer is absent. May need to grep for the exact tab name/selector.

3. **Send logs seeding for MULTI-07**
   - What we know: The test business has send_logs from prior phases. Business B (new) will have zero send logs.
   - What's unclear: Whether MULTI-07 can be verified with zero logs (absence of data is the expected state)
   - Recommendation: Create at least one send_log via SQL for Business B, then verify it does NOT appear in /history when Business A is active. This is a stronger positive test than "empty = isolated."

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection of all components listed above
- `lib/data/active-business.ts` -- cookie-based resolver implementation
- `lib/actions/active-business.ts` -- switchBusiness server action
- `components/layout/business-switcher.tsx` -- dropdown vs plain text logic
- `components/businesses/business-detail-drawer.tsx` -- drawer with edit mode + notes auto-save
- `components/businesses/businesses-client.tsx` -- card grid + optimistic updates
- `components/onboarding/create-business-wizard.tsx` -- 2-step wizard for additional business
- `app/(dashboard)/layout.tsx` -- BusinessSettingsProvider threading
- `lib/data/jobs.ts`, `lib/data/campaign.ts`, `lib/data/send-logs.ts` -- businessId scoping
- `.planning/research/PITFALLS.md` -- multi-tenant audit pitfalls

### Secondary (MEDIUM confidence)

- Prior QA findings format from `docs/qa-v3.1/62-jobs.md`, `docs/qa-v3.1/63-campaigns.md`
- Prior QA script patterns from `qa-scripts/campaigns-qa-task1.js`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all components already exist
- Architecture: HIGH -- every file read and analyzed directly
- Pitfalls: HIGH -- multi-tenant pitfalls documented from direct code analysis + PITFALLS.md research
- Test data strategy: HIGH -- existing test data verified via prior phase reports
- Selectors: MEDIUM -- derived from code but not yet tested against running app

**Research date:** 2026-03-02
**Valid until:** 2026-03-16 (stable -- no code changes expected during QA audit)
