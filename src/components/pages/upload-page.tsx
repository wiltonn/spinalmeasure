'use client'

import { useState } from 'react'
import { R2UploadInterface } from '@/components/upload/r2-upload-interface'
import { useAppStore } from '@/store/app-store'
import { randomUUID } from 'crypto'

export function UploadPage() {
  // For now, we'll use a temporary study ID
  // In a real app, this would come from the current context or be created
  const [currentStudyId] = useState(() => {
    // Generate a proper UUID for validation
    if (typeof window !== 'undefined') {
      return crypto.randomUUID()
    }
    // Fallback for server-side rendering (though this shouldn't be needed for client components)
    return 'temp-study-id'
  })
  const { addNotification } = useAppStore()

  const handleUploadComplete = (results: Array<{ id: string; url: string; fileName: string }>) => {
    console.log('Upload completed:', results)
    addNotification({
      type: 'success',
      title: 'Upload Complete',
      message: `Successfully uploaded ${results.length} file(s)`,
      read: false,
    })
  }

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error)
    addNotification({
      type: 'error',
      title: 'Upload Failed',
      message: error,
      read: false,
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <R2UploadInterface 
        studyId={currentStudyId}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  )
}