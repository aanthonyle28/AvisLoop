# Project Milestones: AvisLoop

## v1.2.1 Tech Debt Closure (Shipped: 2026-02-01)

**Delivered:** Closed all tech debt from the v1.2 audit, fixing a deployment blocker, completing formal verification of core sending, and cleaning up orphaned code.

**Phases completed:** 17-18 (4 plans total)

**Key accomplishments:**

- Fixed deployment blocker: created missing scheduled_sends table migration (00009b) that enables fresh database deploys
- Completed formal verification of Phase 4 Core Sending (9/9 success criteria passed with code evidence)
- Confirmed password reset redirect path already resolved (no code change needed)
- Added pagination controls to history page with URL-driven state
- Centralized billing constants by replacing inline CONTACT_LIMITS duplication
- Updated stale Phase 13 verification status to reflect post-resolution state

**Stats:**

- 15 source files created/modified (33 total including planning docs)
- 18,011 lines of TypeScript/SQL/CSS (total project)
- 2 phases, 4 plans
- 3 days from start (2026-01-30) to ship (2026-02-01)

**Git range:** `422a6f4` (docs: add gap closure phases) -> `0900f11` (docs: complete code cleanup phase)

**What's next:** Production deployment preparation, or plan next feature milestone (SMS, multi-location, analytics)

---

## v1.2 Onboarding Redesign + Google Auth (Shipped: 2026-01-30)

**Delivered:** Redesigned auth pages with split layout and Google OAuth, simplified onboarding to 2 steps, added guided test send walkthrough cards on dashboard.

**Phases completed:** 15-16 (9 plans total)

**Key accomplishments:**

- Design system overhaul: #1B44BF primary, Kumbh Sans font, Phosphor icons, border-only aesthetic
- Dashboard redesigned with stat cards, quick send, recent activity table
- Auth pages with split layout (form left, visual right) and Google OAuth
- Onboarding simplified from 4 steps to 2 (business name + review link)
- Dashboard shows 3 numbered test step cards that auto-complete and disappear
- Test sends flagged in database and excluded from quota counting

**Stats:**

- 5 phases (15-16 + quick tasks), 9 plans
- 6 days (2026-01-29 to 2026-01-30)

---

## v1.1 Scheduled Sending (Shipped: 2026-01-30)

**Delivered:** Users can schedule review request emails for future delivery with preset and custom timing, manage pending sends, and rely on background cron processing.

**Phases completed:** 12-14 (5 plans total)

**Key accomplishments:**

- Cron endpoint processes scheduled sends every minute with race-safe atomic claiming
- Schedule presets (1 hour, next morning, 24 hours, custom date/time) in send form
- Scheduled sends management page with tabs, expandable results, bulk operations
- Cancel and reschedule support for pending sends
- Navigation badges showing pending scheduled count

**Stats:**

- 3 phases, 5 plans
- 2 days (2026-01-29 to 2026-01-30)

---

## v1.0 MVP (Shipped: 2026-01-28)

**Delivered:** Complete review request SaaS with auth, business profiles, contacts, email sending, history, billing, onboarding, and marketing pages.

**Phases completed:** 1-11 (48 plans total)

**Key accomplishments:**

- Full auth system with email verification and password reset
- Contact management with CRUD, CSV import, search, filtering
- Email sending via Resend with cooldown, rate limiting, opt-out, and quota enforcement
- Stripe billing with trial (25 sends), Basic ($49/mo), and Pro ($99/mo) tiers
- Guided onboarding wizard with dashboard checklist
- Landing page with modern design, pricing page with tier comparison
- Bulk send (up to 25), re-send to cooled-down contacts, webhook API for contact ingestion

**Stats:**

- 15 phases (including 4 inserted fix phases), 48 plans
- 3 days (2026-01-26 to 2026-01-28)

---
