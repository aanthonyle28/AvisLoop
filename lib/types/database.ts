// Database table types for businesses and email_templates
// These types match the schema in supabase/migrations/00002_create_business.sql

export interface Business {
  id: string
  user_id: string
  name: string
  google_review_link: string | null
  default_sender_name: string | null
  default_template_id: string | null
  created_at: string
  updated_at: string
}

export interface EmailTemplate {
  id: string
  business_id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// Combined type for business with nested templates (from Supabase joins)
export interface BusinessWithTemplates extends Business {
  email_templates: EmailTemplate[]
}

// Insert/Update types (omit auto-generated fields)
export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type EmailTemplateInsert = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
export type EmailTemplateUpdate = Partial<Omit<EmailTemplate, 'id' | 'business_id' | 'created_at' | 'updated_at'>>
