# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Phase 15 - Design System & Dashboard Redesign

## Current Position

**Phase:** 15 of 15 (Design System & Dashboard Redesign)
**Plan:** 15-03 of 4 (Dashboard Components & Data Layer)
**Status:** Plan 15-03 complete
**Last activity:** 2026-01-29 -- Completed 15-03-PLAN.md (Dashboard Components & Data Layer)

**Progress:** [###########---------] 48/48 v1.0 plans complete, 1/1 Phase 12 complete, 2/2 Phase 13 complete, 3/4 Phase 15 complete

```
v1.0 MVP: ████████████████████████████████████████████████ 48/48 COMPLETE
Phase 12: █ Cron Processing (1/1) COMPLETE
Phase 13: ██ Scheduling & Navigation (2/2) COMPLETE
Phase 14: ░░░ Scheduled Send Management (0/TBD)
Phase 15: ███░ Design System & Dashboard Redesign (3/4) <- IN PROGRESS
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

### Phase 15: Design System & Dashboard Redesign (In Progress)
- **15-01 Complete:** Design system foundation with #1B44BF primary color, Kumbh Sans font, Phosphor icons, semantic status palette, border-only design (no shadows)
- **15-02 Complete:** Sidebar and bottom nav with Phosphor icons, white sidebar bg with #E2E2E2 border, #F2F2F2 active state, #F9F9F9 content bg
- **15-03 Complete:** Dashboard components (stat cards, activity table, avatar) and data layer functions (getNeedsAttentionCount, getRecentActivity)

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS, Resend, Stripe, Upstash Redis, Phosphor Icons, Kumbh Sans (Google Fonts)

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

Recent architectural decisions:
- Separate scheduled_sends table (different lifecycle than send_logs)
- Vercel Cron for processing (serverless, every minute)
- Service role for cron (no user session in cron context)
- FOR UPDATE SKIP LOCKED for race condition prevention
- UTC storage, local timezone display

## Blockers & Concerns

- Vercel Cron only runs in production -- local testing requires curl to route handler
- CRON_SECRET env var must be set before first deployment

## Quick Tasks

| ID  | Name                           | Status   | Summary                          |
| --- | ------------------------------ | -------- | -------------------------------- |
| 001 | Response Rate Dashboard Widget | Complete | reviewed_at column + widget card |

## Session Continuity

**Last session:** 2026-01-29
**Stopped at:** Completed 15-03-PLAN.md (Dashboard Components & Data Layer)
**Resume file:** None
**Next action:** Continue with Phase 15-04 (Dashboard Page Integration)
