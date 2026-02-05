---
phase: QA-AUDIT
plan: 01
subsystem: auth-onboarding
tags: [qa, login, onboarding, wizard, dark-mode, mobile, screenshots]
dependency-graph:
  requires: []
  provides:
    - "Login flow baseline screenshots and audit findings"
    - "Onboarding wizard 7-step audit with all screenshots"
    - "Test account credentials for subsequent audit plans"
    - "Critical blocker C01 documented (phone column missing)"
  affects:
    - "QA-AUDIT-02 through QA-AUDIT-08 (test account availability)"
    - "Phase 28 (database migration must be applied)"
    - "QA-AUDIT-09 (report compilation uses these findings)"
tech-stack:
  added: []
  patterns: ["Playwright headless browser testing", "Multi-viewport screenshot comparison"]
key-files:
  created:
    - "audit-screenshots/login-desktop-light.png"
    - "audit-screenshots/login-desktop-dark.png"
    - "audit-screenshots/login-mobile-light.png"
    - "audit-screenshots/login-mobile-dark.png"
    - "audit-screenshots/login-error-state.png"
    - "audit-screenshots/login-success-redirect.png"
    - "audit-screenshots/onboarding-step1-desktop-light.png"
    - "audit-screenshots/onboarding-step1-desktop-dark.png"
    - "audit-screenshots/onboarding-step1-mobile-light.png"
    - "audit-screenshots/onboarding-step2-desktop-light.png"
    - "audit-screenshots/onboarding-step3-desktop-light.png"
    - "audit-screenshots/onboarding-step3-mobile-light.png"
    - "audit-screenshots/onboarding-step4-desktop-light.png"
    - "audit-screenshots/onboarding-step5-desktop-light.png"
    - "audit-screenshots/onboarding-step5-desktop-dark.png"
    - "audit-screenshots/onboarding-step5-mobile-light.png"
    - "audit-screenshots/onboarding-step6-desktop-light.png"
    - "audit-screenshots/onboarding-step7-desktop-light.png"
    - "audit-screenshots/onboarding-step7-mobile-light.png"
    - "audit-screenshots/QA-AUDIT-01-findings.md"
  modified: []
decisions:
  - decision: "Created test account audit-test@avisloop.com via sign-up + admin email confirmation"
    rationale: "Needed confirmed user for login testing; standard sign-up requires email verification"
  - decision: "Used Playwright in separate temp directory to avoid polluting project dependencies"
    rationale: "QA-only tool should not be committed to package.json"
metrics:
  duration: "~25 minutes"
  completed: "2026-02-05"
---

# Phase QA-AUDIT Plan 01: Login & Onboarding Wizard Audit Summary

**One-liner:** Login flow works end-to-end but onboarding Step 1 blocked by missing database column; 19 baseline screenshots captured across 4 viewport/theme combinations.

## What Was Done

### Task 1: Login Flow Audit
- Navigated to /auth/login and verified all UI elements (email/password inputs, labels, placeholders, submit button, sign-up link, forgot password link, Google OAuth button, AvisLoop branding)
- Created test account (audit-test@avisloop.com) via sign-up and admin API email confirmation
- Tested valid login: successfully redirects to /onboarding for new users
- Tested invalid login: shows user-friendly "Invalid login credentials" error message
- Captured 6 screenshots: desktop light/dark, mobile light/dark, error state, success redirect
- Verified dark mode readability (text color rgb(250,250,250), input borders rgb(51,51,51))
- Verified mobile responsiveness (no horizontal scroll, right panel hidden)

### Task 2: Onboarding Wizard Audit (7 Steps)
- Audited all 7 steps via direct URL navigation (/onboarding?step=1 through ?step=7)
- Verified each step has correct heading, form elements, progress bar (N/7), and navigation buttons
- Tested step 1 validation (empty name shows error)
- Discovered CRITICAL blocker: Step 1 server action fails with "phone column not in schema cache"
- Checked all active icons use @phosphor-icons/react (PASS)
- Scanned for legacy "contacts" terminology (none in active wizard)
- Found "review request" terminology in Steps 1 and 3
- Captured 13 onboarding screenshots: 7 desktop light, 2 desktop dark, 4 mobile light

## Findings Summary

| Severity | Count | Details |
|----------|-------|---------|
| Critical | 1 | C01: Missing `phone` column on `businesses` table blocks onboarding |
| Medium | 2 | M01: "review request" terminology, M02: Step 7 back button inconsistency |
| Low | 6 | L01-L06: Password placeholder, right panel placeholder, theme toggle, preset order, dead code, theme toggle on onboarding |

### Critical Findings

**C01: Step 1 server action fails - "phone" column not in schema cache**
- Submitting Step 1 with a phone number triggers: "Could not find the 'phone' column of 'businesses' in the schema cache"
- Phase 28 added `phone` column to code but database migration was not applied
- **Blocks all new user onboarding**
- Fix: Apply Phase 28 migration OR remove phone field from onboarding temporarily

### Key Medium Findings

**M01: "review request" terminology persists in onboarding**
- Step 1 subtitle and Step 3 timing labels use "review request" language
- Should be updated to "follow-up" for v2.0 campaign-first terminology

## Deviations from Plan

None - plan executed exactly as written.

## Screenshots Captured: 19 Total

| Category | Count | Formats |
|----------|-------|---------|
| Login | 6 | Desktop light/dark, mobile light/dark, error, success |
| Onboarding | 13 | 7 desktop light, 2 desktop dark, 4 mobile light |

## Test Account

| Field | Value |
|-------|-------|
| Email | audit-test@avisloop.com |
| Password | AuditTest123! |
| User ID | ac6f9407-7e88-4204-9f0f-8d213c58ab67 |
| Status | Authenticated, stuck at onboarding (C01 blocks completion) |

**Important for subsequent plans (02-08):** This test account cannot complete onboarding due to C01. Dashboard testing may require an existing account or fixing C01 first.

## Next Phase Readiness

- Plan 01 findings are complete and ready for Plan 09 report compilation
- C01 must be resolved before new user flows can be tested end-to-end
- For Plans 02-08 (dashboard page audits), an account that has completed onboarding should be used
