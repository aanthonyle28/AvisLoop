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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { CSVPreviewTable } from './csv-preview-table'
import { bulkCreateCustomers, getCustomers, type BulkCreateResult } from '@/lib/actions/customer'
import { customerSchema } from '@/lib/validations/customer'
import type { Customer } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { parseAndValidatePhone } from '@/lib/utils/phone'
import { PhoneReviewTable } from '@/components/customers/phone-review-table'

// Header mapping from research
const HEADER_MAPPINGS: Record<string, string> = {
  'name': 'name', 'Name': 'name', 'NAME': 'name',
  'full_name': 'name', 'fullname': 'name', 'contact_name': 'name',
  'First Name': 'name', 'first_name': 'name',
  'email': 'email', 'Email': 'email', 'EMAIL': 'email',
  'email_address': 'email', 'E-mail': 'email',
  'phone': 'phone', 'Phone': 'phone', 'PHONE': 'phone',
  'phone_number': 'phone', 'mobile': 'phone', 'Mobile': 'phone',
}

interface ParsedRow {
  name: string
  email: string
  phone: string | null        // Raw CSV value
  phoneE164: string | null    // Parsed E.164 (null if invalid)
  phoneStatus: 'valid' | 'invalid' | 'missing'
  isValid: boolean
  isDuplicate: boolean
  errors: string[]
}

type Step = 'upload' | 'preview' | 'importing' | 'complete'

export function CSVImportDialog() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set())
  const [importResult, setImportResult] = useState<BulkCreateResult | null>(null)
  const [showPhoneReview, setShowPhoneReview] = useState(false)
  const [phoneIssues, setPhoneIssues] = useState<Array<{
    id: string
    name: string
    email: string
    rawPhone: string
    phoneStatus: 'invalid'
  }>>([])


  // Reset dialog state
  const resetDialog = useCallback(() => {
    setStep('upload')
    setFile(null)
    setParsedRows([])
    setExistingEmails(new Set())
    setImportResult(null)
    setShowPhoneReview(false)
    setPhoneIssues([])
  }, [])

  // Handle file drop/selection
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Fetch existing emails from database
        const { customers: existingCustomers } = await getCustomers()
        const existingEmailsSet = new Set(existingCustomers.map((c: Customer) => c.email.toLowerCase()))
        setExistingEmails(existingEmailsSet)

        // Map and validate rows
        const rows: ParsedRow[] = (results.data as Record<string, string>[]).map((row) => {
          // Auto-map headers
          const mappedRow: Record<string, string> = {}
          for (const [key, value] of Object.entries(row)) {
            const mappedKey = HEADER_MAPPINGS[key] || key.toLowerCase()
            mappedRow[mappedKey] = value
          }

          const name = mappedRow.name || ''
          const email = mappedRow.email || ''
          const rawPhone = mappedRow.phone || ''

          // Parse phone with libphonenumber-js
          const phoneResult = parseAndValidatePhone(rawPhone)

          // Validate with schema (phone optional)
          const parsed = customerSchema.safeParse({ name, email, phone: rawPhone })

          const isValid = parsed.success
          const isDuplicate = isValid && existingEmailsSet.has(email.toLowerCase())
          const errors = parsed.success ? [] : Object.values(parsed.error.flatten().fieldErrors).flat()

          return {
            name,
            email,
            phone: rawPhone || null,
            phoneE164: phoneResult.e164 || null,
            phoneStatus: phoneResult.status,
            isValid,
            isDuplicate,
            errors,
          }
        })

        setParsedRows(rows)
        setStep('preview')
      },
      error: () => {
        alert('Failed to parse CSV file. Please check the file format.')
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  })

  // Handle import
  const handleImport = async () => {
    setStep('importing')

    // Filter valid, non-duplicate customers
    const customersToImport = parsedRows
      .filter(row => row.isValid && !row.isDuplicate)
      .map(row => ({
        name: row.name,
        email: row.email,
        phone: row.phone,
        phoneE164: row.phoneE164,
        phoneStatus: row.phoneStatus,
      }))

    const result = await bulkCreateCustomers(customersToImport)

    // Extract phone issues from result
    if (result.success && result.data?.customersWithPhoneIssues) {
      setPhoneIssues(result.data.customersWithPhoneIssues)
    }

    setImportResult(result)
    setStep('complete')
  }

  // Calculate counts
  const validCount = parsedRows.filter(r => r.isValid && !r.isDuplicate).length

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        resetDialog()
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Upload className='mr-2 h-4 w-4' />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className='space-y-4'>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              {isDragActive ? (
                <p className='text-lg font-medium'>Drop CSV file here...</p>
              ) : (
                <>
                  <p className='text-lg font-medium mb-2'>Drop CSV file here or click to upload</p>
                  <p className='text-sm text-muted-foreground'>
                    Accepts CSV files with columns: name, email, phone (optional)
                  </p>
                </>
              )}
            </div>
            {file && (
              <div className='flex items-center gap-2 text-sm'>
                <FileSpreadsheet className='h-4 w-4' />
                <span className='font-medium'>{file.name}</span>
                <span className='text-muted-foreground'>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className='space-y-4'>
            <CSVPreviewTable rows={parsedRows} existingEmails={existingEmails} />
            <DialogFooter>
              <Button variant='outline' onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} customer{validCount !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className='flex flex-col items-center justify-center py-12 space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-primary' />
            <p className='text-lg font-medium'>Importing contacts...</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className='space-y-4'>
            {importResult?.success ? (
              <>
                <div className='flex flex-col items-center justify-center py-8 space-y-4'>
                  <CheckCircle className='h-16 w-16 text-green-600' />
                  <div className='text-center space-y-2'>
                    <h3 className='text-lg font-semibold'>Import Complete</h3>
                    <div className='text-sm text-muted-foreground space-y-1'>
                      <p>Created: <span className='font-medium text-green-600'>{importResult.data?.created || 0}</span></p>
                      <p>Skipped (duplicates): <span className='font-medium text-yellow-600'>{importResult.data?.skipped || 0}</span></p>
                      {importResult.data?.phoneNeedsReview !== undefined && importResult.data.phoneNeedsReview > 0 && (
                        <p>Phone needs review: <span className='font-medium text-amber-600'>{importResult.data.phoneNeedsReview}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phone review prompt */}
                {phoneIssues.length > 0 && !showPhoneReview && (
                  <div className='p-4 bg-amber-50 dark:bg-amber-950 rounded-lg'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-amber-700 dark:text-amber-300'>
                          {phoneIssues.length} phone number{phoneIssues.length !== 1 ? 's' : ''} need review
                        </p>
                        <p className='text-sm text-amber-600 dark:text-amber-400'>
                          These customers were imported but have invalid phone formats
                        </p>
                      </div>
                      <Button
                        variant='outline'
                        onClick={() => setShowPhoneReview(true)}
                      >
                        Review phone issues
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phone review table */}
                {showPhoneReview && phoneIssues.length > 0 && (
                  <PhoneReviewTable
                    issues={phoneIssues}
                    onComplete={() => {
                      setShowPhoneReview(false)
                      setPhoneIssues([])
                    }}
                  />
                )}
              </>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 space-y-4'>
                <AlertCircle className='h-16 w-16 text-destructive' />
                <div className='text-center space-y-2'>
                  <h3 className='text-lg font-semibold'>Import Failed</h3>
                  <p className='text-sm text-destructive'>{importResult?.error || 'Unknown error'}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => {
                setOpen(false)
                resetDialog()
              }}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
