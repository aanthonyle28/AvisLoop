import { Button } from '@/components/ui/button'
import { Users, Upload } from 'lucide-react'

interface ContactsEmptyStateProps {
  onAddContact: () => void
  onImportCSV: () => void
}

export function ContactsEmptyState({ onAddContact, onImportCSV }: ContactsEmptyStateProps) {
  return (
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
        <Button onClick={onAddContact}>
          <Users className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
        <Button variant="outline" onClick={onImportCSV}>
          <Upload className="mr-2 h-4 w-4" />
          Import from CSV
        </Button>
      </div>
    </div>
  )
}
