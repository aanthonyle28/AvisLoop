'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { PencilSimple, ArrowsClockwise, Star, Trash, Copy, Globe, Link as LinkIcon } from '@phosphor-icons/react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import type { Business, WebProject } from '@/lib/types/database'
import type { BusinessMetadataInput } from '@/lib/validations/business-metadata'
import { updateBusinessMetadata, updateBusinessNotes } from '@/lib/actions/business-metadata'
import { switchBusiness } from '@/lib/actions/active-business'
import { DeleteBusinessDialog } from '@/components/businesses/delete-business-dialog'
import { cn } from '@/lib/utils'

interface BusinessDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  business: Business | null
  isActive: boolean
  businessCount: number
  onBusinessUpdated: (updated: Business) => void
  onBusinessDeleted: (businessId: string) => void
  webProject?: WebProject | null
}

export function BusinessDetailDrawer({
  open,
  onOpenChange,
  business,
  isActive,
  businessCount,
  onBusinessUpdated,
  onBusinessDeleted,
  webProject,
}: BusinessDetailDrawerProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessMetadataInput>>({})

  // Notes auto-save state — exact pattern from customer-detail-drawer.tsx
  const [notes, setNotes] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesRef = useRef('')
  const initialNotesRef = useRef('')

  // Sync notes when business changes
  useEffect(() => {
    if (business) {
      const initial = business.agency_notes || ''
      setNotes(initial)
      notesRef.current = initial
      initialNotesRef.current = initial
    }
  }, [business])

  // Keep notesRef in sync with current value
  notesRef.current = notes

  // Flush pending notes on drawer close
  useEffect(() => {
    if (!open && business && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
      if (notesRef.current !== initialNotesRef.current) {
        updateBusinessNotes(business.id, notesRef.current)
      }
    }
    // Reset editing state when drawer closes
    if (!open) {
      setIsEditing(false)
    }
  }, [open, business])

  // Handle notes change with 500ms debounce
  const handleNotesChange = (value: string) => {
    setNotes(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    if (business) {
      timeoutRef.current = setTimeout(() => {
        updateBusinessNotes(business.id, value)
        initialNotesRef.current = value
      }, 500)
    }
  }

  const handleStartEditing = () => {
    if (!business) return
    setFormData({
      client_type: business.client_type,
      google_rating_start: business.google_rating_start,
      google_rating_current: business.google_rating_current,
      review_count_start: business.review_count_start,
      review_count_current: business.review_count_current,
      monthly_fee: business.monthly_fee,
      start_date: business.start_date,
      gbp_access: business.gbp_access,
      competitor_name: business.competitor_name,
      competitor_review_count: business.competitor_review_count,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({})
    setIsEditing(false)
  }

  async function handleSave() {
    if (!business) return
    setIsSaving(true)
    const result = await updateBusinessMetadata(business.id, formData)
    setIsSaving(false)
    if (result.success) {
      toast.success('Changes saved')
      onBusinessUpdated({ ...business, ...formData })
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Failed to save')
    }
  }

  async function handleSwitchBusiness() {
    if (!business) return
    setIsSwitching(true)
    const result = await switchBusiness(business.id)
    setIsSwitching(false)
    if (!result.error) {
      toast.success(`Switched to ${business.name}`)
      onOpenChange(false)
      // Force full re-fetch so new business context is picked up in production
      router.refresh()
    } else if (result.error === 'Not authenticated') {
      router.push('/login')
    } else {
      toast.error(result.error)
    }
  }

  if (!business) return null

  // Competitive analysis data
  const hasClientReviews = business.review_count_current !== null
  const hasCompetitorData =
    business.competitor_review_count !== null && business.competitor_name !== null
  const gap =
    hasClientReviews && hasCompetitorData
      ? (business.review_count_current ?? 0) - (business.competitor_review_count ?? 0)
      : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{business.name}</SheetTitle>
          <SheetDescription>
            {business.client_type === 'web_design' ? 'Web design client details' :
             business.client_type === 'both' ? 'Web design + review client details' :
             'Client details and competitive analysis'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className='space-y-6'>
            {/* Section 0: Client Type */}
            <div>
              <h4 className='text-sm font-medium mb-3'>Client Type</h4>
              {isEditing ? (
                <div className='flex gap-2'>
                  {(['reputation', 'web_design', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => setFormData((prev) => ({ ...prev, client_type: type }))}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        formData.client_type === type
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-foreground border-border hover:border-foreground/50'
                      )}
                    >
                      {type === 'reputation' ? 'Review' : type === 'web_design' ? 'Web Design' : 'Both'}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  business.client_type === 'web_design'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : business.client_type === 'both'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                )}>
                  {business.client_type === 'reputation' ? 'Review' : business.client_type === 'web_design' ? 'Web Design' : 'Web + Review'}
                </span>
              )}
              {/* Contextual upgrade prompts */}
              {!isEditing && business.client_type === 'web_design' && (
                <p className='text-xs text-muted-foreground mt-2'>
                  Want to add review management? Edit Details → change type to &quot;Both&quot;, save, then set up services and campaigns via{' '}
                  <Link href={`/onboarding?mode=review-setup&businessId=${business.id}`} className='text-primary underline'>
                    Review Setup
                  </Link>
                </p>
              )}
              {!isEditing && business.client_type === 'reputation' && (
                <p className='text-xs text-muted-foreground mt-2'>
                  Want to add web design? Edit Details → change type to &quot;Both&quot;, save, then set up the web project via{' '}
                  <Link href={`/onboarding?mode=web-design-setup&businessId=${business.id}`} className='text-primary underline'>
                    Web Design Setup
                  </Link>
                </p>
              )}
            </div>

            {/* Web Design Details — only for web_design/both */}
            {(business.client_type === 'web_design' || business.client_type === 'both') && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Web Design Details</h4>
                <div className='space-y-2'>
                  {webProject?.domain && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground flex items-center gap-1.5'><Globe size={14} /> Domain</span>
                      <span className='font-medium'>{webProject.domain}</span>
                    </div>
                  )}
                  {webProject?.subscription_tier && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Plan</span>
                      <span className='font-medium capitalize'>
                        {webProject.subscription_tier} — ${webProject.subscription_monthly_fee ?? (webProject.subscription_tier === 'advanced' ? 299 : 199)}/mo
                      </span>
                    </div>
                  )}
                  {webProject?.has_review_addon && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Review Add-on</span>
                      <span className='font-medium text-green-600'>Active — $99/mo</span>
                    </div>
                  )}
                  {webProject?.status && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Project Status</span>
                      <span className='font-medium capitalize'>{webProject.status}</span>
                    </div>
                  )}
                  {webProject?.page_count && (
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Pages</span>
                      <span className='font-medium'>{webProject.page_count}</span>
                    </div>
                  )}
                </div>
                {/* Portal Link — copyable */}
                {webProject?.portal_token && (
                  <div className='mt-3 space-y-1.5'>
                    <h4 className='text-sm font-medium flex items-center gap-1.5'><LinkIcon size={14} /> Client Portal Link</h4>
                    <div className='flex gap-2'>
                      <input
                        readOnly
                        value={typeof window !== 'undefined' ? `${window.location.origin}/portal/${webProject.portal_token}` : `/portal/${webProject.portal_token}`}
                        className='flex-1 text-xs font-mono bg-muted rounded px-2 py-1.5 border border-border truncate'
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          const url = `${window.location.origin}/portal/${webProject.portal_token}`
                          navigator.clipboard.writeText(url)
                          toast.success('Portal link copied')
                        }}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                )}
                {!webProject && (
                  <p className='text-sm text-muted-foreground italic'>No web project created yet. Add one from the /clients page.</p>
                )}
              </div>
            )}

            {/* Section 1: Google Performance — only for reputation/both */}
            {(business.client_type === 'reputation' || business.client_type === 'both') && <div>
              <h4 className='text-sm font-medium mb-3'>Google Performance</h4>
              {isEditing ? (
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='google-rating-start' className='text-xs'>
                      Rating Start
                    </Label>
                    <Input
                      id='google-rating-start'
                      type='number'
                      step='0.1'
                      min='1'
                      max='5'
                      value={formData.google_rating_start ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          google_rating_start: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 4.2'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='google-rating-current' className='text-xs'>
                      Rating Current
                    </Label>
                    <Input
                      id='google-rating-current'
                      type='number'
                      step='0.1'
                      min='1'
                      max='5'
                      value={formData.google_rating_current ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          google_rating_current: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 4.7'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='review-count-start' className='text-xs'>
                      Reviews Start
                    </Label>
                    <Input
                      id='review-count-start'
                      type='number'
                      min='0'
                      value={formData.review_count_start ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          review_count_start: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 45'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='review-count-current' className='text-xs'>
                      Reviews Current
                    </Label>
                    <Input
                      id='review-count-current'
                      type='number'
                      min='0'
                      value={formData.review_count_current ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          review_count_current: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 78'
                    />
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Rating Start</span>
                    <span className='font-medium flex items-center gap-1'>
                      {business.google_rating_start !== null ? (
                        <>
                          <Star size={12} weight='fill' className='text-amber-400' />
                          {Number(business.google_rating_start).toFixed(1)}
                        </>
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Rating Current</span>
                    <span className='font-medium flex items-center gap-1'>
                      {business.google_rating_current !== null ? (
                        <>
                          <Star size={12} weight='fill' className='text-amber-400' />
                          {Number(business.google_rating_current).toFixed(1)}
                        </>
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Reviews Start</span>
                    <span className='font-medium'>
                      {business.review_count_start !== null ? (
                        business.review_count_start
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Reviews Current</span>
                    <span className='font-medium'>
                      {business.review_count_current !== null ? (
                        business.review_count_current
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  {business.review_count_start !== null &&
                    business.review_count_current !== null && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>Reviews Gained</span>
                        <span
                          className={cn(
                            'font-medium',
                            business.review_count_current - business.review_count_start > 0
                              ? 'text-success'
                              : 'text-muted-foreground'
                          )}
                        >
                          {business.review_count_current - business.review_count_start > 0
                            ? `+${business.review_count_current - business.review_count_start}`
                            : business.review_count_current - business.review_count_start}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>}

            {/* Section 2: Competitive Analysis — only for reputation/both */}
            {(business.client_type === 'reputation' || business.client_type === 'both') && <div>
              <h4 className='text-sm font-medium mb-3'>Competitive Analysis</h4>
              {isEditing ? (
                <div className='space-y-3'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='competitor-name' className='text-xs'>
                      Competitor Name
                    </Label>
                    <Input
                      id='competitor-name'
                      type='text'
                      value={formData.competitor_name ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          competitor_name: e.target.value || null,
                        }))
                      }
                      placeholder='e.g., ABC Plumbing'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='competitor-review-count' className='text-xs'>
                      Competitor Review Count
                    </Label>
                    <Input
                      id='competitor-review-count'
                      type='number'
                      min='0'
                      value={formData.competitor_review_count ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          competitor_review_count: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 120'
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className='grid grid-cols-2 gap-4'>
                    {/* Client column */}
                    <div className='space-y-2 text-center'>
                      <p className='text-xs text-muted-foreground font-medium uppercase tracking-wide'>
                        Your Client
                      </p>
                      <p className='text-3xl font-bold'>
                        {business.review_count_current ?? '—'}
                      </p>
                      <p className='text-xs text-muted-foreground'>reviews</p>
                    </div>
                    {/* Competitor column */}
                    <div className='space-y-2 text-center'>
                      <p className='text-xs text-muted-foreground font-medium uppercase tracking-wide truncate'>
                        {business.competitor_name || 'Competitor'}
                      </p>
                      <p className='text-3xl font-bold'>
                        {business.competitor_review_count ?? '—'}
                      </p>
                      <p className='text-xs text-muted-foreground'>reviews</p>
                    </div>
                  </div>
                  {/* Gap indicator */}
                  <div className='text-center mt-3'>
                    {gap !== null ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                          gap > 0
                            ? 'bg-green-50 text-success dark:bg-green-950/30'
                            : gap < 0
                              ? 'bg-red-50 text-destructive dark:bg-red-950/30'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {gap > 0
                          ? `+${gap} reviews ahead`
                          : gap < 0
                            ? `${Math.abs(gap)} reviews behind`
                            : 'Tied'}
                      </span>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        Add competitor data to see gap analysis
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>}

            {/* Section 3: Agency Details */}
            <div>
              <h4 className='text-sm font-medium mb-3'>Agency Details</h4>
              {isEditing ? (
                <div className='space-y-3'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='monthly-fee' className='text-xs'>
                      Monthly Fee ($)
                    </Label>
                    <Input
                      id='monthly-fee'
                      type='number'
                      step='0.01'
                      min='0'
                      value={formData.monthly_fee ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthly_fee: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      placeholder='e.g., 299.00'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='start-date' className='text-xs'>
                      Start Date
                    </Label>
                    <Input
                      id='start-date'
                      type='date'
                      value={formData.start_date ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_date: e.target.value || null,
                        }))
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='gbp-access' className='text-xs'>
                      GBP Access
                    </Label>
                    <Switch
                      id='gbp-access'
                      checked={formData.gbp_access ?? false}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, gbp_access: checked }))
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Monthly Fee</span>
                    <span className='font-medium'>
                      {business.monthly_fee !== null ? (
                        `$${Number(business.monthly_fee).toFixed(2)}`
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Start Date</span>
                    <span className='font-medium'>
                      {business.start_date ? (
                        format(parseISO(business.start_date), 'MMM d, yyyy')
                      ) : (
                        <span className='text-muted-foreground'>Not set</span>
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>GBP Access</span>
                    <span
                      className={cn(
                        'font-medium',
                        business.gbp_access === true
                          ? 'text-success'
                          : business.gbp_access === false
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      )}
                    >
                      {business.gbp_access === true
                        ? 'Yes'
                        : business.gbp_access === false
                          ? 'No'
                          : 'Not set'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Notes (always editable, no edit mode toggle) */}
            <div>
              <div className='space-y-2'>
                <Label htmlFor='business-notes'>Notes</Label>
                <p className='text-xs text-muted-foreground'>
                  Private agency notes (auto-saved)
                </p>
                <Textarea
                  id='business-notes'
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder='Add notes about this client...'
                  className='min-h-[120px] resize-none'
                />
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className='w-full justify-start'
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant='ghost'
                className='w-full justify-start'
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleStartEditing}
              variant='outline'
              className='w-full justify-start'
            >
              <PencilSimple className='mr-2 h-4 w-4' />
              Edit Details
            </Button>
          )}
          {!isActive && (
            <Button
              onClick={handleSwitchBusiness}
              variant='ghost'
              disabled={isSwitching}
              className='w-full justify-start'
            >
              <ArrowsClockwise className='mr-2 h-4 w-4' />
              {isSwitching ? 'Switching...' : 'Switch to this business'}
            </Button>
          )}
          {businessCount > 1 && (
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant='ghost'
              className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'
            >
              <Trash className='mr-2 h-4 w-4' />
              Delete Business
            </Button>
          )}
        </SheetFooter>
      </SheetContent>

      {/* Delete confirmation dialog */}
      {business && (
        <DeleteBusinessDialog
          businessId={business.id}
          businessName={business.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onDeleted={() => {
            onOpenChange(false)
            onBusinessDeleted(business.id)
          }}
        />
      )}
    </Sheet>
  )
}
