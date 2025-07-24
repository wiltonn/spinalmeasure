import { useState, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
  result?: {
    id: string
    url: string
    fileName: string
    fileSize: number
    mimeType: string
    studyId: string
    uploadedAt: string
  }
}

interface UseFileUploadOptions {
  studyId?: string
  onUploadComplete?: (results: UploadProgress[]) => void
  onUploadError?: (error: string, fileId: string) => void
  onProgress?: (fileId: string, progress: number) => void
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const { addNotification } = useAppStore()

  const updateUpload = useCallback((fileId: string, update: Partial<UploadProgress>) => {
    setUploads(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(fileId)
      if (current) {
        newMap.set(fileId, { ...current, ...update })
      }
      return newMap
    })
  }, [])

  const uploadFiles = useCallback(async (files: File[]) => {
    const { studyId, onUploadComplete, onUploadError, onProgress } = options
    
    if (!studyId) {
      throw new Error('Study ID is required for file upload')
    }

    setIsUploading(true)
    const uploadMap = new Map<string, UploadProgress>()

    // Initialize upload progress for each file
    files.forEach((file, index) => {
      const fileId = `${file.name}-${Date.now()}-${index}`
      uploadMap.set(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      })
    })

    setUploads(uploadMap)

    const results: UploadProgress[] = []

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileId = `${file.name}-${Date.now()}-${i}`
        const uploadInfo = uploadMap.get(fileId)
        if (!uploadInfo) continue

        try {
          // Update status to uploading
          updateUpload(fileId, { status: 'uploading', progress: 0 })

          // Create form data
          const formData = new FormData()
          formData.append('file', file)
          formData.append('studyId', studyId)

          // Upload with progress tracking using XMLHttpRequest
          const result = await uploadWithProgress(formData, (progress) => {
            updateUpload(fileId, { progress })
            onProgress?.(fileId, progress)
          })

          // Update with success
          const uploadResult: UploadProgress = {
            ...uploadInfo,
            status: 'complete',
            progress: 100,
            result: result,
          }

          updateUpload(fileId, uploadResult)
          results.push(uploadResult)

          addNotification({
            type: 'success',
            title: 'Upload Complete',
            message: `${file.name} uploaded successfully`,
            read: false,
          })

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          
          updateUpload(fileId, {
            status: 'error',
            error: errorMessage,
          })

          onUploadError?.(errorMessage, fileId)

          addNotification({
            type: 'error',
            title: 'Upload Failed',
            message: `Failed to upload ${file.name}: ${errorMessage}`,
            read: false,
          })
        }
      }

      onUploadComplete?.(results)

    } finally {
      setIsUploading(false)
    }

    return results
  }, [options, updateUpload, addNotification])

  const uploadSingleFile = useCallback(async (file: File) => {
    const results = await uploadFiles([file])
    return results[0]
  }, [uploadFiles])

  const clearUploads = useCallback(() => {
    setUploads(new Map())
  }, [])

  const removeUpload = useCallback((fileId: string) => {
    setUploads(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileId)
      return newMap
    })
  }, [])

  // Get current upload statuses as array
  const uploadList = Array.from(uploads.values())
  const hasUploads = uploadList.length > 0
  const completedUploads = uploadList.filter(u => u.status === 'complete')
  const failedUploads = uploadList.filter(u => u.status === 'error')
  const activeUploads = uploadList.filter(u => u.status === 'uploading' || u.status === 'processing')

  return {
    uploads: uploadList,
    isUploading,
    hasUploads,
    completedUploads,
    failedUploads,
    activeUploads,
    uploadFiles,
    uploadSingleFile,
    clearUploads,
    removeUpload,
  }
}

// Helper function to upload with progress tracking
function uploadWithProgress(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<{
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  studyId: string
  uploadedAt: string
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          if (response.success) {
            resolve(response.data)
          } else {
            reject(new Error(response.message || 'Upload failed'))
          }
        } catch (error) {
          reject(new Error('Invalid response format'))
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText)
          reject(new Error(response.message || `HTTP ${xhr.status}: Upload failed`))
        } catch (error) {
          reject(new Error(`HTTP ${xhr.status}: Upload failed`))
        }
      }
    })

    // Handle errors
    xhr.addEventListener('error', (_error) => {
      reject(new Error('Network error during upload'))
    })

    xhr.addEventListener('abort', (_error) => {
      reject(new Error('Upload aborted'))
    })

    // Send request
    xhr.open('POST', '/api/upload')
    xhr.send(formData)
  })
}

// Hook for direct presigned URL uploads (faster for large files)
export function usePresignedUpload() {
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false)

  const uploadWithPresignedUrl = useCallback(async (
    file: File,
    studyId: string,
    onProgress?: (progress: number) => void
  ) => {
    setIsGeneratingUrl(true)

    try {
      // Get presigned URL
      const response = await fetch(
        `/api/upload?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&studyId=${studyId}`
      )

      if (!response.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { data } = await response.json()
      setIsGeneratingUrl(false)

      // Upload directly to R2
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress?.(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              key: data.key,
              url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${data.key}`,
            })
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('PUT', data.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

    } catch (error) {
      setIsGeneratingUrl(false)
      throw error
    }
  }, [])

  return {
    uploadWithPresignedUrl,
    isGeneratingUrl,
  }
}