'use client'

import { Button } from '@/components/ui/button'
import { AddressBook, Briefcase, Users } from '@phosphor-icons/react'
import { useAddJob } from '@/components/jobs/add-job-provider'

export function CustomersEmptyState() {
  const { openAddJob } = useAddJob()

  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
      <div className='rounded-full bg-muted p-6 mb-6'>
        <AddressBook size={48} weight="regular" className='text-muted-foreground' />
      </div>

      <h2 className='text-2xl font-semibold tracking-tight mb-2'>
        No customers yet
      </h2>

      <p className='text-muted-foreground mb-8 max-w-md'>
        Customers appear here as you complete jobs. Ready to add your first job?
      </p>

      <div className='flex flex-col sm:flex-row gap-3'>
        <Button onClick={openAddJob}>
          <Briefcase className='mr-2 h-4 w-4' weight="regular" />
          Add Your First Job
        </Button>
      </div>

      <p className='text-sm text-muted-foreground mt-6 max-w-sm'>
        When you complete a job, a customer record is automatically created and enrolled in your review campaign.
      </p>
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
