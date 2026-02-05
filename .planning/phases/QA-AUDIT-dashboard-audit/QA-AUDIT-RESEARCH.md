# QA Test & UX Audit - Research

**Researched:** 2026-02-04
**Domain:** Dashboard UI/UX Testing, Playwright E2E Testing, Data Consistency Validation
**Confidence:** HIGH

## Summary

This research investigates comprehensive QA testing and UX auditing methodologies for a Next.js/React dashboard application in 2026. The focus is on systematic testing of all UI surfaces, cross-checking displayed data against database state, detecting legacy terminology from prior product versions, verifying design system consistency, and ensuring accessibility standards.

Key findings:
1. **Playwright best practices for 2026** emphasize parallel execution, critical-path prioritization, and comprehensive screenshot-based reporting
2. **UX testing methodology** combines qualitative think-aloud protocols with quantitative metrics (heatmaps, A/B testing) and systematic page-by-page sweeps
3. **Dark mode testing** requires equal rigor to light mode—color contrast validation, visual regression testing, and OLED-specific rendering checks
4. **Data consistency testing** involves UI-to-database cross-validation using SQL queries to compare displayed values with source data
5. **Empty state design** follows "two parts instruction, one part delight" rule—must replace actual content elements, not overlay them

**Primary recommendation:** Use Playwright for end-to-end testing with dual-account approach (fresh account for onboarding/empty states, populated account for full feature testing). Structure audit report by page with severity-tiered findings (Critical/Medium/Low), include per-page grades, and provide fix recommendations with file paths.

## Standard Stack

The established tools and methodologies for dashboard QA testing in 2026:

### Core Testing Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Playwright | Latest | E2E browser automation | Industry leader in 2026, 70% adoption rate among automation testers, native screenshot support, cross-browser consistency |
| WCAG 2.2 AA | 2.2 | Accessibility compliance | Technical foundation for ADA compliance in 2026, legal standard |
| Chrome DevTools | Built-in | Dark mode emulation, responsive testing | Native prefers-color-scheme toggle, device emulation |
| SQL Queries | N/A | Database cross-validation | Direct DB comparison for UI-to-data consistency checks |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| WAVE | Latest | Accessibility scanning | Quick initial scan for color contrast, missing alt text, keyboard issues |
| Axe Accessibility Checker | Latest | WCAG violation detection | Browser extension for in-page violation highlighting |
| BrowserStack | Cloud | Real device testing | OLED screen rendering, hardware-specific dark mode validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Cypress | Cypress better for component testing but Playwright better for true E2E and multi-browser |
| Manual dark mode testing | Automated visual regression | Manual catches nuanced issues automated tools miss; both needed |
| SQL queries | ORM query inspection | SQL provides ground truth without ORM abstraction layer |

**Installation:**
```bash
npm install -D @playwright/test
npx playwright install
```

## Architecture Patterns

### Recommended Testing Structure
```
tests/
├── dashboard-audit/          # QA audit tests
│   ├── auth.spec.ts         # Login flow
│   ├── dashboard.spec.ts    # Dashboard page
│   ├── send.spec.ts         # Send page
│   ├── customers.spec.ts    # Customers page
│   ├── jobs.spec.ts         # Jobs page
│   ├── campaigns.spec.ts    # Campaigns pages
│   ├── history.spec.ts      # Activity/History page
│   ├── feedback.spec.ts     # Feedback page
│   ├── analytics.spec.ts    # Analytics page
│   ├── billing.spec.ts      # Billing page
│   └── settings.spec.ts     # Settings page
├── helpers/
│   ├── db-query.ts          # Database validation helpers
│   ├── auth-helpers.ts      # Login/session helpers
│   └── screenshot.ts        # Screenshot utilities
└── fixtures/
    ├── fresh-account.json   # Empty state test data
    └── populated-account.json # Full feature test data
```

### Pattern 1: Dual-Account Testing Strategy
**What:** Use two test accounts—one fresh (empty states) and one populated (full features)
**When to use:** All dashboard page testing
**Example:**
```typescript
// Source: Playwright best practices 2026
import { test } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test('empty state - fresh account', async ({ page }) => {
    await page.goto('/dashboard');
    // Verify empty state message, illustration, CTA
  });

  test('populated state - active account', async ({ page }) => {
    // Pre-seed database with jobs, customers, campaigns
    await page.goto('/dashboard');
    // Verify KPI widgets show correct counts
  });
});
```

### Pattern 2: UI-to-Database Cross-Validation
**What:** Compare displayed UI values (counts, stats, lists) with direct database queries
**When to use:** Dashboard KPIs, customer counts, job counts, analytics charts
**Example:**
```typescript
// Source: Database testing best practices
async function verifyCustomerCount(page, businessId) {
  // Get displayed count from UI
  const displayedCount = await page.locator('[data-testid="customer-count"]').innerText();

  // Query database directly
  const { count: dbCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');

  // Compare
  expect(parseInt(displayedCount)).toBe(dbCount);
}
```

### Pattern 3: Systematic Page-by-Page Sweep
**What:** Test every page in order, exhaustively interacting with all UI elements
**When to use:** After user journey walkthrough, for comprehensive coverage
**Example:**
```typescript
// Source: UX testing methodology 2026
test.describe('Settings Page Sweep', () => {
  test('should test all interactions', async ({ page }) => {
    await page.goto('/settings');

    // Screenshot baseline
    await page.screenshot({ path: 'settings-initial.png', fullPage: true });

    // Test every section
    await testBusinessProfileSection(page);
    await testMessageTemplatesSection(page);
    await testServiceTypesSection(page);
    await testPersonalizationSection(page);
    await testIntegrationsSection(page);

    // Test all dropdowns
    await page.click('[data-testid="service-type-dropdown"]');
    await page.screenshot({ path: 'settings-dropdown-open.png' });

    // Test all toggles
    await page.click('[data-testid="sms-enabled-toggle"]');

    // Test all forms
    await page.fill('[name="business-name"]', 'Test Business');
    await page.click('button[type="submit"]');
  });
});
```

### Pattern 4: Dark Mode Testing Protocol
**What:** Test every page in both light and dark mode with equal rigor
**When to use:** All page tests
**Example:**
```typescript
// Source: Dark mode testing checklist 2026
test.describe('Dark Mode Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Enable dark mode via system preference
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('dashboard renders in dark mode', async ({ page }) => {
    await page.goto('/dashboard');

    // Visual regression baseline
    await page.screenshot({ path: 'dashboard-dark.png', fullPage: true });

    // Verify color contrast (15.8:1 minimum per Material Design)
    const textColor = await page.locator('h1').evaluate(el =>
      getComputedStyle(el).color
    );
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );

    // Calculate contrast ratio and assert
    expect(getContrastRatio(textColor, bgColor)).toBeGreaterThan(15.8);
  });
});
```

### Pattern 5: Responsive Breakpoint Testing
**What:** Test at desktop (1280px) and mobile (375px) widths
**When to use:** All page tests
**Example:**
```typescript
// Source: Responsive design breakpoints 2026
const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1280, height: 800 },
};

for (const [device, viewport] of Object.entries(BREAKPOINTS)) {
  test.describe(`${device} - Dashboard`, () => {
    test.use({ viewport });

    test('renders correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.screenshot({
        path: `dashboard-${device}.png`,
        fullPage: true
      });

      // Verify layout doesn't break
      // Verify nav is accessible (hamburger on mobile, sidebar on desktop)
    });
  });
}
```

### Anti-Patterns to Avoid
- **Testing only happy paths:** Test error states, edge cases, empty states equally
- **Brittle selectors:** Use data-testid attributes instead of CSS class selectors that may change
- **Ignoring timing issues:** Use Playwright's auto-waiting instead of arbitrary sleep() calls
- **Screenshot spam:** Capture screenshots strategically (baselines + issues), not every step
- **Testing in isolation:** Real users navigate flows, test user journeys before page-by-page sweeps

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast ratio calculation | Custom RGB-to-luminance math | WCAG contrast checker tool or browser DevTools | Edge cases (transparency, gradients) are complex; standards-based tools handle them |
| Dark mode toggle in tests | Manual theme switching logic | `page.emulateMedia({ colorScheme: 'dark' })` | Playwright native API matches browser behavior exactly |
| Database seeding for tests | Manual INSERT statements | Supabase client with typed helpers | Type safety, RLS policy respect, cleaner code |
| Legacy terminology detection | Manual find-in-files | Automated regex search + manual verification | Catches all instances but requires human judgment for context |
| Visual regression testing | Custom screenshot diffing | Playwright built-in screenshot comparison | Handles anti-aliasing, font rendering differences across platforms |

**Key insight:** QA testing in 2026 has mature tooling for common patterns (accessibility checks, visual regression, responsive testing). Custom solutions add maintenance burden without improving test quality.

## Common Pitfalls

### Pitfall 1: Testing Only Light Mode Thoroughly
**What goes wrong:** Dark mode treated as secondary polish, tested superficially or not at all
**Why it happens:** Teams assume "if it works in light mode, dark mode is just CSS"
**How to avoid:** Test every page in both modes with equal rigor. Dark mode has unique issues—color contrast, status badge visibility, border visibility against dark backgrounds
**Warning signs:**
- Dark mode screenshots missing from test artifacts
- No explicit color contrast checks in test suite
- Issues reported by users after dark mode is "complete"

### Pitfall 2: Data Inconsistency Blind Spots
**What goes wrong:** Dashboard shows "5 customers" but database has 7; KPI widgets show stale data
**Why it happens:** Tests verify UI renders but don't cross-check against source of truth (database)
**How to avoid:** For every count, stat, or aggregate displayed in UI, write a test that queries database and asserts match
**Warning signs:**
- Tests pass but users report "wrong numbers"
- Analytics don't match database reports
- No SQL queries in test suite

### Pitfall 3: Legacy Terminology Slips Through
**What goes wrong:** App renamed "contacts" to "customers" but old term persists in comments, variable names, or user-facing text
**Why it happens:** Search-and-replace misses context-specific usage, new code reuses old patterns
**How to avoid:**
1. Automated search for banned terms (`/\bcontact[sS]?\b/` regex)
2. Manual review of search results to filter false positives (e.g., "contact support")
3. Mark violations as Critical severity in audit
**Warning signs:**
- User confusion about terminology
- Mixed language across pages ("customers" on one page, "contacts" on another)
- Type aliases marked `@deprecated` still in use

### Pitfall 4: Empty States Treated as Edge Cases
**What goes wrong:** Empty states are broken, confusing, or missing entirely; new users see blank screens
**Why it happens:** Developers test with seeded databases and never experience true empty states
**How to avoid:** Dedicated test account with zero data; test onboarding flow and every page in empty state
**Warning signs:**
- "No data" fallback shows dev error messages
- Empty state missing illustration or CTA
- User asks "is something broken?" when they first log in

### Pitfall 5: Orphaned Features from Old Product Versions
**What goes wrong:** Pages or features from v1 architecture still exist but don't fit v2 paradigm
**Why it happens:** Migration leaves behind old routes, components, or features; no one explicitly removes them
**How to avoid:**
1. Map expected v2 page inventory against actual routes
2. Flag pages not in sidebar nav or documented user flows
3. Verify each page aligns with campaign-first v2 model
**Warning signs:**
- Routes accessible via URL but not linked in UI
- Features described in old docs but confusing in new context
- User asks "should I use Send or Campaigns?" (unclear hierarchy)

### Pitfall 6: Accessibility Theater
**What goes wrong:** Tests check for `aria-label` presence but not meaningful values; keyboard navigation exists but focus indicators invisible
**Why it happens:** Checklists get checked without understanding purpose
**How to avoid:** Manual keyboard-only navigation test. Tab through entire page, verify focus indicators visible, verify logical order, verify no traps
**Warning signs:**
- Automated tools pass but real keyboard users struggle
- Focus outline is 1px gray line invisible against light backgrounds
- Tab order jumps illogically (e.g., footer before main content)

## Code Examples

Verified patterns from official sources:

### Playwright Authentication Helper
```typescript
// Source: Playwright best practices
import { test as base } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Log in via UI (not API) to test actual login flow
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');

    await use(page);
  },
});
```

### Database Query Cross-Validation
```typescript
// Source: Database testing best practices
import { createClient } from '@supabase/supabase-js';

async function getDBStats(businessId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-side only
  );

  const [
    { count: customerCount },
    { count: jobCount },
    { count: campaignCount },
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'active'),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId),
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId),
  ]);

  return { customerCount, jobCount, campaignCount };
}

// In test:
test('dashboard KPIs match database', async ({ page }) => {
  const businessId = 'test-business-id';
  const dbStats = await getDBStats(businessId);

  await page.goto('/dashboard');

  const uiCustomerCount = await page
    .locator('[data-testid="kpi-customers"]')
    .innerText();

  expect(parseInt(uiCustomerCount)).toBe(dbStats.customerCount);
});
```

### Legacy Terminology Detection
```typescript
// Source: Research findings
// Run as pre-test or separate script
import { execSync } from 'child_process';

const BANNED_TERMS = [
  /\bcontact[sS]?\b/,  // "contact", "contacts", "Contact", "Contacts"
  /send.*request/i,     // "send request", "Send Request"
  /review.*request/i,   // "review request" (v1 single-send language)
];

function detectLegacyTerms(dir: string) {
  const violations: Array<{ file: string; line: number; match: string }> = [];

  BANNED_TERMS.forEach(pattern => {
    try {
      // Use ripgrep for fast search
      const output = execSync(
        `rg --json "${pattern.source}" ${dir}`,
        { encoding: 'utf-8' }
      );

      // Parse JSON output and collect matches
      output.split('\n').forEach(line => {
        if (!line) return;
        const match = JSON.parse(line);
        if (match.type === 'match') {
          violations.push({
            file: match.data.path.text,
            line: match.data.line_number,
            match: match.data.lines.text.trim(),
          });
        }
      });
    } catch (e) {
      // No matches (exit code 1) is success
    }
  });

  return violations;
}

// In test:
test('no legacy terminology in user-facing text', async () => {
  const violations = detectLegacyTerms('app/(dashboard)');

  // Filter false positives (e.g., "contact support" is okay)
  const realViolations = violations.filter(v =>
    !v.match.includes('contact support') &&
    !v.match.includes('contact us') &&
    !v.file.includes('node_modules')
  );

  expect(realViolations).toHaveLength(0);
});
```

### Responsive Design Testing
```typescript
// Source: Responsive design breakpoints 2026
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1280, height: 800 },
} as const;

for (const [device, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${device} viewport`, () => {
    test.use({ viewport });

    test('sidebar navigation', async ({ page }) => {
      await page.goto('/dashboard');

      if (device === 'mobile') {
        // Mobile: sidebar hidden, hamburger menu visible
        await expect(page.locator('aside')).toBeHidden();
        await expect(page.locator('[aria-label="Open menu"]')).toBeVisible();

        // Open menu
        await page.click('[aria-label="Open menu"]');
        await expect(page.locator('nav')).toBeVisible();
      } else {
        // Desktop: sidebar visible, no hamburger
        await expect(page.locator('aside')).toBeVisible();
        await expect(page.locator('[aria-label="Open menu"]')).toBeHidden();
      }
    });
  });
}
```

### Empty State Validation
```typescript
// Source: Empty state UX best practices 2026
test('customers page - empty state', async ({ page }) => {
  // Fresh account with zero customers
  await page.goto('/customers');

  // Verify empty state elements
  await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-state-icon"]')).toBeVisible();
  await expect(page.locator('[data-testid="empty-state-title"]'))
    .toContainText('No customers yet');
  await expect(page.locator('[data-testid="empty-state-description"]'))
    .toContainText('Add your first customer');

  // Verify CTA present and functional
  const addButton = page.locator('[data-testid="empty-state-cta"]');
  await expect(addButton).toBeVisible();
  await expect(addButton).toContainText('Add Customer');

  // Verify clicking CTA opens form
  await addButton.click();
  await expect(page.locator('[data-testid="customer-form"]')).toBeVisible();

  // Screenshot for baseline
  await page.screenshot({ path: 'customers-empty-state.png' });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Selenium WebDriver | Playwright | 2021-2023 | Faster execution, better async handling, built-in screenshot comparison |
| WCAG 2.1 | WCAG 2.2 AA | 2023 | New success criteria for focus indicators, dragging movements, consistent help |
| Device-specific breakpoints (320px, 768px, 1024px) | Content-driven breakpoints | 2024-2025 | More flexible layouts, fewer rigid breakpoints, better support for foldable devices |
| Dark mode as optional polish | Dark mode as first-class feature | 2024-2026 | Equal testing rigor, contrast standards (15.8:1), OLED-specific rendering tests |
| Manual accessibility testing only | Automated + manual hybrid | 2023-2026 | Automated tools (WAVE, Axe) catch 30-40% of issues; manual testing still essential for UX |

**Deprecated/outdated:**
- **Selenium WebDriver for new projects**: Playwright is faster, more reliable, better developer experience
- **WCAG 2.0 for compliance**: 2.2 AA is now the legal/enforcement standard
- **Testing only on latest browsers**: Need to test on 2-3 versions back for enterprise users
- **Ignoring prefers-reduced-motion**: Accessibility requirement in 2026, affects animations/transitions

## Open Questions

Things that couldn't be fully resolved:

1. **Automated vs. Manual Testing Balance**
   - What we know: Automated tools catch 30-40% of accessibility issues, manual testing required for rest
   - What's unclear: Optimal time allocation for this specific audit (is 50/50 right, or more manual?)
   - Recommendation: Start with automated scan (WAVE, Axe) to identify low-hanging fruit, then allocate 60% time to manual page-by-page sweep

2. **Legacy Variable Names in Code**
   - What we know: User-facing "contact" language is banned; internal variable names like `contactId` still exist throughout codebase
   - What's unclear: Should internal variable names be refactored, or only user-facing text?
   - Recommendation: Flag as LOW severity finding. User-facing text is Critical, code comments are Medium, internal variable names are Low (refactor if time permits)

3. **External Service UI Verification Depth**
   - What we know: Settings page includes Stripe, Resend, Twilio UI elements; test keys available
   - What's unclear: How deeply to test external provider UIs (e.g., should we test Stripe Checkout flow end-to-end, or just verify button links correctly?)
   - Recommendation: Surface-level verification only—verify links open correctly, API keys save/display, error states render. Deep provider flow testing is out of scope.

4. **Orphaned Routes Definition**
   - What we know: `/scheduled` page exists but not in sidebar nav; may be v1 feature
   - What's unclear: How to definitively determine if a route is "orphaned" vs. "intentionally hidden"
   - Recommendation: Flag routes not in sidebar nav AND not linked from any discovered user flow. Present to product owner for determination.

5. **Data Consistency Test Coverage**
   - What we know: Should verify displayed counts match database queries
   - What's unclear: Which pages/components have the highest risk of data inconsistency?
   - Recommendation: Prioritize KPI widgets (dashboard), analytics charts, billing usage displays, customer/job counts. Lower priority for send logs (display-only, no business logic derived from counts).

## AvisLoop-Specific Context

### Complete Page Inventory (Dashboard Only)

| Route | Title | In Sidebar? | Expected in V2? | Notes |
|-------|-------|-------------|-----------------|-------|
| `/dashboard` | Dashboard | Yes (1st) | Yes | Command center with KPIs, ready-to-send queue, alerts |
| `/send` | Send | Yes (2nd) | Yes (secondary) | Manual sending—should feel less primary than Campaigns |
| `/customers` | Customers | Yes (3rd) | Yes | Customer CRUD, tags, phone validation, SMS consent |
| `/jobs` | Jobs | Yes (4th) | Yes | Jobs CRUD, service types, completion status |
| `/campaigns` | Campaigns | Yes (5th) | Yes (primary) | Campaign list + preset picker |
| `/campaigns/new` | New Campaign | No | Yes | New campaign form |
| `/campaigns/[id]` | Campaign Detail | No | Yes | Touch sequence + enrollments |
| `/campaigns/[id]/edit` | Edit Campaign | No | Yes | Edit campaign form |
| `/history` | Activity | Yes (6th) | Yes | Send logs with filtering (metadata says "Activity") |
| `/feedback` | Feedback | Yes (7th) | Yes | Customer feedback from review funnel |
| `/analytics` | Analytics | Yes (8th) | Yes | Service type breakdown charts |
| `/billing` | Billing | No | Yes | Subscription, usage, plan cards (accessed via settings?) |
| `/settings` | Settings | No | Yes | Business profile, templates, service types, AI, etc. |
| `/contacts` | Customers (redirect) | No | No | Backward compat redirect to `/customers` |
| `/scheduled` | Scheduled Sends | No | Unclear | NOT in sidebar nav—orphaned v1 feature? |
| `/onboarding` | Onboarding | No | Yes | 7-step wizard for new users |

**Key findings:**
- **Orphaned route:** `/scheduled` page exists, has metadata, but not in sidebar nav
- **Redirect route:** `/contacts` redirects to `/customers` (backward compat)
- **Nav order issue:** Send is 2nd in nav (feels primary), should be secondary per V2 vision
- **Billing/Settings access:** Billing page exists but not in sidebar—accessed via account menu? Or orphaned?

### Legacy Terminology Patterns to Detect

| Pattern | Context | Severity | Example |
|---------|---------|----------|---------|
| "contact" / "contacts" | User-facing text | Critical | "Select contacts to send to" should be "Select customers..." |
| "CONTACT_LIMITS" | Code constants | Medium | Billing constant name, user sees "customers" |
| `contactId` variable | Code internals | Low | Variables like `resendReadyContactIds`, `contactId` |
| `Contact` type alias | Type definitions | Low | `type Contact = Customer` marked `@deprecated` |
| "send request" / "review request" | User-facing text | Critical | V1 single-send language, should be "campaign touch" or "message" |
| "email template" | UI labels | Medium | Should be "message template" (now supports SMS too) |

**Known instances from code review:**
1. ✅ Sidebar nav: Uses "Customers" correctly
2. ✅ Usage display component: Uses "Customers" in UI text (line 51)
3. ❌ Usage display component: Uses `contactCount` variable name (line 48, 52)
4. ❌ Send components: Extensive use of `contact` variables (`contactId`, `resendReadyContactIds`)
5. ❌ Feedback page: Uses `lucide-react` icon instead of Phosphor (inconsistency)
6. ✅ Database types: `Contact` type alias marked `@deprecated` (line 82)
7. ❌ Billing constants: `CONTACT_LIMITS` constant name (user-facing text is correct though)

### Icon System Consistency

| Standard | Actual Usage | Inconsistencies |
|----------|--------------|-----------------|
| Phosphor Icons (regular weight) | Sidebar, most pages | Feedback page uses `lucide-react` MessageSquare icon |
| Phosphor server-safe imports | `/dist/ssr` path | Most components use correct SSR-safe imports |

**Rule:** All dashboard icons should be from `@phosphor-icons/react` (client) or `@phosphor-icons/react/dist/ssr` (server components), weight "regular" or "duotone" for emphasis.

### Design System Variables

| Variable | Light Mode | Dark Mode | Purpose |
|----------|-----------|-----------|---------|
| `--background` | 0 0% 97.6% | 0 0% 9% | Page background |
| `--foreground` | 0 0% 9% | 0 0% 98% | Text color |
| `--card` | 0 0% 100% | 0 0% 12% | Card backgrounds |
| `--primary` | 224 75% 43% | 224 75% 55% | Brand blue |
| `--border` | 0 0% 89% | 0 0% 20% | Borders |
| `--muted-foreground` | 0 0% 45% | 0 0% 64% | Secondary text |
| `--status-*-bg/text` | Custom per status | Custom per status | Status badge colors |

**Contrast target:** Material Design recommends 15.8:1 minimum for dark mode text-to-background.

**Font:** Kumbh Sans (imported in layout)

**Spacing:** Tailwind default spacing scale (0.25rem increments)

### Data Model for Cross-Validation

Key tables and fields to verify in UI:

| UI Location | Database Source | Query |
|-------------|-----------------|-------|
| Dashboard KPI - Customers | `customers` table | `SELECT COUNT(*) FROM customers WHERE business_id = ? AND status = 'active'` |
| Dashboard KPI - Jobs | `jobs` table | `SELECT COUNT(*) FROM jobs WHERE business_id = ? AND status = 'completed'` |
| Dashboard KPI - Campaigns | `campaigns` table | `SELECT COUNT(*) FROM campaigns WHERE business_id = ? AND status = 'active'` |
| Dashboard Ready-to-Send Queue | `jobs` + `campaign_enrollments` | Complex query checking jobs without active enrollments |
| Analytics - Service Type Breakdown | `jobs` + `send_logs` | Aggregation by `service_type` |
| Billing - Monthly Sends | `send_logs` table | `SELECT COUNT(*) FROM send_logs WHERE business_id = ? AND created_at >= start_of_month` |
| Billing - Customer Count | `customers` table | `SELECT COUNT(*) FROM customers WHERE business_id = ? AND status = 'active'` |
| Customers Page - List | `customers` table | Paginated query with filters |
| Jobs Page - List | `jobs` + `customers` join | Paginated query with service type filter |
| Campaign Enrollments | `campaign_enrollments` + joins | Touch status, scheduled times |

### V2 Product Model Alignment

**V2 Philosophy:**
- Primary workflow: Job completed → Campaign enrollment → Multi-touch sequence → Review funnel
- Customers are secondary (created implicitly when job completed, not primary object)
- Campaigns are primary (automation-first, not manual sending)
- Manual send still exists but should feel secondary

**Pages that should feel primary (v2-aligned):**
1. Dashboard - Command center
2. Jobs - Where work gets logged
3. Campaigns - Where automation is configured
4. Analytics - Where outcomes are measured

**Pages that should feel secondary:**
5. Send - Manual override, not primary workflow
6. Customers - Supporting data, not entry point
7. History - Audit trail, not action center

**Current nav order issues:**
- Send is 2nd in nav (feels primary) → Should move down to 5th or 6th position
- Customers is 3rd (okay but feels too prominent) → Could move after Jobs

### Test Data Requirements

**Fresh Account (Empty States):**
- Zero customers
- Zero jobs
- Zero campaigns
- Zero send history
- Zero feedback
- Default tier: "trial"
- Onboarding incomplete

**Populated Account (Full Features):**
- 50+ customers (mix of active/archived, with/without phone, SMS consent states)
- 30+ jobs (mix of completed/do_not_send, various service types, various completion dates)
- 3+ campaigns (1 default "all services", 2 service-specific)
- 10+ campaign enrollments (mix of active/completed/stopped, various touch states)
- 100+ send logs (mix of sent/delivered/bounced/failed, various dates)
- 5+ feedback entries (mix of resolved/unresolved, various ratings)
- Service types enabled: hvac, plumbing, cleaning
- Tier: "pro" (for unlimited customers)
- Message templates: 2 email, 1 SMS per service type

**Browser/Device Matrix:**
- Chrome/Edge (Chromium) - Desktop 1280x800
- Chrome/Edge (Chromium) - Mobile 375x667
- Light mode + Dark mode for each

## Sources

### Primary (HIGH confidence)
- [Playwright Best Practices 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices) - Testing strategies, parallel execution, reporting
- [Database Testing Guide | Software Testing Help](https://www.softwaretestinghelp.com/database-testing-process/) - UI-to-DB validation, cross-check methods
- [WCAG 2.2 Accessibility Checklist | The Clay Media](https://theclaymedia.com/wcag-2-2-accessibility-checklist-2026/) - 2026 compliance standards
- [Keyboard Navigation Testing | TestParty.ai](https://testparty.ai/blog/keyboard-navigation-testing) - WCAG keyboard requirements
- [Dark Mode Testing | BrowserStack](https://www.browserstack.com/guide/how-to-test-apps-in-dark-mode) - Manual and automated testing approaches

### Secondary (MEDIUM confidence)
- [UX Testing Methods | Outwitly](https://outwitly.com/blog/six-ux-testing-methods-for-success/) - Think-aloud, heatmaps, session recordings
- [Empty State UX | Eleken](https://www.eleken.co/blog-posts/empty-state-ux) - Design rules, "two parts instruction, one part delight"
- [Responsive Design Breakpoints | BrowserStack](https://www.browserstack.com/guide/responsive-design-breakpoints) - 2026 breakpoint standards
- [Usability Testing Guide | UX Design Institute](https://www.uxdesigninstitute.com/blog/guide-to-usability-testing-for-ux/) - Systematic UX testing methodology
- [Dark Mode Best Practices | Tech-RZ](https://www.tech-rz.com/blog/dark-mode-design-best-practices-in-2026/) - Contrast ratios, OLED considerations

### Tertiary (LOW confidence)
- Various Next.js dashboard template repositories (for comparison, not authoritative)
- Developer blog posts on Playwright patterns (anecdotal, not official)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright is industry standard (70% adoption), WCAG 2.2 AA is legal requirement
- Architecture: HIGH - Patterns verified across multiple authoritative sources (BrowserStack, official WCAG docs)
- Pitfalls: MEDIUM - Derived from research + codebase analysis, not from AvisLoop-specific past issues
- AvisLoop-specific context: HIGH - Direct code inspection, DATABASE.md review, sidebar nav analysis

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - testing practices stable, tooling versions may update)
**Codebase snapshot:** Commit 721b07b (test(28-07): verify build passes lint and typecheck)

---

## Quick Reference: Audit Checklist

Use this checklist when executing the audit:

### Per-Page Checklist
- [ ] Screenshot baseline (light mode, desktop)
- [ ] Screenshot baseline (dark mode, desktop)
- [ ] Screenshot baseline (light mode, mobile)
- [ ] Screenshot baseline (dark mode, mobile)
- [ ] Empty state tested (if applicable)
- [ ] All buttons clicked
- [ ] All forms filled and submitted
- [ ] All dropdowns opened
- [ ] All toggles switched
- [ ] All modals/dialogs opened
- [ ] All links followed
- [ ] Data consistency cross-check (if displays counts/stats)
- [ ] Legacy terminology scan
- [ ] Keyboard navigation (Tab through page)
- [ ] Focus indicators visible
- [ ] Icon system consistent (Phosphor only)
- [ ] Design system variables used correctly
- [ ] Spacing/padding consistent
- [ ] V2 alignment verified (campaign-first lens)

### Critical Checks (Hard Fails)
- [ ] No "contact"/"contacts" in user-facing text
- [ ] No v1 single-send language ("send request", "review request")
- [ ] No broken functionality (forms submit, buttons work)
- [ ] No accessibility traps (keyboard users can navigate)
- [ ] No orphaned features visible to users

### Overall Health Scorecard
Calculate per-page grade (Pass / Needs Work / Fail):
- **Pass:** Zero Critical, 0-2 Medium, any number of Low
- **Needs Work:** Zero Critical, 3+ Medium
- **Fail:** 1+ Critical

Overall dashboard health: Average of page grades.
