/**
 * Organization Tier Plans - Server-only tier enforcement
 *
 * IMPORTANT: This file defines tier features and limits.
 * Mobile clients should NEVER import this file directly.
 * Mobile receives only boolean capabilities from the server.
 */

export const ORG_TIER_VALUES = ['free', 'stewardship', 'partner'] as const;
export type OrgTier = typeof ORG_TIER_VALUES[number];

export type OrgTierFeature =
  | 'org.pastoral.appointmentRequests'
  | 'org.wall.private'
  | 'org.communities.private'
  | 'org.ordinations'
  | 'org.sermons'
  | 'org.sermons.noAds'; // Viewers don't see ads (stewardship/partner only)

export interface OrgTierPlan {
  features: OrgTierFeature[];
  limits: Record<string, number>;
}

export const ORG_TIER_PLANS: Record<OrgTier, OrgTierPlan> = {
  free: {
    features: ['org.sermons'], // Can upload, but viewers see ads
    limits: {
      meetingRequestsPerMonth: 0,
      ordinationPrograms: 0,
      sermons: 10,
    }
  },
  stewardship: {
    features: ['org.pastoral.appointmentRequests', 'org.sermons', 'org.sermons.noAds'],
    limits: {
      meetingRequestsPerMonth: 50,
      ordinationPrograms: 1,
      sermons: 100,
    }
  },
  partner: {
    features: [
      'org.pastoral.appointmentRequests',
      'org.wall.private',
      'org.communities.private',
      'org.ordinations',
      'org.sermons',
      'org.sermons.noAds'
    ],
    limits: {
      meetingRequestsPerMonth: -1, // unlimited
      ordinationPrograms: -1, // unlimited
      sermons: -1, // unlimited
    }
  }
};

/**
 * User's relationship to an organization
 * Used in capability computation, not stored in database
 *
 * 'visitor' - Not affiliated, just viewing
 * 'attendee' - Has soft affiliation via userChurchAffiliations
 * 'member' | 'moderator' | 'admin' | 'owner' - Stored roles in organizationUsers
 */
export type UserOrgRole = 'visitor' | 'attendee' | 'member' | 'moderator' | 'admin' | 'owner';

/**
 * Organization capabilities for a specific viewer
 * ONLY contains booleans - never exposes tier information to clients
 */
export interface OrgCapabilities {
  userRole: UserOrgRole;
  canRequestMembership: boolean;
  canRequestMeeting: boolean;
  canViewPrivateWall: boolean;
  canViewPrivateCommunities: boolean;
  hasPendingMembershipRequest: boolean;
  // Sermon/video capabilities (never expose tier - only booleans)
  canViewSermons: boolean; // true when org has sermons feature enabled
  canCreateSermon: boolean; // true when org admin AND org has sermons feature enabled
  canManageSermons: boolean; // owner/admin only (CRUD on existing sermons)
  canUploadVideos: boolean; // Org admin/owner/moderator can upload
  viewerSermonAdsEnabled: boolean; // true for free tier viewers, server-computed
  sermonUploadLimit: number;
}

/**
 * Billing status values for org_billing table
 */
export const ORG_BILLING_STATUSES = ['inactive', 'trialing', 'active', 'past_due', 'canceled'] as const;
export type OrgBillingStatus = typeof ORG_BILLING_STATUSES[number];

export function isOrgTier(value: unknown): value is OrgTier {
  return ORG_TIER_VALUES.includes(value as OrgTier);
}

export function isOrgBillingStatus(value: unknown): value is OrgBillingStatus {
  return ORG_BILLING_STATUSES.includes(value as OrgBillingStatus);
}

/**
 * Membership request status
 */
export type MembershipRequestStatus = 'pending' | 'approved' | 'declined';

/**
 * Meeting request status
 */
export type MeetingRequestStatus = 'new' | 'in_progress' | 'closed';

/**
 * Ordination application status
 */
export type OrdinationApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

/**
 * Ordination review decision
 */
export type OrdinationReviewDecision = 'approve' | 'reject' | 'request_info';

/**
 * Church affiliation visibility
 */
export type AffiliationVisibility = 'public' | 'private';
