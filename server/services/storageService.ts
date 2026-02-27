/**
 * Google Cloud Storage Service
 * Handles file uploads to GCS for The Connection app
 *
 * Supports:
 * - User profile pictures
 * - Event images
 * - Community banners
 * - Post attachments
 *
 * Configuration required in .env:
 * - GOOGLE_CLOUD_PROJECT_ID
 * - GOOGLE_CLOUD_STORAGE_BUCKET
 * - GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 * OR
 * - GOOGLE_APPLICATION_CREDENTIALS_BASE64 (base64 encoded service account JSON)
 */

import { Storage } from '@google-cloud/storage';
import path from 'path';
import crypto from 'crypto';
import { processImage, processImageSingle, type ImageCategory } from './imageProcessor';

// Environment configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const BUCKET_NAME = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const CREDENTIALS_BASE64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

// Check if GCS is configured
const isGcsConfigured = !!(
  PROJECT_ID &&
  BUCKET_NAME &&
  (CREDENTIALS_PATH || CREDENTIALS_BASE64)
);

// Initialize GCS client (only if configured)
let storage: Storage | null = null;
let bucket: any = null;

if (isGcsConfigured) {
  try {
    if (CREDENTIALS_BASE64) {
      // Decode base64 credentials
      const credentials = JSON.parse(
        Buffer.from(CREDENTIALS_BASE64, 'base64').toString('utf-8')
      );
      storage = new Storage({
        projectId: PROJECT_ID,
        credentials,
      });
    } else {
      // Use credentials file path
      storage = new Storage({
        projectId: PROJECT_ID,
        keyFilename: CREDENTIALS_PATH,
      });
    }

    bucket = storage.bucket(BUCKET_NAME!);
    console.info(`✅ Google Cloud Storage initialized: ${BUCKET_NAME}`);
  } catch (error) {
    console.error('❌ Failed to initialize Google Cloud Storage:', error);
    storage = null;
    bucket = null;
  }
} else {
  console.warn('⚠️ Google Cloud Storage not configured - file uploads will use mock mode');
  console.warn('   Set GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_STORAGE_BUCKET, and credentials');
}

/**
 * File upload categories
 */
export enum UploadCategory {
  PROFILE_PICTURES = 'profile-pictures',
  EVENT_IMAGES = 'event-images',
  COMMUNITY_BANNERS = 'community-banners',
  POST_ATTACHMENTS = 'post-attachments',
  PRAYER_REQUEST_IMAGES = 'prayer-images',
}

/**
 * Allowed MIME types for uploads
 */
const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  documents: [
    'application/pdf',
  ],
};

/**
 * Maximum file sizes (in bytes)
 */
const MAX_FILE_SIZES = {
  [UploadCategory.PROFILE_PICTURES]: 5 * 1024 * 1024, // 5MB
  [UploadCategory.EVENT_IMAGES]: 10 * 1024 * 1024, // 10MB
  [UploadCategory.COMMUNITY_BANNERS]: 10 * 1024 * 1024, // 10MB
  [UploadCategory.POST_ATTACHMENTS]: 20 * 1024 * 1024, // 20MB
  [UploadCategory.PRAYER_REQUEST_IMAGES]: 10 * 1024 * 1024, // 10MB
};

// Map upload categories to image processing categories
const CATEGORY_TO_IMAGE_CATEGORY: Record<UploadCategory, ImageCategory> = {
  [UploadCategory.PROFILE_PICTURES]: 'profile',
  [UploadCategory.EVENT_IMAGES]: 'event',
  [UploadCategory.COMMUNITY_BANNERS]: 'community',
  [UploadCategory.POST_ATTACHMENTS]: 'post',
  [UploadCategory.PRAYER_REQUEST_IMAGES]: 'prayer',
};

// Check if a MIME type is an image that can be processed
function isProcessableImage(mimeType: string): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
}

/**
 * Upload a buffer to GCS with a given filename and content type.
 * Returns the public URL.
 */
async function uploadBufferToGcs(
  buf: Buffer,
  filename: string,
  contentType: string,
  userId?: number,
  originalName?: string
): Promise<string> {
  const file = bucket.file(filename);
  await file.save(buf, {
    metadata: {
      contentType,
      metadata: {
        uploadedBy: userId?.toString() || 'anonymous',
        originalName: originalName || 'unknown',
        uploadedAt: new Date().toISOString(),
      },
    },
    public: true,
  });
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
}

/**
 * Upload file to Google Cloud Storage with automatic image optimization.
 * Images are resized, converted to WebP, and a thumbnail is generated.
 *
 * @param fileBuffer - File buffer
 * @param category - Upload category (determines folder and max dimensions)
 * @param originalFilename - Original filename (for extension)
 * @param userId - User ID (for organizing files)
 * @returns Object with url and optional thumbnailUrl
 */
export async function uploadFile(
  fileBuffer: Buffer,
  category: UploadCategory,
  originalFilename: string,
  userId?: number
): Promise<string> {
  const mimeType = getMimeType(originalFilename);

  // Mock mode if GCS not configured
  if (!storage || !bucket) {
    // Still process images even in mock mode (for testing optimization)
    if (isProcessableImage(mimeType)) {
      try {
        const imageCategory = CATEGORY_TO_IMAGE_CATEGORY[category];
        await processImageSingle(fileBuffer, imageCategory); // validate it works
      } catch (e) {
        // Ignore processing errors in mock mode
      }
    }
    const mockUrl = `https://storage.mock.theconnection.app/${category}/${crypto.randomBytes(16).toString('hex')}.webp`;
    return mockUrl;
  }

  // Validate file size
  const maxSize = MAX_FILE_SIZES[category];
  if (fileBuffer.length > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }

  const randomId = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  const userPrefix = userId ? `user-${userId}/` : '';

  // Process images through Sharp pipeline
  if (isProcessableImage(mimeType)) {
    const imageCategory = CATEGORY_TO_IMAGE_CATEGORY[category];

    try {
      const { full, thumbnail } = await processImage(fileBuffer, imageCategory);

      // Upload optimized full image
      const fullFilename = `${category}/${userPrefix}${timestamp}-${randomId}.webp`;
      const fullUrl = await uploadBufferToGcs(full.buffer, fullFilename, 'image/webp', userId, originalFilename);

      // Upload thumbnail alongside
      const thumbFilename = `${category}/${userPrefix}${timestamp}-${randomId}-thumb.webp`;
      await uploadBufferToGcs(thumbnail.buffer, thumbFilename, 'image/webp', userId, originalFilename);

      return fullUrl;
    } catch (e) {
      console.warn('[ImageProcessor] Sharp processing failed, uploading original:', e);
      // Fall through to upload original if Sharp fails
    }
  }

  // Non-image files or Sharp failure: upload as-is
  const ext = path.extname(originalFilename);
  const filename = `${category}/${userPrefix}${timestamp}-${randomId}${ext}`;
  return await uploadBufferToGcs(fileBuffer, filename, mimeType, userId, originalFilename);
}

/**
 * Delete file from Google Cloud Storage
 *
 * @param fileUrl - Public URL of the file
 * @returns true if deleted, false if not found
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  if (!storage || !bucket) {
    return true;
  }

  try {
    // Extract filename from URL
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    const filename = pathname.replace(`/${BUCKET_NAME}/`, '');

    const file = bucket.file(filename);
    await file.delete();

    return true;
  } catch (error: any) {
    if (error.code === 404) {
      console.warn(`⚠️ File not found: ${fileUrl}`);
      return false;
    }
    console.error(`❌ Error deleting file:`, error);
    throw error;
  }
}

/**
 * Get signed URL for temporary access to a private file
 *
 * @param fileUrl - Public URL or filename
 * @param expiresInMinutes - How long the URL should be valid
 * @returns Signed URL
 */
export async function getSignedUrl(
  fileUrl: string,
  expiresInMinutes: number = 60
): Promise<string> {
  if (!storage || !bucket) {
    return fileUrl; // Return as-is in mock mode
  }

  try {
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    const filename = pathname.replace(`/${BUCKET_NAME}/`, '');

    const file = bucket.file(filename);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return signedUrl;
  } catch (error) {
    console.error(`❌ Error generating signed URL:`, error);
    throw error;
  }
}

/**
 * Check if a file exists in storage
 *
 * @param fileUrl - Public URL of the file
 * @returns true if exists, false otherwise
 */
export async function fileExists(fileUrl: string): Promise<boolean> {
  if (!storage || !bucket) {
    return true; // Assume exists in mock mode
  }

  try {
    const urlObj = new URL(fileUrl);
    const pathname = urlObj.pathname;
    const filename = pathname.replace(`/${BUCKET_NAME}/`, '');

    const file = bucket.file(filename);
    const [exists] = await file.exists();

    return exists;
  } catch (error) {
    console.error(`❌ Error checking file existence:`, error);
    return false;
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Validate file MIME type
 */
export function validateMimeType(mimetype: string, allowedTypes: string[] = ALLOWED_MIME_TYPES.images): boolean {
  return allowedTypes.includes(mimetype);
}

/**
 * Export configuration status
 */
export const storageConfig = {
  isConfigured: isGcsConfigured,
  projectId: PROJECT_ID,
  bucketName: BUCKET_NAME,
  mockMode: !isGcsConfigured,
};

/**
 * Health check for storage service
 */
export async function healthCheck(): Promise<{ ok: boolean; message: string }> {
  if (!storage || !bucket) {
    return {
      ok: false,
      message: 'Google Cloud Storage not configured - running in mock mode',
    };
  }

  try {
    // Try to get bucket metadata
    await bucket.getMetadata();
    return {
      ok: true,
      message: `Connected to GCS bucket: ${BUCKET_NAME}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `GCS health check failed: ${error.message}`,
    };
  }
}
