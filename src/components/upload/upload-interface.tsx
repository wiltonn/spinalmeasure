'use client'

import { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileImage, AlertCircle, CheckCircle } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { FilePreview } from './file-preview'
import { ProcessingFeedback } from './processing-feedback'

const ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom']
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_FILES = 10

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

function validateFile(file: File): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 50MB limit`)
  }

  // Check file type
  const isAcceptedType = Object.keys(ACCEPTED_FORMATS).some(type => 
    file.type === type || file.type.startsWith(type)
  )
  
  if (!isAcceptedType) {
    errors.push(`File type "${file.type}" is not supported. Please use JPEG, PNG, or DICOM files.`)
  }

  // Warnings for optimal processing
  if (file.size < 1024 * 1024) { // < 1MB
    warnings.push('File size is quite small. Ensure image has sufficient resolution (≥1024px) for accurate analysis.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function UploadInterface() {
  const { uploadQueue, addToUploadQueue, removeFromUploadQueue } = useAppStore()
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles)
    }

    // Validate accepted files
    const validFiles: File[] = []
    const newValidationResults: Record<string, ValidationResult> = {}

    acceptedFiles.forEach(file => {
      const validation = validateFile(file)
      newValidationResults[file.name] = validation
      
      if (validation.isValid) {
        validFiles.push(file)
      }
    })

    setValidationResults(prev => ({ ...prev, ...newValidationResults }))

    // Add valid files to queue
    if (validFiles.length > 0) {
      if (uploadQueue.length + validFiles.length > MAX_FILES) {
        console.warn(`Cannot add ${validFiles.length} files. Maximum ${MAX_FILES} files allowed.`)
        const allowedCount = MAX_FILES - uploadQueue.length
        if (allowedCount > 0) {
          addToUploadQueue(validFiles.slice(0, allowedCount))
        }
      } else {
        addToUploadQueue(validFiles)
      }
    }
  }, [uploadQueue.length, addToUploadQueue])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - uploadQueue.length,
  })

  const handleRemoveFile = (fileId: string) => {
    const file = uploadQueue.find(f => f.id === fileId)
    if (file) {
      delete validationResults[file.file.name]
      setValidationResults({ ...validationResults })
    }
    removeFromUploadQueue(fileId)
  }

  const hasFiles = uploadQueue.length > 0
  const isProcessing = uploadQueue.some(f => 
    f.status === 'uploading' || f.status === 'processing' || f.status === 'validating'
  )

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Medical Images</h2>
        <p className="text-muted-foreground">
          Drop your X-ray images here or click to browse. Supports JPEG, PNG, and DICOM files up to 50MB each.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-offset-2",
          isDragActive && !isDragReject && "border-medical-primary bg-medical-primary/5",
          isDragReject && "border-medical-danger bg-medical-danger/5",
          !isDragActive && "border-border",
          isProcessing && "pointer-events-none opacity-60"
        )}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            isDragActive && !isDragReject ? "bg-medical-primary text-white" : "bg-muted text-muted-foreground"
          )}>
            {isDragActive ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div>
            <p className="text-lg font-medium text-foreground">
              {isDragActive 
                ? isDragReject 
                  ? "Some files are not supported"
                  : "Drop files here"
                : "Drag & drop files here"
              }
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or <span className="font-medium text-medical-primary">click to browse</span>
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <FileImage className="w-4 h-4" />
              <span>JPEG, PNG, DICOM</span>
            </div>
            <div>Max 50MB per file</div>
            <div>Up to {MAX_FILES} files</div>
          </div>
        </div>
      </div>

      {/* File Queue */}
      {hasFiles && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Upload Queue ({uploadQueue.length}/{MAX_FILES})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                uploadQueue.forEach(file => handleRemoveFile(file.id))
              }}
              disabled={isProcessing}
            >
              Clear All
            </Button>
          </div>

          <div className="grid gap-4">
            {uploadQueue.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                validation={validationResults[file.file.name]}
                onRemove={() => handleRemoveFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processing Feedback */}
      {isProcessing && <ProcessingFeedback />}

      {/* Validation Messages */}
      {Object.entries(validationResults).some(([, result]) => result.errors.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 text-sm">
            {Object.entries(validationResults)
              .filter(([, result]) => result.errors.length > 0)
              .map(([fileName, result]) => (
                <div key={fileName} className="ml-7">
                  <span className="font-medium">{fileName}:</span>
                  <ul className="list-disc list-inside ml-4">
                    {result.errors.map((error, idx) => (
                      <li key={idx} className="text-medical-danger">{error}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}