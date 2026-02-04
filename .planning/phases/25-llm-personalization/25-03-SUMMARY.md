---
phase: 25-llm-personalization
plan: 03
subsystem: ai-personalization
tags: [llm, rate-limiting, fallback, retry, exponential-backoff, openai]
depends_on:
  requires: ["25-01", "25-02"]
  provides: ["personalizeMessage", "personalizeWithFallback", "checkLLMRateLimit", "LLMRateLimitError", "PersonalizeResult", "FallbackReason"]
  affects: ["25-04", "25-05", "25-06", "25-07"]
tech-stack:
  added: []
  patterns: ["fallback chain", "exponential backoff with jitter", "rate limiting per business", "structured LLM output"]
key-files:
  created:
    - lib/ai/rate-limit.ts
    - lib/ai/personalize.ts
    - lib/ai/fallback.ts
  modified: []
decisions:
  - id: llm-rate-limit-100
    decision: "100 LLM calls/hour per business via Upstash sliding window"
    reason: "Prevents runaway costs while allowing reasonable personalization volume"
  - id: 3s-timeout
    decision: "3-second timeout for LLM calls"
    reason: "Balances quality vs responsiveness; fast fallback to template"
  - id: 2-retry-attempts
    decision: "Max 2 attempts with 500ms/1000ms exponential backoff + full jitter"
    reason: "Handles transient errors without excessive delay"
  - id: never-throw-fallback
    decision: "personalizeWithFallback never throws; always returns template on failure"
    reason: "LLM failures must never block message sending"
  - id: validation-no-retry
    decision: "Validation failures trigger immediate fallback (no retry)"
    reason: "Output validation failure unlikely to succeed on retry"
  - id: default-model-from-client
    decision: "Use DEFAULT_MODEL constant from client.ts rather than hardcoded string"
    reason: "Single source of truth for model selection"
metrics:
  duration: "~3 minutes"
  completed: "2026-02-04"
---

# Phase 25 Plan 03: Core Personalization & Fallback Chain Summary

JWT-style rate limiting at 100 calls/hour per business, structured LLM output via AI SDK generateObject, and a never-throw fallback chain with 3s timeout and exponential backoff retry logic.

## What Was Built

### lib/ai/rate-limit.ts
- `checkLLMRateLimit(businessId)` - Checks and decrements rate limit, throws `LLMRateLimitError` if exceeded
- `getLLMUsage(businessId)` - Read-only usage check for analytics/UI without decrementing
- `LLMRateLimitError` - Custom error class with businessId, remaining count, and resetAt date
- Lazy-initialized Upstash Ratelimit with sliding window (100 requests per 1 hour)
- Dev mode bypass when Redis not configured (returns remaining: 999)

### lib/ai/personalize.ts
- `personalizeMessage(ctx)` - Core LLM call via `generateObject` with Zod schema validation
- Input sanitization via `sanitizeAllInputs()` before prompt construction
- Output validation via `validateOutput()` after LLM response
- Channel-specific handling: email returns subject + body, SMS returns body only
- Throws on any failure (retry/fallback handled externally by fallback.ts)

### lib/ai/fallback.ts
- `personalizeWithFallback(ctx)` - Production-ready wrapper that never throws
- Pre-checks: missing critical fields (reviewLink, customerName, businessName) trigger immediate fallback
- Rate limit check before LLM call prevents unnecessary API calls when limit exceeded
- 3-second timeout wraps the LLM call
- Exponential backoff with full jitter: 2 attempts max, 500ms starting delay, 2x multiplier
- Retry only on transient errors (timeout, 429, 5xx); validation failures skip retry
- Error classification into FallbackReason enum for analytics
- `personalizePreviewBatch(contexts)` - Concurrent batch personalization with configurable concurrency (default 3)

## lib/ai/ Module Status

All 7 files complete (from 25-01, 25-02, and 25-03):

| File | Purpose | Status |
|------|---------|--------|
| client.ts | AI SDK OpenAI provider | 25-01 |
| prompts.ts | System prompts + prompt builder | 25-01 |
| schemas.ts | Zod schemas for structured output | 25-02 |
| validation.ts | Input sanitization + output validation | 25-02 |
| rate-limit.ts | Per-business LLM rate limiting | 25-03 |
| personalize.ts | Core LLM personalization function | 25-03 |
| fallback.ts | Fallback chain with retry logic | 25-03 |

## Decisions Made

1. **100 calls/hour rate limit** - Matches CONTEXT.md specification. Uses Upstash sliding window with `ratelimit:llm` prefix (separate from existing `ratelimit:send` and `ratelimit:webhook`).

2. **3-second timeout** - From CONTEXT.md auto-fallback triggers. GPT-4o-mini typically responds in 1-2s for short messages, so 3s provides headroom without excessive wait.

3. **2 retry attempts with jitter** - Initial + 1 retry. Full jitter prevents thundering herd when many messages process simultaneously. Validation failures skip retry since they are deterministic.

4. **Never-throw fallback pattern** - `personalizeWithFallback()` always returns a result. Errors are classified into `FallbackReason` for analytics. Template is the universal fallback.

5. **DEFAULT_MODEL from client.ts** - Instead of hardcoding `'gpt-4o-mini'` string in results, uses the `DEFAULT_MODEL` constant for single source of truth.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `pnpm typecheck` - PASS (zero errors)
- `pnpm lint` - PASS (zero warnings on lib/ai/)

## Commits

| Commit | Description |
|--------|-------------|
| 6e6a9da | feat(25-03): create LLM rate limiting for personalization |
| f9ad8c3 | feat(25-03): create core personalization function with structured output |
| f2bf485 | feat(25-03): create fallback chain with retry logic for LLM personalization |

## Next Phase Readiness

The lib/ai/ module is now complete and ready for integration:
- **25-04** (Integration with campaign touch processor) can import `personalizeWithFallback`
- **25-05** (Preview API) can import `personalizePreviewBatch`
- **25-06/25-07** (UI components) will consume the preview API
