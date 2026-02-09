/**
 * Public Sermons Routes
 *
 * Handles public sermon listing and playback endpoints.
 * Playback endpoint returns ads.enabled boolean based on org tier policy.
 *
 * IMPORTANT: Never expose tier names. Only return booleans.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { computeOrgCapabilities, getOrgSermonPolicy } from '../services/orgTierService';
import { getPlaybackUrl, getThumbnailUrl } from '../services/muxService';
import { getSessionUserId } from '../utils/session';

const router = Router();

// Public sermon DTO - only safe fields
interface PublicSermonDTO {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  sermonDate: string | null;
  series: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
}

// Playback response DTO
interface PlaybackResponseDTO {
  sermon: PublicSermonDTO;
  playback: {
    hlsUrl: string;
    posterUrl: string | null;
  };
  ads: {
    enabled: boolean;
    tagUrl: string | null;
  };
}

/**
 * GET /api/sermons/:id
 * Get a single sermon by ID (public info)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sermonId = parseInt(req.params.id, 10);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: 'Invalid sermon ID' });
    }

    const sermon = await storage.getSermonById(sermonId);
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Check viewer access
    const viewerUserId = getSessionUserId(req);
    const capabilities = await computeOrgCapabilities({
      orgId: sermon.organizationId,
      viewerUserId: viewerUserId || undefined,
    });

    // Check privacy level access
    if (sermon.privacyLevel === 'members') {
      const memberRoles = ['member', 'moderator', 'admin', 'owner'];
      if (!memberRoles.includes(capabilities.userRole)) {
        return res.status(404).json({ error: 'Sermon not found' });
      }
    } else if (sermon.privacyLevel === 'unlisted') {
      // Unlisted sermons are accessible via direct link
      // No additional check needed
    }

    // Return sermon DTO
    const dto: PublicSermonDTO = {
      id: sermon.id,
      title: sermon.title,
      description: sermon.description,
      speaker: sermon.speaker,
      sermonDate: sermon.sermonDate,
      series: sermon.series,
      thumbnailUrl: sermon.thumbnailUrl,
      duration: sermon.duration,
    };

    res.json(dto);
  } catch (error) {
    console.error('Error fetching sermon:', error);
    res.status(500).json({ error: 'Failed to fetch sermon' });
  }
});

/**
 * GET /api/sermons/:id/playback
 * Get playback information including HLS URL and ads configuration
 *
 * ads.enabled computed server-side from billing/tier; clients never see tier names.
 */
router.get('/:id/playback', async (req: Request, res: Response) => {
  try {
    const sermonId = parseInt(req.params.id, 10);
    if (isNaN(sermonId)) {
      return res.status(400).json({ error: 'Invalid sermon ID' });
    }

    const sermon = await storage.getSermonById(sermonId);
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Check video is ready
    if (sermon.status !== 'ready' || !sermon.muxPlaybackId) {
      return res.status(404).json({ error: 'Video not available' });
    }

    // Check viewer access
    const viewerUserId = getSessionUserId(req);
    const capabilities = await computeOrgCapabilities({
      orgId: sermon.organizationId,
      viewerUserId: viewerUserId || undefined,
    });

    // Check privacy level access
    if (sermon.privacyLevel === 'members') {
      const memberRoles = ['member', 'moderator', 'admin', 'owner'];
      if (!memberRoles.includes(capabilities.userRole)) {
        return res.status(404).json({ error: 'Sermon not found' });
      }
    }

    // Get org sermon policy for ads decision
    const policy = await getOrgSermonPolicy(sermon.organizationId);

    // Get playback URLs
    const hlsUrl = getPlaybackUrl(sermon.muxPlaybackId);
    const posterUrl = sermon.muxPlaybackId
      ? getThumbnailUrl(sermon.muxPlaybackId)
      : sermon.thumbnailUrl;

    // Build response - ads.enabled from billing policy
    const response: PlaybackResponseDTO = {
      sermon: {
        id: sermon.id,
        title: sermon.title,
        description: sermon.description,
        speaker: sermon.speaker,
        sermonDate: sermon.sermonDate,
        series: sermon.series,
        thumbnailUrl: sermon.thumbnailUrl,
        duration: sermon.duration,
      },
      playback: {
        hlsUrl,
        posterUrl,
      },
      ads: {
        // ads.enabled from policy.viewerAdsRequired (server-computed)
        enabled: policy.viewerAdsRequired,
        // Ad tag URL from environment (for CSAI)
        tagUrl: policy.viewerAdsRequired
          ? (process.env.JWPLAYER_AD_TAG_URL || null)
          : null,
      },
    };

    // Increment view count asynchronously
    storage.incrementSermonView(sermonId, viewerUserId || undefined).catch(() => {
      // Ignore view tracking errors
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching sermon playback:', error);
    res.status(500).json({ error: 'Failed to fetch playback info' });
  }
});

export default router;
