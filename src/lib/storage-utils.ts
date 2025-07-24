import { r2Storage, type UploadResult } from './r2-storage'
import { nanoid } from 'nanoid'

/**
 * Storage utility functions for handling file uploads and management
 */

// File type constants
export const SUPPORTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom'],
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MULTIPART_THRESHOLD = 10 * 1024 * 1024 // 10MB - use multipart for larger files

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(
  fileName: string,
  options: {
    prefix?: string
    suffix?: string
    preserveExtension?: boolean
  } = {}
): string {
  const { prefix = '', suffix = '', preserveExtension = true } = options
  const fileId = nanoid()
  
  let key = fileId
  
  if (preserveExtension) {
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex > 0) {
      const extension = fileName.substring(lastDotIndex)
      key = `${fileId}${extension}`
    }
  }
  
  if (suffix) {
    const lastDotIndex = key.lastIndexOf('.')
    if (lastDotIndex > 0) {
      key = `${key.substring(0, lastDotIndex)}${suffix}${key.substring(lastDotIndex)}`
    } else {
      key = `${key}${suffix}`
    }
  }
  
  if (prefix) {
    key = `${prefix}/${key}`
  }
  
  return key
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(fileName: string): string | null {
  const extension = fileName.toLowerCase().split('.').pop()
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'dcm':
    case 'dicom':
      return 'application/dicom'
    default:
      return null
  }
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
 * Upload a single file to R2 storage
 */
export async function uploadFile(
  file: File,
  options: {
    prefix?: string
    metadata?: Record<string, string>
    onProgress?: (progress: number) => void
  } = {}
): Promise<UploadResult> {
  const { prefix = 'medical-images', metadata = {}, onProgress } = options

  // Validate file
  const validation = validateFile(file)
  if (!validation.isValid) {
    throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
  }

  // Generate storage key
  const storageKey = generateStorageKey(file.name, { prefix })

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer())

  // Prepare metadata
  const fileMetadata = {
    originalName: file.name,
    originalSize: file.size.toString(),
    uploadTimestamp: new Date().toISOString(),
    ...metadata,
  }

  onProgress?.(10)

  try {
    // Use multipart upload for large files
    if (file.size > MULTIPART_THRESHOLD) {
      return await uploadLargeFile(storageKey, buffer, file.type, fileMetadata, onProgress)
    } else {
      return await uploadSmallFile(storageKey, buffer, file.type, fileMetadata, onProgress)
    }
  } catch (error) {
    console.error('File upload error:', error)
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload small file using single PUT operation
 */
async function uploadSmallFile(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  onProgress?.(25)
  
  const result = await r2Storage.uploadFile(key, buffer, {
    contentType,
    metadata,
    cacheControl: 'public, max-age=31536000', // 1 year
  })
  
  onProgress?.(100)
  return result
}

/**
 * Upload large file using multipart upload
 */
async function uploadLargeFile(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata: Record<string, string>,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const PART_SIZE = 5 * 1024 * 1024 // 5MB parts
  const totalParts = Math.ceil(buffer.length / PART_SIZE)
  
  onProgress?.(15)

  // Initiate multipart upload
  const { uploadId } = await r2Storage.initiateMultipartUpload(key, {
    contentType,
    metadata,
  })

  const parts: Array<{ etag: string; partNumber: number }> = []

  try {
    // Upload parts
    for (let i = 0; i < totalParts; i++) {
      const start = i * PART_SIZE
      const end = Math.min(start + PART_SIZE, buffer.length)
      const partBuffer = buffer.subarray(start, end)
      
      const part = await r2Storage.uploadPart(key, uploadId, i + 1, partBuffer)
      parts.push(part)
      
      // Update progress (15% to 85%)
      const partProgress = 15 + (70 * (i + 1)) / totalParts
      onProgress?.(partProgress)
    }

    // Complete multipart upload
    onProgress?.(90)
    const result = await r2Storage.completeMultipartUpload(key, uploadId, parts)
    onProgress?.(100)
    
    return result
  } catch (error) {
    // Abort multipart upload on error
    try {
      await r2Storage.abortMultipartUpload(key, uploadId)
    } catch (abortError) {
      console.error('Failed to abort multipart upload:', abortError)
    }
    throw error
  }
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadFiles(
  files: File[],
  options: {
    prefix?: string
    metadata?: Record<string, string>
    onFileProgress?: (fileIndex: number, progress: number) => void
    onOverallProgress?: (progress: number) => void
  } = {}
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
 * Delete a file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    await r2Storage.deleteFile(key)
  } catch (error) {
    console.error('File deletion error:', error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate a presigned URL for direct file access
 */
export async function generateFileUrl(
  key: string,
  options: {
    expiresIn?: number
    downloadFileName?: string
  } = {}
): Promise<string> {
  const { expiresIn = 3600, downloadFileName } = options
  
  try {
    return await r2Storage.generatePresignedDownloadUrl(key, {
      expiresIn,
      responseContentDisposition: downloadFileName 
        ? `attachment; filename="${downloadFileName}"`
        : undefined,
    })
  } catch (error) {
    console.error('URL generation error:', error)
    throw new Error(`Failed to generate file URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const metadata = await r2Storage.getFileMetadata(key)
    return metadata.exists
  } catch (error) {
    console.error('File existence check error:', error)
    return false
  }
}

/**
 * Get file metadata from storage
 */
export async function getFileInfo(key: string) {
  try {
    return await r2Storage.getFileMetadata(key)
  } catch (error) {
    console.error('File metadata error:', error)
    throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}