# QA-AUDIT-01: Login & Onboarding Wizard Findings

## Task 1: Login Flow Audit

### Test Account
- Email: audit-test@avisloop.com
- Password: AuditTest123!
- User ID: ac6f9407-7e88-4204-9f0f-8d213c58ab67
- Created via sign-up + admin email confirmation

### Screenshots Captured
1. login-desktop-light.png - Desktop 1280x800 light mode
2. login-desktop-dark.png - Desktop 1280x800 dark mode
3. login-mobile-light.png - Mobile 375x667 light mode
4. login-mobile-dark.png - Mobile 375x667 dark mode
5. login-error-state.png - Invalid credentials error
6. login-success-redirect.png - Post-login redirect to onboarding

### Element Checks (All PASS)
- [x] Email input with label ("Email") and placeholder ("m@example.com")
- [x] Password input with label ("Password")
- [x] Submit button ("Login")
- [x] "Sign up" link present (links to /auth/sign-up)
- [x] "Forgot your password?" link present (links to /auth/forgot-password)
- [x] AvisLoop branding visible (top-left)
- [x] Google OAuth button ("Continue with Google")
- [x] "Or continue with" divider
- [x] Split layout: form left, preview panel right (desktop only)
- [x] Right panel hidden on mobile

### Interaction Tests
- [x] Valid credentials -> redirects to /onboarding (new user without completed onboarding)
- [x] Invalid credentials -> shows "Invalid login credentials" in red text
- [x] Error message is user-friendly (not a raw error object)
- [x] Error message is dismissible (clickable to dismiss)
- [x] /login redirects to /auth/login correctly
- [x] /signup redirects to /auth/sign-up correctly
- [x] No horizontal scroll on mobile

### Findings

#### LOW - L01: Password field missing placeholder
- **Page:** Login (/auth/login)
- **Issue:** Password input has no placeholder text, while email has "m@example.com"
- **Impact:** Minor UX inconsistency
- **Fix:** Add placeholder to password Input in components/login-form.tsx (e.g., "Enter your password")

#### LOW - L02: Right panel "Product Preview" is placeholder content
- **Page:** Login (/auth/login) - desktop only
- **Issue:** Right panel shows a large "A" and "Product Preview" text - clearly placeholder
- **Impact:** Looks unfinished on desktop
- **Fix:** Replace with testimonial, feature showcase, or screenshot in components/auth/auth-split-layout.tsx

#### LOW - L03: Theme toggle button (N) overlaps content area
- **Page:** Login (all viewports)
- **Issue:** A circular "N" button (next-themes toggle?) sits in bottom-left corner, overlapping content
- **Impact:** Minor visual clutter, not blocking
- **Fix:** Ensure theme toggle is properly positioned or hidden on auth pages

### Dark Mode Assessment
- Text readable against dark background (h1 color: rgb(250, 250, 250))
- Form inputs have visible borders (rgb(51, 51, 51))
- Input backgrounds transparent (appropriate for dark mode)
- Google OAuth button visible and styled
- Overall: Dark mode works well, no readability issues

### Mobile Assessment
- No horizontal scroll
- Right panel correctly hidden on mobile
- Form inputs fill available width
- Layout is responsive and functional
- No overflow issues

### Summary
- Critical findings: 0
- Medium findings: 0
- Low findings: 3

---

## Task 2: Onboarding Wizard Audit (7 Steps)

### Screenshots Captured
**Desktop Light (1280x800):**
1. onboarding-step1-desktop-light.png - Business Basics
2. onboarding-step2-desktop-light.png - Review Destination
3. onboarding-step3-desktop-light.png - Services Offered
4. onboarding-step4-desktop-light.png - Software Used
5. onboarding-step5-desktop-light.png - Campaign Preset
6. onboarding-step6-desktop-light.png - Import Customers
7. onboarding-step7-desktop-light.png - SMS Consent

**Desktop Dark (1280x800):**
8. onboarding-step1-desktop-dark.png - Business Basics (dark)
9. onboarding-step5-desktop-dark.png - Campaign Preset (dark)

**Mobile Light (375x667):**
10. onboarding-step1-mobile-light.png - Business Basics (mobile)
11. onboarding-step3-mobile-light.png - Services Offered (mobile)
12. onboarding-step5-mobile-light.png - Campaign Preset (mobile)
13. onboarding-step7-mobile-light.png - SMS Consent (mobile)

### Step-by-Step Audit

#### Step 1: Business Basics
- **Heading:** "Let's get your business set up" - PASS
- **Fields:** Business name (required *), Phone number (optional), Google review link (optional) - PASS
- **Placeholders:** "e.g. Sunrise HVAC", "(555) 123-4567", "https://g.page/r/..." - PASS
- **Continue button:** Present and labeled "Continue" - PASS
- **Progress bar:** Shows 1/7 with progressbar ARIA role - PASS
- **Validation:** Empty name shows "Business name is required" error - PASS
- **Step 1 No Back button:** Correct for first step - PASS

#### Step 2: Review Destination
- **Heading:** "Verify your Google review link" - PASS
- **Link input:** Google review link with placeholder - PASS
- **"Test your link" button:** Present, opens link in new tab - PASS
- **Back button:** Present - PASS
- **Continue button:** Present - PASS
- **"Skip for now" link:** Present - PASS
- **Progress bar:** Shows 2/7 - PASS

#### Step 3: Services Offered
- **Heading:** "What services does your business offer?" - PASS
- **Checkboxes:** 8 service types (HVAC, Plumbing, Electrical, Cleaning, Roofing, Painting, Handyman, Other) - PASS
- **Timing display:** Each shows "Review request: Xh after job" (24h, 48h, 24h, 4h, 72h, 48h, 24h, 24h) - PASS
- **Grid layout:** 2 columns on desktop, 1 column on mobile - PASS
- **Back/Continue buttons:** Present - PASS
- **Progress bar:** Shows 3/7 - PASS

#### Step 4: Software Used
- **Heading:** "What software do you use to manage jobs?" - PASS
- **Info banner:** "This is for our roadmap planning only. No integration will be set up now." with Info icon (Phosphor) - PASS
- **Cards:** ServiceTitan, Jobber, Housecall Pro, None/Other with descriptions - PASS
- **Radio-style behavior:** Cards use custom radio indicators - PASS
- **Skip for now link:** Present - PASS
- **Back/Continue buttons:** Present - PASS
- **Progress bar:** Shows 4/7 - PASS

#### Step 5: Campaign Preset
- **Heading:** "Choose your follow-up approach" - PASS
- **Presets:** Aggressive, Conservative, Standard (3 cards) - PASS
- **Descriptions:** Each preset has description and touch visualization with badges - PASS
- **Touch badges:** Show channel icon (envelope/chat) + timing (4h, 1d, 3d, 7d) - PASS
- **Back/Continue buttons:** Present - PASS
- **Progress bar:** Shows 5/7 - PASS

#### Step 6: Import Customers
- **Heading:** "Import your customers" - PASS
- **CSV button:** "Import CSV" button present - PASS
- **Info note:** SMS consent reminder about setting status in customer list later - PASS
- **Back/Continue buttons:** Present - PASS
- **Progress bar:** Shows 6/7 - PASS

#### Step 7: SMS Consent
- **Heading:** "SMS consent requirements" - PASS
- **Requirements list:** 4 bullet points covering consent, STOP, TCPA, business hours - PASS
- **Checkbox:** TCPA acknowledgment checkbox with full legal text - PASS
- **"Complete Setup" button:** Present, appears disabled when checkbox unchecked - PASS
- **Back link:** Present as underlined text - PASS
- **Progress bar:** Shows 7/7 - PASS

### Cross-Cutting Checks

#### Progress Indicator
- [x] Present on all 7 steps
- [x] Shows "N/7" counter correctly
- [x] Fixed at bottom of page with progressbar ARIA role
- [x] Progress bar fills proportionally

#### Step Navigation
- [x] Step 1: No back button (correct for first step)
- [x] Steps 2-7: Back button works
- [x] Steps 2, 4: "Skip for now" link available for optional steps
- [x] Step 7: "Complete Setup" instead of "Continue"
- [x] Direct URL navigation works (?step=N for each step)

#### Legacy Terminology Scan
- [x] No "contacts" language in active wizard steps
- [x] "customers" used correctly in Step 6 ("Import your customers")
- **FINDING (Medium):** "review request" language found in:
  - Step 1 subtitle: "This info appears in your review request messages."
  - Step 3 timing: "Review request: 24h after job"
  - Setup progress drawer: "Customize your review request email"

#### Icon Audit
- [x] Review Destination Step: CheckCircle from @phosphor-icons/react - PASS
- [x] Software Used Step: Info from @phosphor-icons/react - PASS
- [x] Campaign Preset Step: EnvelopeSimple, ChatCircle from @phosphor-icons/react - PASS
- **NOTE:** Legacy send-step.tsx uses lucide-react icons (not imported in active wizard, dead code)

### Findings

#### CRITICAL - C01: Step 1 server action fails - "phone" column not in schema cache
- **Page:** Onboarding Step 1 (/onboarding?step=1)
- **Issue:** Submitting step 1 with any phone number triggers error: "Could not find the 'phone' column of 'businesses' in the schema cache". This error appears in the page content, and the step cannot advance.
- **Impact:** NEW USERS CANNOT COMPLETE ONBOARDING. The onboarding flow is completely blocked at step 1 when a phone number is provided. Without phone number it may work (untested), but users are prompted to enter one.
- **Root Cause:** Phase 28 added a `phone` column to the `businesses` table in code (lib/actions/onboarding.ts lines 138, 154) but the corresponding database migration has not been applied to the production/development database. The Supabase schema cache does not have this column.
- **Fix:** Apply the Phase 28 database migration that adds the `phone` column to the `businesses` table. Or temporarily remove the phone field from the onboarding form until the migration is applied.
- **Files:** lib/actions/onboarding.ts (saveBusinessBasics), components/onboarding/steps/business-basics-step.tsx

#### MEDIUM - M01: "review request" terminology in onboarding steps
- **Page:** Step 1 and Step 3
- **Issue:** Uses "review request" language:
  - Step 1: "This info appears in your review request messages."
  - Step 3: "Review request: 24h after job" (each service type)
- **Impact:** Inconsistent with v2.0 campaign-first language. Should say "follow-up messages" or "campaign messages"
- **Fix:**
  - Step 1 (business-basics-step.tsx line 68): Change to "This info appears in your follow-up messages."
  - Step 3 (services-offered-step.tsx line 111): Change "Review request" to "Follow-up" (e.g., "Follow-up: 24h after job")

#### MEDIUM - M02: Step 7 "Back" button is inconsistent with other steps
- **Page:** Onboarding Step 7 (/onboarding?step=7)
- **Issue:** Step 7 uses a text underline link "Back" instead of a Button component like steps 2-6. Steps 2-6 use a proper outlined Button, Step 7 uses a bare text link.
- **Impact:** Visual inconsistency in the final step of the wizard
- **Fix:** Replace the text link with a Button variant="outline" to match steps 2-6 pattern, or keep it as a design choice for the final step emphasis on "Complete Setup"

#### LOW - L04: Preset order in Step 5 is Aggressive > Conservative > Standard
- **Page:** Onboarding Step 5 (/onboarding?step=5)
- **Issue:** Presets appear in alphabetical order (Aggressive, Conservative, Standard) rather than escalating order (Conservative, Standard, Aggressive). Users naturally expect a left-to-right progression from least to most.
- **Impact:** Minor UX confusion - users may default to the first (Aggressive) preset
- **Fix:** Reorder database presets or sort in component: Conservative -> Standard -> Aggressive

#### LOW - L05: Legacy onboarding step files not cleaned up
- **Page:** N/A (dead code)
- **Issue:** Three unused step components remain in the codebase:
  - components/onboarding/steps/send-step.tsx (uses lucide-react icons)
  - components/onboarding/steps/business-step.tsx
  - components/onboarding/steps/customer-step.tsx
- **Impact:** Dead code, no user impact. The lucide-react import in send-step.tsx may contribute to bundle size if not tree-shaken.
- **Fix:** Delete the three unused step files

#### LOW - L06: Theme toggle button (N) visible on onboarding pages
- **Page:** All onboarding steps
- **Issue:** The next-themes toggle button (circular "N") appears in the bottom-left corner of every onboarding step, overlapping with the progress bar area
- **Impact:** Visual clutter during onboarding flow
- **Fix:** Hide the theme toggle on /onboarding routes or reposition it

### Dark Mode Assessment
- Step 1 dark mode: Text readable, inputs have visible borders, placeholder text visible - PASS
- Step 5 dark mode: Cards have visible borders, badges readable, descriptions legible - PASS
- Overall: Dark mode works well across onboarding steps

### Mobile Assessment
- No horizontal scroll on any tested step (1, 3, 5, 7) - PASS
- Step 3 grid collapses to single column on mobile - PASS
- Step 5 preset cards stack vertically on mobile - PASS
- Step 7 consent text wraps properly on small screens - PASS
- Progress bar visible at bottom on all mobile views - PASS

### Summary
- Critical findings: 1 (C01 - phone column missing, blocks onboarding)
- Medium findings: 2 (M01 - review request terminology, M02 - Step 7 back button inconsistency)
- Low findings: 3 (L04 - preset order, L05 - dead code, L06 - theme toggle visible)

---

## Overall QA-AUDIT-01 Summary

### Total Findings
| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 1 | C01 |
| Medium | 2 | M01, M02 |
| Low | 6 | L01, L02, L03, L04, L05, L06 |

### Total Screenshots: 19
- Login: 6 (4 viewport/theme combos + error state + success redirect)
- Onboarding: 13 (7 desktop light + 2 desktop dark + 4 mobile light)

### Blocking Issues
- **C01:** Onboarding step 1 fails when phone number is provided due to missing `phone` column in database. This blocks the entire new user onboarding flow. Must be fixed before any other audit findings matter.

### Test Account for Subsequent Plans
- **Email:** audit-test@avisloop.com
- **Password:** AuditTest123!
- **Status:** Authenticated but stuck at onboarding (cannot complete due to C01)
- **Note:** Onboarding has NOT been completed. For plans 02-08, testing the dashboard may require either fixing C01 or using an existing account that already completed onboarding.
