/**
 * Organization Tier Service - Server-only tier enforcement
 *
 * This service handles all tier-related logic:
 * - Determining effective tier based on billing status
 * - Checking feature availability
 * - Computing capabilities for viewers
 *
 * IMPORTANT: This service is server-only. Clients receive only
 * boolean capabilities, never tier or plan information.
 */

import {
  ORG_TIER_PLANS,
  OrgTier,
  OrgTierFeature,
  OrgCapabilities,
  UserOrgRole,
  isOrgBillingStatus,
  isOrgTier,
} from '../../shared/orgTierPlans';
import { storage } from '../storage';

/**
 * Get the effective tier for an organization based on billing status
 *
 * Returns 'free' unless billing status is 'active' or 'trialing'
 */
export async function getEffectiveOrgTier(orgId: number): Promise<OrgTier> {
  const billing = await storage.getOrgBilling(orgId);

  // Free unless billing status is 'active' or 'trialing'
  if (!billing || !isOrgBillingStatus(billing.status)) {
    return 'free';
  }

  // Ensure the tier is valid, default to 'free' if not
  if (billing.status !== 'active' && billing.status !== 'trialing') {
    return 'free';
  }

  if (!isOrgTier(billing.tier) || !ORG_TIER_PLANS[billing.tier]) {
    return 'free';
  }

  return billing.tier;
}

/**
 * Check if an organization has a specific feature at its current tier
 */
export async function requireOrgFeature(
  orgId: number,
  feature: OrgTierFeature
): Promise<boolean> {
  const tier = await getEffectiveOrgTier(orgId);
  const plan = ORG_TIER_PLANS[tier];
  return plan.features.includes(feature);
}

/**
 * Get a specific limit value for an organization based on its tier
 *
 * @returns The limit value, or 0 if not found
 * @note -1 means unlimited
 */
export async function getOrgLimit(orgId: number, limit: string): Promise<number> {
  const tier = await getEffectiveOrgTier(orgId);
  const plan = ORG_TIER_PLANS[tier];
  return plan.limits[limit] ?? 0;
}

/**
 * Check if an organization is within its limit for a specific resource
 *
 * @param orgId - Organization ID
 * @param limit - The limit key (e.g., 'meetingRequestsPerMonth')
 * @param currentCount - Current usage count
 * @returns true if within limit, false if exceeded
 */
export async function isWithinOrgLimit(
  orgId: number,
  limit: string,
  currentCount: number
): Promise<boolean> {
  const maxLimit = await getOrgLimit(orgId, limit);

  // -1 means unlimited
  if (maxLimit === -1) {
    return true;
  }

  return currentCount < maxLimit;
}

/**
 * Compute capabilities for a viewer of an organization
 *
 * Returns ONLY booleans - never exposes tier information
 *
 * @param orgId - Organization ID
 * @param viewerUserId - User ID of the viewer (optional for anonymous)
 */
export async function computeOrgCapabilities(params: {
  orgId: number;
  viewerUserId?: number;
}): Promise<OrgCapabilities> {
  const { orgId, viewerUserId } = params;

  // Get viewer's stored role in organization (owner/admin/moderator/member)
  const storedRole = viewerUserId
    ? await storage.getUserRoleInOrg(orgId, viewerUserId)
    : null;

  // Check soft affiliation (via userChurchAffiliations)
  const hasAffiliation = viewerUserId
    ? await storage.hasAffiliation(orgId, viewerUserId)
    : false;

  // Check for pending membership request
  const pendingRequest = viewerUserId
    ? await storage.getPendingMembershipRequest(orgId, viewerUserId)
    : null;

  // Get tier features
  const hasPastoralAppointments = await requireOrgFeature(orgId, 'org.pastoral.appointmentRequests');

  // Get meeting request limits
  const meetingLimit = await getOrgLimit(orgId, 'meetingRequestsPerMonth');
  const currentMeetingCount = await storage.countOrgMeetingRequestsThisMonth(orgId);

  // Determine user role label
  // Priority: stored role > attendee (if affiliated) > visitor
  let userRole: UserOrgRole;
  if (storedRole) {
    userRole = storedRole as UserOrgRole;
  } else if (hasAffiliation) {
    userRole = 'attendee';
  } else {
    userRole = 'visitor';
  }

  // Roles that grant member-level access
  const memberRoles: UserOrgRole[] = ['member', 'moderator', 'admin', 'owner'];
  const hasMemberAccess = memberRoles.includes(userRole);

  // Roles that can request meetings (members and attendees)
  const canRequestRoles: UserOrgRole[] = ['attendee', 'member', 'moderator', 'admin', 'owner'];
  const roleCanRequest = canRequestRoles.includes(userRole);

  // Check if within meeting limit
  const withinMeetingLimit = meetingLimit === -1 || currentMeetingCount < meetingLimit;

  // Compute booleans
  return {
    userRole,
    // Can request membership: attendee without pending request
    canRequestMembership: userRole === 'attendee' && !pendingRequest,
    // Can request meeting: has pastoral feature, appropriate role, and within limit
    canRequestMeeting: hasPastoralAppointments && roleCanRequest && withinMeetingLimit,
    // Private wall/communities: requires member-level access
    canViewPrivateWall: hasMemberAccess,
    canViewPrivateCommunities: hasMemberAccess,
    // Pending request status
    hasPendingMembershipRequest: !!pendingRequest,
  };
}

/**
 * Check if a user has leader access to any organizations
 *
 * Leader roles: owner, admin, moderator
 */
export async function getUserLeaderOrgs(userId: number): Promise<number[]> {
  const userOrgs = await storage.getUserOrganizations(userId);

  const leaderOrgs: number[] = [];

  for (const org of userOrgs) {
    const role = await storage.getUserRoleInOrg(org.id, userId);
    if (role && ['owner', 'admin', 'moderator'].includes(role)) {
      leaderOrgs.push(org.id);
    }
  }

  return leaderOrgs;
}

/**
 * Compute inbox entitlements for a user
 *
 * Returns booleans indicating what inbox features the user has access to
 */
export async function computeInboxEntitlements(userId: number): Promise<{
  showLeaderInbox: boolean;
  leaderOrgs: number[];
  leaderInboxHasMeetingsTab: boolean;
}> {
  const leaderOrgs = await getUserLeaderOrgs(userId);
  const showLeaderInbox = leaderOrgs.length > 0;

  // Check if any leader org has pastoral appointments feature
  let leaderInboxHasMeetingsTab = false;
  for (const orgId of leaderOrgs) {
    const hasMeetings = await requireOrgFeature(orgId, 'org.pastoral.appointmentRequests');
    if (hasMeetings) {
      leaderInboxHasMeetingsTab = true;
      break;
    }
  }

  return {
    showLeaderInbox,
    leaderOrgs,
    leaderInboxHasMeetingsTab,
  };
}
