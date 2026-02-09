/**
 * Mux Video Service - Server-only API integration
 *
 * Handles:
 * - Direct uploads for org sermon videos
 * - Asset status checking
 * - Signed playback URL generation
 * - Webhook verification and parsing
 *
 * IMPORTANT: Never log tokens, secrets, or raw request bodies.
 */

import Mux from '@mux/mux-node';

// Initialize Mux client with environment credentials
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const { video } = mux;

/**
 * Create a direct upload URL for video content
 *
 * Returns an upload URL that the client can use to upload directly to Mux,
 * and an upload ID for tracking the upload status.
 */
export async function createDirectUpload(params: {
  orgId: number;
  title: string;
  creatorId: number;
}): Promise<{
  uploadUrl: string;
  uploadId: string;
}> {
  const upload = await video.uploads.create({
    cors_origin: '*', // Configure based on your domain
    new_asset_settings: {
      playback_policy: ['public'],
      passthrough: JSON.stringify({
        orgId: params.orgId,
        title: params.title,
        creatorId: params.creatorId,
      }),
    },
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}

/**
 * Get asset information from Mux
 */
export async function getAsset(assetId: string): Promise<{
  status: string;
  playbackId: string | null;
  duration: number | null;
  thumbnailUrl: string | null;
}> {
  const asset = await video.assets.retrieve(assetId);

  const playbackId = asset.playback_ids?.[0]?.id || null;
  const duration = asset.duration ? Math.round(asset.duration) : null;
  const thumbnailUrl = playbackId
    ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
    : null;

  return {
    status: asset.status || 'unknown',
    playbackId,
    duration,
    thumbnailUrl,
  };
}

/**
 * Get upload status and associated asset ID
 */
export async function getUploadStatus(uploadId: string): Promise<{
  status: string;
  assetId: string | null;
}> {
  const upload = await video.uploads.retrieve(uploadId);

  return {
    status: upload.status || 'waiting',
    assetId: upload.asset_id || null,
  };
}

/**
 * Delete an asset from Mux
 */
export async function deleteAsset(assetId: string): Promise<void> {
  await video.assets.delete(assetId);
}

/**
 * Verify Mux webhook signature
 *
 * @param rawBody - Raw request body as string
 * @param signature - Mux-Signature header value
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('MUX_WEBHOOK_SECRET not configured');
    return false;
  }

  try {
    // Mux webhook verification
    // The signature header format is: t=timestamp,v1=signature
    const parts = signature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !signaturePart) {
      return false;
    }

    const timestamp = timestampPart.split('=')[1];
    const receivedSignature = signaturePart.split('=')[1];

    // Create expected signature
    const crypto = require('crypto');
    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification failed');
    return false;
  }
}

/**
 * Parse Mux webhook payload
 *
 * @param rawBody - Raw request body as string
 * @returns Parsed webhook data or null if invalid
 */
export function parseWebhook(rawBody: string): {
  type: string;
  data: {
    id: string;
    playback_ids?: Array<{ id: string; policy: string }>;
    status?: string;
    duration?: number;
    passthrough?: string;
    upload_id?: string;
  };
} | null {
  try {
    const payload = JSON.parse(rawBody);
    return {
      type: payload.type || '',
      data: payload.data || {},
    };
  } catch {
    return null;
  }
}

/**
 * Get playback URL for a Mux video
 *
 * Returns the HLS stream URL for the given playback ID.
 * For signed URLs, this would use JWT signing with MUX_SIGNING_KEY.
 */
export function getPlaybackUrl(playbackId: string): string {
  // For public playback policies, use the standard URL format
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

/**
 * Get poster/thumbnail URL for a Mux video
 */
export function getThumbnailUrl(
  playbackId: string,
  options?: { time?: number; width?: number; height?: number }
): string {
  const params = new URLSearchParams();
  if (options?.time !== undefined) params.set('time', String(options.time));
  if (options?.width) params.set('width', String(options.width));
  if (options?.height) params.set('height', String(options.height));

  const queryString = params.toString();
  return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`;
}
