---
phase: QA-AUDIT
plan: 08
type: execute
wave: 1
depends_on: []
files_modified: []
autonomous: true

must_haves:
  truths:
    - "Orphaned routes identified and documented (/scheduled, /contacts redirect)"
    - "Codebase-wide legacy terminology sweep completed"
    - "Navigation order assessed for V2 alignment"
    - "Cross-cutting design consistency verified"
  artifacts:
    - path: "audit-screenshots/scheduled-*.png"
      provides: "Scheduled page screenshots (orphaned route)"
    - path: "audit-screenshots/contacts-redirect-*.png"
      provides: "Contacts redirect verification"
  key_links:
    - from: "/contacts route"
      to: "/customers route"
      via: "redirect (backward compatibility)"
    - from: "/scheduled route"
      to: "sidebar navigation"
      via: "NOT linked (orphaned)"
---

<objective>
Audit orphaned/edge-case routes (/scheduled, /contacts), perform a comprehensive codebase-wide legacy terminology sweep, assess navigation order for V2 alignment, and check cross-cutting design concerns (icon system, theme consistency, spacing).

Purpose: Catch the findings that don't belong to any single page — cross-cutting concerns, orphaned features, and systemic issues.
Output: Findings documented in scratch notes for final report compilation (Plan 09).
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-RESEARCH.md
@C:\AvisLoop\components\layout\sidebar.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit Orphaned Routes and Navigation</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools for testing.**

    **--- Orphaned Route: /scheduled ---**

    Navigate to `http://localhost:3000/scheduled`.

    **Screenshot:** `audit-screenshots/scheduled-desktop-light.png`

    **Check:**
    - Does the page render? (or 404?)
    - What does it show? (scheduled sends from v1.1?)
    - Is it functional or broken?
    - Is it linked from ANY page in the dashboard? (sidebar, dashboard, any page)
    - Does it fit the V2 model? (In V2, campaigns handle timing automatically — scheduled manual sends may be obsolete)

    **Verdict:** Document whether /scheduled should be:
    - Removed entirely (orphaned v1 feature)
    - Hidden but kept (backward compat)
    - Integrated into another page (e.g., History)

    **--- Redirect Route: /contacts ---**

    Navigate to `http://localhost:3000/contacts`.

    **Screenshot:** `audit-screenshots/contacts-redirect.png` (capture the redirect target)

    **Check:**
    - Verify it redirects to /customers
    - Check redirect type (301 permanent? or client-side?)
    - Note: This is expected backward compatibility — should be Low severity at most

    **--- Navigation Order Assessment ---**

    Open the sidebar (navigate to /dashboard to see full sidebar).

    **Current sidebar order (from sidebar.tsx):**
    1. Dashboard (House)
    2. Send (PaperPlaneTilt)
    3. Customers (AddressBook)
    4. Jobs (Briefcase)
    5. Campaigns (Megaphone)
    6. Activity (ClockCounterClockwise) — route is /history
    7. Feedback (ChatCircleText)
    8. Analytics (ChartBar)

    **V2-aligned suggested order:**
    1. Dashboard — command center (correct position)
    2. Jobs — where work is logged (should be #2)
    3. Campaigns — where automation runs (should be #3)
    4. Analytics — where outcomes are measured (should be #4)
    5. Customers — supporting data (secondary)
    6. Send — manual override (secondary)
    7. Activity — audit trail (utility)
    8. Feedback — response workflow (utility)

    **Assessment:**
    - Send at #2 feels too prominent for V2 model
    - Jobs at #4 feels too buried (should be #2)
    - Campaigns at #5 feels too buried (should be #3)
    - Document this as a MEDIUM finding with specific reorder suggestion

    **Account menu check:**
    - Open the Account menu (bottom of sidebar)
    - Verify it contains: Settings, Billing, Sign Out (or similar)
    - This is the only access to Settings and Billing — verify links work
    - Take screenshot: `audit-screenshots/account-menu.png`

    **Sidebar collapse behavior:**
    - Click collapse button
    - Verify icons remain visible and identifiable
    - Verify tooltips appear on hover when collapsed
    - Verify "Add Job" button remains visible when collapsed
    - Verify badge/dot indicators work when collapsed

    **Mobile navigation:**
    - Resize to 375px width
    - Verify sidebar is hidden
    - Check for hamburger menu or mobile nav
    - If mobile nav exists, verify all pages accessible
    - Take screenshot: `audit-screenshots/mobile-nav.png`

    **Record findings with severity and fix suggestions.**
  </action>
  <verify>
    - Orphaned /scheduled route documented
    - /contacts redirect verified
    - Navigation order assessed against V2 model
    - Account menu tested
    - Sidebar collapse tested
    - Mobile navigation tested
    - All findings documented
  </verify>
  <done>Orphaned routes and navigation fully audited, V2 nav order recommendation documented.</done>
</task>

<task type="auto">
  <name>Task 2: Cross-Cutting Checks (Legacy Terms, Icons, Design)</name>
  <files></files>
  <action>
    **IMPORTANT: This is a QA testing task. Do NOT write code files. Use Playwright MCP tools and grep/search for code-level checks.**

    **--- Comprehensive Legacy Terminology Sweep ---**

    Search the entire codebase for legacy terminology in USER-FACING locations. Use grep/ripgrep or the Grep tool (NOT Playwright for this part).

    **Search 1: "contact" in user-facing files**
    Search in: `app/(dashboard)/**/*.tsx`, `components/**/*.tsx`
    Pattern: `contact` (case-insensitive)
    Exclude: `node_modules`, `.next`, test files

    For each hit, classify:
    - **CRITICAL:** User-facing text (headings, labels, button text, descriptions, placeholders, toast messages, empty state text)
    - **MEDIUM:** Code comments visible in IDE, ARIA labels
    - **LOW:** Variable names, type aliases, internal constants

    Acceptable uses (false positives to filter out):
    - "contact support" / "contact us" — legitimate phrase
    - Import paths containing "contact"
    - Database column names (contact_id in legacy references)
    - The `Contact` type alias in lib/types/database.ts (marked @deprecated)

    **Search 2: "send request" or "review request" in user-facing files**
    Pattern: `send.request|review.request` (case-insensitive)
    These are v1 single-send language and should not appear anywhere.

    **Search 3: "email template" in user-facing text**
    Pattern: `email.template` (case-insensitive)
    Should be "message template" (since Phase 23 unified email + SMS).
    Acceptable in: database migration files, backward compat view references.

    **Search 4: "CONTACT_LIMITS" constant**
    Find where this constant is defined and where it's used.
    Is it visible to users in any UI text? (The constant name itself is fine if user sees "Customer limit")

    **Compile a complete legacy terminology findings list with:**
    - File path
    - Line number
    - The offending text
    - Severity (Critical/Medium/Low)
    - Whether it's user-facing or code-internal
    - Fix suggestion

    ---

    **--- Icon System Consistency Check ---**

    **Known issue:** Feedback page may use lucide-react icons instead of Phosphor.

    Search for lucide-react imports across dashboard components:
    Pattern: `from ['"]lucide-react['"]` or `from 'lucide-react'`
    Location: `app/(dashboard)/**/*.tsx`, `components/**/*.tsx`

    For each lucide-react import found:
    - Document which component uses it
    - Identify which Phosphor icon should replace it
    - Flag as MEDIUM severity (design system inconsistency)

    Verify the standard: All icons should use `@phosphor-icons/react` or `@phosphor-icons/react/dist/ssr`.

    ---

    **--- Design System Consistency ---**

    **Font check:**
    - Navigate to 3-4 different pages and verify Kumbh Sans is applied
    - Check that no pages fall back to system fonts

    **Color variable usage:**
    - Verify cards use `bg-card` or `bg-white dark:bg-card` (not hardcoded colors)
    - Check borders use `border-border` (not hardcoded gray)
    - Check text uses `text-foreground` or `text-muted-foreground` (not hardcoded)
    - Note: Some hardcoded values may be intentional (e.g., #F2F2F2 in sidebar)

    **Spacing consistency:**
    - Compare page padding across 3-4 pages
    - Check that all pages use consistent padding (e.g., p-6 or p-8)
    - Verify card spacing is consistent

    **Theme toggle:**
    - Find and test the theme toggle (light/dark/system)
    - Verify it works from any page
    - Verify theme persists across navigation
    - Verify theme persists across page refresh

    **Record all findings with severity and fix suggestions.**
  </action>
  <verify>
    - Comprehensive legacy terminology sweep complete
    - Icon system consistency checked (lucide-react vs Phosphor)
    - Design system consistency verified
    - Theme toggle tested
    - All findings compiled with severity
  </verify>
  <done>Cross-cutting audit complete: legacy terminology catalogue, icon consistency, design system, theme toggle.</done>
</task>

</tasks>

<verification>
- Orphaned routes identified and documented
- Navigation order assessed with V2 recommendation
- Legacy terminology sweep covers all user-facing files
- Icon system consistency verified
- Design system consistency verified
- Mobile navigation tested
</verification>

<success_criteria>
- /scheduled route status documented (orphaned or kept)
- /contacts redirect verified
- Navigation reorder recommendation documented
- Complete legacy terminology findings list compiled
- lucide-react usage fully documented
- Design system consistency assessed
- Theme toggle works correctly
- All findings documented with severity + fix suggestions
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-08-SUMMARY.md`

Include: Orphaned route decisions, nav order recommendation, legacy terminology count by severity, icon consistency issues, design findings.
</output>
