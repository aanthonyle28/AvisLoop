'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Paperclip, X, SpinnerGap } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ACCEPTED_MIME: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
}

export interface UploadedFile {
  name: string
  readUrl: string
  storagePath: string
}

interface AttachmentUploaderProps {
  projectId: string
  businessId: string
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function AttachmentUploader({
  projectId,
  businessId,
  onFilesChange,
  maxFiles = 5,
  disabled = false,
}: AttachmentUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadingCount, setUploadingCount] = useState(0)

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    try {
      // Step 1: Get signed upload URL from server
      const urlRes = await fetch('/api/tickets/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          projectId,
          businessId,
        }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({})) as Record<string, string>
        toast.error(err.error ?? 'Failed to get upload URL')
        return null
      }

      const { signedUploadUrl, storagePath, readUrl } = await urlRes.json() as {
        signedUploadUrl: string
        storagePath: string
        readUrl: string | null
      }

      // Step 2: PUT file directly to Supabase Storage (bypasses Next.js body limit)
      const putRes = await fetch(signedUploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!putRes.ok) {
        toast.error('Upload failed. Please try again.')
        return null
      }

      return { name: file.name, readUrl: readUrl ?? storagePath, storagePath }
    } catch (err) {
      console.error('[AttachmentUploader] upload error:', err)
      toast.error('Upload failed unexpectedly')
      return null
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files per message`)
        return
      }

      setUploadingCount((c) => c + acceptedFiles.length)

      const results = await Promise.all(acceptedFiles.map(uploadFile))
      const succeeded = results.filter((r): r is UploadedFile => r !== null)

      setUploadingCount((c) => c - acceptedFiles.length)

      const updated = [...uploadedFiles, ...succeeded]
      setUploadedFiles(updated)
      onFilesChange(updated)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uploadedFiles, maxFiles, projectId, businessId, onFilesChange]
  )

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(updated)
    onFilesChange(updated)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: MAX_SIZE_BYTES,
    disabled: disabled || uploadedFiles.length >= maxFiles,
    onDropRejected: (fileRejections) => {
      const firstError = fileRejections[0]?.errors[0]
      if (firstError?.code === 'file-too-large') {
        toast.error('File exceeds 10MB limit')
      } else if (firstError?.code === 'file-invalid-type') {
        toast.error('File type not allowed. Use JPEG, PNG, GIF, WebP, or PDF.')
      } else {
        toast.error(
          'File rejected: ' + (firstError?.message ?? 'unknown error')
        )
      }
    },
  })

  return (
    <div className="space-y-2">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/50',
          (disabled || uploadedFiles.length >= maxFiles) &&
            'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Paperclip
          size={20}
          className="mx-auto text-muted-foreground mb-1"
        />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag & drop or click to attach files'}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          PNG, JPG, GIF, WebP, PDF — max 10MB each
        </p>
      </div>

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SpinnerGap size={16} className="animate-spin" />
          Uploading {uploadingCount} file{uploadingCount !== 1 ? 's' : ''}...
        </div>
      )}

      {/* Uploaded file list */}
      {uploadedFiles.length > 0 && (
        <ul className="space-y-1">
          {uploadedFiles.map((file, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
