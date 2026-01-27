// Database table types for businesses and email_templates
// These types match the schema in supabase/migrations/00002_create_business.sql

export interface Business {
  id: string
  user_id: string
  name: string
  google_review_link: string | null
  default_sender_name: string | null
  default_template_id: string | null
  tier: 'basic' | 'pro' | 'trial'
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

export interface Contact {
  id: string
  business_id: string
  name: string
  email: string
  phone: string | null
  status: 'active' | 'archived'
  opted_out: boolean
  last_sent_at: string | null
  send_count: number
  created_at: string
  updated_at: string
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'last_sent_at' | 'send_count'>
export type ContactUpdate = Partial<Omit<Contact, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

export interface SendLog {
  id: string
  business_id: string
  contact_id: string
  template_id: string | null
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'
  provider_id: string | null
  error_message: string | null
  subject: string
  created_at: string
  updated_at: string
}

export type SendLogInsert = Omit<SendLog, 'id' | 'created_at' | 'updated_at' | 'provider_id' | 'error_message'>
export type SendLogUpdate = Partial<Pick<SendLog, 'status' | 'provider_id' | 'error_message'>>

// Combined type for send history display with contact info
export interface SendLogWithContact extends SendLog {
  contacts: Pick<Contact, 'name' | 'email'>
}
