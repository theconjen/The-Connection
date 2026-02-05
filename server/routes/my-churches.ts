/**
 * My Churches Routes (Soft Affiliations)
 *
 * Allows users to mark churches as "my churches" without formal membership.
 * Supports both linked organizations and free-text church names.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';
import { requireSessionUserId } from '../utils/session';
import { z } from 'zod/v4';

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/me/churches - List user's church affiliations
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const affiliations = await storage.getUserChurchAffiliations(userId);

    // Enrich with organization data for linked affiliations
    const enrichedAffiliations = await Promise.all(
      affiliations.map(async (aff) => {
        if (aff.organizationId) {
          const org = await storage.getOrganization(aff.organizationId);
          return {
            ...aff,
            organization: org ? {
              id: org.id,
              name: org.name,
              slug: org.slug,
              logoUrl: org.logoUrl,
              city: org.city,
              state: org.state,
            } : null,
          };
        }
        return { ...aff, organization: null };
      })
    );

    res.json(enrichedAffiliations);
  } catch (error) {
    console.error('Error fetching church affiliations:', error);
    res.status(500).json({ error: 'Failed to fetch church affiliations' });
  }
});

/**
 * POST /api/me/churches - Add a church affiliation
 *
 * Body: { organizationId?: number, freeTextName?: string, roleLabel?: string, visibility?: string }
 * XOR: Either organizationId OR freeTextName must be provided, not both
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);

    const schema = z.object({
      organizationId: z.number().optional(),
      freeTextName: z.string().min(1).max(200).optional(),
      roleLabel: z.string().max(100).optional(),
      visibility: z.enum(['public', 'private']).optional().default('public'),
    }).refine(
      (data) => {
        const hasOrgId = data.organizationId !== undefined;
        const hasFreeText = data.freeTextName !== undefined && data.freeTextName.length > 0;
        // XOR: exactly one must be set
        return hasOrgId !== hasFreeText;
      },
      { message: 'Either organizationId or freeTextName must be provided, but not both' }
    );

    const data = schema.parse(req.body);

    // If organizationId provided, verify the org exists
    if (data.organizationId) {
      const org = await storage.getOrganization(data.organizationId);
      if (!org) {
        return res.status(400).json({ error: 'Organization not found' });
      }

      // Check if user already has this affiliation
      const hasExisting = await storage.hasAffiliation(data.organizationId, userId);
      if (hasExisting) {
        return res.status(400).json({ error: 'You already have an affiliation with this church' });
      }
    }

    const affiliation = await storage.addUserChurchAffiliation({
      userId,
      organizationId: data.organizationId || null,
      freeTextName: data.freeTextName || null,
      roleLabel: data.roleLabel || null,
      visibility: data.visibility,
    });

    res.status(201).json(affiliation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request', details: error.errors });
    }
    console.error('Error adding church affiliation:', error);
    res.status(500).json({ error: 'Failed to add church affiliation' });
  }
});

/**
 * DELETE /api/me/churches/:affiliationId - Remove a church affiliation
 */
router.delete('/:affiliationId', async (req: Request, res: Response) => {
  try {
    const userId = requireSessionUserId(req);
    const affiliationId = parseInt(req.params.affiliationId, 10);

    if (isNaN(affiliationId)) {
      return res.status(400).json({ error: 'Invalid affiliation ID' });
    }

    const removed = await storage.removeUserChurchAffiliation(userId, affiliationId);

    if (!removed) {
      return res.status(404).json({ error: 'Affiliation not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing church affiliation:', error);
    res.status(500).json({ error: 'Failed to remove church affiliation' });
  }
});

export default router;
