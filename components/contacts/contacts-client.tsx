'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ContactTable } from './contact-table'
import { AddContactSheet } from './add-contact-sheet'
import { EditContactSheet } from './edit-contact-sheet'
import { CSVImportDialog } from './csv-import-dialog'
import { ContactDetailDrawer } from './contact-detail-drawer'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
import {
  archiveContact,
  restoreContact,
  deleteContact,
  bulkArchiveContacts,
  bulkDeleteContacts,
} from '@/lib/actions/contact'
import type { Contact } from '@/lib/types/database'

interface ContactsClientProps {
  initialContacts: Contact[]
}

export function ContactsClient({ initialContacts }: ContactsClientProps) {
  const router = useRouter()

  // State for add contact sheet
  const [addSheetOpen, setAddSheetOpen] = useState(false)

  // State for editing contact
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  // State for detail drawer
  const [detailContact, setDetailContact] = useState<Contact | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)

  // Transition for action feedback
  const [, startTransition] = useTransition()

  // Action handlers
  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setEditSheetOpen(true)
  }

  const handleArchive = (id: string) => {
    startTransition(async () => {
      await archiveContact(id)
    })
  }

  const handleRestore = (id: string) => {
    startTransition(async () => {
      await restoreContact(id)
    })
  }

  const handleDelete = (id: string) => {
    // Show confirmation dialog for destructive action
    if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      startTransition(async () => {
        await deleteContact(id)
      })
    }
  }

  const handleBulkArchive = (ids: string[]) => {
    startTransition(async () => {
      await bulkArchiveContacts(ids)
    })
  }

  const handleBulkDelete = (ids: string[]) => {
    // Show confirmation dialog for destructive action
    if (window.confirm(`Are you sure you want to delete ${ids.length} contact${ids.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
      startTransition(async () => {
        await bulkDeleteContacts(ids)
      })
    }
  }

  // Detail drawer handlers
  const handleRowClick = (contact: Contact) => {
    setDetailContact(contact)
    setDetailDrawerOpen(true)
  }

  const handleSendFromDrawer = () => {
    router.push('/send')
    setDetailDrawerOpen(false)
  }

  const handleEditFromDrawer = (contact: Contact) => {
    setDetailDrawerOpen(false)
    // Small delay to avoid two sheets overlapping
    setTimeout(() => {
      handleEdit(contact)
    }, 200)
  }

  const handleArchiveFromDrawer = (contactId: string) => {
    handleArchive(contactId)
    setDetailDrawerOpen(false)
  }

  const handleViewHistoryFromDrawer = (contactId: string) => {
    router.push(`/history?contact=${contactId}`)
    setDetailDrawerOpen(false)
  }

  const hasContacts = initialContacts.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer contacts for review requests
          </p>
        </div>

        {hasContacts && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
            <CSVImportDialog />
          </div>
        )}
      </div>

      {/* Content */}
      {hasContacts ? (
        <ContactTable
          data={initialContacts}
          onEdit={handleEdit}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
          onRowClick={handleRowClick}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            No contacts yet
          </h2>

          <p className="text-muted-foreground mb-8 max-w-md">
            Add your first contact to start sending review requests and building your reputation
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setAddSheetOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
            <CSVImportDialog />
          </div>
        </div>
      )}

      {/* Add Contact Sheet */}
      <AddContactSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />

      {/* Edit Contact Sheet */}
      <EditContactSheet
        contact={editingContact}
        open={editSheetOpen}
        onOpenChange={(open) => {
          setEditSheetOpen(open)
          if (!open) {
            setEditingContact(null)
          }
        }}
      />

      {/* Contact Detail Drawer */}
      <ContactDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open)
          if (!open) {
            setDetailContact(null)
          }
        }}
        contact={detailContact}
        onSend={handleSendFromDrawer}
        onEdit={handleEditFromDrawer}
        onArchive={handleArchiveFromDrawer}
        onViewHistory={handleViewHistoryFromDrawer}
      />
    </div>
  )
}
