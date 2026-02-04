import { MessageTemplate, ServiceType, MessageChannel } from '@/lib/types/database'

/**
 * Default message templates for review requests.
 * These constants mirror the database INSERTs from migration 20260203_rename_to_message_templates.sql
 * and are used for:
 * - UI display of default templates
 * - Template copy operations
 * - Fallback if database query fails
 */

// Email templates (8 service types)
const EMAIL_TEMPLATES: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    business_id: null,
    name: 'HVAC Service Review',
    channel: 'email',
    service_type: 'hvac',
    subject: 'How was your AC/heating service, {{CUSTOMER_NAME}}?',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for choosing {{BUSINESS_NAME}} for your HVAC service! We hope your home is now perfectly comfortable.

We'd love to hear about your experience. Your feedback helps us continue providing excellent heating and cooling services.

Leave a review here: {{REVIEW_LINK}}

Thanks for your trust in us,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Plumbing Service Review',
    channel: 'email',
    service_type: 'plumbing',
    subject: 'Quick feedback on your plumbing service?',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for trusting {{BUSINESS_NAME}} with your plumbing needs! We hope everything is flowing smoothly now.

Your feedback means a lot to us and helps other homeowners find reliable plumbing service.

Share your experience: {{REVIEW_LINK}}

Thanks for choosing us,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Electrical Service Review',
    channel: 'email',
    service_type: 'electrical',
    subject: 'Your electrical work is complete - quick question?',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for choosing {{BUSINESS_NAME}} for your electrical work! Your safety and satisfaction are our top priorities.

We'd appreciate hearing about your experience. Your review helps us maintain the highest standards.

Leave a review here: {{REVIEW_LINK}}

Best regards,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Cleaning Service Review',
    channel: 'email',
    service_type: 'cleaning',
    subject: 'Sparkling clean! How did we do?',
    body: `Hi {{CUSTOMER_NAME}},

We hope your space is looking and feeling fresh after our visit! Thank you for choosing {{BUSINESS_NAME}}.

We pay attention to every detail, and your feedback helps us keep improving.

Share your thoughts: {{REVIEW_LINK}}

Thank you,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Roofing Service Review',
    channel: 'email',
    service_type: 'roofing',
    subject: 'Roof work finished - your thoughts?',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for trusting {{BUSINESS_NAME}} with your roof! We take pride in protecting your home with quality workmanship.

Your feedback helps other homeowners make informed decisions about their roofing needs.

Leave a review: {{REVIEW_LINK}}

Best regards,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Painting Service Review',
    channel: 'email',
    service_type: 'painting',
    subject: 'Fresh paint! How does it look?',
    body: `Hi {{CUSTOMER_NAME}},

We hope you're enjoying your freshly painted space! Thank you for choosing {{BUSINESS_NAME}} to transform your home.

Your review helps us continue delivering beautiful results for homeowners like you.

Share your experience: {{REVIEW_LINK}}

Thank you,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Handyman Service Review',
    channel: 'email',
    service_type: 'handyman',
    subject: 'Your repairs are done - how did we do?',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for calling {{BUSINESS_NAME}} to get things done! We hope everything is working just as it should.

Your feedback helps us continue providing dependable handyman services.

Leave a review: {{REVIEW_LINK}}

Thanks again,
{{SENDER_NAME}}`,
    is_default: true,
  },
  {
    business_id: null,
    name: 'Service Review Request',
    channel: 'email',
    service_type: 'other',
    subject: 'We\'d love your feedback!',
    body: `Hi {{CUSTOMER_NAME}},

Thank you for choosing {{BUSINESS_NAME}}! We appreciate your trust in our services.

Your feedback is valuable and helps us serve you and others better.

Share your experience: {{REVIEW_LINK}}

Best regards,
{{SENDER_NAME}}`,
    is_default: true,
  },
]

// SMS templates (8 service types - all under 140 chars for single-segment delivery)
const SMS_TEMPLATES: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    business_id: null,
    name: 'HVAC Service SMS',
    channel: 'sms',
    service_type: 'hvac',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}} for HVAC! We\'d love your feedback. Reply YES for review link.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Plumbing Service SMS',
    channel: 'sms',
    service_type: 'plumbing',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, your plumbing work is done! How\'d we do? Reply YES to share feedback on {{BUSINESS_NAME}}.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Electrical Service SMS',
    channel: 'sms',
    service_type: 'electrical',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, electrical work complete! Your feedback helps us serve you better. Reply YES for review link - {{BUSINESS_NAME}}',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Cleaning Service SMS',
    channel: 'sms',
    service_type: 'cleaning',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, hope your space is sparkling! Quick feedback on {{BUSINESS_NAME}}? Reply YES for review link.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Roofing Service SMS',
    channel: 'sms',
    service_type: 'roofing',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, roof work finished! We\'d appreciate your thoughts on {{BUSINESS_NAME}}. Reply YES for review link.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Painting Service SMS',
    channel: 'sms',
    service_type: 'painting',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, fresh paint done! How does it look? Reply YES to share feedback on {{BUSINESS_NAME}}.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Handyman Service SMS',
    channel: 'sms',
    service_type: 'handyman',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, repairs complete! How\'d {{BUSINESS_NAME}} do? Reply YES for review link.',
    is_default: true,
  },
  {
    business_id: null,
    name: 'Service SMS',
    channel: 'sms',
    service_type: 'other',
    subject: '',
    body: 'Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}}! We\'d love your feedback. Reply YES for review link.',
    is_default: true,
  },
]

// Combined array of all 16 default templates
export const DEFAULT_MESSAGE_TEMPLATES: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  ...EMAIL_TEMPLATES,
  ...SMS_TEMPLATES,
]

/**
 * Get default templates filtered by channel
 */
export function getDefaultTemplatesByChannel(channel: MessageChannel): Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] {
  return DEFAULT_MESSAGE_TEMPLATES.filter((t) => t.channel === channel)
}

/**
 * Get default templates filtered by service type
 */
export function getDefaultTemplatesByServiceType(serviceType: ServiceType): Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>[] {
  return DEFAULT_MESSAGE_TEMPLATES.filter((t) => t.service_type === serviceType)
}

/**
 * Get a specific default template by channel and service type
 */
export function getDefaultTemplate(
  channel: MessageChannel,
  serviceType: ServiceType
): Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'> | undefined {
  return DEFAULT_MESSAGE_TEMPLATES.find((t) => t.channel === channel && t.service_type === serviceType)
}
