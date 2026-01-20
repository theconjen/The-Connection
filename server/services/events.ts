/**
 * Events Service
 *
 * Single source of truth for event operations following the hardened pattern:
 * - Explicit result codes for all operations
 * - RequestId logging for traceability
 * - Explicit event states
 * - Permission checking via community membership service
 * - Structured diagnostics
 */

import { db as dbInstance } from '../db';
import { events, communities, communityMembers, users } from '@shared/schema';
import { eq, and, desc, sql, gte, lte, isNull } from 'drizzle-orm';
import { resolveMembership } from './communityMembership';
import { notifyCommunityMembers, notifyEventAttendees, truncateText } from './notificationHelper';

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

export type EventStatus = 'ACTIVE' | 'CANCELED' | 'COMPLETED';

export type EventResultCode =
  | 'OK'
  | 'EVENT_NOT_FOUND'
  | 'COMMUNITY_NOT_FOUND'
  | 'NOT_AUTHORIZED'
  | 'EVENT_CANCELED'
  | 'INVALID_DATE'
  | 'INVALID_INPUT'
  | 'ERROR';

export interface EventResult {
  status: EventResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    eventId?: number;
    communityId?: number;
    actorId?: number;
    actorRole?: string;
    eventStatus?: string;
    reason: string;
  };
  data?: {
    event?: EventRecord;
  };
}

export interface EventListResult {
  status: EventResultCode;
  success: boolean;
  code: string;
  requestId: string;
  diagnostics: {
    totalCount: number;
    returnedCount: number;
    filters: Record<string, any>;
    reason: string;
  };
  data: {
    events: EventRecord[];
    nextCursor: string | null;
  };
}

export interface EventRecord {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  isVirtual: boolean;
  location?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  virtualMeetingUrl?: string | null;
  isPublic: boolean;
  communityId?: number | null;
  creatorId: number;
  status: string;
  locationProvider?: string | null;
  placeId?: string | null;
  locationText?: string | null;
  createdAt: Date;
}

export interface CreateEventParams {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime?: string;
  isVirtual?: boolean;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  virtualMeetingUrl?: string;
  isPublic?: boolean;
  communityId?: number;
  locationProvider?: string;
  placeId?: string;
  locationText?: string;
}

export interface UpdateEventParams {
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  isVirtual?: boolean;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  virtualMeetingUrl?: string;
  isPublic?: boolean;
  locationProvider?: string;
  placeId?: string;
  locationText?: string;
}

export interface ListEventsFilters {
  communityId?: number;
  isPublic?: boolean;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  cursor?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
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
  console.log(`[EVENT][${operation}] stage=${stage} requestId=${requestId} ${detailStr}`);
}

// ============================================================================
// RESOLVE EVENT ACCESS
// ============================================================================

/**
 * Resolve a user's access to an event
 * Checks if user can view/modify the event based on:
 * - Event visibility (public vs private)
 * - Community membership (for community events)
 * - Creator/admin role
 */
export async function resolveEventAccess(
  eventId: number,
  userId: number | undefined,
  requestId: string
): Promise<EventResult> {
  log('RESOLVE_ACCESS', 'START', requestId, { eventId, userId });

  if (!eventId || eventId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: {
        eventId,
        reason: 'Event ID must be a positive integer',
      },
    };
  }

  try {
    const db = getDb();

    // Get the event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'EVENT_NOT_FOUND' });
      return {
        status: 'EVENT_NOT_FOUND',
        success: false,
        code: 'EVENT_NOT_FOUND',
        requestId,
        diagnostics: {
          eventId,
          reason: 'Event does not exist',
        },
      };
    }

    const eventStatus = (event as any).status || 'ACTIVE';

    // Public events are accessible to everyone
    if (event.isPublic) {
      log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'OK', access: 'public' });
      return {
        status: 'OK',
        success: true,
        code: 'EVENT_ACCESS_GRANTED',
        requestId,
        diagnostics: {
          eventId,
          eventStatus,
          reason: 'Public event - accessible to all',
        },
        data: {
          event: mapEvent(event),
        },
      };
    }

    // Private event - need to check membership
    if (!userId) {
      log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'EVENT_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          eventId,
          eventStatus,
          reason: 'Authentication required for private event',
        },
      };
    }

    // Check if user is the event creator
    if (event.creatorId === userId) {
      log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'OK', access: 'creator' });
      return {
        status: 'OK',
        success: true,
        code: 'EVENT_ACCESS_GRANTED',
        requestId,
        diagnostics: {
          eventId,
          actorId: userId,
          actorRole: 'creator',
          eventStatus,
          reason: 'Event creator - full access',
        },
        data: {
          event: mapEvent(event),
        },
      };
    }

    // Check community membership for community events
    if (event.communityId) {
      const membershipResult = await resolveMembership(event.communityId, userId, requestId);

      if (membershipResult.status === 'OK' && membershipResult.diagnostics.memberStatus === 'APPROVED') {
        log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'OK', access: 'member' });
        return {
          status: 'OK',
          success: true,
          code: 'EVENT_ACCESS_GRANTED',
          requestId,
          diagnostics: {
            eventId,
            communityId: event.communityId,
            actorId: userId,
            actorRole: membershipResult.diagnostics.memberRole,
            eventStatus,
            reason: 'Community member - access granted',
          },
          data: {
            event: mapEvent(event),
          },
        };
      }
    }

    log('RESOLVE_ACCESS', 'COMPLETE', requestId, { status: 'NOT_AUTHORIZED' });
    return {
      status: 'NOT_AUTHORIZED',
      success: false,
      code: 'EVENT_NOT_AUTHORIZED',
      requestId,
      diagnostics: {
        eventId,
        communityId: event.communityId,
        actorId: userId,
        eventStatus,
        reason: 'Not authorized to view this private event',
      },
    };
  } catch (error) {
    log('RESOLVE_ACCESS', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'EVENT_ACCESS_FAILED',
      requestId,
      diagnostics: {
        eventId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// CREATE EVENT
// ============================================================================

/**
 * Create a new event
 * Permission requirements:
 * - Community events: require OWNER/ADMIN/MODERATOR role in community
 * - App-wide events: require isAdmin=true
 */
export async function createEvent(
  params: CreateEventParams,
  actorId: number,
  requestId: string
): Promise<EventResult> {
  log('CREATE', 'START', requestId, { actorId, communityId: params.communityId });

  if (!actorId || actorId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: {
        actorId,
        reason: 'Actor ID is required',
      },
    };
  }

  if (!params.title || !params.description || !params.eventDate || !params.startTime) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: {
        actorId,
        reason: 'Title, description, eventDate, and startTime are required',
      },
    };
  }

  try {
    const db = getDb();

    // Get the actor
    const [actor] = await db
      .select()
      .from(users)
      .where(eq(users.id, actorId))
      .limit(1);

    if (!actor) {
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'EVENT_USER_NOT_FOUND',
        requestId,
        diagnostics: {
          actorId,
          reason: 'User not found',
        },
      };
    }

    const isAppAdmin = actor.isAdmin === true;

    // Check authorization for community events
    if (params.communityId) {
      const [community] = await db
        .select()
        .from(communities)
        .where(eq(communities.id, params.communityId))
        .limit(1);

      if (!community) {
        return {
          status: 'COMMUNITY_NOT_FOUND',
          success: false,
          code: 'EVENT_COMMUNITY_NOT_FOUND',
          requestId,
          diagnostics: {
            communityId: params.communityId,
            actorId,
            reason: 'Community not found',
          },
        };
      }

      // Check if user is community admin/moderator
      if (!isAppAdmin) {
        const membershipResult = await resolveMembership(params.communityId, actorId, requestId);

        if (membershipResult.status !== 'OK' ||
            !['owner', 'moderator'].includes(membershipResult.diagnostics.memberRole || '')) {
          return {
            status: 'NOT_AUTHORIZED',
            success: false,
            code: 'EVENT_NOT_AUTHORIZED',
            requestId,
            diagnostics: {
              communityId: params.communityId,
              actorId,
              actorRole: membershipResult.diagnostics.memberRole,
              reason: 'Only community owners and moderators can create events',
            },
          };
        }
      }
    } else {
      // Non-community events require app admin
      if (!isAppAdmin) {
        return {
          status: 'NOT_AUTHORIZED',
          success: false,
          code: 'EVENT_NOT_AUTHORIZED',
          requestId,
          diagnostics: {
            actorId,
            reason: 'Only app admins can create events without a community',
          },
        };
      }
    }

    // Insert the event
    const [inserted] = await db
      .insert(events)
      .values({
        title: params.title,
        description: params.description,
        eventDate: params.eventDate,
        startTime: params.startTime,
        endTime: params.endTime || params.startTime,
        isVirtual: params.isVirtual || false,
        location: params.location || null,
        address: params.address || null,
        city: params.city || null,
        state: params.state || null,
        zipCode: params.zipCode || null,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
        virtualMeetingUrl: params.virtualMeetingUrl || null,
        isPublic: params.isPublic ?? true,
        communityId: params.communityId || null,
        creatorId: actorId,
      } as any)
      .returning();

    // Set status and location fields separately (migration may not have run)
    try {
      await db.execute(sql`
        UPDATE events
        SET status = 'ACTIVE',
            location_provider = ${params.locationProvider || null},
            place_id = ${params.placeId || null},
            location_text = ${params.locationText || null}
        WHERE id = ${inserted.id}
      `);
    } catch {
      // Columns don't exist yet
    }

    // Notify community members about new event
    if (params.communityId) {
      try {
        const [community] = await db
          .select()
          .from(communities)
          .where(eq(communities.id, params.communityId))
          .limit(1);

        const eventLocation = params.isVirtual ? 'Virtual Event' : (params.location || params.city || 'TBD');
        const eventTime = `${params.eventDate} at ${params.startTime}`;

        await notifyCommunityMembers(
          params.communityId,
          {
            title: `New event: ${truncateText(params.title, 40)}`,
            body: `${eventTime} - ${eventLocation}`,
            data: {
              type: 'event_created',
              eventId: inserted.id,
              communityId: params.communityId,
            },
            category: 'event',
          },
          [actorId]
        );
      } catch (notifError) {
        console.error('[EVENT][CREATE] Notification error:', notifError);
      }
    }

    log('CREATE', 'COMPLETE', requestId, { status: 'OK', eventId: inserted.id });

    return {
      status: 'OK',
      success: true,
      code: 'EVENT_CREATED',
      requestId,
      diagnostics: {
        eventId: inserted.id,
        communityId: params.communityId,
        actorId,
        eventStatus: 'ACTIVE',
        reason: 'Event created successfully',
      },
      data: {
        event: { ...mapEvent(inserted), status: 'ACTIVE' },
      },
    };
  } catch (error) {
    log('CREATE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'EVENT_CREATE_FAILED',
      requestId,
      diagnostics: {
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// UPDATE EVENT
// ============================================================================

/**
 * Update an existing event
 * Permission requirements:
 * - Event creator
 * - Community owner/moderator (for community events)
 * - App admin
 */
export async function updateEvent(
  eventId: number,
  params: UpdateEventParams,
  actorId: number,
  requestId: string
): Promise<EventResult> {
  log('UPDATE', 'START', requestId, { eventId, actorId });

  if (!eventId || eventId <= 0 || !actorId || actorId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        reason: 'Event ID and Actor ID are required',
      },
    };
  }

  try {
    const db = getDb();

    // Get the event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return {
        status: 'EVENT_NOT_FOUND',
        success: false,
        code: 'EVENT_NOT_FOUND',
        requestId,
        diagnostics: {
          eventId,
          actorId,
          reason: 'Event not found',
        },
      };
    }

    const eventStatus = (event as any).status || 'ACTIVE';
    if (eventStatus === 'CANCELED') {
      return {
        status: 'EVENT_CANCELED',
        success: false,
        code: 'EVENT_CANCELED',
        requestId,
        diagnostics: {
          eventId,
          actorId,
          eventStatus,
          reason: 'Cannot update a canceled event',
        },
      };
    }

    // Check authorization
    const [actor] = await db
      .select()
      .from(users)
      .where(eq(users.id, actorId))
      .limit(1);

    const isAppAdmin = actor?.isAdmin === true;
    const isCreator = event.creatorId === actorId;

    let actorRole = isCreator ? 'creator' : 'unknown';

    if (!isAppAdmin && !isCreator) {
      // Check community moderator status
      if (event.communityId) {
        const membershipResult = await resolveMembership(event.communityId, actorId, requestId);
        if (membershipResult.status === 'OK' &&
            ['owner', 'moderator'].includes(membershipResult.diagnostics.memberRole || '')) {
          actorRole = membershipResult.diagnostics.memberRole || 'moderator';
        } else {
          return {
            status: 'NOT_AUTHORIZED',
            success: false,
            code: 'EVENT_NOT_AUTHORIZED',
            requestId,
            diagnostics: {
              eventId,
              actorId,
              actorRole: membershipResult.diagnostics.memberRole,
              reason: 'Only event creator or community moderators can update this event',
            },
          };
        }
      } else {
        return {
          status: 'NOT_AUTHORIZED',
          success: false,
          code: 'EVENT_NOT_AUTHORIZED',
          requestId,
          diagnostics: {
            eventId,
            actorId,
            reason: 'Only event creator can update this event',
          },
        };
      }
    }

    // Build update payload
    const updatePayload: any = {};
    const allowedFields = [
      'title', 'description', 'eventDate', 'startTime', 'endTime',
      'isVirtual', 'location', 'address', 'city', 'state', 'zipCode',
      'latitude', 'longitude', 'virtualMeetingUrl', 'isPublic'
    ];

    for (const field of allowedFields) {
      if ((params as any)[field] !== undefined) {
        updatePayload[field] = (params as any)[field];
      }
    }

    // Update the event
    const [updated] = await db
      .update(events)
      .set(updatePayload)
      .where(eq(events.id, eventId))
      .returning();

    // Update location fields separately
    if (params.locationProvider || params.placeId || params.locationText) {
      try {
        await db.execute(sql`
          UPDATE events
          SET location_provider = COALESCE(${params.locationProvider}, location_provider),
              place_id = COALESCE(${params.placeId}, place_id),
              location_text = COALESCE(${params.locationText}, location_text)
          WHERE id = ${eventId}
        `);
      } catch {
        // Columns don't exist
      }
    }

    // Notify attendees about important changes
    const importantChanges = ['title', 'eventDate', 'startTime', 'location', 'isVirtual'];
    const changedFields = importantChanges.filter(f => (params as any)[f] !== undefined);

    if (changedFields.length > 0) {
      try {
        await notifyEventAttendees(
          eventId,
          {
            title: `Event updated: ${truncateText(updated.title, 40)}`,
            body: `Changes: ${changedFields.join(', ')}`,
            data: {
              type: 'event_updated',
              eventId,
            },
            category: 'event',
          },
          [actorId]
        );
      } catch (notifError) {
        console.error('[EVENT][UPDATE] Notification error:', notifError);
      }
    }

    log('UPDATE', 'COMPLETE', requestId, { status: 'OK', eventId });

    return {
      status: 'OK',
      success: true,
      code: 'EVENT_UPDATED',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        actorRole,
        eventStatus,
        reason: 'Event updated successfully',
      },
      data: {
        event: mapEvent(updated),
      },
    };
  } catch (error) {
    log('UPDATE', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'EVENT_UPDATE_FAILED',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// CANCEL EVENT (Soft Delete)
// ============================================================================

/**
 * Cancel an event (soft delete by setting status to CANCELED)
 */
export async function cancelEvent(
  eventId: number,
  actorId: number,
  requestId: string
): Promise<EventResult> {
  log('CANCEL', 'START', requestId, { eventId, actorId });

  if (!eventId || eventId <= 0 || !actorId || actorId <= 0) {
    return {
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        reason: 'Event ID and Actor ID are required',
      },
    };
  }

  try {
    const db = getDb();

    // Get the event
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return {
        status: 'EVENT_NOT_FOUND',
        success: false,
        code: 'EVENT_NOT_FOUND',
        requestId,
        diagnostics: {
          eventId,
          actorId,
          reason: 'Event not found',
        },
      };
    }

    // Check authorization (only creator can cancel)
    const [actor] = await db
      .select()
      .from(users)
      .where(eq(users.id, actorId))
      .limit(1);

    const isAppAdmin = actor?.isAdmin === true;
    const isCreator = event.creatorId === actorId;

    if (!isAppAdmin && !isCreator) {
      return {
        status: 'NOT_AUTHORIZED',
        success: false,
        code: 'EVENT_NOT_AUTHORIZED',
        requestId,
        diagnostics: {
          eventId,
          actorId,
          reason: 'Only event creator can cancel this event',
        },
      };
    }

    // Set status to CANCELED
    try {
      await db.execute(sql`
        UPDATE events
        SET status = 'CANCELED',
            deleted_at = NOW()
        WHERE id = ${eventId}
      `);
    } catch {
      // If status column doesn't exist, use deletedAt only
      await db
        .update(events)
        .set({ deletedAt: new Date() } as any)
        .where(eq(events.id, eventId));
    }

    // Notify attendees about cancellation
    try {
      await notifyEventAttendees(
        eventId,
        {
          title: `Event canceled: ${truncateText(event.title, 40)}`,
          body: 'This event has been canceled by the organizer.',
          data: {
            type: 'event_canceled',
            eventId,
          },
          category: 'event',
        },
        [actorId]
      );
    } catch (notifError) {
      console.error('[EVENT][CANCEL] Notification error:', notifError);
    }

    log('CANCEL', 'COMPLETE', requestId, { status: 'OK', eventId });

    return {
      status: 'OK',
      success: true,
      code: 'EVENT_CANCELED',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        eventStatus: 'CANCELED',
        reason: 'Event canceled successfully',
      },
    };
  } catch (error) {
    log('CANCEL', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'EVENT_CANCEL_FAILED',
      requestId,
      diagnostics: {
        eventId,
        actorId,
        reason: `Database error: ${(error as Error).message}`,
      },
    };
  }
}

// ============================================================================
// LIST EVENTS
// ============================================================================

/**
 * List events with filtering and access control
 */
export async function listEvents(
  filters: ListEventsFilters,
  userId: number | undefined,
  requestId: string
): Promise<EventListResult> {
  log('LIST', 'START', requestId, { userId, filters });

  const { limit = 50, cursor, status = 'ACTIVE' } = filters;

  try {
    const db = getDb();

    // Build query conditions
    let conditions: any[] = [];

    // Filter by status (default to ACTIVE)
    // This is done in memory since column might not exist

    // Filter by community
    if (filters.communityId) {
      conditions.push(eq(events.communityId, filters.communityId));
    }

    // Filter by public/private
    if (filters.isPublic !== undefined) {
      conditions.push(eq(events.isPublic, filters.isPublic));
    }

    // Date range filters
    if (filters.startDate) {
      conditions.push(gte(events.eventDate as any, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(events.eventDate as any, filters.endDate));
    }

    // Exclude soft-deleted
    conditions.push(isNull(events.deletedAt));

    // Build and execute query
    let query = db
      .select()
      .from(events)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(events.eventDate as any))
      .limit(limit + 1);

    const results = await query;

    // Filter by status in memory (column may not exist)
    let filteredResults = results.filter((e: any) => {
      const eventStatus = e.status || 'ACTIVE';
      return eventStatus === status;
    });

    // Filter private events for non-members
    if (userId) {
      const accessibleEvents: any[] = [];
      for (const event of filteredResults) {
        if (event.isPublic) {
          accessibleEvents.push(event);
        } else if (event.creatorId === userId) {
          accessibleEvents.push(event);
        } else if (event.communityId) {
          const membershipResult = await resolveMembership(event.communityId, userId, requestId);
          if (membershipResult.status === 'OK' && membershipResult.diagnostics.memberStatus === 'APPROVED') {
            accessibleEvents.push(event);
          }
        }
      }
      filteredResults = accessibleEvents;
    } else {
      // Anonymous users only see public events
      filteredResults = filteredResults.filter((e: any) => e.isPublic);
    }

    // Apply cursor pagination
    const hasMore = filteredResults.length > limit;
    const items = hasMore ? filteredResults.slice(0, limit) : filteredResults;
    const nextCursor = hasMore ? String(items[items.length - 1].id) : null;

    log('LIST', 'COMPLETE', requestId, {
      status: 'OK',
      totalCount: results.length,
      returnedCount: items.length
    });

    return {
      status: 'OK',
      success: true,
      code: 'EVENTS_LISTED',
      requestId,
      diagnostics: {
        totalCount: results.length,
        returnedCount: items.length,
        filters,
        reason: 'Events retrieved successfully',
      },
      data: {
        events: items.map(mapEvent),
        nextCursor,
      },
    };
  } catch (error) {
    log('LIST', 'ERROR', requestId, { error: (error as Error).message });
    return {
      status: 'ERROR',
      success: false,
      code: 'EVENT_LIST_FAILED',
      requestId,
      diagnostics: {
        totalCount: 0,
        returnedCount: 0,
        filters,
        reason: `Database error: ${(error as Error).message}`,
      },
      data: {
        events: [],
        nextCursor: null,
      },
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function mapEvent(row: any): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    eventDate: row.eventDate || row.event_date,
    startTime: row.startTime || row.start_time,
    endTime: row.endTime || row.end_time,
    isVirtual: row.isVirtual || row.is_virtual || false,
    location: row.location,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zipCode || row.zip_code,
    latitude: row.latitude,
    longitude: row.longitude,
    virtualMeetingUrl: row.virtualMeetingUrl || row.virtual_meeting_url,
    isPublic: row.isPublic || row.is_public || true,
    communityId: row.communityId || row.community_id,
    creatorId: row.creatorId || row.creator_id,
    status: row.status || 'ACTIVE',
    locationProvider: row.locationProvider || row.location_provider,
    placeId: row.placeId || row.place_id,
    locationText: row.locationText || row.location_text,
    createdAt: row.createdAt || row.created_at,
  };
}
