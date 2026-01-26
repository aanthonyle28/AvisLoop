# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts and access the app securely. This includes sign-up, login, logout, password reset, and email verification. Session management and RLS policies ensure data security. Onboarding wizard and business setup are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Sign-up flow
- Email verification required BEFORE app access — user must click email link first
- Support both email/password AND Google OAuth sign-up
- Password requirements: standard (8+ characters, mixed case, number required)
- Post-verification landing: Claude's discretion (onboarding wizard vs dashboard)

### Session behavior
- Session duration: 7 days default
- Remember me checkbox: Claude's discretion
- Multi-device: unlimited simultaneous sessions allowed, no restrictions
- Session expiry handling: Claude's discretion (inline prompt vs redirect)

### Password recovery
- "Forgot password?" link on login page (not separate page)
- Reset link expiry: Claude's discretion (sensible security default)
- Rate limiting on reset requests: Claude's discretion (implement sensible protection)
- Post-reset behavior: Claude's discretion (auto-login vs manual login)

### Error messaging
- Specificity: user-friendly — show "Email not found" or "Wrong password" distinctly
- Tone: friendly and casual — "Oops! That password doesn't match. Try again?"
- Include help actions: yes — error messages should include relevant links (e.g., "Forgot password?")
- Validation display: both summary at top AND inline hints under each field

### Claude's Discretion
- Post-verification landing page (onboarding wizard vs dashboard with prompts)
- Remember me checkbox (yes/no, and if yes, extended duration)
- Session expiry UX pattern (inline modal vs redirect)
- Password reset link expiry duration
- Rate limiting implementation for password reset
- Post-password-reset behavior (auto-login vs redirect to login)

</decisions>

<specifics>
## Specific Ideas

- Error messages should feel approachable for small business owners, not technical
- Login/signup should be minimal — business owners are busy, don't want complexity
- Google login supports users who prefer not to manage another password

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-01-26*
