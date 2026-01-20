/**
 * Community Membership Service
 *
 * Single source of truth for community membership operations following the hardened pattern:
 * - Explicit result codes for all operations
 * - RequestId logging for traceability
 * - Explicit membership states
 * - Structured diagnostics
 */

import { db as dbInstance } from '../db';
import { communities, communityMembers, users } from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { notifyUserWithService, createNotification } from './notifications';

// Ensure db is available
function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Ensure USE_DB=true and DATABASE_URL is set.');
  }
  return dbInstance;
}

// ============================================================================
// TYPES
// ============================================================================

export type MembershipStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'REMOVED';
export type MemberRole = 'owner' | 'moderator' | 'member';

export type MembershipResultCode =
  | 'OK'
  | 'COMMUNITY_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'NOT_AUTHORIZED'
  | 'ALREADY_MEMBER'
  | 'ALREADY_PENDING'
  | 'NOT_A_MEMBER'
  | 'CANNOT_REMOVE_OWNER'
  | 'RATE_LIMITED'
  | 'INVALID_STATE'
  | 'INVALID_INPUT'
  | 'ERROR';

export interface MembershipResult {
  status: MembershipResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    communityId?: number;
    userId?: number;
    actorId?: number;
    memberRole?: string;
    memberStatus?: string;
    communityIsPrivate?: boolean;
    reason: string;
  };
  data?: {
    membership?: CommunityMemberRecord;
  };
}

export interface MembershipListResult {
  status: MembershipResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    communityId: number;
    totalCount: number;
    reason: string;
  };
  data: {
    members: CommunityMemberRecord[];
  };
}

export interface CommunityMemberRecord {
  id: number;
  communityId: number;
  userId: number;
  role: string;
  status: string;
  joinedAt: Date;
  actedByUserId?: number | null;
  actedAt?: Date | null;
  user?: {
    id: number;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

function log(
  operation: string,
  stage: 'START' | 'COMPLETE' | 'ERROR',
  requestId: string,
  details: Record<string, any> = {}
): void {
  const detailStr = Object.entries(details)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');
  console.log(`[COMMUNITY_MEMBERSHIP][${operation}] stage=${stage} requestId=${requestId} ${detailStr}`);
}

// ============================================================================
// RESOLVE MEMBERSHIP - Single source of truth for membership lookup
// ============================================================================

/**
 * Resolve a user's membership in a community
 * This is the single source of truth for membership status checks
 */
export async function resolveMembership(
  communityId: number,
  userId: number,
  requestId: string
): Promise<MembershipResult> {
  log('RESOLVE', 'START', requestId, { communityId, userId });

  if (!communityId || communityId <= 0 || !userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: 'Community ID and User ID must be positive integers',
      },
    };
  }

  try {
    const db = getDb();

    // Check community exists
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    if (!community) {
      log('RESOLVE', 'COMPLETE', requestId, { status: 'COMMUNITY_NOT_FOUND' });
      return {
        status: 'COMMUNITY_NOT_FOUND',
        success: false,
        code: 'MEMBERSHIP_COMMUNITY_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          reason: 'Community does not exist',
        },
      };
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      log('RESOLVE', 'COMPLETE', requestId, { status: 'NOT_A_MEMBER' });
      return {
        status: 'NOT_A_MEMBER',
        success: true, // Query succeeded, just no membership
        code: 'MEMBERSHIP_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          communityIsPrivate: community.isPrivate || false,
          reason: 'User is not a member of this community',
        },
      };
    }

    log('RESOLVE', 'COMPLETE', requestId, {
      status: 'OK',
      role: membership.role,
      memberStatus: (membership as any).status || 'APPROVED'
    });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_RESOLVED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        memberRole: membership.role,
        memberStatus: (membership as any).status || 'APPROVED',
        communityIsPrivate: community.isPrivate || false,
        reason: 'Membership found',
      },
      data: {
        membership: mapMembership(membership),
      },
    };
  } catch (error) {
    log('RESOLVE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_RESOLVE_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// REQUEST JOIN
// ============================================================================

/**
 * Request to join a community
 * - Public communities: immediately APPROVED
 * - Private communities: status set to PENDING
 */
export async function requestJoin(
  communityId: number,
  userId: number,
  requestId: string
): Promise<MembershipResult> {
  log('REQUEST_JOIN', 'START', requestId, { communityId, userId });

  if (!communityId || communityId <= 0 || !userId || userId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: 'Community ID and User ID must be positive integers',
      },
    };
  }

  try {
    const db = getDb();

    // Check community exists
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    if (!community) {
      log('REQUEST_JOIN', 'COMPLETE', requestId, { status: 'COMMUNITY_NOT_FOUND' });
      return {
        status: 'COMMUNITY_NOT_FOUND',
        success: false,
        code: 'MEMBERSHIP_COMMUNITY_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          reason: 'Community does not exist',
        },
      };
    }

    // Check user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      log('REQUEST_JOIN', 'COMPLETE', requestId, { status: 'USER_NOT_FOUND' });
      return {
        status: 'USER_NOT_FOUND',
        success: false,
        code: 'MEMBERSHIP_USER_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          reason: 'User does not exist',
        },
      };
    }

    // Check existing membership
    const [existing] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    const existingStatus = (existing as any)?.status || 'APPROVED';

    if (existing) {
      if (existingStatus === 'APPROVED') {
        log('REQUEST_JOIN', 'COMPLETE', requestId, { status: 'ALREADY_MEMBER' });
        return {
          status: 'ALREADY_MEMBER',
          success: false,
          code: 'MEMBERSHIP_ALREADY_MEMBER',
          requestId,
          diagnostics: {
            communityId,
            userId,
            memberRole: existing.role,
            memberStatus: existingStatus,
            reason: 'User is already a member of this community',
          },
          data: {
            membership: mapMembership(existing),
          },
        };
      }
      if (existingStatus === 'PENDING') {
        log('REQUEST_JOIN', 'COMPLETE', requestId, { status: 'ALREADY_PENDING' });
        return {
          status: 'ALREADY_PENDING',
          success: false,
          code: 'MEMBERSHIP_ALREADY_PENDING',
          requestId,
          diagnostics: {
            communityId,
            userId,
            memberStatus: existingStatus,
            reason: 'User already has a pending join request',
          },
          data: {
            membership: mapMembership(existing),
          },
        };
      }
      // If REJECTED or REMOVED, allow re-requesting
    }

    // Determine initial status based on community privacy
    const isPrivate = community.isPrivate || false;
    const initialStatus: MembershipStatus = isPrivate ? 'PENDING' : 'APPROVED';

    // Check if this will be the first member (becomes owner)
    const existingMembers = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));

    const hasOwner = existingMembers.some(m => m.role === 'owner' && (m as any).status === 'APPROVED');
    const role: MemberRole = (existingMembers.length === 0 || !hasOwner) ? 'owner' : 'member';

    // Insert or update membership
    let membership;
    if (existing) {
      // Update existing record (was REJECTED or REMOVED)
      [membership] = await db
        .update(communityMembers)
        .set({
          role,
          joinedAt: new Date(),
        } as any)
        .where(eq(communityMembers.id, existing.id))
        .returning();

      // Update status separately (column might not exist)
      try {
        await db.execute(sql`
          UPDATE community_members
          SET status = ${initialStatus},
              acted_by_user_id = NULL,
              acted_at = NOW()
          WHERE id = ${existing.id}
        `);
      } catch {
        // Column doesn't exist yet
      }
    } else {
      // Insert new membership
      [membership] = await db
        .insert(communityMembers)
        .values({
          communityId,
          userId,
          role,
          joinedAt: new Date(),
        } as any)
        .returning();

      // Set status separately (column might not exist)
      try {
        await db.execute(sql`
          UPDATE community_members
          SET status = ${initialStatus}
          WHERE id = ${membership.id}
        `);
      } catch {
        // Column doesn't exist yet
      }
    }

    // Send notification to community owner for pending requests
    if (initialStatus === 'PENDING') {
      const owners = existingMembers.filter(m => m.role === 'owner' && (m as any).status === 'APPROVED');
      for (const owner of owners) {
        await createNotification({
          userId: owner.userId,
          title: 'New Join Request',
          body: `${user.displayName || user.username} wants to join ${community.name}`,
          data: { communityId, userId, type: 'join_request' },
          category: 'community',
          sourceType: 'community_join',
          sourceId: `${communityId}:${userId}`,
        }, requestId);
      }
    }

    log('REQUEST_JOIN', 'COMPLETE', requestId, {
      status: 'OK',
      memberStatus: initialStatus,
      role
    });

    return {
      status: 'OK',
      success: true,
      code: initialStatus === 'PENDING' ? 'MEMBERSHIP_PENDING' : 'MEMBERSHIP_APPROVED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        memberRole: role,
        memberStatus: initialStatus,
        communityIsPrivate: isPrivate,
        reason: initialStatus === 'PENDING'
          ? 'Join request submitted, waiting for approval'
          : 'Successfully joined community',
      },
      data: {
        membership: { ...mapMembership(membership), status: initialStatus },
      },
    };
  } catch (error) {
    log('REQUEST_JOIN', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_JOIN_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// APPROVE REQUEST
// ============================================================================

/**
 * Approve a pending join request
 * Only owner/moderator can approve
 */
export async function approveRequest(
  communityId: number,
  userId: number,
  actorId: number,
  requestId: string
): Promise<MembershipResult> {
  log('APPROVE', 'START', requestId, { communityId, userId, actorId });

  if (!communityId || !userId || !actorId) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: 'All IDs are required',
      },
    };
  }

  try {
    const db = getDb();

    // Check actor authorization
    const [actorMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, actorId)
        )
      )
      .limit(1);

    const actorRole = actorMembership?.role;
    const actorStatus = (actorMembership as any)?.status || 'APPROVED';

    if (!actorMembership || !['owner', 'moderator'].includes(actorRole) || actorStatus !== 'APPROVED') {
      log('APPROVE', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'MEMBERSHIP_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'Only owners and moderators can approve requests',
        },
      };
    }

    // Check target membership exists and is PENDING
    const [targetMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    if (!targetMembership) {
      log('APPROVE', 'COMPLETE', requestId, { status: 'NOT_A_MEMBER' });
      return {
        status: 'NOT_A_MEMBER',
        success: false,
        code: 'MEMBERSHIP_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'No pending join request found',
        },
      };
    }

    const targetStatus = (targetMembership as any)?.status;
    if (targetStatus !== 'PENDING') {
      log('APPROVE', 'COMPLETE', requestId, { status: 'INVALID_STATE' });
      return {
        status: 'INVALID_STATE',
        success: false,
        code: 'MEMBERSHIP_INVALID_STATE',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          memberStatus: targetStatus,
          reason: `Cannot approve: membership status is ${targetStatus}, expected PENDING`,
        },
      };
    }

    // Update to APPROVED
    try {
      await db.execute(sql`
        UPDATE community_members
        SET status = 'APPROVED',
            acted_by_user_id = ${actorId},
            acted_at = NOW()
        WHERE id = ${targetMembership.id}
      `);
    } catch {
      // Fallback if columns don't exist
      await db
        .update(communityMembers)
        .set({ role: 'member' } as any)
        .where(eq(communityMembers.id, targetMembership.id));
    }

    // Get community name for notification
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    // Notify the user
    await createNotification({
      userId,
      title: 'Join Request Approved',
      body: `Your request to join ${community?.name || 'the community'} has been approved!`,
      data: { communityId, type: 'join_approved' },
      category: 'community',
      sourceType: 'community_approve',
      sourceId: `${communityId}:${userId}`,
    }, requestId);

    log('APPROVE', 'COMPLETE', requestId, { status: 'OK' });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_APPROVED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        memberStatus: 'APPROVED',
        reason: 'Join request approved successfully',
      },
      data: {
        membership: { ...mapMembership(targetMembership), status: 'APPROVED' },
      },
    };
  } catch (error) {
    log('APPROVE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_APPROVE_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// DENY REQUEST
// ============================================================================

/**
 * Deny a pending join request
 * Only owner/moderator can deny
 */
export async function denyRequest(
  communityId: number,
  userId: number,
  actorId: number,
  requestId: string
): Promise<MembershipResult> {
  log('DENY', 'START', requestId, { communityId, userId, actorId });

  if (!communityId || !userId || !actorId) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: 'All IDs are required',
      },
    };
  }

  try {
    const db = getDb();

    // Check actor authorization
    const [actorMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, actorId)
        )
      )
      .limit(1);

    const actorRole = actorMembership?.role;
    const actorStatus = (actorMembership as any)?.status || 'APPROVED';

    if (!actorMembership || !['owner', 'moderator'].includes(actorRole) || actorStatus !== 'APPROVED') {
      log('DENY', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'MEMBERSHIP_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'Only owners and moderators can deny requests',
        },
      };
    }

    // Check target membership exists and is PENDING
    const [targetMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    if (!targetMembership) {
      log('DENY', 'COMPLETE', requestId, { status: 'NOT_A_MEMBER' });
      return {
        status: 'NOT_A_MEMBER',
        success: false,
        code: 'MEMBERSHIP_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'No pending join request found',
        },
      };
    }

    const targetStatus = (targetMembership as any)?.status;
    if (targetStatus !== 'PENDING') {
      log('DENY', 'COMPLETE', requestId, { status: 'INVALID_STATE' });
      return {
        status: 'INVALID_STATE',
        success: false,
        code: 'MEMBERSHIP_INVALID_STATE',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          memberStatus: targetStatus,
          reason: `Cannot deny: membership status is ${targetStatus}, expected PENDING`,
        },
      };
    }

    // Update to REJECTED
    try {
      await db.execute(sql`
        UPDATE community_members
        SET status = 'REJECTED',
            acted_by_user_id = ${actorId},
            acted_at = NOW()
        WHERE id = ${targetMembership.id}
      `);
    } catch {
      // Delete the record if columns don't exist
      await db
        .delete(communityMembers)
        .where(eq(communityMembers.id, targetMembership.id));
    }

    // Get community name for notification
    const [community] = await db
      .select()
      .from(communities)
      .where(eq(communities.id, communityId))
      .limit(1);

    // Notify the user
    await createNotification({
      userId,
      title: 'Join Request Declined',
      body: `Your request to join ${community?.name || 'the community'} was not approved.`,
      data: { communityId, type: 'join_denied' },
      category: 'community',
      sourceType: 'community_deny',
      sourceId: `${communityId}:${userId}`,
    }, requestId);

    log('DENY', 'COMPLETE', requestId, { status: 'OK' });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_DENIED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        memberStatus: 'REJECTED',
        reason: 'Join request denied',
      },
      data: {
        membership: { ...mapMembership(targetMembership), status: 'REJECTED' },
      },
    };
  } catch (error) {
    log('DENY', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_DENY_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// LEAVE COMMUNITY
// ============================================================================

/**
 * Leave a community voluntarily
 */
export async function leaveCommunity(
  communityId: number,
  userId: number,
  requestId: string
): Promise<MembershipResult> {
  log('LEAVE', 'START', requestId, { communityId, userId });

  if (!communityId || !userId) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: 'Community ID and User ID are required',
      },
    };
  }

  try {
    const db = getDb();

    // Check membership exists
    const [membership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      log('LEAVE', 'COMPLETE', requestId, { status: 'NOT_A_MEMBER' });
      return {
        status: 'NOT_A_MEMBER',
        success: false,
        code: 'MEMBERSHIP_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          reason: 'User is not a member of this community',
        },
      };
    }

    const memberStatus = (membership as any)?.status || 'APPROVED';
    if (memberStatus !== 'APPROVED') {
      log('LEAVE', 'COMPLETE', requestId, { status: 'INVALID_STATE' });
      return {
        status: 'INVALID_STATE',
        success: false,
        code: 'MEMBERSHIP_INVALID_STATE',
        requestId,
        diagnostics: {
          communityId,
          userId,
          memberStatus,
          reason: 'User does not have an active membership',
        },
      };
    }

    // If owner is leaving, need to handle ownership transfer
    if (membership.role === 'owner') {
      const allMembers = await db
        .select()
        .from(communityMembers)
        .where(eq(communityMembers.communityId, communityId));

      const approvedMembers = allMembers.filter(m => {
        const status = (m as any).status || 'APPROVED';
        return status === 'APPROVED' && m.userId !== userId;
      });

      if (approvedMembers.length === 0) {
        // Owner is the only approved member - delete the community
        await db
          .delete(communityMembers)
          .where(eq(communityMembers.communityId, communityId));

        // Soft delete community
        await db
          .update(communities)
          .set({ deletedAt: new Date() } as any)
          .where(eq(communities.id, communityId));

        log('LEAVE', 'COMPLETE', requestId, { status: 'OK', communityDeleted: true });

        return {
          status: 'OK',
          success: true,
          code: 'MEMBERSHIP_LEFT_COMMUNITY_DELETED',
          requestId,
          diagnostics: {
            communityId,
            userId,
            memberRole: 'owner',
            reason: 'Left community (community deleted as last member)',
          },
        };
      } else {
        // Transfer ownership to first moderator or first member
        const moderators = approvedMembers.filter(m => m.role === 'moderator');
        const newOwner = moderators[0] || approvedMembers[0];

        await db
          .update(communityMembers)
          .set({ role: 'owner' })
          .where(eq(communityMembers.id, newOwner.id));

        log('LEAVE', 'COMPLETE', requestId, { newOwner: newOwner.userId });
      }
    }

    // Remove the membership
    await db
      .delete(communityMembers)
      .where(eq(communityMembers.id, membership.id));

    log('LEAVE', 'COMPLETE', requestId, { status: 'OK' });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_LEFT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        memberRole: membership.role,
        reason: 'Successfully left community',
      },
    };
  } catch (error) {
    log('LEAVE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_LEAVE_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// REMOVE MEMBER
// ============================================================================

/**
 * Remove a member from a community (kick)
 * Only owner can remove members
 */
export async function removeMember(
  communityId: number,
  userId: number,
  actorId: number,
  requestId: string
): Promise<MembershipResult> {
  log('REMOVE', 'START', requestId, { communityId, userId, actorId });

  if (!communityId || !userId || !actorId) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'MEMBERSHIP_INVALID_INPUT',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: 'All IDs are required',
      },
    };
  }

  try {
    const db = getDb();

    // Check actor authorization (must be owner)
    const [actorMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, actorId)
        )
      )
      .limit(1);

    const actorRole = actorMembership?.role;
    const actorStatus = (actorMembership as any)?.status || 'APPROVED';

    if (!actorMembership || actorRole !== 'owner' || actorStatus !== 'APPROVED') {
      log('REMOVE', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'MEMBERSHIP_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'Only owners can remove members',
        },
      };
    }

    // Check target membership exists
    const [targetMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    if (!targetMembership) {
      log('REMOVE', 'COMPLETE', requestId, { status: 'NOT_A_MEMBER' });
      return {
        status: 'NOT_A_MEMBER',
        success: false,
        code: 'MEMBERSHIP_NOT_FOUND',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          reason: 'User is not a member of this community',
        },
      };
    }

    // Cannot remove owner
    if (targetMembership.role === 'owner') {
      log('REMOVE', 'COMPLETE', requestId, { status: 'CANNOT_REMOVE_OWNER' });
      return {
        status: 'CANNOT_REMOVE_OWNER',
        success: false,
        code: 'MEMBERSHIP_CANNOT_REMOVE_OWNER',
        requestId,
        diagnostics: {
          communityId,
          userId,
          actorId,
          memberRole: 'owner',
          reason: 'Cannot remove the community owner',
        },
      };
    }

    // Remove the membership (or set status to REMOVED)
    try {
      await db.execute(sql`
        UPDATE community_members
        SET status = 'REMOVED',
            acted_by_user_id = ${actorId},
            acted_at = NOW()
        WHERE id = ${targetMembership.id}
      `);
    } catch {
      // Delete if columns don't exist
      await db
        .delete(communityMembers)
        .where(eq(communityMembers.id, targetMembership.id));
    }

    log('REMOVE', 'COMPLETE', requestId, { status: 'OK' });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_REMOVED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        memberStatus: 'REMOVED',
        reason: 'Member removed from community',
      },
    };
  } catch (error) {
    log('REMOVE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_REMOVE_FAILED',
      requestId,
      diagnostics: {
        communityId,
        userId,
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// GET PENDING REQUESTS
// ============================================================================

/**
 * Get all pending join requests for a community
 */
export async function getPendingRequests(
  communityId: number,
  actorId: number,
  requestId: string
): Promise<MembershipListResult> {
  log('GET_PENDING', 'START', requestId, { communityId, actorId });

  try {
    const db = getDb();

    // Check actor authorization
    const [actorMembership] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, actorId)
        )
      )
      .limit(1);

    const actorRole = actorMembership?.role;
    const actorStatus = (actorMembership as any)?.status || 'APPROVED';

    if (!actorMembership || !['owner', 'moderator'].includes(actorRole) || actorStatus !== 'APPROVED') {
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'MEMBERSHIP_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          communityId,
          totalCount: 0,
          reason: 'Only owners and moderators can view pending requests',
        },
        data: { members: [] },
      };
    }

    // Get pending members
    const pendingMembers = await db.execute(sql`
      SELECT cm.*, u.username, u.display_name, u.avatar_url
      FROM community_members cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.community_id = ${communityId}
        AND cm.status = 'PENDING'
      ORDER BY cm.joined_at DESC
    `);

    const members = (pendingMembers.rows || []).map((row: any) => ({
      id: row.id,
      communityId: row.community_id,
      userId: row.user_id,
      role: row.role,
      status: row.status,
      joinedAt: row.joined_at,
      user: {
        id: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    }));

    log('GET_PENDING', 'COMPLETE', requestId, { count: members.length });

    return {
      status: 'OK',
      success: true,
      code: 'MEMBERSHIP_PENDING_LISTED',
      requestId,
      diagnostics: {
        communityId,
        totalCount: members.length,
        reason: 'Pending requests retrieved',
      },
      data: { members },
    };
  } catch (error) {
    log('GET_PENDING', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'MEMBERSHIP_LIST_FAILED',
      requestId,
      diagnostics: {
        communityId,
        totalCount: 0,
        reason: `Database error: ${(error as Error).message}`,
      },
      data: { members: [] },
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function mapMembership(row: any): CommunityMemberRecord {
  return {
    id: row.id,
    communityId: row.communityId || row.community_id,
    userId: row.userId || row.user_id,
    role: row.role,
    status: row.status || 'APPROVED',
    joinedAt: row.joinedAt || row.joined_at,
    actedByUserId: row.actedByUserId || row.acted_by_user_id,
    actedAt: row.actedAt || row.acted_at,
  };
}
