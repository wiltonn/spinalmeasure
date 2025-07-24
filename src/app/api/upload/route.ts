import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadFile } from '@/lib/storage-utils'
import { successResponse, errorResponse } from '@/lib/api-response'
import { uploadImageSchema } from '@/lib/validations'
import { z } from 'zod'

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return errorResponse(new Error('Unauthorized'))
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const studyId = formData.get('studyId') as string
    const metadata = formData.get('metadata') as string

    console.log('Received upload request:', {
      file: file ? { name: file.name, size: file.size, type: file.type } : null,
      studyId,
      metadata,
      userId
    })

    // Validate required fields
    if (!file) {
      return errorResponse(new Error( 'No file provided'))
    }

    if (!studyId) {
      return errorResponse(new Error( 'Study ID is required'))
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(new Error( `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`))
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom']
    if (!allowedTypes.includes(file.type)) {
      return errorResponse(new Error( 'Invalid file type. Only JPEG, PNG, and DICOM files are allowed.'))
    }

    // Parse and validate upload data
    const uploadData = {
      studyId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type as 'image/jpeg' | 'image/png' | 'application/dicom',
    }

    console.log('Upload data:', uploadData)

    const validation = uploadImageSchema.safeParse(uploadData)
    if (!validation.success) {
      console.error('Validation failed:', validation.error)
      return errorResponse(validation.error)
    }

    // Parse additional metadata if provided
    let additionalMetadata: Record<string, string> = {}
    if (metadata) {
      try {
        additionalMetadata = JSON.parse(metadata)
      } catch (error) {
        console.warn('Failed to parse metadata:', error)
      }
    }

    // Upload file to R2 storage
    const uploadResult = await uploadFile(file, {
      prefix: `studies/${studyId}/images`,
      metadata: {
        studyId,
        userId,
        fileName: file.name,
        fileSize: file.size.toString(),
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        ...additionalMetadata,
      },
    })

    // TODO: Save file record to database
    // This would typically create a record in the images table
    // linking the file to the study and user

    return successResponse({
      id: uploadResult.key,
      url: uploadResult.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      studyId,
      uploadedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse(error, 500)
  }
}

// Handle presigned URL generation for direct uploads
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return errorResponse(new Error('Unauthorized'))
    }

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')
    const contentType = searchParams.get('contentType')
    const studyId = searchParams.get('studyId')

    if (!fileName || !contentType || !studyId) {
      return errorResponse(new Error( 'Missing required parameters'))
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom']
    if (!allowedTypes.includes(contentType)) {
      return errorResponse(new Error( 'Invalid content type'))
    }

    // Validate study ID format
    const studyValidation = z.string().uuid().safeParse(studyId)
    if (!studyValidation.success) {
      return errorResponse(new Error('Invalid study ID format'))
    }

    // Generate storage key and presigned URL
    const { r2Storage } = await import('@/lib/r2-storage')
    const { generateStorageKey } = await import('@/lib/storage-utils')
    
    const storageKey = generateStorageKey(fileName, {
      prefix: `studies/${studyId}/images`,
    })

    const presignedUrl = await r2Storage.generatePresignedUploadUrl(storageKey, {
      expiresIn: 3600, // 1 hour
      contentType,
    })

    return successResponse({
      uploadUrl: presignedUrl.url,
      key: storageKey,
      expiresIn: 3600,
    })

  } catch (error) {
    console.error('Presigned URL error:', error)
    return errorResponse(error, 500)
  }
}