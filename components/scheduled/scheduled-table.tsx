'use client'

import { Fragment, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ScheduledSendWithDetails } from '@/lib/types/database'
import { formatScheduleDate } from '@/lib/utils/schedule'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExpandedDetails } from './expanded-details'
import { BulkActionBar } from './bulk-action-bar'
import { CancelDialog } from './cancel-dialog'
import { RescheduleDialog } from './reschedule-dialog'
import { CancelButton } from './cancel-button'
import { bulkCancelScheduledSends, bulkRescheduleScheduledSends } from '@/lib/actions/schedule'
import { toast } from 'sonner'
import {
  CaretRight,
  CaretDown,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Warning
} from '@phosphor-icons/react'

interface ScheduledTableProps {
  sends: ScheduledSendWithDetails[]
}

export function ScheduledTable({ sends }: ScheduledTableProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'pending' | 'past'>('pending')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [isBulkPending, setIsBulkPending] = useState(false)

  // Split sends by status
  const pending = sends
    .filter(s => s.status === 'pending')
    .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())

  const past = sends
    .filter(s => s.status !== 'pending')
    .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())

  // Handle tab change - reset expanded and selection
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'pending' | 'past')
    setExpanded({})
    setRowSelection({})
    setLastSelectedId(null)
  }

  // Toggle expanded state for a row
  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Handle checkbox selection with shift-click range support
  const handleCheckboxChange = (id: string, checked: boolean, event?: React.MouseEvent) => {
    if (event?.shiftKey && lastSelectedId) {
      // Range selection
      const visibleIds = pending.map(s => s.id)
      const lastIndex = visibleIds.indexOf(lastSelectedId)
      const currentIndex = visibleIds.indexOf(id)

      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const range = visibleIds.slice(start, end + 1)

        setRowSelection(prev => {
          const newSelection = { ...prev }
          range.forEach(rangeId => {
            newSelection[rangeId] = true
          })
          return newSelection
        })
      }
    } else {
      // Single selection
      setRowSelection(prev => {
        const newSelection = { ...prev }
        if (checked) {
          newSelection[id] = true
        } else {
          delete newSelection[id]
        }
        return newSelection
      })
    }

    setLastSelectedId(id)
  }

  // Select/deselect all
  const toggleSelectAll = () => {
    const allSelected = pending.length > 0 && pending.every(s => rowSelection[s.id])
    if (allSelected) {
      setRowSelection({})
    } else {
      const newSelection: Record<string, boolean> = {}
      pending.forEach(s => {
        newSelection[s.id] = true
      })
      setRowSelection(newSelection)
    }
  }

  // Get selected IDs
  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])
  const selectedCount = selectedIds.length

  // Bulk cancel handler
  const handleBulkCancel = async () => {
    setIsBulkPending(true)
    const result = await bulkCancelScheduledSends(selectedIds)
    setIsBulkPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Cancelled ${result.count} scheduled send${result.count !== 1 ? 's' : ''}`)
      setRowSelection({})
      setShowCancelDialog(false)
      router.refresh()
    }
  }

  // Bulk reschedule handler
  const handleBulkReschedule = async (newScheduledFor: string) => {
    setIsBulkPending(true)
    const result = await bulkRescheduleScheduledSends(selectedIds, newScheduledFor)
    setIsBulkPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Rescheduled ${result.count} send${result.count !== 1 ? 's' : ''}`)
      setRowSelection({})
      setShowRescheduleDialog(false)
      router.refresh()
    }
  }

  // Clear selection
  const clearSelection = () => {
    setRowSelection({})
    setLastSelectedId(null)
  }

  // Get status badge
  const getStatusBadge = (status: ScheduledSendWithDetails['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="default" className="gap-1 bg-blue-600 text-white">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="gap-1 text-green-600 bg-green-50 border-green-200">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="outline" className="gap-1 text-red-600 bg-red-50 border-red-200">
            <Warning className="h-3 w-3" />
            Failed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        )
    }
  }

  // Get results summary for completed sends
  const getResultsSummary = (send: ScheduledSendWithDetails) => {
    if (send.status !== 'completed') return null

    const sentCount = send.sendLogs.filter(log =>
      log.status === 'sent' || log.status === 'delivered'
    ).length
    const failedCount = send.sendLogs.filter(log =>
      log.status === 'failed' || log.status === 'bounced'
    ).length
    const skippedCount = send.contact_ids.length - send.sendLogs.length

    return (
      <span className="text-sm text-muted-foreground">
        <span className="text-green-600 font-medium">{sentCount} sent</span>
        {skippedCount > 0 && (
          <> · <span className="text-orange-600 font-medium">{skippedCount} skipped</span></>
        )}
        {failedCount > 0 && (
          <> · <span className="text-red-600 font-medium">{failedCount} failed</span></>
        )}
      </span>
    )
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({past.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending tab */}
        <TabsContent value="pending" className="mt-4">
          {pending.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending scheduled sends.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 w-10">
                        <Checkbox
                          checked={pending.length > 0 && pending.every(s => rowSelection[s.id])}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 w-10"></th>
                      <th className="p-3 text-left text-sm font-medium">Contacts</th>
                      <th className="p-3 text-left text-sm font-medium">Scheduled For</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((send) => (
                      <Fragment key={send.id}>
                        <tr
                          className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleExpanded(send.id)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={!!rowSelection[send.id]}
                              onCheckedChange={(checked) => handleCheckboxChange(send.id, !!checked)}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation()
                                handleCheckboxChange(send.id, !rowSelection[send.id], e)
                              }}
                            />
                          </td>
                          <td className="p-3">
                            {expanded[send.id] ? (
                              <CaretDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <CaretRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatScheduleDate(send.scheduled_for)}
                            </div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(send.status)}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <CancelButton scheduledSendId={send.id} />
                          </td>
                        </tr>
                        {expanded[send.id] && (
                          <tr>
                            <td colSpan={6} className="p-4 bg-muted/10">
                              <ExpandedDetails scheduledSend={send} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {pending.map((send) => (
                  <div
                    key={send.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    <div
                      className="p-4 space-y-3 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleExpanded(send.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!rowSelection[send.id]}
                            onCheckedChange={(checked) => handleCheckboxChange(send.id, !!checked)}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              handleCheckboxChange(send.id, !rowSelection[send.id], e)
                            }}
                          />
                          {expanded[send.id] ? (
                            <CaretDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CaretRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(send.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatScheduleDate(send.scheduled_for)}
                      </div>
                      <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                        <CancelButton scheduledSendId={send.id} />
                      </div>
                    </div>
                    {expanded[send.id] && (
                      <div className="p-4 bg-muted/10 border-t">
                        <ExpandedDetails scheduledSend={send} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Past tab */}
        <TabsContent value="past" className="mt-4">
          {past.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No past scheduled sends.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 w-10"></th>
                      <th className="p-3 text-left text-sm font-medium">Contacts</th>
                      <th className="p-3 text-left text-sm font-medium">Scheduled For</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-left text-sm font-medium">Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((send) => (
                      <Fragment key={send.id}>
                        <tr
                          className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                          onClick={() => toggleExpanded(send.id)}
                        >
                          <td className="p-3">
                            {expanded[send.id] ? (
                              <CaretDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <CaretRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {formatScheduleDate(send.scheduled_for)}
                            </div>
                          </td>
                          <td className="p-3">
                            {getStatusBadge(send.status)}
                          </td>
                          <td className="p-3">
                            {getResultsSummary(send)}
                          </td>
                        </tr>
                        {expanded[send.id] && (
                          <tr>
                            <td colSpan={5} className="p-4 bg-muted/10">
                              <ExpandedDetails scheduledSend={send} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {past.map((send) => (
                  <div
                    key={send.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    <div
                      className="p-4 space-y-3 cursor-pointer hover:bg-muted/30"
                      onClick={() => toggleExpanded(send.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expanded[send.id] ? (
                            <CaretDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <CaretRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(send.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatScheduleDate(send.scheduled_for)}
                      </div>
                      {send.status === 'completed' && (
                        <div className="pt-2 border-t">
                          {getResultsSummary(send)}
                        </div>
                      )}
                    </div>
                    {expanded[send.id] && (
                      <div className="p-4 bg-muted/10 border-t">
                        <ExpandedDetails scheduledSend={send} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating bulk action bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onReschedule={() => setShowRescheduleDialog(true)}
        onCancel={() => setShowCancelDialog(true)}
        onClearSelection={clearSelection}
      />

      {/* Cancel dialog */}
      <CancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        selectedCount={selectedCount}
        onConfirm={handleBulkCancel}
        isPending={isBulkPending}
      />

      {/* Reschedule dialog */}
      <RescheduleDialog
        open={showRescheduleDialog}
        onOpenChange={setShowRescheduleDialog}
        selectedCount={selectedCount}
        onConfirm={handleBulkReschedule}
        isPending={isBulkPending}
      />
    </>
  )
}
