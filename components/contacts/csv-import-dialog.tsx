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
import { bulkCreateContacts, getContacts, type BulkCreateResult } from '@/lib/actions/contact'
import { contactSchema } from '@/lib/validations/contact'
import { cn } from '@/lib/utils'

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
  phone?: string
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

  // Reset dialog state
  const resetDialog = useCallback(() => {
    setStep('upload')
    setFile(null)
    setParsedRows([])
    setExistingEmails(new Set())
    setImportResult(null)
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
        const { contacts } = await getContacts()
        const existingEmailsSet = new Set(contacts.map(c => c.email.toLowerCase()))
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
          const phone = mappedRow.phone || ''

          // Validate with schema
          const parsed = contactSchema.safeParse({ name, email, phone })

          const isValid = parsed.success
          const isDuplicate = isValid && existingEmailsSet.has(email.toLowerCase())
          const errors = parsed.success ? [] : Object.values(parsed.error.flatten().fieldErrors).flat()

          return {
            name,
            email,
            phone,
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

    // Filter valid, non-duplicate contacts
    const contactsToImport = parsedRows
      .filter(row => row.isValid && !row.isDuplicate)
      .map(row => ({
        name: row.name,
        email: row.email,
        phone: row.phone,
      }))

    const result = await bulkCreateContacts(contactsToImport)
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
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-lg font-medium">Drop CSV file here...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Drop CSV file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">
                    Accepts CSV files with columns: name, email, phone (optional)
                  </p>
                </>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <CSVPreviewTable rows={parsedRows} existingEmails={existingEmails} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} contact{validCount !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Importing contacts...</p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="space-y-4">
            {importResult?.success ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Import Complete</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Created: <span className="font-medium text-green-600">{importResult.data?.created || 0}</span></p>
                    <p>Skipped (duplicates): <span className="font-medium text-yellow-600">{importResult.data?.skipped || 0}</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Import Failed</h3>
                  <p className="text-sm text-destructive">{importResult?.error || 'Unknown error'}</p>
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
