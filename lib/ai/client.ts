import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// ============================================================
// Provider Initialization (server-only, keys from env)
// ============================================================

// OpenAI provider (GPT-4o-mini) - 25% of calls
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Google AI provider (Gemini Flash) - 70% of calls
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

// OpenRouter provider for DeepSeek V3 - 5% of calls
// Uses OpenAI-compatible API with custom baseURL
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
})

// ============================================================
// Model Constants
// ============================================================

export const MODELS = {
  GEMINI_FLASH: 'gemini-2.0-flash',
  GPT_4O_MINI: 'gpt-4o-mini',
  DEEPSEEK_V3: 'deepseek/deepseek-chat-v3-0324',
} as const

export type ModelId = typeof MODELS[keyof typeof MODELS]

// Cost per 1M tokens (USD) for each model - used by cost tracking (25-11)
export const MODEL_COSTS: Record<ModelId, { input: number; output: number }> = {
  [MODELS.GEMINI_FLASH]: { input: 0.10, output: 0.40 },
  [MODELS.GPT_4O_MINI]: { input: 0.15, output: 0.60 },
  [MODELS.DEEPSEEK_V3]: { input: 0.14, output: 0.28 },
}

// ============================================================
// Model Routing
// ============================================================

/** Task types that determine which model to use */
export type ModelTask =
  | 'bulk_sms'           // Gemini Flash - simple SMS personalization
  | 'standard_email'     // Gemini Flash - standard email personalization
  | 'quality_email'      // GPT-4o-mini - touch 2/3, missing data handling
  | 'preview'            // GPT-4o-mini - preview samples need consistent quality
  | 'edge_case'          // DeepSeek V3 - complex edge cases

/**
 * Route to appropriate model based on task type.
 * Returns AI SDK model instance ready for generateObject/generateText.
 *
 * Routing strategy from CONTEXT.md:
 * - Gemini Flash (70%): Bulk SMS, standard email, simple personalization
 * - GPT-4o-mini (25%): Quality personalization, touch 2/3, preview
 * - DeepSeek V3 (5%): Complex edge cases, experimentation
 */
export function getModelForTask(task: ModelTask) {
  switch (task) {
    case 'bulk_sms':
    case 'standard_email':
      return {
        model: google(MODELS.GEMINI_FLASH),
        modelId: MODELS.GEMINI_FLASH,
      }
    case 'quality_email':
    case 'preview':
      return {
        model: openai(MODELS.GPT_4O_MINI),
        modelId: MODELS.GPT_4O_MINI,
      }
    case 'edge_case':
      return {
        model: openrouter(MODELS.DEEPSEEK_V3),
        modelId: MODELS.DEEPSEEK_V3,
      }
  }
}

/**
 * Get a secondary/fallback model different from the primary.
 * Used when primary model fails validation (try different model before raw template).
 *
 * Fallback chain:
 * - Gemini Flash -> GPT-4o-mini
 * - GPT-4o-mini -> Gemini Flash
 * - DeepSeek V3 -> GPT-4o-mini
 */
export function getSecondaryModel(primaryModelId: ModelId) {
  switch (primaryModelId) {
    case MODELS.GEMINI_FLASH:
      return {
        model: openai(MODELS.GPT_4O_MINI),
        modelId: MODELS.GPT_4O_MINI,
      }
    case MODELS.GPT_4O_MINI:
      return {
        model: google(MODELS.GEMINI_FLASH),
        modelId: MODELS.GEMINI_FLASH,
      }
    case MODELS.DEEPSEEK_V3:
      return {
        model: openai(MODELS.GPT_4O_MINI),
        modelId: MODELS.GPT_4O_MINI,
      }
  }
}

/**
 * Determine task type from personalization context.
 * Used by personalizeMessage() to auto-route.
 */
export function inferModelTask(channel: 'email' | 'sms', touchNumber: 1 | 2 | 3 | 4): ModelTask {
  if (channel === 'sms') {
    return 'bulk_sms'
  }

  // Email: Touch 1 is standard, Touch 2-4 need quality variation
  if (touchNumber >= 2) {
    return 'quality_email'
  }

  return 'standard_email'
}

// Legacy exports for backward compatibility (existing code may use these)
export const DEFAULT_MODEL = MODELS.GPT_4O_MINI

export function getModel(modelId: string = DEFAULT_MODEL) {
  return openai(modelId)
}

export { openai }
