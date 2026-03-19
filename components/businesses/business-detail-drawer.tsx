'use client'

import { useState, useEffect, useRef } from 'react'
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
import { PencilSimple, ArrowsClockwise, Star, Trash, Globe, LinkSimple, Copy } from '@phosphor-icons/react'
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

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex justify-between text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value ?? <span className='text-muted-foreground'>Not set</span>}</span>
    </div>
  )
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
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<BusinessMetadataInput>>({})

  // Notes auto-save
  const [notes, setNotes] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesRef = useRef('')
  const initialNotesRef = useRef('')

  useEffect(() => {
    if (business) {
      const initial = business.agency_notes || ''
      setNotes(initial)
      notesRef.current = initial
      initialNotesRef.current = initial
    }
  }, [business])

  notesRef.current = notes

  useEffect(() => {
    if (!open && business && timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
      if (notesRef.current !== initialNotesRef.current) {
        updateBusinessNotes(business.id, notesRef.current)
      }
    }
    if (!open) setIsEditing(false)
  }, [open, business])

  const handleNotesChange = (value: string) => {
    setNotes(value)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
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
      // Review fields
      google_rating_start: business.google_rating_start,
      google_rating_current: business.google_rating_current,
      review_count_start: business.review_count_start,
      review_count_current: business.review_count_current,
      gbp_access: business.gbp_access,
      // Web design fields
      owner_name: business.owner_name,
      owner_email: business.owner_email,
      owner_phone: business.owner_phone,
      domain: business.domain,
      web_design_tier: business.web_design_tier as 'basic' | 'advanced' | null,
      live_website_url: business.live_website_url,
      vercel_project_url: business.vercel_project_url,
      // Shared
      monthly_fee: business.monthly_fee,
      start_date: business.start_date,
      status: business.status as 'active' | 'paused' | 'churned' | null,
    })
    setIsEditing(true)
  }

  const handleCancel = () => { setFormData({}); setIsEditing(false) }

  async function handleSave() {
    if (!business) return
    setIsSaving(true)
    // Auto-compute monthly_fee from plan + add-on
    const ct = formData.client_type ?? business.client_type
    const t = formData.web_design_tier ?? business.web_design_tier
    const hasWeb = ct === 'web_design' || ct === 'both'
    const hasRev = ct === 'reputation' || ct === 'both'
    const webFee = hasWeb ? (t === 'advanced' ? 299 : 199) : 0
    const reviewFee = hasRev ? 99 : 0
    const computedData = { ...formData, monthly_fee: webFee + reviewFee }
    const result = await updateBusinessMetadata(business.id, computedData)
    setIsSaving(false)
    if (result.success) {
      toast.success('Changes saved')
      onBusinessUpdated({ ...business, ...computedData })
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Failed to save')
    }
  }

  async function handleSwitchBusiness() {
    if (!business) return
    setIsSwitching(true)
    const result = await switchBusiness(business.id)
    if (!result.error) {
      toast.success(`Switched to ${business.name}`)
      // Full page reload to ensure cookies and server components are fully
      // in sync. router.refresh() can serve stale RSC payloads on Vercel.
      // Reload preserves the current page.
      window.location.reload()
    } else if (result.error === 'Not authenticated') {
      setIsSwitching(false)
      // Try a full reload — middleware will refresh the session
      window.location.reload()
    } else {
      setIsSwitching(false)
      toast.error(result.error)
    }
  }

  if (!business) return null

  const isWebDesign = business.client_type === 'web_design' || business.client_type === 'both'
  const isReview = business.client_type === 'reputation' || business.client_type === 'both'

  const updateField = (field: string, value: unknown) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>{business.name}</SheetTitle>
          <SheetDescription>
            {business.client_type === 'web_design' ? 'Web design client' :
             business.client_type === 'both' ? 'Web design + review client' :
             'Review management client'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className='space-y-6'>
            {/* Client Type */}
            <div>
              <h4 className='text-sm font-medium mb-3'>Client Type</h4>
              {isEditing ? (
                <div className='flex gap-2'>
                  {(['reputation', 'web_design', 'both'] as const).map((type) => (
                    <button
                      key={type}
                      type='button'
                      onClick={() => updateField('client_type', type)}
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
                <>
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
                  {/* Upgrade prompts */}
                  {business.client_type === 'web_design' && (
                    <p className='text-xs text-muted-foreground mt-2'>
                      Add review management? Change to &quot;Both&quot; then{' '}
                      <Link href={`/onboarding?mode=review-setup&businessId=${business.id}`} className='text-primary underline'>set up reviews</Link>
                    </p>
                  )}
                  {business.client_type === 'reputation' && (
                    <p className='text-xs text-muted-foreground mt-2'>
                      Add web design? Change to &quot;Both&quot; then{' '}
                      <Link href={`/onboarding?mode=web-design-setup&businessId=${business.id}`} className='text-primary underline'>set up web design</Link>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Web Design Details */}
            {(isWebDesign || (isEditing && (formData.client_type === 'web_design' || formData.client_type === 'both'))) && (
              <div>
                <h4 className='text-sm font-medium mb-3'>Web Design Details</h4>
                {isEditing ? (
                  <div className='space-y-3'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Owner Name</Label>
                      <Input value={formData.owner_name ?? ''} onChange={(e) => updateField('owner_name', e.target.value || null)} placeholder='John Smith' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Owner Email</Label>
                      <Input type='email' value={formData.owner_email ?? ''} onChange={(e) => updateField('owner_email', e.target.value || null)} placeholder='john@example.com' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Owner Phone</Label>
                      <Input type='tel' value={formData.owner_phone ?? ''} onChange={(e) => updateField('owner_phone', e.target.value || null)} placeholder='(555) 123-4567' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Domain</Label>
                      <Input value={formData.domain ?? ''} onChange={(e) => updateField('domain', e.target.value || null)} placeholder='example.com' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Subscription Tier</Label>
                      <div className='flex gap-2'>
                        {(['basic', 'advanced'] as const).map((t) => (
                          <button key={t} type='button' onClick={() => updateField('web_design_tier', t)}
                            className={cn('flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                              formData.web_design_tier === t ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:border-foreground/50')}>
                            {t === 'basic' ? 'Basic $199' : 'Advanced $299'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Live Website URL</Label>
                      <Input value={formData.live_website_url ?? ''} onChange={(e) => updateField('live_website_url', e.target.value || null)} placeholder='https://example.com' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Vercel Project URL</Label>
                      <Input value={formData.vercel_project_url ?? ''} onChange={(e) => updateField('vercel_project_url', e.target.value || null)} placeholder='https://vercel.com/...' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Client Status</Label>
                      <div className='flex gap-2'>
                        {(['active', 'paused', 'churned'] as const).map((s) => (
                          <button key={s} type='button' onClick={() => updateField('status', s)}
                            className={cn('flex-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                              formData.status === s ? 'bg-foreground text-background border-foreground' : 'bg-background border-border hover:border-foreground/50')}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <ReadOnlyField label='Owner' value={business.owner_name} />
                    <ReadOnlyField label='Email' value={business.owner_email} />
                    <ReadOnlyField label='Phone' value={business.owner_phone} />
                    <ReadOnlyField label='Domain' value={business.domain ? (
                      <span className='flex items-center gap-1'><Globe size={12} />{business.domain}</span>
                    ) : null} />
                    <ReadOnlyField label='Plan' value={business.web_design_tier ? (
                      <span className='capitalize'>{business.web_design_tier} — ${business.web_design_tier === 'advanced' ? 299 : 199}/mo</span>
                    ) : null} />
                    <ReadOnlyField label='Status' value={business.status ? (
                      <span className='capitalize'>{business.status}</span>
                    ) : null} />
                    {business.live_website_url && (
                      <ReadOnlyField label='Website' value={
                        <a href={business.live_website_url} target='_blank' rel='noopener noreferrer' className='text-primary underline text-xs'>
                          {business.live_website_url.replace(/^https?:\/\//, '')}
                        </a>
                      } />
                    )}
                    {/* Portal Link */}
                    {webProject?.portal_token && (
                      <div className='mt-3 space-y-1.5'>
                        <h4 className='text-sm font-medium flex items-center gap-1.5'><LinkSimple size={14} /> Client Portal</h4>
                        <div className='flex gap-2'>
                          <input readOnly
                            value={typeof window !== 'undefined' ? `${window.location.origin}/portal/${webProject.portal_token}` : `/portal/${webProject.portal_token}`}
                            className='flex-1 text-xs font-mono bg-muted rounded px-2 py-1.5 border border-border truncate'
                            onClick={(e) => (e.target as HTMLInputElement).select()} />
                          <Button variant='outline' size='sm' onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/portal/${webProject.portal_token}`)
                            toast.success('Portal link copied')
                          }}>
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Review Details — only for reputation/both */}
            {(isReview || (isEditing && (formData.client_type === 'reputation' || formData.client_type === 'both'))) && (
              <div>
                <h4 className='text-sm font-medium mb-3'>Review Details</h4>
                {isEditing ? (
                  <div className='grid grid-cols-2 gap-3'>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Rating Start</Label>
                      <Input type='number' step='0.1' min='1' max='5' value={formData.google_rating_start ?? ''}
                        onChange={(e) => updateField('google_rating_start', e.target.value ? Number(e.target.value) : null)} placeholder='4.2' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Rating Current</Label>
                      <Input type='number' step='0.1' min='1' max='5' value={formData.google_rating_current ?? ''}
                        onChange={(e) => updateField('google_rating_current', e.target.value ? Number(e.target.value) : null)} placeholder='4.7' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Reviews Start</Label>
                      <Input type='number' min='0' value={formData.review_count_start ?? ''}
                        onChange={(e) => updateField('review_count_start', e.target.value ? Number(e.target.value) : null)} placeholder='45' />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Reviews Current</Label>
                      <Input type='number' min='0' value={formData.review_count_current ?? ''}
                        onChange={(e) => updateField('review_count_current', e.target.value ? Number(e.target.value) : null)} placeholder='78' />
                    </div>
                    <div className='col-span-2 flex items-center justify-between'>
                      <Label className='text-xs'>GBP Access</Label>
                      <Switch checked={formData.gbp_access ?? false}
                        onCheckedChange={(checked) => updateField('gbp_access', checked)} />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <ReadOnlyField label='Rating Start' value={business.google_rating_start !== null ? (
                      <span className='flex items-center gap-1'><Star size={12} weight='fill' className='text-amber-400' />{Number(business.google_rating_start).toFixed(1)}</span>
                    ) : null} />
                    <ReadOnlyField label='Rating Current' value={business.google_rating_current !== null ? (
                      <span className='flex items-center gap-1'><Star size={12} weight='fill' className='text-amber-400' />{Number(business.google_rating_current).toFixed(1)}</span>
                    ) : null} />
                    <ReadOnlyField label='Reviews Start' value={business.review_count_start} />
                    <ReadOnlyField label='Reviews Current' value={business.review_count_current} />
                    {business.review_count_start !== null && business.review_count_current !== null && (
                      <ReadOnlyField label='Reviews Gained' value={
                        <span className={business.review_count_current - business.review_count_start > 0 ? 'text-green-600' : ''}>
                          {business.review_count_current - business.review_count_start > 0 ? '+' : ''}{business.review_count_current - business.review_count_start}
                        </span>
                      } />
                    )}
                    <ReadOnlyField label='GBP Access' value={
                      business.gbp_access === true ? <span className='text-green-600'>Yes</span> :
                      business.gbp_access === false ? <span className='text-destructive'>No</span> : null
                    } />
                  </div>
                )}
              </div>
            )}

            {/* Billing — computed from plan + review add-on */}
            <div>
              <h4 className='text-sm font-medium mb-3'>Billing</h4>
              {(() => {
                const ct = isEditing ? formData.client_type ?? business.client_type : business.client_type
                const t = isEditing ? formData.web_design_tier ?? business.web_design_tier : business.web_design_tier
                const webFee = t === 'advanced' ? 299 : t === 'basic' ? 199 : 0
                const reviewFee = 99
                const hasWeb = ct === 'web_design' || ct === 'both'
                const hasRev = ct === 'reputation' || ct === 'both'
                const total = (hasWeb ? webFee : 0) + (hasRev ? reviewFee : 0)

                return isEditing ? (
                  <div className='space-y-3'>
                    {/* Web design fee is auto-calculated from tier */}
                    {hasWeb && (
                      <ReadOnlyField label='Web Design' value={`$${webFee}/mo (${t ?? 'basic'})`} />
                    )}
                    {/* Review fee — checkbox for both, fixed display for review-only */}
                    {ct === 'both' && (
                      <div className='flex items-center justify-between'>
                        <Label className='text-xs'>Review Add-on ($99/mo)</Label>
                        <Switch checked={true} disabled />
                      </div>
                    )}
                    {ct === 'reputation' && (
                      <ReadOnlyField label='Review Management' value='$99/mo' />
                    )}
                    <div className='pt-2 border-t border-border/50'>
                      <ReadOnlyField label='Total MRR' value={<span className='text-base font-bold'>${total}/mo</span>} />
                    </div>
                    <div className='space-y-1.5'>
                      <Label className='text-xs'>Start Date</Label>
                      <Input type='date' value={formData.start_date ?? ''}
                        onChange={(e) => updateField('start_date', e.target.value || null)} />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {hasWeb && (
                      <ReadOnlyField label='Web Design' value={`$${webFee}/mo (${(business.web_design_tier ?? 'basic')})`} />
                    )}
                    {hasRev && (
                      <ReadOnlyField label='Review Management' value='$99/mo' />
                    )}
                    <div className='pt-2 border-t border-border/50'>
                      <ReadOnlyField label='Total MRR' value={<span className='text-base font-bold'>${total}/mo</span>} />
                    </div>
                    <ReadOnlyField label='Start Date' value={business.start_date ? format(parseISO(business.start_date), 'MMM d, yyyy') : null} />
                  </div>
                )
              })()}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor='business-notes'>Notes</Label>
              <p className='text-xs text-muted-foreground mb-2'>Private notes (auto-saved)</p>
              <Textarea
                id='business-notes'
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder='Add notes about this client...'
                className='min-h-[100px] resize-none'
              />
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving} className='w-full justify-start'>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={handleCancel} variant='ghost' className='w-full justify-start'>Cancel</Button>
            </>
          ) : (
            <Button onClick={handleStartEditing} variant='outline' className='w-full justify-start'>
              <PencilSimple className='mr-2 h-4 w-4' />
              Edit Details
            </Button>
          )}
          {!isActive && (
            <Button onClick={handleSwitchBusiness} variant='ghost' disabled={isSwitching} className='w-full justify-start'>
              <ArrowsClockwise className='mr-2 h-4 w-4' />
              {isSwitching ? 'Switching...' : 'Switch to this business'}
            </Button>
          )}
          {businessCount > 1 && (
            <Button onClick={() => setDeleteDialogOpen(true)} variant='ghost'
              className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'>
              <Trash className='mr-2 h-4 w-4' />
              Delete Business
            </Button>
          )}
        </SheetFooter>
      </SheetContent>

      {business && (
        <DeleteBusinessDialog businessId={business.id} businessName={business.name}
          open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}
          onDeleted={() => { onOpenChange(false); onBusinessDeleted(business.id) }} />
      )}
    </Sheet>
  )
}
