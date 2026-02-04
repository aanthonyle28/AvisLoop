'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sparkle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TouchSequenceEditor } from './touch-sequence-editor'
import { createCampaign, updateCampaign } from '@/lib/actions/campaign'
import { campaignWithTouchesSchema, type CampaignWithTouchesFormData } from '@/lib/validations/campaign'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { toast } from 'sonner'
import type { CampaignWithTouches, MessageTemplate, ServiceType } from '@/lib/types/database'

interface CampaignFormProps {
  campaign?: CampaignWithTouches
  templates: MessageTemplate[]
}

export function CampaignForm({ campaign, templates }: CampaignFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!campaign

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignWithTouchesFormData>({
    resolver: zodResolver(campaignWithTouchesSchema),
    defaultValues: {
      name: campaign?.name || '',
      service_type: campaign?.service_type || null,
      status: campaign?.status || 'active',
      touches: campaign?.campaign_touches?.map(t => ({
        touch_number: t.touch_number,
        channel: t.channel,
        delay_hours: t.delay_hours,
        template_id: t.template_id,
      })) || [
        { touch_number: 1, channel: 'email', delay_hours: 24, template_id: null },
      ],
    },
  })

  const touches = watch('touches')

  // Personalization toggle - local state for now, DB column in 25-07
  // Default ON: most users benefit from AI personalization
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true)

  const onSubmit = (data: CampaignWithTouchesFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCampaign(campaign.id, data)
        : await createCampaign(data)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          if (errors?.[0]) {
            toast.error(`${field}: ${errors[0]}`)
          }
        })
        return
      }

      toast.success(isEditing ? 'Campaign updated' : 'Campaign created')
      router.push('/campaigns')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., HVAC Follow-up"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="service_type">Service Type</Label>
          <Select
            value={watch('service_type') || 'all'}
            onValueChange={(value) =>
              setValue('service_type', value === 'all' ? null : value as ServiceType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Jobs with this service type will be enrolled in this campaign
          </p>
        </div>
      </div>

      {/* Touch sequence */}
      <div className="space-y-4">
        <div>
          <Label>Touch Sequence</Label>
          <p className="text-sm text-muted-foreground">
            Configure when and how to reach out after job completion
          </p>
        </div>

        <TouchSequenceEditor
          touches={touches}
          templates={templates}
          onChange={(newTouches) => setValue('touches', newTouches)}
        />

        {errors.touches && (
          <p className="text-sm text-destructive">
            {typeof errors.touches === 'string'
              ? errors.touches
              : errors.touches.message || 'Invalid touch configuration'}
          </p>
        )}
      </div>

      {/* Advanced Settings */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors select-none list-none flex items-center gap-1.5">
          <span className="text-xs transition-transform group-open:rotate-90">&#9654;</span>
          Advanced Settings
        </summary>

        <div className="mt-4 space-y-4 border border-border rounded-lg p-4 bg-muted/30">
          {/* AI Personalization toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkle weight="fill" className="h-4 w-4 text-amber-500" />
                <Label htmlFor="personalization" className="text-sm font-medium">
                  AI Personalization
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically customize messages for each customer using AI
              </p>
              {!personalizationEnabled && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  All recipients will receive the exact template text without customization
                </p>
              )}
            </div>
            <Switch
              id="personalization"
              checked={personalizationEnabled}
              onCheckedChange={setPersonalizationEnabled}
            />
          </div>
        </div>
      </details>

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Campaign'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
