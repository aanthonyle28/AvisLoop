'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { createMessageTemplate, type MessageTemplateActionState } from '@/lib/actions/message-template'
import { useSMSCharacterCounter } from './use-sms-character-counter'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface MessageTemplateFormProps {
  onSuccess?: () => void
}

export function MessageTemplateForm({ onSuccess }: MessageTemplateFormProps) {
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [smsBody, setSmsBody] = useState('')

  const [state, formAction] = useFormState<MessageTemplateActionState | null, FormData>(
    createMessageTemplate,
    null
  )

  const smsCounter = useSMSCharacterCounter(smsBody)

  // Handle success state
  if (state?.success && onSuccess) {
    onSuccess()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Message Template</CardTitle>
        <CardDescription>
          Create a reusable template for email or SMS messages
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {/* Global error message */}
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Channel selector tabs */}
          <Tabs value={channel} onValueChange={(v) => setChannel(v as 'email' | 'sms')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
            </TabsList>

            {/* Hidden input to send channel value */}
            <input type="hidden" name="channel" value={channel} />

            {/* Email tab content */}
            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Follow-up Request"
                  required
                />
                {state?.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="e.g., How was your experience with {{BUSINESS_NAME}}?"
                  required
                />
                {state?.fieldErrors?.subject && (
                  <p className="text-sm text-destructive">{state.fieldErrors.subject[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Hi {{CUSTOMER_NAME}},&#10;&#10;Thank you for choosing {{BUSINESS_NAME}}!&#10;&#10;Click here to leave a review: {{REVIEW_LINK}}"
                  rows={8}
                  required
                />
                {state?.fieldErrors?.body && (
                  <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Available variables: {'{'}{'{'}{'}'}CUSTOMER_NAME{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_NAME{'}'}{'}'}, {'{'}{'{'}{'}'}REVIEW_LINK{'}'}{'}'}, {'{'}{'{'}{'}'}OPT_OUT_LINK{'}'}{'}'}, {'{'}{'{'}{'}'}CONTACT_PHONE{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_PHONE{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_EMAIL{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_ADDRESS{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_CITY{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_STATE{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_ZIP{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_WEBSITE{'}'}{'}'}, {'{'}{'{'}{'}'}SERVICE_TYPE{'}'}{'}'}, {'{'}{'{'}{'}'}COMPLETED_AT{'}'}{'}'}, {'{'}{'{'}{'}'}DAYS_SINCE_SERVICE{'}'}{'}'}, {'{'}{'{'}{'}'}NOTES{'}'}{'}'}, {'{'}{'{'}{'}'}SENDER_NAME{'}'}{'}'}, {'{'}{'{'}{'}'}UNSUBSCRIBE{'}'}{'}'}, {'{'}{'{'}{'}'}CURRENT_YEAR{'}'}{'}'}, {'{'}{'{'}{'}'}SUPPORT_EMAIL{'}'}{'}'}, {'{'}{'{'}{'}'}SUPPORT_PHONE{'}'}{'}'}, {'{'}{'{'}{'}'}LOGO_URL{'}'}{'}'}, {'{'}{'{'}{'}'}HEADER_IMAGE_URL{'}'}{'}'}, {'{'}{'{'}{'}'}FOOTER_TEXT{'}'}{'}'}, {'{'}{'{'}{'}'}SOCIAL_LINKS{'}'}{'}'}, {'{'}{'{'}{'}'}TRACKING_PIXEL{'}'}{'}'}, {'{'}{'{'}{'}'}SENTIMENT{'}'}{'}'}, {'{'}{'{'}{'}'}RATING{'}'}{'}'}, {'{'}{'{'}{'}'}TESTIMONIAL{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_1{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_2{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_3{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_4{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_5{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_6{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_7{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_8{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_9{'}'}{'}'}, {'{'}{'{'}{'}'}CUSTOM_10{'}'}{'}'}
                </p>
              </div>
            </TabsContent>

            {/* SMS tab content */}
            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-name">Template Name</Label>
                <Input
                  id="sms-name"
                  name="name"
                  placeholder="e.g., Quick SMS Follow-up"
                  required
                />
                {state?.fieldErrors?.name && (
                  <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sms-body">SMS Message</Label>
                <Textarea
                  id="sms-body"
                  name="body"
                  placeholder="Hi {{CUSTOMER_NAME}}, thanks for choosing {{BUSINESS_NAME}}!"
                  rows={6}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  required
                />
                {state?.fieldErrors?.body && (
                  <p className="text-sm text-destructive">{state.fieldErrors.body[0]}</p>
                )}

                {/* Character counter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        smsCounter.warning === 'error'
                          ? 'text-destructive'
                          : smsCounter.warning === 'warning'
                          ? 'text-yellow-600 dark:text-yellow-500'
                          : 'text-muted-foreground'
                      }
                    >
                      {smsCounter.length} / {smsCounter.limit} characters ({smsCounter.encoding})
                    </span>
                    <span className="text-muted-foreground">
                      {smsCounter.segments} segment{smsCounter.segments !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {smsCounter.warningMessage && (
                    <p
                      className={
                        smsCounter.warning === 'error'
                          ? 'text-sm text-destructive'
                          : 'text-sm text-yellow-600 dark:text-yellow-500'
                      }
                    >
                      {smsCounter.warningMessage}
                    </p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Available variables: {'{'}{'{'}{'}'}CUSTOMER_NAME{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_NAME{'}'}{'}'}, {'{'}{'{'}{'}'}CONTACT_PHONE{'}'}{'}'}, {'{'}{'{'}{'}'}BUSINESS_PHONE{'}'}{'}'}, {'{'}{'{'}{'}'}SERVICE_TYPE{'}'}{'}'} (Note: {'{'}{'{'}{'}'}REVIEW_LINK{'}'}{'}'}  not available for SMS)
                </p>
              </div>

              {/* Opt-out footer notice */}
              <div className="rounded-md border border-border bg-muted p-3">
                <p className="text-sm font-medium text-foreground">Automatic Opt-out Footer</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  All SMS messages automatically include: &quot;Reply STOP to opt out&quot;
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          <Button type="submit">Create Template</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
