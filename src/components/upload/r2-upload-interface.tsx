'use client'

import { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileImage, AlertCircle, CheckCircle, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useFileUpload } from '@/hooks/use-file-upload'
import { validateFile, SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/storage-client'

const MAX_FILES = 10

interface FileWithPreview {
  file: File
  id: string
  preview?: string
}

interface UploadResult {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  studyId: string
  uploadedAt: string
}

interface R2UploadInterfaceProps {
  studyId: string
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: string) => void
}

export function R2UploadInterface({ 
  studyId, 
  onUploadComplete, 
  onUploadError 
}: R2UploadInterfaceProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [validationResults, setValidationResults] = useState<Record<string, ReturnType<typeof validateFile>>>({})

  const {
    uploads,
    isUploading,
    uploadFiles,
    clearUploads,
    removeUpload,
  } = useFileUpload({
    studyId,
    onUploadComplete,
    onUploadError,
  })

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles)
    }

    // Validate accepted files
    const validFiles: FileWithPreview[] = []
    const newValidationResults: Record<string, ReturnType<typeof validateFile>> = {}

    acceptedFiles.forEach(file => {
      const validation = validateFile(file)
      newValidationResults[file.name] = validation
      
      if (validation.isValid) {
        const fileWithPreview: FileWithPreview = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
        }

        // Create preview for image files
        if (file.type.startsWith('image/')) {
          fileWithPreview.preview = URL.createObjectURL(file)
        }

        validFiles.push(fileWithPreview)
      }
    })

    setValidationResults(prev => ({ ...prev, ...newValidationResults }))

    // Add valid files to queue
    if (validFiles.length > 0) {
      setFiles(prev => {
        const newFiles = [...prev, ...validFiles]
        if (newFiles.length > MAX_FILES) {
          console.warn(`Cannot add ${validFiles.length} files. Maximum ${MAX_FILES} files allowed.`)
          return newFiles.slice(0, MAX_FILES)
        }
        return newFiles
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: SUPPORTED_IMAGE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length,
    disabled: isUploading,
  })

  const handleRemoveFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file?.preview) {
      URL.revokeObjectURL(file.preview)
    }
    
    setFiles(prev => prev.filter(f => f.id !== fileId))
    
    // Remove from validation results
    if (file) {
      setValidationResults(prev => {
        const { [file.file.name]: _, ...rest } = prev
        return rest
      })
    }
  }, [files])

  const handleStartUpload = useCallback(async () => {
    if (files.length === 0) return

    const filesToUpload = files.map(f => f.file)
    
    try {
      await uploadFiles(filesToUpload)
      // Clear files after successful upload
      files.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      setFiles([])
      setValidationResults({})
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }, [files, uploadFiles])

  const handleClearAll = useCallback(() => {
    files.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    setFiles([])
    setValidationResults({})
    clearUploads()
  }, [files, clearUploads])

  const hasFiles = files.length > 0
  const hasValidationErrors = Object.values(validationResults).some(r => r.errors.length > 0)
  const canUpload = hasFiles && !hasValidationErrors && !isUploading

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
          isUploading && "pointer-events-none opacity-60"
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
              Files Ready for Upload ({files.length}/{MAX_FILES})
            </h3>
            <div className="flex gap-2">
              {canUpload && (
                <Button
                  onClick={handleStartUpload}
                  className="bg-medical-primary hover:bg-medical-primary/90"
                  disabled={isUploading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Upload
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={isUploading}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {files.map((fileItem) => (
              <FilePreviewCard
                key={fileItem.id}
                fileItem={fileItem}
                validation={validationResults[fileItem.file.name]}
                onRemove={() => handleRemoveFile(fileItem.id)}
                disabled={isUploading}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Upload Progress</h3>
          <div className="grid gap-4">
            {uploads.map((upload) => (
              <UploadProgressCard
                key={upload.fileId}
                upload={upload}
                onRemove={() => removeUpload(upload.fileId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Validation Messages */}
      {hasValidationErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Errors</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 text-sm">
            {Object.entries(validationResults)
              .filter(([, result]) => result.errors.length > 0)
              .map(([fileName, result]) => (
                <div key={fileName}>
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

// File preview card component
function FilePreviewCard({ 
  fileItem, 
  validation, 
  onRemove, 
  disabled 
}: {
  fileItem: FileWithPreview
  validation?: ReturnType<typeof validateFile>
  onRemove: () => void
  disabled: boolean
}) {
  const { file, preview } = fileItem
  const hasErrors = validation?.errors.length ?? 0 > 0
  const hasWarnings = validation?.warnings.length ?? 0 > 0

  return (
    <div className={cn(
      "flex items-center space-x-4 p-4 border rounded-lg",
      hasErrors && "border-medical-danger bg-medical-danger/5",
      hasWarnings && !hasErrors && "border-yellow-500 bg-yellow-50",
      !hasErrors && !hasWarnings && "border-border"
    )}>
      {/* File preview/icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={preview} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </>
        ) : (
          <FileImage className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(1)} MB • {file.type}
        </p>
        
        {/* Validation messages */}
        {hasErrors && (
          <div className="mt-1">
            {validation!.errors.map((error, idx) => (
              <p key={idx} className="text-xs text-medical-danger">{error}</p>
            ))}
          </div>
        )}
        {hasWarnings && !hasErrors && (
          <div className="mt-1">
            {validation!.warnings.map((warning, idx) => (
              <p key={idx} className="text-xs text-yellow-600">{warning}</p>
            ))}
          </div>
        )}
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}

// Upload progress card component  
interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}

function UploadProgressCard({ 
  upload, 
  onRemove 
}: {
  upload: UploadProgress
  onRemove: () => void
}) {
  const getStatusColor = () => {
    switch (upload.status) {
      case 'complete': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'uploading': return 'text-blue-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusText = () => {
    switch (upload.status) {
      case 'pending': return 'Waiting...'
      case 'uploading': return `Uploading... ${upload.progress}%`
      case 'processing': return 'Processing...'
      case 'complete': return 'Complete'
      case 'error': return `Error: ${upload.error}`
      default: return upload.status
    }
  }

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <FileImage className="w-8 h-8 text-muted-foreground flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{upload.fileName}</p>
        <div className="mt-1 space-y-1">
          <p className={cn("text-xs", getStatusColor())}>
            {getStatusText()}
          </p>
          {upload.status === 'uploading' && (
            <Progress value={upload.progress} className="h-1" />
          )}
        </div>
      </div>

      {upload.status === 'error' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}