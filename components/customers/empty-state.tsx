import { Button } from '@/components/ui/button'
import { Users, Upload, Plus } from '@phosphor-icons/react'

interface CustomersEmptyStateProps {
  onAddCustomer?: () => void
  onImportCSV?: () => void
}

export function CustomersEmptyState({ onAddCustomer, onImportCSV }: CustomersEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
      <div className='rounded-full bg-muted p-4 mb-4'>
        <Users size={32} weight="regular" className="text-muted-foreground" />
      </div>
      <h3 className='text-lg font-semibold mb-2'>No customers yet</h3>
      <p className='text-muted-foreground max-w-sm mb-6'>
        Add your first customer to start sending review requests. You can add them manually or import from a CSV file.
      </p>
      <div className='flex flex-col sm:flex-row gap-3'>
        {onAddCustomer && (
          <Button onClick={onAddCustomer}>
            <Plus size={16} weight="regular" />
            Add Customer
          </Button>
        )}
        {onImportCSV && (
          <Button variant='outline' onClick={onImportCSV}>
            <Upload size={16} weight="regular" />
            Import CSV
          </Button>
        )}
      </div>
    </div>
  )
}

// Filtered empty state when search returns no results
export function CustomersFilteredEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
      <div className='rounded-full bg-muted p-4 mb-4'>
        <Users size={32} weight="regular" className="text-muted-foreground" />
      </div>
      <h3 className='text-lg font-semibold mb-2'>No customers found</h3>
      <p className='text-muted-foreground max-w-sm'>
        Try adjusting your search or filter criteria.
      </p>
    </div>
  )
}
