# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Phase 12 - Cron Processing (v1.1 Scheduled Sending)

## Current Position

**Phase:** 12 of 14 (Cron Processing)
**Plan:** 12-01 of 1 (Cron Processing Engine)
**Status:** Plan 12-01 complete
**Last activity:** 2026-01-29 -- Completed 12-01-PLAN.md (Cron Processing Engine)

**Progress:** [###########---------] 48/48 v1.0 plans complete, 1/1 Phase 12 plan complete

```
v1.0 MVP: ████████████████████████████████████████████████ 48/48 COMPLETE
Phase 12: █ Cron Processing (1/1) COMPLETE
Phase 13: ░░░ Scheduling & Navigation (0/TBD) <- NEXT
Phase 14: ░░░ Scheduled Send Management (0/TBD)
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

### v1.1 Partial Work (Exists from Manual Work)
- `lib/types/database.ts` -- ScheduledSend, ScheduledSendInsert, ScheduleActionState types
- `lib/actions/schedule.ts` -- scheduleReviewRequest, cancelScheduledSend, getScheduledSends actions
- `lib/utils/schedule.ts` -- SCHEDULE_PRESETS, formatForDateTimeInput, isValidScheduleDate, formatScheduleDate
- `lib/validations/schedule.ts` -- scheduleSendSchema Zod validation
- `lib/supabase/service-role.ts` -- createServiceRoleClient
- `components/send/schedule-selector.tsx` -- ScheduleSelector (presets + custom picker)
- `components/send/send-form.tsx` -- Already supports scheduled send flow
- Database migration for scheduled_sends table applied

## Tech Stack

Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS, Resend, Stripe, Upstash Redis

## Decisions Made

| ID | Phase | Decision | Rationale | Impact | Date |
|----|-------|----------|-----------|--------|------|
| D12-01-01 | 12-01 | Use FOR UPDATE SKIP LOCKED for race-safe claiming | Prevents duplicate processing when multiple cron invocations overlap | High | 2026-01-29 |
| D12-01-02 | 12-01 | Service role client for cron context | Cron runs without user session, needs RLS bypass | High | 2026-01-29 |
| D12-01-03 | 12-01 | Re-validate all rules at send time | Contact status may change between schedule and execution | Medium | 2026-01-29 |
| D12-01-04 | 12-01 | Return 200 for partial failures | Vercel Cron expects 200 for success; individual failures logged in scheduled_send records | Low | 2026-01-29 |

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
**Stopped at:** Completed 12-01-PLAN.md (Cron Processing Engine)
**Resume file:** None
**Next action:** `/gsd:plan-phase 13` or manual work on Phase 13 (Scheduling & Navigation)
