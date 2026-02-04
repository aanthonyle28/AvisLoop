import { createOpenAI } from '@ai-sdk/openai'

// Initialize OpenAI provider
// API key from env var, never exposed to client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Default model for personalization
// GPT-4o-mini: Fast, cheap ($0.15/1M input, $0.60/1M output), good quality
export const DEFAULT_MODEL = 'gpt-4o-mini'

// Model selection helper
export function getModel(modelId: string = DEFAULT_MODEL) {
  return openai(modelId)
}

// Export provider for direct access if needed
export { openai }
