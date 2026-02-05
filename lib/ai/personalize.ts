import { generateObject } from 'ai'
import { getModelForTask, inferModelTask, type ModelTask } from './client'
import {
  EMAIL_SYSTEM_PROMPT,
  SMS_SYSTEM_PROMPT,
  buildPersonalizationPrompt,
  type PersonalizationContext,
} from './prompts'
import {
  PersonalizedEmailSchema,
  PersonalizedSmsSchema,
  type PersonalizedEmail,
  type PersonalizedSms,
} from './schemas'
import { sanitizeAllInputs, validateOutput } from './validation'

export type PersonalizeResult = {
  message: string
  subject?: string // Only for email
  personalized: boolean
  model?: string
}

/**
 * Personalize a message using LLM.
 * Returns structured output validated against Zod schema.
 *
 * This is the raw LLM call - no fallback handling here.
 * Use personalizeWithFallback() for production code.
 *
 * @throws Error on LLM failure, validation failure, or timeout
 */
export async function personalizeMessage(
  ctx: PersonalizationContext,
  options?: {
    task?: ModelTask
    modelOverride?: { model: ReturnType<typeof getModelForTask>['model']; modelId: string }
  }
): Promise<PersonalizeResult> {
  // Determine which model to use (auto-inferred or explicit)
  const task = options?.task ?? inferModelTask(ctx.channel, ctx.touchNumber)
  const { model, modelId } = options?.modelOverride ?? getModelForTask(task)

  // Sanitize all user-controlled inputs
  const sanitized = sanitizeAllInputs({
    customerName: ctx.customerName,
    businessName: ctx.businessName,
    serviceType: ctx.serviceType,
    technicianName: ctx.technicianName,
  })

  // Build context with sanitized inputs
  const sanitizedCtx: PersonalizationContext = {
    ...ctx,
    ...sanitized,
  }

  // Select system prompt based on channel
  const systemPrompt =
    ctx.channel === 'email' ? EMAIL_SYSTEM_PROMPT : SMS_SYSTEM_PROMPT

  // Select schema based on channel
  const schema =
    ctx.channel === 'email' ? PersonalizedEmailSchema : PersonalizedSmsSchema

  // Build user prompt
  const userPrompt = buildPersonalizationPrompt(sanitizedCtx)

  // Call LLM with structured output
  const { object, finishReason } = await generateObject({
    model,
    schema,
    system: systemPrompt,
    prompt: userPrompt,
    maxRetries: 1, // AI SDK internal retry (schema correction)
  })

  // Check finish reason
  if (finishReason === 'length') {
    throw new Error('LLM output truncated (length limit)')
  }

  // Extract message based on channel
  if (ctx.channel === 'email') {
    const email = object as PersonalizedEmail

    // Validate output
    const validation = validateOutput(email.body, {
      reviewLink: ctx.reviewLink,
      businessName: ctx.businessName,
      templateLength: ctx.template.length,
      channel: 'email',
    })

    if (!validation.valid) {
      throw new Error(`Output validation failed: ${validation.reason}`)
    }

    return {
      subject: email.subject,
      message: email.body,
      personalized: true,
      model: modelId,
    }
  } else {
    const sms = object as PersonalizedSms

    // Validate output
    const validation = validateOutput(sms.body, {
      reviewLink: ctx.reviewLink,
      businessName: ctx.businessName,
      templateLength: ctx.template.length,
      channel: 'sms',
    })

    if (!validation.valid) {
      throw new Error(`Output validation failed: ${validation.reason}`)
    }

    return {
      message: sms.body,
      personalized: true,
      model: modelId,
    }
  }
}
