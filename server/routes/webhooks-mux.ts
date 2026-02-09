/**
 * Mux Webhook Handler
 *
 * Processes Mux webhook events for video asset status updates.
 *
 * IMPORTANT: Never log raw request bodies or sensitive data.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { verifyWebhookSignature, parseWebhook, getAsset } from '../services/muxService';

const router = Router();

/**
 * POST /api/webhooks/mux - Handle Mux webhook events
 *
 * Events handled:
 * - video.asset.ready: Video processing complete
 * - video.asset.errored: Video processing failed
 * - video.upload.asset_created: Upload complete, asset created
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['mux-signature'] as string;

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      console.error('Mux webhook: Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    const webhook = parseWebhook(rawBody);
    if (!webhook) {
      console.error('Mux webhook: Invalid payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { type, data } = webhook;

    // Log event type only (not full payload)
    console.info(`Mux webhook received: ${type}`);

    switch (type) {
      case 'video.asset.ready': {
        // Video processing complete
        const assetId = data.id;
        if (!assetId) break;

        try {
          const assetInfo = await getAsset(assetId);

          await storage.updateSermonByMuxAssetId(assetId, {
            status: 'ready',
            muxPlaybackId: assetInfo.playbackId,
            duration: assetInfo.duration,
            thumbnailUrl: assetInfo.thumbnailUrl,
          });

          console.info(`Sermon asset ready: ${assetId}`);
        } catch (error) {
          console.error('Error updating sermon asset:', error);
        }
        break;
      }

      case 'video.asset.errored': {
        // Video processing failed
        const assetId = data.id;
        if (!assetId) break;

        try {
          await storage.updateSermonByMuxAssetId(assetId, {
            status: 'error',
          });

          console.info(`Sermon asset errored: ${assetId}`);
        } catch (error) {
          console.error('Error updating sermon error status:', error);
        }
        break;
      }

      case 'video.upload.asset_created': {
        // Upload complete, asset created
        const uploadId = data.upload_id;
        const assetId = data.id;

        if (!uploadId || !assetId) break;

        // Find sermon by upload ID and update with asset ID
        // The asset is still processing at this point
        try {
          await storage.updateSermonByMuxUploadId(uploadId, {
            muxAssetId: assetId,
            status: 'processing',
          });
          console.info(`Upload complete, asset created: ${assetId}`);
        } catch (error) {
          console.error('Error handling upload complete:', error);
        }
        break;
      }

      default:
        // Unknown event type - acknowledge but don't process
        break;
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Mux webhook error:', error);
    // Return 500 to trigger retry
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
