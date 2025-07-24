/**
 * Client-side storage utilities for handling file uploads
 * This file is safe for browser use and doesn't import server-side modules
 */

// File type constants
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom'],
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export interface UploadResult {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  studyId: string
  uploadedAt: string
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
  }

  // Check file type
  const isAcceptedType = Object.keys(SUPPORTED_IMAGE_TYPES).includes(file.type)
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
    warnings,
  }
}

/**
 * Upload a single file via API
 */
export async function uploadFile(
  file: File,
  options: {
    studyId: string
    metadata?: Record<string, string>
    onProgress?: (progress: number) => void
  }
): Promise<UploadResult> {
  const { studyId, metadata = {}, onProgress } = options

  // Validate file
  const validation = validateFile(file)
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
  }

  onProgress?.(10)

  // Create form data
  const formData = new FormData()
  formData.append('file', file)
  formData.append('studyId', studyId)
  if (Object.keys(metadata).length > 0) {
    formData.append('metadata', JSON.stringify(metadata))
  }

  onProgress?.(25)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    onProgress?.(90)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Upload failed with status ${response.status}`)
    }

    const result = await response.json()
    
    onProgress?.(100)

    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }

    return result.data
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadFiles(
  files: File[],
  options: {
    studyId: string
    metadata?: Record<string, string>
    onFileProgress?: (fileIndex: number, progress: number) => void
    onOverallProgress?: (progress: number) => void
  }
): Promise<UploadResult[]> {
  const { onFileProgress, onOverallProgress } = options
  const results: UploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    try {
      const result = await uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          onFileProgress?.(i, progress)
          
          // Calculate overall progress
          const completedFiles = i
          const currentFileProgress = progress / 100
          const overallProgress = ((completedFiles + currentFileProgress) / files.length) * 100
          onOverallProgress?.(overallProgress)
        },
      })
      
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload file ${file.name}:`, error)
      // Continue with other files but track the error
      throw error
    }
  }
  
  return results
}

/**
 * Generate a presigned URL for direct upload
 */
export async function generatePresignedUrl(
  fileName: string,
  contentType: string,
  studyId: string
): Promise<{
  uploadUrl: string
  key: string
  expiresIn: number
}> {
  const params = new URLSearchParams({
    fileName,
    contentType,
    studyId,
  })

  try {
    const response = await fetch(`/api/upload?${params}`, {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `Failed to generate presigned URL: ${response.status}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate presigned URL')
    }

    return result.data
  } catch (error) {
    console.error('Presigned URL generation error:', error)
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}