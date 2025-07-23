'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FileImage, X, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UploadFile } from '@/store/app-store'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

interface FilePreviewProps {
  file: UploadFile
  validation?: ValidationResult
  onRemove: () => void
}

const statusIcons = {
  pending: Clock,
  uploading: Zap,
  validating: Clock,
  processing: Zap,
  complete: CheckCircle,
  error: AlertTriangle,
}

const statusColors = {
  pending: 'text-muted-foreground',
  uploading: 'text-blue-500',
  validating: 'text-yellow-500',
  processing: 'text-medical-primary',
  complete: 'text-medical-success',
  error: 'text-medical-danger',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileType(file: File): string {
  if (file.type.startsWith('image/')) {
    return file.type.split('/')[1].toUpperCase()
  }
  if (file.type === 'application/dicom' || file.name.toLowerCase().endsWith('.dcm')) {
    return 'DICOM'
  }
  return 'Unknown'
}

export function FilePreview({ file, validation, onRemove }: FilePreviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Generate preview for image files
  if (!imagePreview && file.file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file.file)
  }

  const StatusIcon = statusIcons[file.status]
  const statusColor = statusColors[file.status]
  
  const hasErrors = validation && validation.errors.length > 0
  const hasWarnings = validation && validation.warnings.length > 0

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-card",
      hasErrors && "border-medical-danger bg-medical-danger/5",
      file.status === 'complete' && "border-medical-success bg-medical-success/5"
    )}>
      <div className="flex items-center space-x-4">
        {/* File Preview/Icon */}
        <div className="flex-shrink-0">
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt={`Preview of ${file.file.name}`}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded border"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
              <FileImage className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-foreground truncate">{file.file.name}</h4>
            <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
              {getFileType(file.file)}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
            <span>{formatFileSize(file.file.size)}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <StatusIcon className={cn("w-4 h-4", statusColor)} />
              <span className={cn("capitalize", statusColor)}>
                {file.status === 'processing' ? 'AI Processing' : file.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {(file.status === 'uploading' || file.status === 'processing') && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {file.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="font-medium">{file.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    file.status === 'uploading' ? "bg-blue-500" : "bg-medical-primary"
                  )}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {hasErrors && validation && (
            <div className="text-sm text-medical-danger space-y-1">
              {validation.errors.map((error, idx) => (
                <div key={idx} className="flex items-start space-x-1">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {hasWarnings && validation && (
            <div className="text-sm text-medical-warning space-y-1 mt-2">
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="flex items-start space-x-1">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {file.error && (
            <div className="text-sm text-medical-danger mt-2">
              <div className="flex items-start space-x-1">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{file.error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={file.status === 'uploading' || file.status === 'processing'}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${file.file.name}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}