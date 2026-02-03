'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerTable } from './customer-table'
import { AddCustomerSheet } from './add-customer-sheet'
import { EditCustomerSheet } from './edit-customer-sheet'
import { CSVImportDialog } from './csv-import-dialog'
import { CustomerDetailDrawer } from './customer-detail-drawer'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import {
  archiveCustomer,
  restoreCustomer,
  deleteCustomer,
  bulkArchiveCustomers,
  bulkDeleteCustomers,
} from '@/lib/actions/customer'
import type { Customer } from '@/lib/types/database'

interface CustomersClientProps {
  initialCustomers: Customer[]
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter()

  // State for add customer sheet
  const [addSheetOpen, setAddSheetOpen] = useState(false)

  // State for editing customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  // State for detail drawer
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

  // Transition for action feedback
  const [, startTransition] = useTransition()

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
    // Show confirmation dialog for destructive action
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      startTransition(async () => {
        await deleteCustomer(id)
      })
    }
  }

  const handleBulkArchive = (ids: string[]) => {
    startTransition(async () => {
      await bulkArchiveCustomers(ids)
    })
  }

  const handleBulkDelete = (ids: string[]) => {
    // Show confirmation dialog for destructive action
    if (window.confirm(`Are you sure you want to delete ${ids.length} customer${ids.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      startTransition(async () => {
        await bulkDeleteCustomers(ids)
      })
    }
  }

  // Detail drawer handlers
  const handleRowClick = (customer: Customer) => {
    setDetailCustomer(customer)
    setDetailDrawerOpen(true)
  }

  const handleSendFromDrawer = () => {
    router.push('/send')
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
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Customers</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your customers for review requests
          </p>
        </div>

        {hasCustomers && (
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setAddSheetOpen(true)}>
              <Plus className='mr-2 h-4 w-4' />
              Add Customer
            </Button>
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
        <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
          <div className='rounded-full bg-muted p-6 mb-6'>
            <Users className='h-12 w-12 text-muted-foreground' />
          </div>

          <h2 className='text-2xl font-semibold tracking-tight mb-2'>
            No customers yet
          </h2>

          <p className='text-muted-foreground mb-8 max-w-md'>
            Add your first customer to start sending review requests and building your reputation
          </p>

          <div className='flex flex-col sm:flex-row gap-3'>
            <Button onClick={() => setAddSheetOpen(true)}>
              <Users className='mr-2 h-4 w-4' />
              Add Customer
            </Button>
            <CSVImportDialog />
          </div>
        </div>
      )}

      {/* Add Customer Sheet */}
      <AddCustomerSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />

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
    </div>
  )
}
