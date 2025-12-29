import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configuration S3 Hetzner
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_ZONE || 'eu-central',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for S3-compatible storage like Hetzner
})

const BUCKET_NAME = process.env.S3_BUCKET || 'cechemoi'

/**
 * Upload a file buffer to S3
 * @param key - The S3 key (path) for the file
 * @param buffer - The file buffer
 * @param contentType - MIME type (default: application/pdf)
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string = 'application/pdf'
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)

  // Return the full URL
  return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`
}

/**
 * Get a signed URL for temporary access to a private file
 * @param key - The S3 key (path) for the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedS3Url(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Download a file from S3
 * @param key - The S3 key (path) for the file
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)
  const bodyContents = await response.Body?.transformToByteArray()

  if (!bodyContents) {
    throw new Error('Empty response from S3')
  }

  return Buffer.from(bodyContents)
}

/**
 * Delete a file from S3
 * @param key - The S3 key (path) for the file
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Generate S3 key for customer measurement PDF
 * Format: customers/{customerId}/measurements/{measurementId}-{timestamp}.pdf
 */
export function generateMeasurementPdfKey(customerId: string, measurementId: string): string {
  const timestamp = Date.now()
  return `customers/${customerId}/measurements/${measurementId}-${timestamp}.pdf`
}

/**
 * Generate S3 key for customer avatar
 * Format: customers/{customerId}/avatar/{filename}
 */
export function generateAvatarKey(customerId: string, filename: string): string {
  const timestamp = Date.now()
  const ext = filename.split('.').pop() || 'jpg'
  return `customers/${customerId}/avatar/${timestamp}.${ext}`
}

/**
 * Generate S3 key for invoice PDF
 * Format: invoices/{invoiceNumber}.pdf
 */
export function generateInvoicePdfKey(invoiceNumber: string): string {
  return `invoices/${invoiceNumber}.pdf`
}

export { s3Client, BUCKET_NAME }
