---
phase: QA-AUDIT
plan: 09
type: execute
wave: 2
depends_on: ["QA-AUDIT-01", "QA-AUDIT-02", "QA-AUDIT-03", "QA-AUDIT-04", "QA-AUDIT-05", "QA-AUDIT-06", "QA-AUDIT-07", "QA-AUDIT-08"]
files_modified: ["docs/QA-AUDIT.md"]
autonomous: true

must_haves:
  truths:
    - "docs/QA-AUDIT.md exists with complete audit report"
    - "Report organized by page with severity-sorted findings"
    - "Per-page grades assigned (Pass/Needs Work/Fail)"
    - "Overall dashboard health scorecard included"
    - "Every finding has actionable fix suggestion"
  artifacts:
    - path: "docs/QA-AUDIT.md"
      provides: "Complete QA audit report"
      min_lines: 200
  key_links:
    - from: "QA-AUDIT.md"
      to: "Plan 01-08 SUMMARY files"
      via: "Aggregated findings from all audit plans"
---

<objective>
Compile all findings from Plans 01-08 into the final docs/QA-AUDIT.md report. This is the deliverable of the entire QA audit phase.

Purpose: Produce a single, actionable report that the user can reference when fixing issues. Every finding needs severity, location, and fix suggestion.
Output: `docs/QA-AUDIT.md` — the complete QA audit report.
</objective>

<execution_context>
@C:\Users\aanth\.claude/get-shit-done/workflows/execute-plan.md
@C:\Users\aanth\.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-CONTEXT.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-01-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-02-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-03-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-04-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-05-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-06-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-07-SUMMARY.md
@C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-08-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Compile QA Audit Report</name>
  <files>docs/QA-AUDIT.md</files>
  <action>
    **STEP 1: Load all summary files using the Read tool.**

    Before compiling the report, you MUST use the Read tool to load ALL 8 summary files from the phase directory. Read each of these files explicitly:

    1. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-01-SUMMARY.md`
    2. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-02-SUMMARY.md`
    3. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-03-SUMMARY.md`
    4. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-04-SUMMARY.md`
    5. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-05-SUMMARY.md`
    6. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-06-SUMMARY.md`
    7. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-07-SUMMARY.md`
    8. `C:\AvisLoop\.planning\phases\QA-AUDIT-dashboard-audit\QA-AUDIT-08-SUMMARY.md`

    Read all 8 files (you can read them in parallel) BEFORE proceeding to Step 2. Do not rely on the @-references in the context section alone — explicitly load each file with the Read tool to ensure full content is available.

    **STEP 2: Aggregate findings and compile report.**

    After reading all 8 summaries, aggregate every finding into a single structured report.

    **Create `docs/QA-AUDIT.md` with this structure:**

    ```markdown
    # AvisLoop Dashboard QA Audit Report

    **Date:** [current date]
    **Auditor:** Claude (automated QA audit)
    **Scope:** All authenticated dashboard pages (15 routes)
    **Methodology:** Playwright MCP interaction + Supabase MCP data cross-checks
    **Viewports:** Desktop (1280x800) + Mobile (375x667)
    **Themes:** Light mode + Dark mode

    ## Executive Summary

    **Overall Dashboard Health:** [Pass / Needs Work / Fail]
    **Total Findings:** X (Y Critical, Z Medium, W Low)

    ### Key Themes
    [2-3 sentences summarizing the biggest patterns — e.g., legacy terminology, V2 alignment gaps, design inconsistencies]

    ### Priority Actions
    1. [Highest impact fix]
    2. [Second highest]
    3. [Third highest]

    ## Scorecard

    | Page | Grade | Critical | Medium | Low | Notes |
    |------|-------|----------|--------|-----|-------|
    | Login | [grade] | X | Y | Z | [brief note] |
    | Onboarding | [grade] | X | Y | Z | |
    | Dashboard | [grade] | X | Y | Z | |
    | Analytics | [grade] | X | Y | Z | |
    | Jobs | [grade] | X | Y | Z | |
    | Campaigns | [grade] | X | Y | Z | |
    | Campaign Detail | [grade] | X | Y | Z | |
    | Campaign Edit | [grade] | X | Y | Z | |
    | Campaign New | [grade] | X | Y | Z | |
    | Send (Quick) | [grade] | X | Y | Z | |
    | Send (Bulk) | [grade] | X | Y | Z | |
    | Customers | [grade] | X | Y | Z | |
    | Feedback | [grade] | X | Y | Z | |
    | History | [grade] | X | Y | Z | |
    | Billing | [grade] | X | Y | Z | |
    | Settings | [grade] | X | Y | Z | |

    **Grading criteria:**
    - **Pass:** 0 Critical, 0-2 Medium, any Low
    - **Needs Work:** 0 Critical, 3+ Medium
    - **Fail:** 1+ Critical

    ## V2 Alignment Assessment

    ### Navigation Order
    [Current order vs recommended order, with rationale]

    ### Product-Sense Gaps
    [Features that work but don't fit campaign-first V2 model]

    ### Orphaned Features
    [/scheduled page assessment, any other orphaned routes]

    ## Findings by Page

    ### Login Page
    [Findings sorted by severity: Critical first, then Medium, then Low]

    #### Critical
    - **[Finding title]** — [Description]. File: `path/to/file.tsx`. Fix: [Specific fix suggestion].

    #### Medium
    - ...

    #### Low
    - ...

    ### Onboarding Wizard
    [Same structure for each page...]

    ### Dashboard
    ...

    [Continue for all pages]

    ## Cross-Cutting Findings

    ### Legacy Terminology
    [Complete catalogue of "contact"/"send request"/"email template" references]

    | Severity | File | Line | Text | Fix |
    |----------|------|------|------|-----|
    | Critical | ... | ... | ... | ... |
    | Medium | ... | ... | ... | ... |
    | Low | ... | ... | ... | ... |

    ### Icon System Inconsistencies
    [lucide-react vs Phosphor findings]

    ### Design System
    [Spacing, color, typography findings]

    ### Data Consistency
    [Summary of all DB cross-checks — which passed, which failed]

    ## Screenshots Index

    | Screenshot | Page | Theme | Viewport | Path |
    |------------|------|-------|----------|------|
    | Login | Login | Light | Desktop | C:\AvisLoop\audit-screenshots\login-desktop-light.png |
    | ... | ... | ... | ... | ... |

    ## Recommendations

    ### Immediate (before next release)
    1. [Critical fixes]
    2. ...

    ### Short-term (next sprint)
    1. [Medium fixes grouped by concern]
    2. ...

    ### Future consideration
    1. [Low severity items, V2 alignment suggestions]
    2. ...
    ```

    **Writing guidelines:**
    - Every finding MUST have: severity, file path, specific fix suggestion
    - Findings within each page section sorted by severity (Critical first)
    - Use consistent formatting throughout
    - Include actual data from cross-checks (what was expected vs what was displayed)
    - Reference screenshot file paths for visual evidence (use absolute paths: `C:\AvisLoop\audit-screenshots\...`)
    - Be specific about V2 alignment concerns (not vague "could be better")
    - Legacy terminology table should list EVERY instance found
  </action>
  <verify>
    - `docs/QA-AUDIT.md` exists and is well-structured
    - All pages from Plans 01-08 have findings sections
    - Scorecard has grades for all pages
    - Executive summary is accurate
    - Every finding has severity + file + fix suggestion
    - Cross-cutting sections are complete
    - Screenshots index is complete
  </verify>
  <done>
    Complete QA audit report exists at docs/QA-AUDIT.md with:
    - Executive summary with overall health grade
    - Per-page scorecard
    - All findings organized by page and severity
    - Cross-cutting findings (terminology, icons, design)
    - Prioritized recommendations
    - Screenshots index
  </done>
</task>

</tasks>

<verification>
- docs/QA-AUDIT.md is comprehensive (200+ lines)
- Every page from the audit has a findings section
- Scorecard covers all 15+ routes
- No findings left undocumented from prior plan summaries
- Report is actionable (every finding has a fix suggestion)
</verification>

<success_criteria>
- docs/QA-AUDIT.md created with complete, well-structured content
- Executive summary accurately reflects overall health
- Per-page grades assigned using consistent criteria
- All findings from Plans 01-08 included
- Cross-cutting concerns documented
- Prioritized recommendations provided
- Report is immediately useful for fixing issues
</success_criteria>

<output>
After completion, create `.planning/phases/QA-AUDIT-dashboard-audit/QA-AUDIT-09-SUMMARY.md`

Include: Final statistics (total findings by severity), overall health grade, key action items.
</output>
