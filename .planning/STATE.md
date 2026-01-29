# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-28)

**Core value:** Make requesting reviews so simple that business owners actually do it -- one contact, one click, done.
**Current focus:** Phase 12 - Cron Processing (v1.1 Scheduled Sending)

## Current Position

**Phase:** 12 of 14 (Cron Processing)
**Plan:** Not started
**Status:** Ready to plan
**Last activity:** 2026-01-28 -- Roadmap created for v1.1 Scheduled Sending milestone

**Progress:** [###########---------] 48/48 v1.0 plans complete, 0/TBD v1.1 plans

```
v1.0 MVP: ████████████████████████████████████████████████ 48/48 COMPLETE
Phase 12: ░░░ Cron Processing (0/TBD) <- NEXT
Phase 13: ░░░ Scheduling & Navigation (0/TBD)
Phase 14: ░░░ Scheduled Send Management (0/TBD)
```

## What's Been Built

### v1.0 MVP (Complete)
- Auth, business profiles, contacts, sending, history, billing, onboarding, public pages, polish, landing redesign, bulk send & integrations

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

Recent decisions affecting current work:
- Separate scheduled_sends table (different lifecycle than send_logs)
- Vercel Cron for processing (serverless, every minute)
- Service role for cron (no user session in cron context)
- FOR UPDATE SKIP LOCKED for race condition prevention
- UTC storage, local timezone display

## Blockers & Concerns

- Vercel Cron only runs in production -- local testing requires curl to route handler
- CRON_SECRET env var must be set before first deployment

## Session Continuity

**Last session:** 2026-01-28
**Stopped at:** Roadmap created for v1.1 milestone
**Resume file:** None
**Next action:** `/gsd:plan-phase 12`
