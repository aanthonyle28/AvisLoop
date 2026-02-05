'use client'

import { Button } from '@/components/ui/button'
import { CSVImportDialog } from '@/components/customers/csv-import-dialog'

interface CustomerImportStepProps {
  onComplete: () => void
  onGoBack: () => void
}

/**
 * Step 6: Customer Import
 * Renders CSV import dialog with option to skip.
 * Import is optional - users can always import later.
 */
export function CustomerImportStep({
  onComplete,
  onGoBack,
}: CustomerImportStepProps) {
  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Import your customers</h1>
        <p className="text-muted-foreground text-lg">
          Upload a CSV file or skip to add customers later.
        </p>
      </div>

      {/* Import section */}
      <div className="space-y-4">
        {/* CSV Import Dialog (self-contained) */}
        <div className="flex justify-center">
          <CSVImportDialog />
        </div>

        {/* Info banner about SMS consent */}
        <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> When importing customers with phone numbers, you can set their SMS consent status in the customer list later.
          </p>
        </div>
      </div>

      {/* Button row */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          className="flex-1 h-12 text-base"
        >
          Back
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 h-12 text-base"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
