import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 Storage Configuration
const R2_CONFIG = {
  endpoint: process.env.R2_ENDPOINT!,
  region: process.env.R2_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // R2 compatibility settings for AWS SDK v3
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  responseChecksumValidation: 'WHEN_REQUIRED' as const,
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME!

// Validate configuration
if (!R2_CONFIG.endpoint || !R2_CONFIG.credentials.accessKeyId || !R2_CONFIG.credentials.secretAccessKey || !BUCKET_NAME) {
  throw new Error('Missing required R2 configuration. Please check your environment variables.')
}

// Initialize R2 client
const r2Client = new S3Client(R2_CONFIG)

/**
 * R2 Storage Service
 * Provides S3-compatible storage operations using Cloudflare R2
 */
export class R2StorageService {
  private client: S3Client
  private bucketName: string

  constructor() {
    this.client = r2Client
    this.bucketName = BUCKET_NAME
  }

  /**
   * Upload a file to R2 storage
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    options: {
      contentType?: string
      metadata?: Record<string, string>
      cacheControl?: string
    } = {}
  ): Promise<{ key: string; url: string; etag?: string }> {
    try {
      const uploadParams: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: options.contentType || 'application/octet-stream',
        CacheControl: options.cacheControl || 'public, max-age=31536000',
        Metadata: options.metadata,
      }

      const command = new PutObjectCommand(uploadParams)
      const result = await this.client.send(command)

      const url = `${R2_CONFIG.endpoint}/${this.bucketName}/${key}`

      return {
        key,
        url,
        etag: result.ETag,
      }
    } catch (error) {
      console.error('R2 upload error:', error)
      throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download a file from R2 storage
   */
  async downloadFile(key: string): Promise<{ body: ReadableStream; metadata: Record<string, any> }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const result = await this.client.send(command)

      if (!result.Body) {
        throw new Error('No file body returned from R2')
      }

      return {
        body: result.Body as ReadableStream,
        metadata: {
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          metadata: result.Metadata || {},
        } as Record<string, unknown>,
      }
    } catch (error) {
      console.error('R2 download error:', error)
      throw new Error(`Failed to download file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
    } catch (error) {
      console.error('R2 delete error:', error)
      throw new Error(`Failed to delete file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if a file exists and get its metadata
   */
  async getFileMetadata(key: string): Promise<{
    exists: boolean
    metadata?: {
      contentType?: string
      contentLength?: number
      lastModified?: Date
      etag?: string
      customMetadata?: Record<string, string>
    }
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const result = await this.client.send(command)

      return {
        exists: true,
        metadata: {
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          customMetadata: result.Metadata,
        },
      }
    } catch (error: unknown) {
      if ((error as { name?: string })?.name === 'NotFound' || (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode === 404) {
        return { exists: false }
      }
      console.error('R2 metadata error:', error)
      throw new Error(`Failed to get file metadata from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a presigned URL for direct upload
   */
  async generatePresignedUploadUrl(
    key: string,
    options: {
      expiresIn?: number // seconds
      contentType?: string
      contentLength?: number
    } = {}
  ): Promise<{ url: string; fields?: Record<string, string> }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: options.contentType,
        ContentLength: options.contentLength,
      })

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || 3600, // 1 hour default
      })

      return { url }
    } catch (error) {
      console.error('R2 presigned URL error:', error)
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a presigned URL for download
   */
  async generatePresignedDownloadUrl(
    key: string,
    options: {
      expiresIn?: number // seconds
      responseContentDisposition?: string
    } = {}
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: options.responseContentDisposition,
      })

      const url = await getSignedUrl(this.client, command, {
        expiresIn: options.expiresIn || 3600, // 1 hour default
      })

      return url
    } catch (error) {
      console.error('R2 presigned download URL error:', error)
      throw new Error(`Failed to generate presigned download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Initiate multipart upload for large files
   */
  async initiateMultipartUpload(
    key: string,
    options: {
      contentType?: string
      metadata?: Record<string, string>
    } = {}
  ): Promise<{ uploadId: string }> {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: options.contentType,
        Metadata: options.metadata,
      })

      const result = await this.client.send(command)

      if (!result.UploadId) {
        throw new Error('No upload ID returned from R2')
      }

      return { uploadId: result.UploadId }
    } catch (error) {
      console.error('R2 multipart initiate error:', error)
      throw new Error(`Failed to initiate multipart upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Upload a part for multipart upload
   */
  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | Uint8Array
  ): Promise<{ etag: string; partNumber: number }> {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      })

      const result = await this.client.send(command)

      if (!result.ETag) {
        throw new Error('No ETag returned from part upload')
      }

      return {
        etag: result.ETag,
        partNumber,
      }
    } catch (error) {
      console.error('R2 part upload error:', error)
      throw new Error(`Failed to upload part: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Complete multipart upload
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ etag: string; partNumber: number }>
  ): Promise<{ key: string; url: string; etag?: string }> {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part) => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      })

      const result = await this.client.send(command)
      const url = `${R2_CONFIG.endpoint}/${this.bucketName}/${key}`

      return {
        key,
        url,
        etag: result.ETag,
      }
    } catch (error) {
      console.error('R2 multipart complete error:', error)
      throw new Error(`Failed to complete multipart upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Abort multipart upload
   */
  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
      })

      await this.client.send(command)
    } catch (error) {
      console.error('R2 multipart abort error:', error)
      throw new Error(`Failed to abort multipart upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const r2Storage = new R2StorageService()

// Export types
export type UploadResult = {
  key: string
  url: string
  etag?: string
}

export type FileMetadata = {
  exists: boolean
  metadata?: {
    contentType?: string
    contentLength?: number
    lastModified?: Date
    etag?: string
    customMetadata?: Record<string, string>
  }
}

export type MultipartPart = {
  etag: string
  partNumber: number
}