---
phase: 25-llm-personalization
plan: 01
subsystem: ai-infrastructure
tags: [ai-sdk, openai, prompts, personalization]
dependency-graph:
  requires: []
  provides: [ai-client, system-prompts, personalization-context]
  affects: [25-02, 25-03, 25-04, 25-05, 25-06, 25-07]
tech-stack:
  added: [ai@6.0.69, "@ai-sdk/openai@3.0.25", exponential-backoff@3.1.3]
  patterns: [server-only-ai-client, channel-specific-prompts, moderate-rewrite-guardrails]
key-files:
  created: [lib/ai/client.ts, lib/ai/prompts.ts]
  modified: [package.json, pnpm-lock.yaml]
decisions:
  - id: "25-01-01"
    description: "Single provider (OpenAI) for MVP, multi-provider deferred"
    rationale: "Start simple, GPT-4o-mini sufficient for personalization"
  - id: "25-01-02"
    description: "Removed compatibility: strict from createOpenAI options"
    rationale: "Property not available in @ai-sdk/openai v3.0.25 API"
  - id: "25-01-03"
    description: "Moderate rewrite level enforced in both system and user prompts"
    rationale: "LLM-03 requirement - prevents hallucination while allowing warmth"
metrics:
  duration: "~5 minutes"
  completed: "2026-02-04"
---

# Phase 25 Plan 01: AI SDK Installation and Foundation Summary

**One-liner:** Vercel AI SDK with OpenAI GPT-4o-mini provider, channel-specific system prompts enforcing moderate rewrite with anti-hallucination guardrails

## What Was Done

### Task 1: Install AI SDK and dependencies
- Installed `ai` (Vercel AI SDK core), `@ai-sdk/openai` (OpenAI provider), `exponential-backoff` (retry logic)
- All packages resolve and install cleanly alongside existing dependencies
- Commit: `e28f926`

### Task 2: Create AI client with provider configuration
- Created `lib/ai/client.ts` with OpenAI provider initialized from `OPENAI_API_KEY` env var
- Set GPT-4o-mini as DEFAULT_MODEL (fast, cheap, good quality for personalization)
- Exported `getModel()` helper for model selection and `openai` provider for direct access
- Server-only module (no 'use client' directive)
- Commit: `7cabe6c`

### Task 3: Create system prompts for email and SMS channels
- Created `lib/ai/prompts.ts` with full prompt engineering foundation
- `EMAIL_SYSTEM_PROMPT`: Warm, 2-4 sentence guidelines with subject line constraints
- `SMS_SYSTEM_PROMPT`: 160-char punchy guidelines, casual text-message tone
- `GUARDRAILS` constant: Prohibited content list (incentives, fake urgency, invented claims, prompt injection defense)
- `REWRITE_LEVEL` constant: Explicit "MODERATE" enforcement with "Do not invent details" rule
- `TOUCH_PROMPTS`: Touch-specific variants (fresh ask, gentle reminder, final follow-up, closure)
- `buildPersonalizationPrompt()`: Context injection with XML-tagged template separation
- `PersonalizationContext` interface: Typed context for all personalization calls
- Commit: `9dcde09`

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Single provider (OpenAI) for MVP | Multi-provider routing adds complexity; GPT-4o-mini is sufficient |
| Removed `compatibility: 'strict'` option | Not available in @ai-sdk/openai v3.0.25 API |
| MODERATE rewrite in both system and user prompt | Dual enforcement prevents LLM from ignoring single instruction |
| XML tags for template separation | Defends against prompt injection in user-provided templates |
| Touch-specific prompt hints | Campaign progression needs different tone per touch number |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed invalid `compatibility: 'strict'` option**
- **Found during:** Task 2
- **Issue:** Plan specified `compatibility: 'strict'` in createOpenAI options, but `OpenAIProviderSettings` in @ai-sdk/openai v3.0.25 does not include this property
- **Fix:** Removed the property; provider works correctly without it
- **Files modified:** lib/ai/client.ts
- **Commit:** 7cabe6c

## Verification

- `pnpm typecheck` passes cleanly
- `pnpm lint` passes cleanly
- `lib/ai/client.ts` exports `getModel`, `DEFAULT_MODEL`, `openai`
- `lib/ai/prompts.ts` exports `EMAIL_SYSTEM_PROMPT`, `SMS_SYSTEM_PROMPT`, `buildPersonalizationPrompt`, `PersonalizationContext`, `TOUCH_PROMPTS`
- REWRITE_LEVEL includes "MODERATE" and "Do not invent details"

## Next Phase Readiness

Plan 25-02 (Output Schemas) can proceed immediately. It will import from `lib/ai/prompts.ts` and define Zod schemas for structured LLM output validation.
