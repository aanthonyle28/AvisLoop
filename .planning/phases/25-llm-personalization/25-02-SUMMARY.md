---
phase: 25-llm-personalization
plan: 02
subsystem: ai-validation
tags: [zod, validation, sanitization, llm, prompt-injection, compliance]
dependency-graph:
  requires: []
  provides: [ai-schemas, input-sanitization, output-validation]
  affects: [25-03, 25-04, 25-05]
tech-stack:
  added: []
  patterns: [discriminated-union-schema, fail-fast-validation, input-sanitization]
key-files:
  created:
    - lib/ai/schemas.ts
    - lib/ai/validation.ts
  modified: []
decisions:
  - id: sms-160-char-limit
    description: SMS output capped at 160 chars (single segment); opt-out text appended separately
  - id: discriminated-union
    description: PersonalizedMessageSchema uses Zod discriminatedUnion on channel field for single-parse validation
  - id: fail-fast-validation
    description: validateOutput returns on first failure for performance
  - id: base64-detection
    description: Input sanitization detects and truncates base64-encoded content as prompt injection evasion
  - id: 2x-template-length
    description: Output length capped at 2x original template length to prevent LLM verbosity
metrics:
  duration: ~5 min
  completed: 2026-02-04
---

# Phase 25 Plan 02: Zod Schemas and Validation Utilities Summary

**One-liner:** Zod schemas for structured LLM output with triple-layer defense: input sanitization against prompt injection, output validation for compliance and security.

## What Was Done

### Task 1: Zod Schemas for Structured LLM Output (lib/ai/schemas.ts)
- **PersonalizedEmailSchema**: subject (1-200 chars) + body (10-2000 chars)
- **PersonalizedSmsSchema**: body (10-160 chars) for single SMS segment
- **PersonalizedMessageSchema**: discriminated union on `channel` field -- email or SMS with channel-appropriate constraints in a single parse
- **PersonalizationInputSchema**: validates all context fields (template, customer name, business name, service type, touch number, channel, review link, business ID for rate limiting) before LLM call
- All schemas export both const schemas and inferred TypeScript types

### Task 2: Input Sanitization and Output Validation (lib/ai/validation.ts)
- **sanitizeInput()**: Removes prompt injection phrases (ignore instructions, system/assistant/user role prefixes, jailbreak, DAN mode, pretend), detects base64-encoded payloads, strips angle brackets, enforces 500-char limit
- **sanitizeAllInputs()**: Batch sanitization for all customer-controlled fields (name, business, service type, technician, notes)
- **validateOutput()**: Fail-fast 7-check pipeline:
  1. Review link present (critical)
  2. Business name present (critical)
  3. Length within 2x template (critical)
  4. No HTML/script tags (security)
  5. No unknown URLs (security)
  6. No prohibited content -- incentives, fake urgency, pressure tactics, false claims (compliance)
  7. No unresolved template tokens (quality)
- **hasOptOutLanguage()**: SMS opt-out detection for separate append logic
- All validation under 50ms budget target

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| SMS 160-char limit | Single segment keeps costs predictable; opt-out text appended separately after LLM output |
| Discriminated union schema | Single `PersonalizedMessageSchema.parse()` call handles both channels with appropriate constraints |
| Fail-fast validation | Return on first failure for performance; order: critical > security > compliance |
| Base64 detection | Common prompt injection evasion technique; truncate suspicious base64 strings |
| 2x template length cap | Prevents LLM from generating excessively long outputs while allowing moderate rewriting |
| Prohibited patterns baked in | 14 regex patterns for incentives, urgency, pressure, false claims -- hard-coded for zero-latency |

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| 14b890e | feat(25-02): add Zod schemas for LLM personalization output |
| dde51f4 | feat(25-02): add input sanitization and output validation for LLM |

## Next Phase Readiness

Plan 25-03 (Prompt Templates) can import from `lib/ai/schemas.ts` for type definitions. Plan 25-04 (Personalization Function) will use both schemas and validation utilities.

Key integration points:
- `PersonalizationInputSchema` validates context before prompt building (25-03)
- `sanitizeAllInputs()` called before prompt assembly (25-04)
- `validateOutput()` called after LLM response parsed (25-04)
- `PersonalizedMessageSchema` validates LLM structured output (25-04)
