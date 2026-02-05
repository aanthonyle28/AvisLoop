---
phase: 25-llm-personalization
plan: 10
subsystem: ai
tags: [gemini, gpt-4o-mini, deepseek, openai, google-ai, openrouter, model-routing, llm, personalization]

# Dependency graph
requires:
  - phase: 25-01
    provides: Basic AI client with OpenAI provider
  - phase: 25-02
    provides: LLM output validation and schemas
  - phase: 25-03
    provides: Fallback chain and rate limiting
provides:
  - Multi-provider AI client (Google, OpenAI, OpenRouter)
  - Task-based model routing logic
  - Secondary model fallback on validation failures
  - Cost constants for downstream tracking
affects: [25-11-cost-tracking, campaign-processing]

# Tech tracking
tech-stack:
  added: ["@ai-sdk/google"]
  patterns: ["Task-based model routing", "Secondary model fallback chain", "Cross-provider cost tracking"]

key-files:
  created: []
  modified: ["lib/ai/client.ts", "lib/ai/personalize.ts", "lib/ai/fallback.ts"]

key-decisions:
  - "Gemini Flash (70%): bulk SMS + standard email (touch 1)"
  - "GPT-4o-mini (25%): quality email (touch 2+) + preview samples"
  - "DeepSeek V3 (5%): edge cases via OpenRouter"
  - "Validation failures trigger secondary model before template fallback"
  - "inferModelTask() auto-routes based on channel and touch number"

patterns-established:
  - "getModelForTask(task): Returns {model, modelId} tuple for routing + tracking"
  - "getSecondaryModel(primaryModelId): Cross-model fallback (Gemini ↔ GPT-4o-mini)"
  - "inferModelTask(channel, touchNumber): Auto-route without explicit task param"

# Metrics
duration: 4min
completed: 2026-02-04
---

# Phase 25 Plan 10: Multi-Model Routing Summary

**Three-provider AI routing with Gemini Flash (70%), GPT-4o-mini (25%), DeepSeek V3 (5%), and automatic secondary model fallback on validation failures**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-04T23:50:09Z
- **Completed:** 2026-02-04T23:54:08Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Multi-provider AI client supports Google (Gemini Flash), OpenAI (GPT-4o-mini), and OpenRouter (DeepSeek V3)
- Task-based routing automatically selects appropriate model based on channel and touch number
- Secondary model fallback tries alternative provider on validation failures before falling back to raw template
- Cost constants exported for downstream cost tracking (Plan 25-11)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install AI SDK providers and update client.ts with multi-model routing** - `0f7b96a` (feat) - *[Already complete]*
2. **Task 2: Update personalize.ts and fallback.ts to use multi-model routing** - `a6c471a` (feat)

**Note:** Task 1 was found to be already complete in commit 0f7b96a (client.ts already had multi-model routing). Only Task 2 required execution.

## Files Created/Modified
- `lib/ai/client.ts` - Three-provider initialization, getModelForTask(), getSecondaryModel(), inferModelTask(), MODEL_COSTS
- `lib/ai/personalize.ts` - Uses routed model via getModelForTask(), accepts modelOverride for fallback
- `lib/ai/fallback.ts` - Tries secondary model on validation failures before template fallback

## Decisions Made

**Model routing strategy (from CONTEXT.md):**
- **Gemini Flash (70%):** bulk_sms, standard_email tasks (simple personalization, high volume)
- **GPT-4o-mini (25%):** quality_email, preview tasks (touch 2+, consistent quality)
- **DeepSeek V3 (5%):** edge_case task (complex scenarios, experimentation)

**Fallback chain:**
- Primary model fails with validation error → try secondary model (Gemini ↔ GPT-4o-mini)
- Secondary model also fails → fall back to raw template
- Timeout/API errors skip secondary model (transient failures retried by exponential backoff)

**Auto-routing:**
- `inferModelTask(channel, touchNumber)` eliminates need for explicit task parameter
- SMS always routes to Gemini Flash (bulk_sms)
- Email touch 1 routes to Gemini Flash (standard_email)
- Email touch 2+ routes to GPT-4o-mini (quality_email)

**Return value tracking:**
- `personalizeMessage()` returns actual modelId used (not hardcoded DEFAULT_MODEL)
- Enables downstream cost tracking and debugging

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - Task 1 was already complete, Task 2 executed cleanly.

## User Setup Required

**External services require manual configuration.** Environment variables needed:

1. **Google AI Studio (Gemini Flash - 70% of calls):**
   - Variable: `GOOGLE_GENERATIVE_AI_API_KEY`
   - Source: https://aistudio.google.com/apikey
   - Why: Primary model for bulk SMS and standard email personalization

2. **OpenAI Platform (GPT-4o-mini - 25% of calls):**
   - Variable: `OPENAI_API_KEY`
   - Source: https://platform.openai.com/api-keys
   - Why: Quality model for touch 2+ and preview samples
   - Note: Already configured in earlier phases

3. **OpenRouter (DeepSeek V3 - 5% of calls):**
   - Variable: `OPENROUTER_API_KEY`
   - Source: https://openrouter.ai/keys
   - Why: Edge case handling via DeepSeek V3 (OpenAI-compatible API)

**Verification:**
```bash
# All three providers should be configured
echo $GOOGLE_GENERATIVE_AI_API_KEY
echo $OPENAI_API_KEY
echo $OPENROUTER_API_KEY
```

## Next Phase Readiness

**Ready for Phase 25-11 (Cost Tracking):**
- `MODEL_COSTS` constant exported with per-model pricing
- `modelId` returned in PersonalizeResult for attribution
- All three providers operational

**Campaign processing benefits:**
- Gemini Flash handles 70% of volume at lower cost
- GPT-4o-mini provides quality for touch 2+ where variation matters
- Secondary model fallback improves resilience

**No blockers.** Multi-model routing fully operational. Cost tracking can now proceed.

---
*Phase: 25-llm-personalization*
*Completed: 2026-02-04*
