'use client'

import { useActionState } from 'react'
import { updateBusiness, type BusinessActionState } from '@/lib/actions/business'
import type { Business, MessageTemplate } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BusinessSettingsFormProps {
  initialData: Business | null
  templates: MessageTemplate[]
}

function FormField({ label, required, children, error, hint }: {
  label: string
  required?: boolean
  children: React.ReactNode
  error?: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p role="alert" className="text-destructive text-xs">{error}</p>}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

export function BusinessSettingsForm({ initialData, templates }: BusinessSettingsFormProps) {
  const [state, formAction, isPending] = useActionState<BusinessActionState | null, FormData>(
    updateBusiness,
    null
  )

  const isWebDesign = initialData?.client_type === 'web_design' || initialData?.client_type === 'both'

  return (
    <form action={formAction} className="space-y-8">
      {/* Status messages */}
      {state?.error && (
        <div role="alert" className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg text-sm">
          Settings saved successfully!
        </div>
      )}

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Business Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Business Name" required error={state?.fieldErrors?.name?.[0]}>
            <Input name="name" required defaultValue={initialData?.name || ''} placeholder="Your Business Name" />
          </FormField>

          <FormField label="Phone Number" error={state?.fieldErrors?.phone?.[0]}>
            <Input name="phone" type="tel" defaultValue={initialData?.phone || ''} placeholder="(555) 123-4567" />
          </FormField>
        </div>

        <FormField
          label="Google Review Link"
          error={state?.fieldErrors?.googleReviewLink?.[0]}
          hint="Your Google Business Profile 'Write a review' link"
        >
          <Input name="googleReviewLink" type="url" defaultValue={initialData?.google_review_link || ''} placeholder="https://search.google.com/local/writereview?placeid=..." />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Default Sender Name"
            error={state?.fieldErrors?.defaultSenderName?.[0]}
            hint="Appears in review request emails"
          >
            <Input name="defaultSenderName" defaultValue={initialData?.default_sender_name || ''} placeholder="Your Name or Business Name" />
          </FormField>

          <FormField label="Default Email Template" error={state?.fieldErrors?.defaultTemplateId?.[0]}>
            <select
              name="defaultTemplateId"
              defaultValue={initialData?.default_template_id || ''}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_default ? '(System)' : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Web Design Details — only for web_design / both client types */}
      {isWebDesign && (
        <div className="space-y-4 pt-2 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Client Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Owner Name" error={state?.fieldErrors?.ownerName?.[0]}>
              <Input name="ownerName" defaultValue={initialData?.owner_name || ''} placeholder="John Smith" />
            </FormField>

            <FormField label="Owner Email" error={state?.fieldErrors?.ownerEmail?.[0]}>
              <Input name="ownerEmail" type="email" defaultValue={initialData?.owner_email || ''} placeholder="john@example.com" />
            </FormField>

            <FormField label="Owner Phone" error={state?.fieldErrors?.ownerPhone?.[0]}>
              <Input name="ownerPhone" type="tel" defaultValue={initialData?.owner_phone || ''} placeholder="(555) 123-4567" />
            </FormField>
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Web Presence</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Domain" error={state?.fieldErrors?.domain?.[0]}>
              <Input name="domain" defaultValue={initialData?.domain || ''} placeholder="example.com" />
            </FormField>

            <FormField label="Live Website URL" error={state?.fieldErrors?.liveWebsiteUrl?.[0]}>
              <Input name="liveWebsiteUrl" type="url" defaultValue={initialData?.live_website_url || ''} placeholder="https://example.com" />
            </FormField>

            <FormField label="Vercel Project URL" error={state?.fieldErrors?.vercelProjectUrl?.[0]}>
              <Input name="vercelProjectUrl" type="url" defaultValue={initialData?.vercel_project_url || ''} placeholder="https://vercel.com/..." />
            </FormField>
          </div>
        </div>
      )}

      {/* Hidden fields for web design clients that aren't web_design type — still need to be submitted */}
      {!isWebDesign && (
        <>
          <input type="hidden" name="ownerName" value="" />
          <input type="hidden" name="ownerEmail" value="" />
          <input type="hidden" name="ownerPhone" value="" />
          <input type="hidden" name="domain" value="" />
          <input type="hidden" name="liveWebsiteUrl" value="" />
          <input type="hidden" name="vercelProjectUrl" value="" />
        </>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
