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
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react'
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
                statusIcon = <XCircle size={16} className=' text-destructive' />
                rowClassName = 'bg-destructive/10'
              } else if (row.isDuplicate) {
                statusIcon = <Warning size={16} className=' text-warning' />
                rowClassName = 'bg-warning-bg'
              } else {
                statusIcon = <CheckCircle size={16} className=' text-success' />
              }

              return (
                <TableRow key={index} className={cn(rowClassName)}>
                  <TableCell>{statusIcon}</TableCell>
                  <TableCell className='font-medium'>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone || '-'}</TableCell>
                  <TableCell>
                    {row.isDuplicate && row.isValid ? (
                      <Badge variant='outline' className='bg-warning-bg text-warning-foreground border-warning-border'>
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
          <CheckCircle size={16} className=' text-success' />
          <span className='text-muted-foreground'>Valid:</span>
          <span className='font-medium text-success'>{validRows}</span>
        </div>
        <div className='flex items-center gap-2'>
          <XCircle size={16} className=' text-destructive' />
          <span className='text-muted-foreground'>Invalid:</span>
          <span className='font-medium text-destructive'>{invalidRows}</span>
        </div>
        <div className='flex items-center gap-2'>
          <Warning size={16} className=' text-warning' />
          <span className='text-muted-foreground'>Duplicates:</span>
          <span className='font-medium text-warning'>{duplicateRows}</span>
        </div>
      </div>
    </div>
  )
}
