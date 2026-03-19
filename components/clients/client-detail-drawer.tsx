'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PencilSimple, Ticket, LinkSimple } from '@phosphor-icons/react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { updateClientDetails } from '@/lib/actions/client'
import type { ClientUpdateInput } from '@/lib/validations/client'
import type { WebDesignClient } from '@/lib/data/clients'

interface ClientDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: WebDesignClient | null
  onClientUpdated: (updated: WebDesignClient) => void
}

function getTierLimit(tier: 'basic' | 'advanced' | null | undefined): number | null {
  if (tier === 'basic') return 2
  if (tier === 'advanced') return 4
  return null
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not set'
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy')
  } catch {
    return dateStr
  }
}

export function ClientDetailDrawer({
  open,
  onOpenChange,
  client,
  onClientUpdated,
}: ClientDetailDrawerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<ClientUpdateInput>>({})

  // Reset editing state when drawer closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])

  if (!client) return null

  const handleStartEditing = () => {
    setFormData({
      owner_name: client.owner_name,
      owner_email: client.owner_email,
      owner_phone: client.owner_phone,
      web_design_tier: client.web_design_tier,
      domain: client.domain,
      vercel_project_url: client.vercel_project_url,
      status: client.status,
      monthly_fee: client.monthly_fee,
      start_date: client.start_date,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setFormData({})
    setIsEditing(false)
  }

  async function handleSave() {
    setIsSaving(true)
    const result = await updateClientDetails(client!.id, formData)
    setIsSaving(false)
    if (result.success) {
      toast.success('Changes saved')
      onClientUpdated({ ...client!, ...formData } as WebDesignClient)
      setIsEditing(false)
    } else {
      toast.error(result.error ?? 'Failed to save')
    }
  }

  const tierLimit = getTierLimit(client.web_design_tier)
  const revisionPercent =
    tierLimit !== null
      ? Math.min(100, (client.revisions_used_this_month / tierLimit) * 100)
      : 0

  const webProject = client.web_project

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{client.name}</SheetTitle>
          <SheetDescription>Web design client details</SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-6">
            {/* Section 1: Contact Info */}
            <div>
              <h4 className="text-sm font-medium mb-3">Contact Info</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-name" className="text-xs">
                      Owner Name
                    </Label>
                    <Input
                      id="owner-name"
                      value={formData.owner_name ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          owner_name: e.target.value || null,
                        }))
                      }
                      placeholder="e.g. John Smith"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-email" className="text-xs">
                      Email
                    </Label>
                    <Input
                      id="owner-email"
                      type="email"
                      value={formData.owner_email ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          owner_email: e.target.value || null,
                        }))
                      }
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-phone" className="text-xs">
                      Phone
                    </Label>
                    <Input
                      id="owner-phone"
                      value={formData.owner_phone ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          owner_phone: e.target.value || null,
                        }))
                      }
                      placeholder="e.g. +1 555-000-0000"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">
                      {client.owner_name ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">
                      {client.owner_email ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">
                      {client.owner_phone ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Project Details (always read-only) */}
            {webProject && (
              <div>
                <h4 className="text-sm font-medium mb-3">Project Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Project Name</span>
                    <span className="font-medium">
                      {webProject.project_name ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pages</span>
                    <span className="font-medium">
                      {webProject.page_count ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">
                      {webProject.status ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Launched</span>
                    <span className="font-medium">
                      {webProject.launched_at
                        ? formatDate(webProject.launched_at)
                        : (
                          <span className="text-muted-foreground">Not launched</span>
                        )}
                    </span>
                  </div>
                  {client.live_website_url && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Live Site</span>
                      <a
                        href={client.live_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate max-w-[200px]"
                      >
                        {client.live_website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 3: Plan & Billing */}
            <div>
              <h4 className="text-sm font-medium mb-3">Plan &amp; Billing</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="web-design-tier" className="text-xs">
                      Tier
                    </Label>
                    <Select
                      value={formData.web_design_tier ?? ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          web_design_tier:
                            v === '' ? null : (v as 'basic' | 'advanced'),
                        }))
                      }
                    >
                      <SelectTrigger id="web-design-tier">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="monthly-fee" className="text-xs">
                      Monthly Fee ($)
                    </Label>
                    <Input
                      id="monthly-fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthly_fee ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          monthly_fee: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      placeholder="e.g. 199.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="start-date" className="text-xs">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={formData.start_date ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_date: e.target.value || null,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-status" className="text-xs">
                      Status
                    </Label>
                    <Select
                      value={formData.status ?? ''}
                      onValueChange={(v) =>
                        setFormData((prev) => ({
                          ...prev,
                          status:
                            v === ''
                              ? null
                              : (v as 'active' | 'paused' | 'churned'),
                        }))
                      }
                    >
                      <SelectTrigger id="client-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="churned">Churned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-medium capitalize">
                      {client.web_design_tier ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Fee</span>
                    <span className="font-medium">
                      {client.monthly_fee !== null && client.monthly_fee !== undefined
                        ? `$${Number(client.monthly_fee).toFixed(0)}`
                        : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="font-medium">
                      {client.start_date
                        ? formatDate(client.start_date)
                        : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">
                      {client.status ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Tech Details */}
            <div>
              <h4 className="text-sm font-medium mb-3">Tech Details</h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="domain" className="text-xs">
                      Domain
                    </Label>
                    <Input
                      id="domain"
                      value={formData.domain ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          domain: e.target.value || null,
                        }))
                      }
                      placeholder="e.g. plumbingpros.com"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="vercel-project-url" className="text-xs">
                      Vercel Project URL
                    </Label>
                    <Input
                      id="vercel-project-url"
                      value={formData.vercel_project_url ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vercel_project_url: e.target.value || null,
                        }))
                      }
                      placeholder="https://vercel.com/..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Domain</span>
                    <span className="font-mono font-medium text-sm">
                      {client.domain ?? (
                        <span className="font-sans text-muted-foreground">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vercel URL</span>
                    {client.vercel_project_url ? (
                      <a
                        href={client.vercel_project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline truncate max-w-[200px]"
                      >
                        {client.vercel_project_url}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 5: Revision Quota (always read-only) */}
            <div>
              <h4 className="text-sm font-medium mb-3">Revision Quota</h4>
              {tierLimit !== null ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used this month</span>
                    <span className="font-medium">
                      {client.revisions_used_this_month} of {tierLimit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${revisionPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tierLimit - client.revisions_used_this_month > 0
                      ? `${tierLimit - client.revisions_used_this_month} remaining`
                      : 'Monthly quota reached'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set a tier to track revision quota.
                </p>
              )}
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full justify-start"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="w-full justify-start"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleStartEditing}
                variant="outline"
                className="w-full justify-start"
              >
                <PencilSimple className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href={client.web_project ? `/clients/${client.web_project.id}/tickets` : `/clients/tickets`}>
                  <Ticket className="mr-2 h-4 w-4" />
                  View Tickets ({client.revisions_used_this_month ?? 0} this month)
                </Link>
              </Button>
              {client.web_project?.portal_token && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    const url = `${window.location.origin}/portal/${client.web_project!.portal_token}`
                    navigator.clipboard.writeText(url)
                    toast.success('Portal link copied')
                  }}
                >
                  <LinkSimple className="mr-2 h-4 w-4" />
                  Copy Portal Link
                </Button>
              )}
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
