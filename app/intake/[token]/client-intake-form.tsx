'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  Check,
  CheckCircle,
  SpinnerGap,
  UploadSimple,
  X,
  Image as ImageIcon,
  FilePdf,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TagBadge } from '@/components/ui/tag-badge'
import { cn } from '@/lib/utils'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
} from '@/lib/validations/job'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClientIntakeFormProps {
  token: string
  agencyName: string
}

interface UploadedFile {
  name: string
  storagePath: string
  readUrl: string | null
  contentType: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientIntakeForm({ token, agencyName }: ClientIntakeFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Business basics
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')

  // Services
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceNames, setCustomServiceNames] = useState<string[]>([])
  const [customServiceInput, setCustomServiceInput] = useState('')

  // Design brief
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [brandColors, setBrandColors] = useState('')
  const [currentWebsite, setCurrentWebsite] = useState('')
  const [inspirationUrls, setInspirationUrls] = useState('')

  // File uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Review management add-on
  const [wantsReview, setWantsReview] = useState(false)
  const [googleReviewLink, setGoogleReviewLink] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)

  // ─── Service toggle ──────────────────────────────────────────────────────

  const handleToggleService = (serviceType: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceType)
        ? prev.filter((s) => s !== serviceType)
        : [...prev, serviceType]
    )
    setError(null)
  }

  const addCustomService = () => {
    const trimmed = customServiceInput.trim()
    if (trimmed && !customServiceNames.includes(trimmed) && customServiceNames.length < 10) {
      setCustomServiceNames((prev) => [...prev, trimmed])
      setCustomServiceInput('')
    }
  }

  const removeCustomService = (name: string) => {
    setCustomServiceNames((prev) => prev.filter((n) => n !== name))
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = 10 - uploadedFiles.length
    const filesToUpload = Array.from(files).slice(0, remaining)

    if (filesToUpload.length === 0) {
      toast.error('Maximum 10 files allowed')
      return
    }

    setIsUploading(true)

    for (const file of filesToUpload) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        continue
      }

      try {
        // Get signed upload URL
        const res = await fetch('/api/intake/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            filename: file.name,
            contentType: file.type,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          toast.error(data.error || `Failed to upload ${file.name}`)
          continue
        }

        const { signedUploadUrl, storagePath, readUrl } = await res.json()

        // Upload file directly to Supabase Storage
        const uploadRes = await fetch(signedUploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })

        if (!uploadRes.ok) {
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        setUploadedFiles((prev) => [
          ...prev,
          { name: file.name, storagePath, readUrl, contentType: file.type },
        ])
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setIsUploading(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (storagePath: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.storagePath !== storagePath))
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (selectedServices.length === 0) {
      setError('Select at least one service type')
      return
    }
    if (wantsReview && !smsConsent) {
      setError('SMS consent acknowledgment is required for review management')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          ownerName: ownerName.trim() || undefined,
          ownerEmail: ownerEmail.trim() || undefined,
          ownerPhone: ownerPhone.trim() || undefined,
          serviceTypes: selectedServices,
          customServiceNames: selectedServices.includes('other') ? customServiceNames : [],
          description: description.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          brandColors: brandColors.trim() || undefined,
          currentWebsite: currentWebsite.trim() || undefined,
          inspirationUrls: inspirationUrls.trim() || undefined,
          assetPaths: uploadedFiles.map((f) => f.storagePath),
          wantsReviewManagement: wantsReview,
          googleReviewLink: wantsReview ? (googleReviewLink.trim() || undefined) : undefined,
          smsConsentAcknowledged: wantsReview ? smsConsent : false,
          token,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Success state ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="bg-card border rounded-xl shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle size={40} weight="fill" className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground">
          Your business details have been submitted. {agencyName} will take it from here.
        </p>
      </div>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-card border rounded-xl shadow-sm p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          {agencyName}
        </p>
        <h1 className="text-2xl font-bold">New Client Intake</h1>
        <p className="text-muted-foreground">
          Tell us about your business so we can get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ─── Section 1: Business Details ───────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Your Business
          </legend>

          <div className="space-y-2">
            <Label htmlFor="intake-biz-name">Business name *</Label>
            <Input id="intake-biz-name" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sunrise HVAC" disabled={isSubmitting} autoFocus className="h-11" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intake-owner-name">Your name</Label>
              <Input id="intake-owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                placeholder="John Smith" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intake-owner-phone">Phone</Label>
              <Input id="intake-owner-phone" type="tel" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="(555) 123-4567" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake-owner-email">Email</Label>
            <Input id="intake-owner-email" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="john@example.com" disabled={isSubmitting} />
          </div>
        </fieldset>

        {/* ─── Section 2: Services ───────────────────────────────────────── */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Services You Offer *
          </legend>

          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((serviceType) => {
              const isSelected = selectedServices.includes(serviceType)
              return (
                <button key={serviceType} type="button" onClick={() => handleToggleService(serviceType)}
                  disabled={isSubmitting}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  )}>
                  {isSelected && <Check size={14} weight="bold" />}
                  {SERVICE_TYPE_LABELS[serviceType]}
                </button>
              )
            })}
          </div>

          {selectedServices.includes('other') && (
            <div className="space-y-2 pt-1">
              <Label htmlFor="intake-custom-svc">Specify your services</Label>
              <div className="flex gap-2">
                <Input id="intake-custom-svc" value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomService() } }}
                  placeholder="e.g. Pest Control, Pool Cleaning..." disabled={isSubmitting} maxLength={50} />
                <Button type="button" variant="outline" size="sm" onClick={addCustomService}
                  disabled={isSubmitting || !customServiceInput.trim() || customServiceNames.length >= 10}
                  className="shrink-0">Add</Button>
              </div>
              {customServiceNames.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customServiceNames.map((n) => (
                    <TagBadge key={n} tag={n} onRemove={() => removeCustomService(n)} className="text-sm px-2.5 py-1" />
                  ))}
                </div>
              )}
            </div>
          )}
        </fieldset>

        {/* ─── Section 3: Design Brief ───────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Design Brief
          </legend>

          <div className="space-y-2">
            <Label htmlFor="intake-desc">Tell us about your business</Label>
            <textarea id="intake-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your business do? What makes you different from competitors?"
              disabled={isSubmitting} rows={3} maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="intake-audience">Target customers</Label>
              <Input id="intake-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g. Homeowners in Phoenix, AZ" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intake-colors">Brand colors</Label>
              <Input id="intake-colors" value={brandColors} onChange={(e) => setBrandColors(e.target.value)}
                placeholder="e.g. Navy blue and gold" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake-website">Current website (if any)</Label>
            <Input id="intake-website" type="url" value={currentWebsite} onChange={(e) => setCurrentWebsite(e.target.value)}
              placeholder="https://yoursite.com" disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake-inspiration">Competitor or inspiration websites</Label>
            <textarea id="intake-inspiration" value={inspirationUrls} onChange={(e) => setInspirationUrls(e.target.value)}
              placeholder={"Paste one URL per line, e.g.\nhttps://competitor1.com\nhttps://competitor2.com"}
              disabled={isSubmitting} rows={3} maxLength={2000}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none" />
          </div>

          {/* File uploads */}
          <div className="space-y-3">
            <div>
              <Label>Upload files</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logo, photos of your work, brand guidelines, etc. (max 10 files, 10MB each)
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                'hover:border-primary/50 hover:bg-muted/30',
                isUploading && 'pointer-events-none opacity-60'
              )}
            >
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.svg"
                onChange={handleFileSelect} className="hidden" />
              <UploadSimple size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isUploading ? 'Uploading...' : 'Click to upload or drag files here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, SVG, PDF — up to 10MB
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.storagePath}
                    className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                    {file.contentType === 'application/pdf' ? (
                      <FilePdf size={18} className="text-red-500 shrink-0" />
                    ) : (
                      <ImageIcon size={18} className="text-blue-500 shrink-0" />
                    )}
                    <span className="flex-1 truncate">{file.name}</span>
                    <button type="button" onClick={() => removeFile(file.storagePath)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1" aria-label="Remove file">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        {/* ─── Section 4: Review Management Add-on ───────────────────────── */}
        <fieldset className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
            <Checkbox id="intake-review-addon" checked={wantsReview}
              onCheckedChange={(checked) => setWantsReview(checked === true)} className="mt-0.5" />
            <div>
              <Label htmlFor="intake-review-addon" className="cursor-pointer font-medium">
                Add automated review management
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically request Google reviews from customers after each completed job.
              </p>
            </div>
          </div>

          {wantsReview && (
            <div className="space-y-4 pl-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="intake-google-link">Google review link</Label>
                <Input id="intake-google-link" type="url" value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  placeholder="https://g.page/r/..." disabled={isSubmitting} />
                <p className="text-xs text-muted-foreground">
                  Find your Google Business Profile and copy the &quot;Write a review&quot; link.
                </p>
              </div>

              <div className="border border-info-border bg-info-bg rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Checkbox id="intake-sms-consent" checked={smsConsent}
                    onCheckedChange={(checked) => setSmsConsent(checked === true)} className="mt-0.5" />
                  <Label htmlFor="intake-sms-consent" className="text-sm cursor-pointer leading-relaxed">
                    I understand that I must obtain written consent from customers before sending them SMS messages, and I will maintain records of consent as required by TCPA regulations. *
                  </Label>
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* ─── Error + Submit ────────────────────────────────────────────── */}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-12 text-base"
          disabled={isSubmitting || isUploading || selectedServices.length === 0}>
          {isSubmitting ? (
            <><SpinnerGap size={20} className="animate-spin mr-2" /> Submitting...</>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </div>
  )
}
