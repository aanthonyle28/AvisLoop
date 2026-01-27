# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-25)

**Core value:** Make requesting reviews so simple that business owners actually do it — one contact, one click, done.
**Current focus:** Phase 4 - Core Sending

## Current Position

Phase: 4 of 9 (Core Sending)
Plan: 2 of 5
Status: In progress
Last activity: 2026-01-27 - Completed 04-02-PLAN.md (Email infrastructure setup)

Progress: [████░░░░░░] ~38% (4/9 phases, 21/~52 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 21
- Average duration: 3 min
- Total execution time: 1.00 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth | 6 | 19 min | 3 min |
| 02-business-setup | 3 | 6 min | 2 min |
| 03-contact-management | 6 | 19 min | 3 min |
| 03.1-critical-fixes | 1 | 3 min | 3 min |
| 04-core-sending | 2 | 4 min | 2 min |

**Recent Trend:**
- Last 5 plans: 04-02 (2 min), 04-01 (2 min), 03.1-01 (3 min), 03-06 (8 min), 03-05 (5 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Use (SELECT auth.uid()) wrapper for RLS policy performance optimization
- SECURITY DEFINER on handle_new_user trigger for auth.users access
- Cascade delete profiles when auth.users deleted
- Use NEXT_PUBLIC_SUPABASE_ANON_KEY over PUBLISHABLE_KEY for compatibility
- UPDATED: Renamed proxy.ts to middleware.ts per gap closure plan (Next.js 16 shows deprecation warning but still works)
- Use getUser() for JWT validation (security best practice)
- AuthActionState returns fieldErrors separately for per-field form validation
- signOut returns Promise<never> (always redirects)
- Recovery type in email confirmation redirects to /auth/update-password
- useActionState pattern used for all auth forms with pending state
- Per-field error display using fieldErrors from Server Action response
- LogoutButton simplified to form action without 'use client' directive
- [02-01] Use subquery pattern for child table RLS (email_templates)
- [02-01] Store default templates in code, clone on business creation
- [02-01] Use .optional().or(z.literal('')) for optional form fields
- [02-02] Use upsert pattern (check existing then insert/update) for business profile
- [02-02] Collocate data fetching functions with Server Actions in business.ts
- [02-03] Use explicit FK hint (email_templates!email_templates_business_id_fkey) for PostgREST ambiguous relationship
- [03-01] Unique constraint on (business_id, email) prevents duplicate contacts per business
- [03-01] Status field limited to 'active'/'archived' via CHECK constraint for contact archival
- [03-01] Optional phone field for future SMS support (nullable TEXT, max 20 chars)
- [03-01] Tracking fields (last_sent_at, send_count) for send analytics and spam prevention
- [03-02] Lowercase email normalization prevents case-sensitive duplicates
- [03-02] Server-side business_id fetch (never trust client) for security
- [03-02] bulkCreateContacts skips duplicates and returns detailed report for CSV import UX
- [03-02] Collocate data fetching (getContacts, searchContacts) with mutations in contact.ts
- [03-05] Use PapaParse for CSV parsing with header auto-mapping
- [03-05] Fetch existing emails from database for duplicate detection before import
- [03-05] Multi-step dialog flow: upload -> preview -> importing -> complete
- [03-05] Filter duplicates and invalid rows before calling bulkCreateContacts
- [03-03] Use TanStack Table for headless table functionality
- [03-03] Debounce search with 300ms delay for performance
- [03-03] Default sort by last_sent_at DESC (most recent first)
- [03-03] Client-side filtering for performance on small datasets
- [03-04] Use Dialog for add (not Sheet) for focused, blocking interaction
- [03-04] Sheet slides from right, shows edit form + activity summary
- [03-04] Auto-close on success by checking result.success in useActionState callback
- [03-04] Form reset on contact change using useEffect + formRef
- [03-05] Use PapaParse for CSV parsing with header auto-mapping
- [03-05] Fetch existing emails from database for duplicate detection before import
- [03-05] Multi-step dialog flow: upload -> preview -> importing -> complete
- [03-05] Filter duplicates and invalid rows before calling bulkCreateContacts
- [03.1-01] escapeLikePattern helper escapes %, _, \ for ILIKE sanitization
- [03.1-01] 100-item limit for bulk operations prevents memory/performance issues
- [03.1-01] getContacts returns { contacts, total } for pagination support
- [04-02] Resend singleton with environment variable validation at module load
- [04-02] React Email components for type-safe, maintainable templates
- [04-02] Rate limiter with dev-mode bypass (returns success if Upstash not configured)
- [04-02] Sliding window rate limit: 10 sends per minute per user

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

None currently.

### Completed Setup

- ✅ Supabase project configured (env vars in .env.local)
- ✅ Migration 00001 applied (profiles table with RLS)
- ⚠️ Migration 00002 pending (businesses/email_templates) - run in Supabase SQL Editor
- ✅ Migration 00003 applied (contacts table with RLS)
- ✅ Migration 00004 applied (businesses unique constraint)
- ⚠️ Optional: Enable "Leaked password protection" in Supabase Auth settings
- ⚠️ Resend API key required (RESEND_API_KEY) - see 04-02-SUMMARY.md User Setup section
- ⚠️ Upstash Redis optional (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) - bypasses in dev

## Session Continuity

Last session: 2026-01-27
Stopped at: Completed 04-02-PLAN.md - Email infrastructure setup complete
Resume file: None
Next: 04-03 - Send Server Action
