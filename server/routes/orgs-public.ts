/**
 * Public Organization Routes (Commons)
 *
 * Public directory and profile endpoints.
 * No tier awareness in responses - only boolean capabilities.
 */

import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { computeOrgCapabilities } from '../services/orgTierService';
import { getSessionUserId } from '../utils/session';
import { z } from 'zod';

const router = Router();

type PublicOrganizationDTO = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  mission: string | null;
  serviceTimes: string | null;
  socialMedia: string | null;
  foundedDate: string | null;
  congregationSize: number | null;
  denomination: string | null;
  city: string | null;
  state: string | null;
  publicPhone: string | null;
  publicAddress: string | null;
  publicZipCode: string | null;
};

const publicOrganizationKeys = new Set<keyof PublicOrganizationDTO>([
  'id',
  'name',
  'slug',
  'description',
  'logoUrl',
  'website',
  'mission',
  'serviceTimes',
  'socialMedia',
  'foundedDate',
  'congregationSize',
  'denomination',
  'city',
  'state',
  'publicPhone',
  'publicAddress',
  'publicZipCode',
]);

const forbiddenPublicOrgKeys = [
  'email',
  'tier',
  'plan',
  'billing',
  'adminUserId',
  'phone',
  'address',
  'zipCode',
];

function assertPublicOrganizationDTO(dto: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return;
  for (const key of Object.keys(dto)) {
    if (key.startsWith('stripe')) {
      throw new Error(`Public organization DTO contains forbidden key: ${key}`);
    }
    if (forbiddenPublicOrgKeys.includes(key)) {
      throw new Error(`Public organization DTO contains forbidden key: ${key}`);
    }
    if (!publicOrganizationKeys.has(key as keyof PublicOrganizationDTO)) {
      throw new Error(`Public organization DTO contains unexpected key: ${key}`);
    }
  }
}

/**
 * GET /api/orgs/search - Quick search organizations
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json([]);
    }

    const results = await storage.searchOrganizations(q);

    // Return only public-safe fields
    const publicResults = results.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      city: org.city,
      state: org.state,
      denomination: org.denomination,
    }));

    res.json(publicResults);
  } catch (error) {
    console.error('Error searching organizations:', error);
    res.status(500).json({ error: 'Failed to search organizations' });
  }
});

/**
 * GET /api/orgs/directory - Cursor-paginated directory
 */
router.get('/directory', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      limit: z.coerce.number().min(1).max(50).optional().default(20),
      cursor: z.string().optional(),
      q: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      denomination: z.string().optional(),
    });

    const params = schema.parse(req.query);

    const result = await storage.getPublicOrganizations({
      limit: params.limit,
      cursor: params.cursor,
      q: params.q,
      city: params.city,
      state: params.state,
      denomination: params.denomination,
    });

    // Return only public-safe fields
    const publicItems = result.items.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      city: org.city,
      state: org.state,
      denomination: org.denomination,
      congregationSize: org.congregationSize,
    }));

    res.json({
      items: publicItems,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    console.error('Error fetching organization directory:', error);
    res.status(500).json({ error: 'Failed to fetch directory' });
  }
});

/**
 * GET /api/orgs/:slug - Public organization profile with capabilities
 *
 * Returns:
 * - organization: Public organization data
 * - capabilities: Boolean-only capabilities for the viewer
 * - communities: Filtered by capabilities
 * - upcomingEvents: Filtered by capabilities
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const viewerUserId = getSessionUserId(req);

    // Get organization
    const org = await storage.getOrganizationBySlug(slug);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Compute capabilities for viewer
    const capabilities = await computeOrgCapabilities({
      orgId: org.id,
      viewerUserId: viewerUserId || undefined,
    });

    // Build public organization object
    const publicOrganization: PublicOrganizationDTO = {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      logoUrl: org.logoUrl,
      website: org.website,
      mission: org.mission,
      serviceTimes: org.serviceTimes,
      socialMedia: org.socialMedia,
      foundedDate: org.foundedDate,
      congregationSize: org.congregationSize,
      denomination: org.denomination,
      city: org.city,
      state: org.state,
      // Only show phone/address if org has enabled them
      publicPhone: org.showPhone ? org.phone : null,
      publicAddress: org.showAddress ? org.address : null,
      publicZipCode: org.showAddress ? org.zipCode : null,
    };
    assertPublicOrganizationDTO(publicOrganization as Record<string, unknown>);

    // TODO: Fetch communities filtered by capabilities
    // For now, return empty arrays
    const communities: any[] = [];
    const upcomingEvents: any[] = [];

    res.json({
      organization: publicOrganization,
      capabilities,
      communities,
      upcomingEvents,
    });
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

export default router;
