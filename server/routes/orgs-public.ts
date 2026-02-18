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

// Public leader DTO - only safe fields for public display
type PublicLeaderDTO = {
  id: number;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

// Public sermon DTO - only safe fields for public display
type PublicSermonDTO = {
  id: number;
  title: string;
  description: string | null;
  speaker: string | null;
  sermonDate: string | null;
  series: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
};

// Public community DTO - only safe fields for public display
type PublicCommunityDTO = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  iconName: string | null;
  iconColor: string | null;
  memberCount: number;
  isPrivate: boolean;
};

// Public event DTO - only safe fields for public display
type PublicEventDTO = {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  imageUrl: string | null;
};

const publicLeaderKeys = new Set<keyof PublicLeaderDTO>([
  'id',
  'name',
  'title',
  'bio',
  'photoUrl',
  'sortOrder',
]);

const forbiddenLeaderKeys = [
  'email',
  'phone',
  'address',
  'organizationId',
  'isPublic',
  'createdAt',
  'updatedAt',
];

const publicSermonKeys = new Set<keyof PublicSermonDTO>([
  'id',
  'title',
  'description',
  'speaker',
  'sermonDate',
  'series',
  'thumbnailUrl',
  'duration',
]);

const forbiddenSermonKeys = [
  'organizationId',
  'creatorId',
  'muxAssetId',
  'muxPlaybackId',
  'muxUploadId',
  'status',
  'privacyLevel',
  'viewCount',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'publishedAt',
];

function assertPublicSermonDTO(dto: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return;
  for (const key of Object.keys(dto)) {
    if (forbiddenSermonKeys.includes(key)) {
      throw new Error(`Public sermon DTO contains forbidden key: ${key}`);
    }
    if (!publicSermonKeys.has(key as keyof PublicSermonDTO)) {
      throw new Error(`Public sermon DTO contains unexpected key: ${key}`);
    }
  }
}

function assertPublicLeaderDTO(dto: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return;
  for (const key of Object.keys(dto)) {
    if (forbiddenLeaderKeys.includes(key)) {
      throw new Error(`Public leader DTO contains forbidden key: ${key}`);
    }
    if (!publicLeaderKeys.has(key as keyof PublicLeaderDTO)) {
      throw new Error(`Public leader DTO contains unexpected key: ${key}`);
    }
  }
}

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
 * GET /api/orgs/filters - Get available filter options
 */
router.get('/filters', async (_req: Request, res: Response) => {
  try {
    // Church types (major Christian traditions) - denominations alphabetized
    const churchTypes = [
      { id: 'protestant', label: 'Protestant', denominations: ['Anglican', 'Assembly of God', 'Baptist', 'Calvary Chapel', 'Church of Christ', 'Church of God', 'Episcopal', 'Lutheran', 'Mennonite', 'Methodist', 'Nazarene', 'Non-Denominational', 'Pentecostal', 'Presbyterian', 'Reformed', 'Seventh-day Adventist'] },
      { id: 'evangelical', label: 'Evangelical', denominations: ['Assembly of God', 'Baptist', 'Charismatic', 'Church of God', 'Evangelical', 'Nazarene', 'Non-Denominational', 'Pentecostal'] },
      { id: 'catholic', label: 'Catholic', denominations: ['Catholic', 'Roman Catholic'] },
      { id: 'orthodox', label: 'Orthodox', denominations: ['Coptic Orthodox', 'Eastern Orthodox', 'Greek Orthodox', 'Orthodox', 'Russian Orthodox'] },
      { id: 'church-of-east', label: 'Church of the East', denominations: ['Assyrian Church of the East', 'Chaldean Catholic', 'Church of the East'] },
    ];

    // Common denominations (alphabetized)
    const denominations = [
      'Anglican',
      'Assembly of God',
      'Baptist',
      'Catholic',
      'Charismatic',
      'Church of Christ',
      'Church of God',
      'Episcopal',
      'Evangelical',
      'Lutheran',
      'Mennonite',
      'Methodist',
      'Nazarene',
      'Non-Denominational',
      'Orthodox',
      'Pentecostal',
      'Presbyterian',
      'Reformed',
      'Seventh-day Adventist',
      'Other',
    ];

    // US States
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    ];

    res.json({ churchTypes, denominations, states });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
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

    // Fetch leaders (public only, ordered by sortOrder then id)
    const allLeaders = await storage.getOrganizationLeaders(org.id);
    const publicLeaders: PublicLeaderDTO[] = allLeaders
      .filter(leader => leader.isPublic)
      .map(leader => {
        const dto: PublicLeaderDTO = {
          id: leader.id,
          name: leader.name,
          title: leader.title,
          bio: leader.bio,
          photoUrl: leader.photoUrl,
          sortOrder: leader.sortOrder ?? 0,
        };
        assertPublicLeaderDTO(dto as Record<string, unknown>);
        return dto;
      });

    // TODO: Fetch communities filtered by capabilities
    // For now, return typed empty arrays (never undefined)
    const communities: PublicCommunityDTO[] = [];
    const upcomingEvents: PublicEventDTO[] = [];

    // Fetch public sermons (filtered by viewer's member status)
    const memberRoles = ['member', 'moderator', 'admin', 'owner'];
    const viewerIsMember = memberRoles.includes(capabilities.userRole);
    const allSermons = await storage.getPublicOrgSermons(org.id, viewerIsMember);
    const publicSermons: PublicSermonDTO[] = allSermons.map(sermon => {
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
      assertPublicSermonDTO(dto as Record<string, unknown>);
      return dto;
    });

    res.json({
      organization: publicOrganization,
      capabilities,
      leaders: publicLeaders,
      sermons: publicSermons,
      communities,
      upcomingEvents,
    });
  } catch (error) {
    console.error('Error fetching organization profile:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

/**
 * GET /api/orgs/:id/connections-attending
 * Get the count and preview of user's connections who attend this church
 */
router.get('/:id/connections-attending', async (req: Request, res: Response) => {
  try {
    const userId = getSessionUserId(req);
    if (!userId) {
      return res.json({ count: 0, connections: [] });
    }

    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) {
      return res.status(400).json({ error: 'Invalid organization ID' });
    }

    // Get user's connections who attend this church
    const connectionsAttending = await storage.getConnectionsAttendingOrg(userId, orgId);

    res.json({
      count: connectionsAttending.length,
      connections: connectionsAttending.slice(0, 5).map(c => ({
        id: c.id,
        username: c.username,
        displayName: c.displayName,
        avatarUrl: c.avatarUrl,
        affiliationType: c.affiliationType,
      })),
    });
  } catch (error) {
    console.error('Error fetching connections attending:', error);
    res.status(500).json({ error: 'Failed to fetch connections' });
  }
});

/**
 * GET /api/orgs/:id/announcements
 * Get public announcements for an organization (church)
 * - Public visibility: Anyone can see
 * - Members visibility: Only affiliated users
 * - Leaders visibility: Only org staff (handled separately)
 */
router.get('/:id/announcements', async (req: Request, res: Response) => {
  try {
    const userId = getSessionUserId(req);
    const orgId = parseInt(req.params.id, 10);

    if (isNaN(orgId)) {
      return res.status(400).json({ error: 'Invalid organization ID' });
    }

    // Check if user is affiliated with this org
    let isAffiliated = false;
    let isStaff = false;

    if (userId) {
      // Check if member/attendee
      const affiliation = await storage.getUserChurchAffiliation(userId);
      if (affiliation?.organizationId === orgId) {
        isAffiliated = true;
      }

      // Check if staff
      const role = await storage.getUserRoleInOrg(orgId, userId);
      if (role && ['owner', 'admin', 'moderator'].includes(role)) {
        isStaff = true;
        isAffiliated = true;
      }
    }

    // Get announcements with appropriate visibility filter
    let visibilityFilter: string | undefined;
    if (isStaff) {
      // Staff can see everything
      visibilityFilter = undefined;
    } else if (isAffiliated) {
      // Members can see 'all' and 'members' announcements
      // We'll filter out 'leaders' announcements
    } else {
      // Public users can only see 'all' visibility
      visibilityFilter = 'all';
    }

    const announcements = await storage.getOrganizationAnnouncements(orgId, {
      visibility: visibilityFilter,
    });

    // Filter out leaders-only announcements for non-staff
    const filteredAnnouncements = isStaff
      ? announcements
      : announcements.filter(a => a.visibility !== 'leaders' && (isAffiliated || a.visibility === 'all'));

    // Filter out expired announcements
    const now = new Date();
    const activeAnnouncements = filteredAnnouncements.filter(a =>
      !a.expiresAt || new Date(a.expiresAt) > now
    );

    res.json(activeAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

export default router;
