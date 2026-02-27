# Technology Stack: Playwright E2E QA Audit

**Project:** AvisLoop — Comprehensive E2E QA audit milestone
**Researched:** 2026-02-27
**Milestone Type:** Subsequent — adding Playwright test suite to existing Next.js 15 + Supabase app
**Confidence:** HIGH (Playwright 1.58.1 already installed; patterns verified against official docs + community)

---

## Executive Summary

**One new dev dependency needed: `@axe-core/playwright`.** Playwright 1.58.1 is already in `package.json`. Everything else — screenshot capture, visual diff, device emulation, cookie manipulation, accessibility scanning — is available via built-in Playwright APIs or that single axe package. Do not add Cypress, Percy, or any additional test runner.

---

## Core Tooling

### Already Installed

| Package | Version | Role |
|---------|---------|------|
| `playwright` | 1.58.1 | Browser automation, test runner, assertions, screenshot |

Playwright includes: `@playwright/test` runner, `expect` with visual matchers (`toHaveScreenshot`), device emulation dictionary, cookie/storage APIs, and accessibility tree snapshots.

### Add One Dev Dependency

| Package | Version | Role | Why |
|---------|---------|------|-----|
| `@axe-core/playwright` | latest | WCAG accessibility scan | Playwright's built-in `page.accessibility.snapshot()` gives tree structure only. `@axe-core/playwright` runs the full axe-core engine against the live DOM, catching color contrast, missing labels, duplicate IDs, and 50+ other WCAG 2.1 AA rules automatically. |

**Install:**
```bash
pnpm add -D @axe-core/playwright
```

### Do NOT Add

| Package | Reason |
|---------|--------|
| Cypress | Already have Playwright; two E2E runners is pure overhead |
| Percy / Chromatic | `toHaveScreenshot()` built into Playwright — no external service needed for an audit |
| Vitest / Jest | Audit tests are E2E by nature; unit test runner adds no value here |
| `playwright-testing-library` | Playwright 1.5x has `getByRole`, `getByLabel`, `getByText` built in — no wrapper needed |
| `faker` / `@faker-js/faker` | Audit is read-heavy; data generation only needed if writing mutations, which this audit avoids |

---

## Authentication Pattern

### The Right Approach: UI Login + storageState

**Use UI-based login stored to a JSON file, not API-based token injection.**

Rationale: AvisLoop uses Supabase's `@supabase/ssr` package, which stores auth tokens in cookies managed by the server. `context.addCookies()` can set Playwright-visible cookies, but Supabase's SSR library re-validates and re-issues session cookies on each server request. The only reliable way to get a fully valid, server-accepted Supabase session in a Playwright browser context is to perform the actual UI login flow once and capture the resulting cookie jar via `storageState`.

**Setup file (`e2e/auth.setup.ts`):**
```typescript
import { test as setup, expect } from '@playwright/test'
import path from 'path'

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel('Email').fill(process.env.E2E_TEST_EMAIL!)
  await page.getByLabel('Password').fill(process.env.E2E_TEST_PASSWORD!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  // Wait for redirect to dashboard — confirms cookies are set
  await expect(page).toHaveURL('/dashboard')
  await page.context().storageState({ path: authFile })
})
```

**`playwright.config.ts` projects:**
```typescript
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },
  {
    name: 'mobile',
    use: {
      ...devices['iPhone 14'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },
],
```

**Security:** Add `e2e/.auth/` to `.gitignore` immediately. These JSON files contain live Supabase session cookies.

### Multi-Business Context Switching

The `active_business_id` cookie is set by a Next.js server action (`switchBusiness()`). It is NOT a Supabase auth cookie — it is application-level. Playwright **can** inject this cookie directly via `context.addCookies()` because it only needs to survive the HTTP request to the Next.js server (not round-trip through Supabase's SSR validation).

**Pattern for switching business context in tests:**
```typescript
// In a test or beforeEach
await context.addCookies([{
  name: 'active_business_id',
  value: BUSINESS_B_UUID,
  domain: 'localhost',
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
}])
await page.reload() // Server re-renders with new active business
await expect(page.getByText('Business B Name')).toBeVisible()
```

This works because `cookies()` from `next/headers` reads the cookie from the incoming HTTP request, which Playwright sets correctly at the browser level.

---

## Selector Strategy

**Priority order (most to least preferred):**

1. `getByRole()` — semantic, accessibility-aligned, resilient
2. `getByLabel()` — for form inputs
3. `getByText()` — for unique visible text
4. `getByTestId()` — add `data-testid` attributes only where semantic selectors are genuinely ambiguous
5. CSS selectors — last resort; never use nth-child or positional selectors

**Why this order:** The audit's own accessibility findings (see UX-AUDIT.md) flag missing aria-labels as High severity. Tests that use `getByRole()` simultaneously verify semantic HTML is correct. If `getByRole('button', { name: 'Complete Job' })` fails to find the button, that is itself an accessibility bug.

**Never use:**
- XPath
- CSS attribute selectors based on class names (`[class*="btn-primary"]`)
- Positional locators (`nth(0)`)

---

## Screenshot Strategy

### viewport sizes to capture

```typescript
// Desktop: 1280x800 (standard audit baseline)
// Mobile: 390x844 (iPhone 14 — representative of real usage)
// Tablet: 768x1024 (iPad — catches layout breakpoints)
```

### Light + Dark mode

```typescript
// In playwright.config.ts, define two project variants
{
  name: 'chromium-dark',
  use: {
    ...devices['Desktop Chrome'],
    colorScheme: 'dark',
    storageState: 'e2e/.auth/user.json',
  },
  dependencies: ['setup'],
},
```

### Screenshot configuration for audit (not visual regression)

For an audit, screenshots are **evidence documents**, not regression baselines. Avoid `toHaveScreenshot()` pixel-diff assertions for the audit — they create maintenance overhead. Instead:

```typescript
// Capture for documentation, not assertion
await page.screenshot({
  path: `e2e/screenshots/${pageName}-desktop-light.png`,
  fullPage: true,
})
```

Use `toHaveScreenshot()` assertions only for specific components where pixel-exact regression is explicitly desired (e.g., KPI chart rendering). For an audit, prefer behavioral assertions.

### Animation control

Disable CSS animations globally to get stable screenshots:

```typescript
// playwright.config.ts
use: {
  actionTimeout: 10_000,
  screenshot: 'on',
  // Disable animations for stable screenshots
}

// Or in test
await page.emulateMedia({ reducedMotion: 'reduce' })
```

---

## Accessibility Testing

### Pattern: @axe-core/playwright

```typescript
import { checkA11y } from '@axe-core/playwright'
// OR use the AxeBuilder class from @axe-core/playwright

import AxeBuilder from '@axe-core/playwright'

test('dashboard has no WCAG 2.1 AA violations', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  // Log violations with context for the audit report
  if (results.violations.length > 0) {
    console.log(JSON.stringify(results.violations, null, 2))
  }

  expect(results.violations).toHaveLength(0)
})
```

### Known limitations of automated accessibility testing

Automated axe scans catch ~30-40% of WCAG issues: color contrast, missing labels, duplicate IDs, invalid ARIA roles. They do NOT catch: keyboard trap detection, logical reading order, focus management quality, or screen reader announcement content. Axe is a filter, not a complete audit.

For AvisLoop specifically, the UX-AUDIT.md identified:
- Icon buttons missing `aria-label` (High) — axe catches this
- Checkbox 16px touch target (High) — axe does NOT catch this (size is not a WCAG violation, just WCAG mobile guidance)
- Input height 36px (Medium) — axe does NOT catch this

---

## Test Configuration

### playwright.config.ts skeleton

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Serial for Supabase connection limit sanity
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2, // Supabase free tier: limit connections
  reporter: [
    ['html', { outputFolder: 'e2e/report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Why `workers: 1` in CI:** Supabase free tier limits concurrent DB connections. Parallel workers each open their own connection pool. Running serially avoids `FATAL: remaining connection slots are reserved` errors.

---

## Test Directory Structure

```
e2e/
├── .auth/                    # gitignored — storageState JSON files
│   └── user.json
├── auth.setup.ts             # Auth setup project
├── fixtures/
│   └── index.ts              # Shared fixtures (page factory, context with business cookie)
├── pages/                    # Page Object classes (optional — use for complex pages)
│   ├── dashboard.page.ts
│   └── jobs.page.ts
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── signup.spec.ts
│   │   └── password-reset.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   ├── jobs/
│   │   └── jobs.spec.ts
│   ├── campaigns/
│   │   └── campaigns.spec.ts
│   ├── businesses/           # Multi-business / agency tests
│   │   └── businesses.spec.ts
│   ├── settings/
│   │   └── settings.spec.ts
│   └── public/
│       ├── review-funnel.spec.ts  # /r/[token]
│       └── complete-form.spec.ts  # /complete/[token]
├── screenshots/              # Captured screenshots for audit report
└── report/                   # HTML report output
```

---

## Routes Under Test

Full inventory of AvisLoop routes to cover:

### Public (no auth)
| Route | Notes |
|-------|-------|
| `/` | Marketing landing |
| `/pricing` | Pricing page |
| `/auth/login` | Login form |
| `/auth/sign-up` | Sign up form |
| `/auth/forgot-password` | Password reset |
| `/r/[token]` | Review funnel (HMAC token required) |
| `/complete/[token]` | Job completion form (HMAC token required) |

### Authenticated (dashboard group)
| Route | Key Things to Test |
|-------|-------------------|
| `/dashboard` | KPIs load, Ready-to-Send queue, Attention alerts |
| `/jobs` | Table loads, Add Job sheet, status toggle |
| `/campaigns` | Campaign cards, touch editor, pause/resume |
| `/campaigns/[id]` | Campaign detail, enrollment list |
| `/analytics` | Charts render, service type breakdown |
| `/history` | Filter controls, status badges, resend action |
| `/feedback` | Feedback list, resolution workflow |
| `/customers` | Table, search, tags, CSV import |
| `/businesses` | Agency card grid, detail drawer |
| `/billing` | Plan info, usage meter |
| `/settings` | All tabs render, form saves |
| `/onboarding` | Multi-step wizard completes |

### Edge Cases to Cover
- Business switcher: switch from Business A to Business B, verify all pages reflect new context
- Empty states: fresh business with no data
- Long data: customer name 80+ chars, business name 60+ chars
- Quota limits: behavior when send limit reached
- Mobile layout: all dashboard pages at 390px width

---

## Environment Variables for Tests

```bash
# .env.test (gitignored)
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=testpassword123
E2E_TEST_BUSINESS_ID_A=uuid-for-business-a
E2E_TEST_BUSINESS_ID_B=uuid-for-business-b
```

**Strategy:** Use a dedicated Supabase test account with pre-seeded data. Do NOT use production accounts. Create seed data once (jobs, customers, campaigns) and treat it as stable read-only fixtures for the audit.

---

## What NOT to Add

| Considered | Decision | Reason |
|------------|----------|--------|
| `playwright-testing-library` | No | Playwright 1.5x has `getByRole/Label/Text` natively |
| Cypress | No | Playwright already installed |
| Percy / Chromatic | No | `toHaveScreenshot()` is sufficient for this audit |
| `msw` (Mock Service Worker) | No | Audit should test real app behavior, not mocked |
| `@playwright/test-ct` (Component Testing) | No | E2E audit tests full pages, not isolated components |
| Visual regression CI pipeline | No | Out of scope for audit milestone; screenshots are evidence docs |
| Database seeding scripts (complex) | No | Use Supabase UI to create stable test data once |
| Separate staging database | No | Local dev against local Supabase is sufficient for audit |

---

## Scripts to Add to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:report": "playwright show-report e2e/report",
    "test:e2e:update": "playwright test --update-snapshots"
  }
}
```

---

## Sources

- Playwright 1.58 auth patterns: [playwright.dev/docs/auth](https://playwright.dev/docs/auth) — HIGH confidence (official docs)
- Playwright visual comparisons: [playwright.dev/docs/test-snapshots](https://playwright.dev/docs/test-snapshots) — HIGH confidence (official docs)
- Playwright emulation: [playwright.dev/docs/emulation](https://playwright.dev/docs/emulation) — HIGH confidence (official docs)
- Playwright accessibility: [playwright.dev/docs/accessibility-testing](https://playwright.dev/docs/accessibility-testing) — HIGH confidence (official docs)
- Next.js Playwright guide: [nextjs.org/docs/app/guides/testing/playwright](https://nextjs.org/docs/app/guides/testing/playwright) — HIGH confidence (official, fetched 2026-02-27)
- Supabase REST auth in Playwright: [mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test](https://mokkapps.de/blog/login-at-supabase-via-rest-api-in-playwright-e2e-test) — MEDIUM confidence (third-party, verified against Playwright auth docs)
- Next.js cookies() + Playwright compatibility: [github.com/vercel/next.js/discussions/62254](https://github.com/vercel/next.js/discussions/62254) — HIGH confidence (explains why UI login + storageState is required over API injection)
- axe-core/playwright npm: [npmjs.com/package/axe-playwright](https://www.npmjs.com/package/axe-playwright) — MEDIUM confidence (package exists, API confirmed via official Playwright a11y docs)

---

*Stack research for: Playwright E2E QA Audit milestone*
*Researched: 2026-02-27*
*Confidence: HIGH — Playwright 1.58.1 confirmed installed; auth + cookie patterns verified against official sources*
