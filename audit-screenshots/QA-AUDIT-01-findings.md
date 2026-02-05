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
