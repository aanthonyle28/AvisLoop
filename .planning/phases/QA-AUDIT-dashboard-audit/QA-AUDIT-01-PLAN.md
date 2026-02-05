---
phase: QA-AUDIT
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Login flow works end-to-end (email/password -> dashboard redirect)"
    - "Onboarding wizard renders all 7 steps with correct flow"
    - "Screenshots captured for login and all onboarding steps in both themes and viewports"
  artifacts:
    - path: "audit-screenshots/login-*.png"
      provides: "Login page baseline screenshots"
    - path: "audit-screenshots/onboarding-*.png"
      provides: "Onboarding wizard step screenshots"
  key_links:
    - from: "login page"
      to: "/dashboard"
      via: "successful authentication redirect"
    - from: "onboarding step N"
      to: "onboarding step N+1"
      via: "step navigation (Next button)"
---

<objective>
Audit the login flow and 7-step onboarding wizard. This is the first user journey touchpoint — if login or onboarding is broken, nothing else matters.

Purpose: Verify authentication works, onboarding wizard renders all 7 steps correctly, and the first-time user experience is polished in both themes and viewports.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\app\onboarding\page.tsx
@C:\AvisLoop\components\layout\sidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Login Flow</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools (browser_navigate, browser_snapshot, browser_click, browser_type, browser_take_screenshot) and Supabase MCP (execute_sql) to test.**

    1. Start the dev server if not running (`pnpm dev`)
    2. Navigate to `http://localhost:3000/login` using browser_navigate
    3. Take screenshot: `audit-screenshots/login-desktop-light.png` (1280x800 viewport)

    **Login page checks:**
    - Page has proper title (check document title or heading)
    - Email input field has label and placeholder
    - Password input field has label and placeholder
    - Submit button exists and is labeled appropriately
    - "Sign up" or "Create account" link exists
    - "Forgot password" link exists (if applicable)
    - Page renders correctly (no broken layout, no console errors)
    - Branding: AvisLoop logo/name visible

    **Login interaction test:**
    - Enter valid test credentials (use existing test account or sign up)
    - Submit the form
    - Verify redirect to `/dashboard` (or `/onboarding` if new user)
    - Verify no error toasts on successful login

    **Error state test:**
    - Navigate back to login
    - Enter invalid credentials
    - Verify error message displays (not a generic crash)
    - Verify error message is user-friendly (not a raw error object)

    **Dark mode test:**
    - Switch to dark mode (toggle theme or use browser_navigate with dark mode)
    - Take screenshot: `audit-screenshots/login-desktop-dark.png`
    - Verify text is readable against dark background
    - Verify form inputs have visible borders

    **Mobile test:**
    - Resize to 375x667 viewport
    - Take screenshot: `audit-screenshots/login-mobile-light.png`
    - Verify layout doesn't break (no horizontal scroll, inputs don't overflow)
    - Switch to dark mode, take screenshot: `audit-screenshots/login-mobile-dark.png`

    **Record findings with severity:**
    - Critical: Login doesn't work, redirect fails
    - Medium: Error messages unclear, layout broken on mobile
    - Low: Minor spacing issues, placeholder text could be better
  </action>
  <verify>
    - 4 login screenshots captured (desktop light/dark, mobile light/dark)
    - Login flow works end-to-end
    - Error state tested
    - All findings documented with severity
  </verify>
  <done>Login page audited across all 4 viewport+theme combinations, interaction tested, findings documented.</done>
</task>

<task type="auto">
  <name>Task 2: Audit Onboarding Wizard (7 Steps)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools to test.**

    Navigate to `http://localhost:3000/onboarding` (may need a fresh user or direct URL).

    **For each of the 7 onboarding steps, check:**

    **Step 1 - Business Basics:**
    - Business name input with label
    - Phone number input with label
    - Google review link input with label
    - Next button works
    - Validation works (try submitting empty)
    - Take screenshot: `audit-screenshots/onboarding-step1-desktop-light.png`

    **Step 2 - Review Destination:**
    - Google review link validation/preview
    - "Test your link" button works (opens in new tab)
    - Take screenshot

    **Step 3 - Services Offered:**
    - Multi-select checkboxes for service types (HVAC, plumbing, electrical, cleaning, roofing, painting, handyman, other)
    - Timing display ("Review request: Xh after job") for each service
    - Take screenshot

    **Step 4 - Software Used:**
    - Card selection for ServiceTitan/Jobber/Housecall Pro/none
    - Radio-style behavior (one selection at a time)
    - Take screenshot

    **Step 5 - Campaign Preset:**
    - Preset picker (Conservative/Standard/Aggressive)
    - Preset descriptions visible
    - Take screenshot

    **Step 6 - Import Customers:**
    - CSV upload area
    - Manual add option
    - Take screenshot

    **Step 7 - SMS Consent:**
    - Consent acknowledgment checkbox
    - TCPA compliance language
    - Cannot skip (consent required)
    - Take screenshot

    **Cross-cutting onboarding checks:**
    - Progress indicator visible (step X of 7)
    - Back button works (navigate between steps)
    - Step flow is linear (can't skip ahead)
    - V2 alignment: Steps make sense for campaign-first model
    - No legacy "contacts" language anywhere
    - No "send request" or "review request" language
    - All icons are Phosphor (not lucide-react or other)

    **Dark mode test:**
    - Navigate through wizard in dark mode
    - Take dark mode screenshots for at least step 1 and step 5
    - Verify readability and contrast

    **Mobile test:**
    - Resize to 375x667
    - Navigate through wizard
    - Verify layout doesn't break
    - Take mobile screenshots for at least step 1

    **Record all findings with:**
    - Page: Onboarding Step N
    - Finding description
    - Severity: Critical / Medium / Low
    - Fix suggestion (file, component, what to change)
  </action>
  <verify>
    - Screenshots for all 7 steps captured
    - Dark mode tested
    - Mobile tested
    - Legacy terminology scan complete
    - All findings documented with severity and fix suggestions
  </verify>
  <done>All 7 onboarding steps audited across themes and viewports, every interaction tested, findings documented.</done>
</task>

</tasks>

<verification>
- Login flow works end-to-end
- All onboarding steps render and are navigable
- No Critical severity findings that block user entry
- Screenshots serve as visual baseline documentation
</verification>

<success_criteria>
- Login page fully audited (4 screenshots, interaction tested, error states checked)
- All 7 onboarding steps audited (screenshots, interactions, validations)
- Both light and dark mode tested
- Both desktop and mobile tested
- All findings documented with severity + fix suggestion
- No legacy "contacts" or "send request" language found (or flagged if found)
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-01-SUMMARY.md`

Include: Total findings count by severity, key screenshots taken, any blockers discovered.
</output>
