/**
 * Image Processing Service
 * Uses Sharp for server-side image optimization:
 * - Auto-resize (profile: 800px, others: 1920px max width)
 * - WebP conversion (quality 80 full, 70 thumbnail)
 * - Thumbnail generation (400px wide)
 * - EXIF auto-rotation
 */

import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ProcessedImageSet {
  full: ProcessedImage;
  thumbnail: ProcessedImage;
}

export type ImageCategory = 'profile' | 'event' | 'community' | 'post' | 'prayer';

const MAX_WIDTHS: Record<ImageCategory, number> = {
  profile: 800,
  event: 1920,
  community: 1920,
  post: 1920,
  prayer: 1920,
};

const THUMBNAIL_WIDTH = 400;
const FULL_QUALITY = 80;
const THUMBNAIL_QUALITY = 70;

/**
 * Process an image buffer: resize, convert to WebP, generate thumbnail.
 * Returns both full and thumbnail versions.
 */
export async function processImage(
  inputBuffer: Buffer,
  category: ImageCategory
): Promise<ProcessedImageSet> {
  const maxWidth = MAX_WIDTHS[category];

  // Full-size image: resize + WebP + auto-rotate
  const fullPipeline = sharp(inputBuffer)
    .rotate() // Auto-rotate from EXIF
    .resize({
      width: maxWidth,
      withoutEnlargement: true, // Don't upscale small images
      fit: 'inside',
    })
    .webp({ quality: FULL_QUALITY });

  const fullBuffer = await fullPipeline.toBuffer();
  const fullMeta = await sharp(fullBuffer).metadata();

  // Thumbnail: smaller resize + WebP
  const thumbPipeline = sharp(inputBuffer)
    .rotate()
    .resize({
      width: THUMBNAIL_WIDTH,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: THUMBNAIL_QUALITY });

  const thumbBuffer = await thumbPipeline.toBuffer();
  const thumbMeta = await sharp(thumbBuffer).metadata();

  return {
    full: {
      buffer: fullBuffer,
      width: fullMeta.width || 0,
      height: fullMeta.height || 0,
      format: 'webp',
      size: fullBuffer.length,
    },
    thumbnail: {
      buffer: thumbBuffer,
      width: thumbMeta.width || 0,
      height: thumbMeta.height || 0,
      format: 'webp',
      size: thumbBuffer.length,
    },
  };
}

/**
 * Process a single image (no thumbnail). Useful for profile pictures.
 */
export async function processImageSingle(
  inputBuffer: Buffer,
  category: ImageCategory
): Promise<ProcessedImage> {
  const maxWidth = MAX_WIDTHS[category];

  const pipeline = sharp(inputBuffer)
    .rotate()
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: FULL_QUALITY });

  const buffer = await pipeline.toBuffer();
  const meta = await sharp(buffer).metadata();

  return {
    buffer,
    width: meta.width || 0,
    height: meta.height || 0,
    format: 'webp',
    size: buffer.length,
  };
}
