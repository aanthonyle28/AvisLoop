'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { messageTemplateSchema } from '@/lib/validations/message-template'

export type MessageTemplateActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }
}

/**
 * Create a new message template for the user's business.
 *
 * @param _prevState - Previous action state. Required by React's useActionState
 *   progressive enhancement pattern but not used in this action.
 * @param formData - Form data containing template fields
 */
export async function createMessageTemplate(
  _prevState: MessageTemplateActionState | null,
  formData: FormData
): Promise<MessageTemplateActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create templates' }
  }

  // Get user's business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Parse form data
  const channel = formData.get('channel') as string
  const rawData = {
    channel,
    name: formData.get('name'),
    subject: channel === 'sms' ? '' : formData.get('subject'),
    body: formData.get('body'),
  }

  // Validate using discriminated union schema
  const parsed = messageTemplateSchema.safeParse(rawData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, subject, body } = parsed.data

  // Insert new template
  const { data: newTemplate, error } = await supabase
    .from('message_templates')
    .insert({
      business_id: business.id,
      name,
      subject: subject || '',
      body,
      channel,
      is_default: false,
      service_type: null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true, data: { id: newTemplate.id } }
}

/**
 * Update an existing message template.
 *
 * @param templateId - The ID of the template to update
 * @param _prevState - Previous action state. Required by React's useActionState
 *   progressive enhancement pattern but not used in this action.
 * @param formData - Form data containing updated template fields
 */
export async function updateMessageTemplate(
  templateId: string,
  _prevState: MessageTemplateActionState | null,
  formData: FormData
): Promise<MessageTemplateActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Verify template exists and belongs to user (RLS handles security)
  const { data: template } = await supabase
    .from('message_templates')
    .select('id, is_default, channel')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  if (template.is_default) {
    return { error: 'Cannot edit system templates. Use "Copy" to create an editable version.' }
  }

  // Parse and validate
  const channel = template.channel // Channel cannot change
  const rawData = {
    channel,
    name: formData.get('name'),
    subject: channel === 'sms' ? '' : formData.get('subject'),
    body: formData.get('body'),
  }

  const parsed = messageTemplateSchema.safeParse(rawData)
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, subject, body } = parsed.data

  const { error } = await supabase
    .from('message_templates')
    .update({ name, subject: subject || '', body })
    .eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Delete a message template.
 * Only allows deleting user's own non-default templates.
 */
export async function deleteMessageTemplate(
  templateId: string
): Promise<MessageTemplateActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Check if template is a default (RLS handles ownership)
  const { data: template } = await supabase
    .from('message_templates')
    .select('is_default')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  if (template.is_default) {
    return { error: 'Cannot delete system templates' }
  }

  const { error } = await supabase
    .from('message_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Create a copy of a system template that the user can edit.
 * Used for "Use this template" flow.
 */
export async function copySystemTemplate(
  templateId: string,
  newName?: string
): Promise<MessageTemplateActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  // Get the template to copy
  const { data: original } = await supabase
    .from('message_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!original) {
    return { error: 'Template not found' }
  }

  // Create copy with user's business_id
  const { data: copy, error } = await supabase
    .from('message_templates')
    .insert({
      business_id: business.id,
      name: newName || `${original.name} (Copy)`,
      subject: original.subject,
      body: original.body,
      channel: original.channel,
      is_default: false,
      service_type: original.service_type,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true, data: { id: copy.id } }
}
