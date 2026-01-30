# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Phase 16 - Onboarding Redesign

## Current Position

**Phase:** 16 of 19 (Onboarding Redesign)
**Plan:** 16-03 of 3 (Auth Page Redesign)
**Status:** Phase complete
**Last activity:** 2026-01-30 -- Completed 16-03-PLAN.md (Auth Page Redesign)

**Progress:** [█████████████████████] 51/57 total plans complete, 3/3 Phase 16 complete

```
v1.0 MVP: ████████████████████████████████████████████████ 48/48 COMPLETE
Phase 12: █ Cron Processing (1/1) COMPLETE
Phase 13: ██ Scheduling & Navigation (2/2) COMPLETE
Phase 14: ██ Scheduled Send Management (2/2) COMPLETE
Phase 15: ████ Design System & Dashboard Redesign (4/4) COMPLETE
Phase 16: ███ Onboarding Redesign (3/3) COMPLETE
```

## What's Been Built

### v1.0 MVP (Complete)
- Auth, business profiles, contacts, sending, history, billing, onboarding, public pages, polish, landing redesign, bulk send & integrations

### v1.1 Phase 12: Cron Processing (Complete)
- **Atomic claim function:** `claim_due_scheduled_sends()` with FOR UPDATE SKIP LOCKED
- **Cron route handler:** `/api/cron/process-scheduled-sends` with service role client
- **Vercel Cron config:** Runs every minute, processes pending scheduled sends
- **Re-validation at send time:** Cooldown, opt-out, archived, quota checks
- **Race-safe processing:** Multiple cron invocations can't double-process

### Phase 13: Scheduling & Navigation (Complete)
- **13-01:** Nav link badge showing pending scheduled count in sidebar and mobile nav, dashboard stat card for pending sends
- **13-02:** /scheduled page with list view, status badges, cancel action for pending sends

### Phase 14: Scheduled Send Management (Complete)
- **14-01 Complete:** Backend infrastructure with bulk cancel/reschedule server actions (max 50 IDs), enhanced data layer with send_log details for completed sends, Radix Tabs UI component
- **14-02 Complete:** Tabbed scheduled table with expandable per-contact results, checkbox selection with shift-click range support, Gmail-style floating action bar, styled confirmation dialogs (CancelDialog, RescheduleDialog), responsive desktop/mobile layouts, Phase 15 design system integration

### Phase 15: Design System & Dashboard Redesign (Complete)
- **15-01 Complete:** Design system foundation with #1B44BF primary color, Kumbh Sans font, Phosphor icons, semantic status palette, border-only design (no shadows)
- **15-02 Complete:** Sidebar and bottom nav with Phosphor icons, white sidebar bg with #E2E2E2 border, #F2F2F2 active state, #F9F9F9 content bg
- **15-03 Complete:** Dashboard components (stat cards, activity table, avatar) and data layer functions (getNeedsAttentionCount, getRecentActivity)
- **15-04 Complete:** Dashboard page integration with QuickSend component, redesigned layout matching Figma reference (welcome header, stat cards, quick send + schedule presets, recent activity)

### Phase 16: Onboarding Redesign (Complete)
- **16-01 Complete:** Database migration (is_test flag on send_logs, onboarding_steps_completed object format), Google OAuth infrastructure (callback route, signInWithGoogle action, GoogleOAuthButton component)
- **16-02 Complete:** Wizard redesign to 2 steps (business name, Google review link), horizontal progress bar at bottom, simplified inline step components
- **16-03 Complete:** Auth page redesign with split layout (form left, visual right), Google OAuth button integration via OR divider, removed Card wrappers from forms

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans (Google Fonts), Radix UI (Dialog, Tabs)

## Decisions Made

| ID | Phase | Decision | Rationale | Impact | Date |
|----|-------|----------|-----------|--------|------|
| D12-01-01 | 12-01 | Use FOR UPDATE SKIP LOCKED for race-safe claiming | Prevents duplicate processing when multiple cron invocations overlap | High | 2026-01-29 |
| D12-01-02 | 12-01 | Service role client for cron context | Cron runs without user session, needs RLS bypass | High | 2026-01-29 |
| D12-01-03 | 12-01 | Re-validate all rules at send time | Contact status may change between schedule and execution | Medium | 2026-01-29 |
| D12-01-04 | 12-01 | Return 200 for partial failures | Vercel Cron expects 200 for success; individual failures logged in scheduled_send records | Low | 2026-01-29 |
| D15-01-01 | 15-01 | Primary color #1B44BF app-wide | Matches Figma design reference for dashboard redesign | High | 2026-01-29 |
| D15-01-02 | 15-01 | Kumbh Sans font family | Design system requirement, replaces Geist | Medium | 2026-01-29 |
| D15-01-03 | 15-01 | Border-only design (no shadows) | Reference design aesthetic, removes all box-shadows from components | Medium | 2026-01-29 |
| D15-01-04 | 15-01 | 8px border-radius standard | Changed from 12px for tighter corners matching reference | Low | 2026-01-29 |
| D15-01-05 | 15-01 | Semantic status color palette | 5 status colors (success, warning, error, info, reviewed) with light/dark variants | Medium | 2026-01-29 |
| D13-01-01 | 13-01 | Pass scheduled count as prop from Server Component layout | Client components cannot call server functions; count must be fetched server-side | Medium | 2026-01-30 |
| D13-01-02 | 13-01 | Show badge on both desktop sidebar and mobile bottom nav | Users need visibility of pending scheduled sends from all navigation contexts | Low | 2026-01-30 |
| D13-01-03 | 13-01 | Add Scheduled stat card to dashboard | Provides quick visibility of pending sends and reinforces feature discoverability | Low | 2026-01-30 |
| D13-02-01 | 13-02 | Separate pending and past sends in UI | Users care most about pending sends; past sends are reference only | Medium | 2026-01-29 |
| D13-02-02 | 13-02 | Native confirm() dialog for cancel confirmation | Simple, accessible, no additional UI dependencies | Low | 2026-01-29 |
| D13-02-03 | 13-02 | Responsive table/card pattern | Tables don't work well on mobile; cards provide better UX | Medium | 2026-01-29 |
| D15-02-01 | 15-02 | Bottom nav reduced to 4 items | Scheduled removed from mobile nav to match reference design | Low | 2026-01-30 |
| D15-02-02 | 15-02 | App content bg #F9F9F9 | Light gray background for content area matching Figma reference | Low | 2026-01-30 |
| D15-03-01 | 15-03 | Deterministic avatar colors based on name hash | Hash the name string (sum of char codes mod 8) to select from 8 pastel colors for consistent avatar appearance | Low | 2026-01-29 |
| D15-03-02 | 15-03 | Map 'opened' status to 'Clicked' label in UI | Display email 'opened' status as 'Clicked' for better user understanding in Recent Activity table | Low | 2026-01-29 |
| D15-04-01 | 15-04 | Contact search max 5 matches in dropdown | Prevent dropdown UI overflow, encourage specific queries | Low | 2026-01-30 |
| D15-04-02 | 15-04 | Recently added contact chips (max 5) | Quick selection for common use case, avoid UI clutter | Low | 2026-01-30 |
| D15-04-03 | 15-04 | Schedule presets as toggle chips | Matches Figma aesthetic (rounded-full border), clear visual state | Low | 2026-01-30 |
| D15-04-04 | 15-04 | Extract first name from business name or email | Personalized welcome message with graceful fallbacks | Low | 2026-01-30 |
| D14-01-01 | 14-01 | Bulk operations limited to 50 items | Prevent database performance issues and timeouts | Medium | 2026-01-30 |
| D14-01-02 | 14-01 | Parallel send_log fetching with Promise.all | Optimize performance for multiple completed scheduled sends | Medium | 2026-01-30 |
| D14-01-03 | 14-01 | Handle Supabase join returning arrays with graceful mapping | Supabase foreign key joins return arrays; need to extract first element | Low | 2026-01-30 |
| D14-02-01 | 14-02 | Checkboxes only on Pending tab, not Past tab | Past sends cannot be rescheduled/cancelled, so selection not needed | Low | 2026-01-30 |
| D14-02-02 | 14-02 | Reset expanded state and selection on tab change | Prevent confusion when switching between Pending and Past tabs | Low | 2026-01-30 |
| D14-02-03 | 14-02 | Filter out 'Send now' preset from reschedule dialog | Rescheduling to 'now' doesn't make semantic sense | Low | 2026-01-30 |
| D14-02-04 | 14-02 | Show inline results summary in Past tab table rows | Users can see sent/skipped/failed counts at a glance | Low | 2026-01-30 |
| D16-01-01 | 16-01 | Use PKCE flow for Google OAuth | Supabase built-in OAuth provider support with secure PKCE flow | Medium | 2026-01-30 |
| D16-01-02 | 16-01 | Partial index on send_logs WHERE is_test = false | Optimizes quota enforcement queries by excluding test sends at index level | Medium | 2026-01-30 |
| D16-01-03 | 16-01 | Change onboarding_steps_completed from array to object | Object format better supports key-value tracking for dashboard cards | Low | 2026-01-30 |
| D16-02-01 | 16-02 | 2-step wizard (business name, Google review link) | Faster onboarding, less intimidating for new users | Medium | 2026-01-30 |
| D16-02-02 | 16-02 | Inline step components instead of separate files | Simple single-input forms don't need complex form libraries or separate files | Low | 2026-01-30 |
| D16-02-03 | 16-02 | Horizontal progress bar at bottom with counter | Cleaner UI matching modern onboarding patterns | Low | 2026-01-30 |
| D16-03-01 | 16-03 | Use split layout (grid-cols-1 lg:grid-cols-2) for auth pages | Modern design pattern that provides visual interest on desktop while remaining clean and focused on mobile | Medium | 2026-01-30 |
| D16-03-02 | 16-03 | Remove Card wrapper from auth forms | Split layout already provides visual structure; Card wrapper was redundant and cluttered the design | Low | 2026-01-30 |
| D16-03-03 | 16-03 | Place Google OAuth below email/password form with OR divider | Email/password remains primary auth method with OAuth as convenient alternative; OR divider clearly separates the two options | Low | 2026-01-30 |
| D16-03-04 | 16-03 | Hide right panel on mobile (lg:hidden) | Mobile screens need all space for form; visual panel is decorative and not essential to task completion | Low | 2026-01-30 |

Recent architectural decisions:
- Separate scheduled_sends table (different lifecycle than send_logs)
- Vercel Cron for processing (serverless, every minute)
- Service role for cron (no user session in cron context)
- FOR UPDATE SKIP LOCKED for race condition prevention
- UTC storage, local timezone display
- Inline Quick Send pattern with schedule presets for dashboard

## Blockers & Concerns

- Vercel Cron only runs in production -- local testing requires curl to route handler
- CRON_SECRET env var must be set before first deployment
- Supabase Google OAuth provider must be configured in dashboard before OAuth flow works
- Migration 00011 must be applied to database before is_test flag is usable

## Quick Tasks

| ID  | Name                           | Status   | Summary                          |
| --- | ------------------------------ | -------- | -------------------------------- |
| 001 | Response Rate Dashboard Widget | Complete | reviewed_at column + widget card |

## Session Continuity

**Last session:** 2026-01-30
**Stopped at:** Completed 16-03-PLAN.md (Auth Page Redesign) - Phase 16 complete
**Resume file:** None
**Next action:** Phase 16 complete - ready for next phase or milestone completion
