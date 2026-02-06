'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileXls,
  CheckCircle,
  CircleNotch,
  Briefcase,
} from '@phosphor-icons/react'
import {
  bulkCreateJobsWithCustomers,
  type BulkJobCreateResult,
} from '@/lib/actions/job'
import {
  csvJobRowSchema,
  JOB_CSV_HEADER_MAPPINGS,
  SERVICE_TYPES,
  type CSVJobRow,
} from '@/lib/validations/job'
import { cn } from '@/lib/utils'

interface CustomerImportStepProps {
  onComplete: () => void
  onGoBack: () => void
}

interface ParsedRow extends CSVJobRow {
  isValid: boolean
  errors: string[]
}

/**
 * Step 6: Job Import (V2)
 * Imports jobs with automatic customer creation.
 * Renamed from CustomerImportStep but kept filename for compatibility.
 */
export function CustomerImportStep({
  onComplete,
  onGoBack,
}: CustomerImportStepProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importResult, setImportResult] = useState<BulkJobCreateResult | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    Papa.parse(acceptedFiles[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = (results.data as Record<string, string>[]).map((row) => {
          const mappedRow: Record<string, string> = {}
          for (const [key, value] of Object.entries(row)) {
            const mappedKey = JOB_CSV_HEADER_MAPPINGS[key] || key.toLowerCase()
            mappedRow[mappedKey] = value
          }

          let serviceType = mappedRow.serviceType?.toLowerCase() || 'other'
          if (!SERVICE_TYPES.includes(serviceType as typeof SERVICE_TYPES[number])) {
            serviceType = 'other'
          }

          const parsed = csvJobRowSchema.safeParse({
            customerName: mappedRow.customerName || '',
            customerEmail: mappedRow.customerEmail || '',
            customerPhone: mappedRow.customerPhone || null,
            serviceType: serviceType,
            completionDate: mappedRow.completionDate || null,
            notes: mappedRow.notes || null,
          })

          if (parsed.success) {
            return { ...parsed.data, isValid: true, errors: [] }
          } else {
            return {
              customerName: mappedRow.customerName || '',
              customerEmail: mappedRow.customerEmail || '',
              customerPhone: mappedRow.customerPhone || null,
              serviceType: serviceType as typeof SERVICE_TYPES[number],
              completionDate: mappedRow.completionDate || null,
              notes: mappedRow.notes || null,
              isValid: false,
              errors: Object.values(parsed.error.flatten().fieldErrors).flat(),
            }
          }
        })

        setParsedRows(rows)
        setStep('preview')
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const handleImport = async () => {
    setStep('importing')
    const validRows = parsedRows.filter(r => r.isValid)
    const result = await bulkCreateJobsWithCustomers(validRows)
    setImportResult(result)
    setStep('complete')
  }

  const validCount = parsedRows.filter(r => r.isValid).length

  // Upload step
  if (step === 'upload') {
    return (
      <div className="space-y-8">
        {/* Heading */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Briefcase size={24} weight="regular" className="text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Import past jobs</h1>
          <p className="text-muted-foreground text-lg">
            Have existing job records? Import them to get started quickly.
          </p>
          <p className="text-sm text-muted-foreground">
            Customer records will be created automatically.
          </p>
        </div>

        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          <FileXls size={40} weight="regular" className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">Drop CSV file here or click to upload</p>
          <p className="text-sm text-muted-foreground">
            Required: customer_name, email, service_type
          </p>
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
            Skip for now
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          You can always import jobs later from the Jobs page
        </p>
      </div>
    )
  }

  // Preview step
  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Preview</h2>
          <Badge variant="outline" className="text-green-600">{validCount} valid jobs</Badge>
        </div>

        <div className="border rounded-lg overflow-x-auto max-h-48 text-sm">
          <table className="min-w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {parsedRows.slice(0, 10).map((row, i) => (
                <tr key={i} className={cn(!row.isValid && 'bg-red-50 dark:bg-red-950/20')}>
                  <td className="px-3 py-2">{row.customerName}</td>
                  <td className="px-3 py-2">{row.serviceType}</td>
                  <td className="px-3 py-2">
                    {row.isValid ? <CheckCircle size={16} className="text-green-600" /> : 'Invalid'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setStep('upload')}
            className="flex-1 h-12 text-base"
          >
            Back
          </Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0}
            className="flex-1 h-12 text-base"
          >
            Import {validCount} Jobs
          </Button>
        </div>
      </div>
    )
  }

  // Importing step
  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <CircleNotch size={48} className="animate-spin text-primary" />
        <p className="font-medium text-lg">Importing jobs...</p>
      </div>
    )
  }

  // Complete step
  return (
    <div className="space-y-8 text-center">
      <CheckCircle size={64} weight="regular" className="mx-auto text-green-600" />
      <div>
        <h2 className="text-2xl font-semibold mb-2">Import Complete!</h2>
        <p className="text-muted-foreground">
          {importResult?.data?.jobsCreated || 0} jobs imported,{' '}
          {importResult?.data?.customersCreated || 0} new customers created
        </p>
      </div>
      <Button onClick={onComplete} className="h-12 text-base px-8">
        Continue
      </Button>
    </div>
  )
}
