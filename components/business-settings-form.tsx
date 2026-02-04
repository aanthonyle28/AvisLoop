'use client'

import { useActionState } from 'react'
import { updateBusiness, type BusinessActionState } from '@/lib/actions/business'
import type { Business, MessageTemplate } from '@/lib/types/database'
import { Button } from '@/components/ui/button'

interface BusinessSettingsFormProps {
  initialData: Business | null
  templates: MessageTemplate[]
}

export function BusinessSettingsForm({ initialData, templates }: BusinessSettingsFormProps) {
  const [state, formAction, isPending] = useActionState<BusinessActionState | null, FormData>(
    updateBusiness,
    null
  )

  return (
    <form action={formAction} className="space-y-6">
      {/* General error */}
      {state?.error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded">
          {state.error}
        </div>
      )}

      {/* Success message */}
      {state?.success && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded">
          Settings saved successfully!
        </div>
      )}

      {/* Business Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={initialData?.name || ''}
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Your Business Name"
        />
        {state?.fieldErrors?.name && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Google Review Link */}
      <div>
        <label htmlFor="googleReviewLink" className="block text-sm font-medium text-foreground mb-1">
          Google Review Link
        </label>
        <input
          type="url"
          id="googleReviewLink"
          name="googleReviewLink"
          defaultValue={initialData?.google_review_link || ''}
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="https://search.google.com/local/writereview?placeid=..."
        />
        {state?.fieldErrors?.googleReviewLink && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.googleReviewLink[0]}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Find your Google Business Profile and copy the &quot;Write a review&quot; link
        </p>
      </div>

      {/* Default Sender Name */}
      <div>
        <label htmlFor="defaultSenderName" className="block text-sm font-medium text-foreground mb-1">
          Default Sender Name
        </label>
        <input
          type="text"
          id="defaultSenderName"
          name="defaultSenderName"
          defaultValue={initialData?.default_sender_name || ''}
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Your Name or Business Name"
        />
        {state?.fieldErrors?.defaultSenderName && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.defaultSenderName[0]}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          This name will appear in your review request emails
        </p>
      </div>

      {/* Default Template Selection */}
      <div>
        <label htmlFor="defaultTemplateId" className="block text-sm font-medium text-foreground mb-1">
          Default Email Template
        </label>
        <select
          id="defaultTemplateId"
          name="defaultTemplateId"
          defaultValue={initialData?.default_template_id || ''}
          className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} {template.is_default ? '(Default)' : ''}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.defaultTemplateId && (
          <p className="text-red-600 text-sm mt-1">{state.fieldErrors.defaultTemplateId[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
