import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateFileUrl, getFileInfo } from '@/lib/storage-utils'
import { successResponse, errorResponse } from '@/lib/api-response'

interface RouteParams {
  params: {
    key: string
  }
}

// Get file metadata or generate download URL
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return errorResponse(new Error('Unauthorized'))
    }

    const { key } = params
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') // 'metadata' or 'download' (default)
    const downloadFileName = searchParams.get('filename')
    const expiresIn = parseInt(searchParams.get('expires') || '3600')

    if (!key) {
      return errorResponse(new Error( 'File key is required'))
    }

    // Decode the key (in case it was URL encoded)
    const decodedKey = decodeURIComponent(key)

    // Handle metadata request
    if (action === 'metadata') {
      const fileInfo = await getFileInfo(decodedKey)
      
      if (!fileInfo.exists) {
        return errorResponse(new Error( 'File not found'), 404)
      }

      return successResponse({
        key: decodedKey,
        exists: fileInfo.exists,
        ...fileInfo.metadata,
      })
    }

    // Handle download URL generation (default)
    try {
      const downloadUrl = await generateFileUrl(decodedKey, {
        expiresIn,
        downloadFileName: downloadFileName || undefined,
      })

      return successResponse({
        downloadUrl,
        key: decodedKey,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      })

    } catch (error) {
      console.error('Download URL generation error:', error)
      
      // Check if file exists to provide better error message
      const fileInfo = await getFileInfo(decodedKey)
      if (!fileInfo.exists) {
        return errorResponse(new Error( 'File not found'), 404)
      }

      throw error
    }

  } catch (error) {
    console.error('File access error:', error)
    return errorResponse(error, 500)
  }
}

// Delete a file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return errorResponse(new Error('Unauthorized'))
    }

    const { key } = params

    if (!key) {
      return errorResponse(new Error( 'File key is required'))
    }

    // Decode the key
    const decodedKey = decodeURIComponent(key)

    // TODO: Check user permissions to delete this file
    // This would typically verify the user owns the file or has appropriate permissions

    // Delete file from R2 storage
    const { deleteFile } = await import('@/lib/storage-utils')
    await deleteFile(decodedKey)

    // TODO: Remove file record from database
    // This would typically delete the corresponding database record

    return successResponse(null)

  } catch (error) {
    console.error('File deletion error:', error)
    return errorResponse(error, 500)
  }
}