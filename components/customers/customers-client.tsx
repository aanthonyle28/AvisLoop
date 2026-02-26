'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerTable } from './customer-table'
import { EditCustomerSheet } from './edit-customer-sheet'
import { CSVImportDialog } from './csv-import-dialog'
import { CustomerDetailDrawer } from './customer-detail-drawer'
import { DeleteCustomerDialog } from './delete-customer-dialog'
import { CustomersEmptyState } from './empty-state'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import { CircleNotch } from '@phosphor-icons/react'
import {
  archiveCustomer,
  restoreCustomer,
  deleteCustomer,
  bulkArchiveCustomers,
  bulkDeleteCustomers,
} from '@/lib/actions/customer'
import type { Customer, Business, MessageTemplate } from '@/lib/types/database'

interface CustomersClientProps {
  initialCustomers: Customer[]
  business: Business & { message_templates?: MessageTemplate[] }
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
}

export function CustomersClient({
  initialCustomers,
  business,
  templates,
  monthlyUsage,
  hasReviewLink,
}: CustomersClientProps) {
  const router = useRouter()

  // State for editing customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  // State for detail drawer
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const [customersToDelete, setCustomersToDelete] = useState<string[]>([])

  // State for quick send modal
  const [quickSendOpen, setQuickSendOpen] = useState(false)
  const [quickSendCustomer, setQuickSendCustomer] = useState<Customer | null>(null)

  // Transition for action feedback with loading state
  const [isPending, startTransition] = useTransition()

  // Action handlers
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditSheetOpen(true)
  }

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveCustomer(id)
    })
  }

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreCustomer(id)
    })
  }

  const handleDelete = (id: string) => {
    // Open confirmation dialog for destructive action
    setCustomerToDelete(id)
    setCustomersToDelete([])
    setDeleteDialogOpen(true)
  }

  const handleBulkArchive = (ids: string[]) => {
    startTransition(async () => {
      await bulkArchiveCustomers(ids)
    })
  }

  const handleBulkDelete = (ids: string[]) => {
    // Open confirmation dialog for destructive action
    setCustomerToDelete(null)
    setCustomersToDelete(ids)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false)
    if (customerToDelete) {
      startTransition(async () => {
        await deleteCustomer(customerToDelete)
        setCustomerToDelete(null)
      })
    } else if (customersToDelete.length > 0) {
      startTransition(async () => {
        await bulkDeleteCustomers(customersToDelete)
        setCustomersToDelete([])
      })
    }
  }

  // Detail drawer handlers
  const handleRowClick = (customer: Customer) => {
    setDetailCustomer(customer)
    setDetailDrawerOpen(true)
  }

  const handleSendFromDrawer = () => {
    if (detailCustomer) {
      setQuickSendCustomer(detailCustomer)
      setQuickSendOpen(true)
    }
    setDetailDrawerOpen(false)
  }

  const handleEditFromDrawer = (customer: Customer) => {
    setDetailDrawerOpen(false)
    // Small delay to avoid two sheets overlapping
    setTimeout(() => {
      handleEdit(customer)
    }, 200)
  }

  const handleArchiveFromDrawer = (customerId: string) => {
    handleArchive(customerId)
    setDetailDrawerOpen(false)
  }

  const handleViewHistoryFromDrawer = (customerId: string) => {
    router.push(`/history?customer=${customerId}`)
    setDetailDrawerOpen(false)
  }

  const hasCustomers = initialCustomers.length > 0

  return (
    <div className='space-y-6'>
      {/* Loading overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center">
          <CircleNotch className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Created automatically when you complete jobs &middot; {initialCustomers.length} total
          </p>
        </div>

        {hasCustomers && (
          <div className='flex gap-2'>
            <CSVImportDialog />
          </div>
        )}
      </div>

      {/* Content */}
      {hasCustomers ? (
        <CustomerTable
          data={initialCustomers}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
          onRowClick={handleRowClick}
        />
      ) : (
        <CustomersEmptyState />
      )}

      {/* Edit Customer Sheet */}
      <EditCustomerSheet
        customer={editingCustomer}
        open={editSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open)
          if (!open) {
            setEditingCustomer(null)
          }
        }}
      />

      {/* Contact Detail Drawer */}
      <CustomerDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open)
          if (!open) {
            setDetailCustomer(null)
          }
        }}
        customer={detailCustomer}
        onSend={handleSendFromDrawer}
        onEdit={handleEditFromDrawer}
        onArchive={handleArchiveFromDrawer}
        onViewHistory={handleViewHistoryFromDrawer}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCustomerDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        customerCount={customerToDelete ? 1 : customersToDelete.length}
        onConfirm={handleConfirmDelete}
        isDeleting={isPending}
      />

      {/* Quick Send Modal -- opened from Customer detail drawer */}
      <QuickSendModal
        open={quickSendOpen}
        onOpenChange={setQuickSendOpen}
        customers={initialCustomers}
        business={business}
        templates={templates}
        monthlyUsage={monthlyUsage}
        hasReviewLink={hasReviewLink}
        prefilledCustomer={quickSendCustomer}
      />
    </div>
  )
}
