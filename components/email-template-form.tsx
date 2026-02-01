'use client'

import { useActionState } from 'react'
import { createEmailTemplate, type BusinessActionState } from '@/lib/actions/business'

export function EmailTemplateForm() {
  const [state, formAction, isPending] = useActionState<BusinessActionState | null, FormData>(
    createEmailTemplate,
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      {/* General error */}
      {state?.error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Success message */}
      {state?.success && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded">
          Template created successfully!
        </div>
      )}

      {/* Template Name */}
      <div>
        <label htmlFor="template-name" className="block text-sm font-medium text-foreground mb-1">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="template-name"
          name="name"
          required
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="My Custom Template"
        />
        {state?.fieldErrors?.name && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Email Subject */}
      <div>
        <label htmlFor="template-subject" className="block text-sm font-medium text-foreground mb-1">
          Email Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="template-subject"
          name="subject"
          required
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="We would love your feedback, {{CUSTOMER_NAME}}!"
        />
        {state?.fieldErrors?.subject && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.subject[0]}</p>
        )}
      </div>

      {/* Email Body */}
      <div>
        <label htmlFor="template-body" className="block text-sm font-medium text-foreground mb-1">
          Email Body <span className="text-red-500">*</span>
        </label>
        <textarea
          id="template-body"
          name="body"
          required
          rows={8}
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
          placeholder={`Hi {{CUSTOMER_NAME}},

Thank you for choosing {{BUSINESS_NAME}}!

We would really appreciate if you could leave us a review:
{{REVIEW_LINK}}

Best regards,
{{SENDER_NAME}}`}
        />
        {state?.fieldErrors?.body && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.body[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Creating...' : 'Create Template'}
        </button>
      </div>
    </form>
  )
}
