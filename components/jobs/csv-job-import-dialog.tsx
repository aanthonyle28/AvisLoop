'use client'

import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { useDropzone } from 'react-dropzone'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload,
  FileXls,
  WarningCircle,
  CheckCircle,
  CircleNotch,
} from '@phosphor-icons/react'
import {
  bulkCreateJobsWithCustomers,
  type BulkJobCreateResult,
} from '@/lib/actions/job'
import {
  csvJobRowSchema,
  JOB_CSV_HEADER_MAPPINGS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type CSVJobRow,
} from '@/lib/validations/job'
import { cn } from '@/lib/utils'

interface ParsedJobRow extends CSVJobRow {
  isValid: boolean
  errors: string[]
}

type Step = 'upload' | 'preview' | 'importing' | 'complete'

export function CSVJobImportDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [parsedRows, setParsedRows] = useState<ParsedJobRow[]>([])
  const [importResult, setImportResult] = useState<BulkJobCreateResult | null>(null)

  const resetDialog = useCallback(() => {
    setStep('upload')
    setParsedRows([])
    setImportResult(null)
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedJobRow[] = (results.data as Record<string, string>[]).map((row) => {
          // Map headers
          const mappedRow: Record<string, string> = {}
          for (const [key, value] of Object.entries(row)) {
            const mappedKey = JOB_CSV_HEADER_MAPPINGS[key] || key.toLowerCase()
            mappedRow[mappedKey] = value
          }

          // Normalize service type (case-insensitive)
          let serviceType = mappedRow.serviceType?.toLowerCase() || ''
          if (!SERVICE_TYPES.includes(serviceType as typeof SERVICE_TYPES[number])) {
            serviceType = 'other'
          }

          const parsed = csvJobRowSchema.safeParse({
            customerName: mappedRow.customerName || '',
            customerEmail: mappedRow.customerEmail || '',
            customerPhone: mappedRow.customerPhone || null,
            serviceType: serviceType || 'other',
            completionDate: mappedRow.completionDate || null,
            notes: mappedRow.notes || null,
          })

          if (parsed.success) {
            return {
              ...parsed.data,
              isValid: true,
              errors: [],
            }
          } else {
            return {
              customerName: mappedRow.customerName || '',
              customerEmail: mappedRow.customerEmail || '',
              customerPhone: mappedRow.customerPhone || null,
              serviceType: (serviceType || 'other') as typeof SERVICE_TYPES[number],
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
      error: () => {
        alert('Failed to parse CSV file.')
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
  const invalidCount = parsedRows.filter(r => !r.isValid).length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetDialog()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload size={16} weight="regular" className="mr-2" />
          Import Jobs CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Jobs from CSV</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <FileXls size={48} weight="regular" className="mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop CSV file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Drop CSV file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Required columns: customer_name, email, service_type
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Optional: phone, completion_date, notes
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="text-success">
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="text-destructive">
                  {invalidCount} invalid
                </Badge>
              )}
            </div>

            <div className="border rounded-lg overflow-x-auto max-h-64">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Service</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className={cn(!row.isValid && 'bg-destructive/10')}>
                      <td className="px-3 py-2">{row.customerName}</td>
                      <td className="px-3 py-2">{row.customerEmail}</td>
                      <td className="px-3 py-2">{SERVICE_TYPE_LABELS[row.serviceType] || row.serviceType}</td>
                      <td className="px-3 py-2">{row.completionDate || 'Today'}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <CheckCircle size={16} className="text-success" />
                        ) : (
                          <span className="text-destructive text-xs">{row.errors.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 20 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  ...and {parsedRows.length - 20} more rows
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium">Note:</p>
              <p className="text-muted-foreground">
                Customers will be created automatically. Existing customers (by email) will be linked.
                Jobs will be imported as &quot;completed&quot; status.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} job{validCount !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CircleNotch size={48} weight="regular" className="animate-spin text-primary" />
            <p className="text-lg font-medium">Importing jobs...</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="space-y-4">
            {importResult?.success ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle size={64} weight="regular" className="text-success" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Import Complete</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Jobs created: <span className="font-medium text-success">{importResult.data?.jobsCreated || 0}</span></p>
                    <p>New customers: <span className="font-medium text-info">{importResult.data?.customersCreated || 0}</span></p>
                    <p>Linked to existing: <span className="font-medium">{importResult.data?.customersLinked || 0}</span></p>
                    {(importResult.data?.skipped || 0) > 0 && (
                      <p>Skipped: <span className="font-medium text-warning">{importResult.data?.skipped}</span></p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <WarningCircle size={64} weight="regular" className="text-destructive" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Import Failed</h3>
                  <p className="text-sm text-destructive">{importResult?.error || 'Unknown error'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { setOpen(false); resetDialog(); }}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
