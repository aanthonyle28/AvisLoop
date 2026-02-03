'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CSVPreviewRow {
  name: string
  email: string
  phone: string | null | undefined  // Accept both null and undefined
  phoneE164?: string | null   // Optional for compatibility
  phoneStatus?: 'valid' | 'invalid' | 'missing'  // Optional for compatibility
  isValid: boolean
  isDuplicate: boolean
  errors: string[]
}

interface CSVPreviewTableProps {
  rows: CSVPreviewRow[]
  existingEmails: Set<string>
}

export function CSVPreviewTable({ rows }: CSVPreviewTableProps) {
  // Calculate summary counts
  const totalRows = rows.length
  const validRows = rows.filter(r => r.isValid && !r.isDuplicate).length
  const invalidRows = rows.filter(r => !r.isValid).length
  const duplicateRows = rows.filter(r => r.isDuplicate && r.isValid).length

  return (
    <div className='space-y-4'>
      <div className='max-h-[400px] overflow-auto rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              let statusIcon
              let rowClassName = ''

              if (!row.isValid) {
                statusIcon = <XCircle className='h-4 w-4 text-destructive' />
                rowClassName = 'bg-destructive/10'
              } else if (row.isDuplicate) {
                statusIcon = <AlertTriangle className='h-4 w-4 text-yellow-600' />
                rowClassName = 'bg-yellow-50 dark:bg-yellow-950/20'
              } else {
                statusIcon = <CheckCircle className='h-4 w-4 text-green-600' />
              }

              return (
                <TableRow key={index} className={cn(rowClassName)}>
                  <TableCell>{statusIcon}</TableCell>
                  <TableCell className='font-medium'>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone || '-'}</TableCell>
                  <TableCell>
                    {row.isDuplicate && row.isValid ? (
                      <Badge variant='outline' className='bg-yellow-50 text-yellow-800 border-yellow-300'>
                        Duplicate
                      </Badge>
                    ) : row.errors.length > 0 ? (
                      <span className='text-xs text-destructive'>{row.errors[0]}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary Footer */}
      <div className='flex items-center gap-6 text-sm'>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground'>Total:</span>
          <span className='font-medium'>{totalRows}</span>
        </div>
        <div className='flex items-center gap-2'>
          <CheckCircle className='h-4 w-4 text-green-600' />
          <span className='text-muted-foreground'>Valid:</span>
          <span className='font-medium text-green-600'>{validRows}</span>
        </div>
        <div className='flex items-center gap-2'>
          <XCircle className='h-4 w-4 text-destructive' />
          <span className='text-muted-foreground'>Invalid:</span>
          <span className='font-medium text-destructive'>{invalidRows}</span>
        </div>
        <div className='flex items-center gap-2'>
          <AlertTriangle className='h-4 w-4 text-yellow-600' />
          <span className='text-muted-foreground'>Duplicates:</span>
          <span className='font-medium text-yellow-600'>{duplicateRows}</span>
        </div>
      </div>
    </div>
  )
}
