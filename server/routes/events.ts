import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertEventSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { notifyCommunityMembers, notifyEventAttendees, notifyNearbyUsers, truncateText } from '../services/notificationHelper';
import {
  createEvent as createEventService,
  updateEvent as updateEventService,
  cancelEvent as cancelEventService,
  listEvents as listEventsService,
  resolveEventAccess,
} from '../services/events';

const router = Router();

router.get('/api/events', async (req, res) => {
  try {
    const filter = req.query.filter as string;
    const userId = getSessionUserId(req);
    const rsvpStatus = req.query.rsvpStatus as string; // 'going', 'maybe', 'not_going'
    const communityId = req.query.communityId ? parseInt(req.query.communityId as string) : undefined;

    // Distance filtering parameters
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const distance = req.query.distance ? parseFloat(req.query.distance as string) : undefined;

    let events;

    // If distance filtering is requested with valid coordinates
    if (latitude !== undefined && longitude !== undefined && distance !== undefined &&
        Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(distance)) {
      // Use distance-based filtering
      events = await storage.getEventsNearLocation(latitude, longitude, distance);

      // Calculate and attach distance to each event
      events = events.map((event: any) => {
        const eventLat = event.latitude ? parseFloat(String(event.latitude)) : null;
        const eventLng = event.longitude ? parseFloat(String(event.longitude)) : null;

        if (eventLat !== null && eventLng !== null && Number.isFinite(eventLat) && Number.isFinite(eventLng)) {
          const haversineDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
            const toRadians = (deg: number) => (deg * Math.PI) / 180;
            const earthRadiusMiles = 3958.8;
            const dLat = toRadians(lat2 - lat1);
            const dLon = toRadians(lon2 - lon1);
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return earthRadiusMiles * c;
          };

          const distanceMiles = haversineDistanceMiles(latitude, longitude, eventLat, eventLng);
          return {
            ...event,
            distanceMiles: parseFloat(distanceMiles.toFixed(1)),
          };
        }

        return event;
      });
    } else {
      // No distance filtering - get all events
      events = await storage.getAllEvents();
    }

    // Filter out events from blocked users
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        events = events.filter((e: any) => !blockedIds.includes(e.creatorId));
      }
    }

    // Community-specific filtering
    if (communityId && Number.isFinite(communityId)) {
      // Filter to only this community's events
      events = events.filter((e: any) => e.communityId === communityId);

      // For community pages, check if user is a member to show private events
      if (userId) {
        const isMember = await storage.isCommunityMember(userId, communityId);
        if (!isMember) {
          // Non-members can only see public events from this community
          events = events.filter((e: any) => e.isPrivate !== true);
        }
        // Members can see all events including private ones
      } else {
        // Unauthenticated users can only see public events
        events = events.filter((e: any) => e.isPrivate !== true);
      }
    } else {
      // App-wide listing: filter out private events
      // Private events (isPrivate=true) should only be visible on the community's event page
      events = events.filter((e: any) => e.isPrivate !== true);
    }

    // Get user's RSVPs to attach status to each event
    let userRsvpMap: Record<number, string> = {};
    let userBookmarkSet: Set<number> = new Set();
    if (userId) {
      const userRsvps = await storage.getUserRSVPs(userId);
      userRsvpMap = userRsvps.reduce((acc: Record<number, string>, rsvp: any) => {
        acc[rsvp.eventId] = rsvp.status;
        return acc;
      }, {});

      // Get user's bookmarked event IDs
      const bookmarkedIds = await storage.getUserEventBookmarkIds(userId);
      userBookmarkSet = new Set(bookmarkedIds);
    }

    // Filter by RSVP status if requested
    if (rsvpStatus && userId) {
      // Map frontend status values to backend values for compatibility
      // Frontend may send: 'going', 'maybe', 'not_going'
      // Backend stores: 'going', 'maybe', 'not_going' (now aligned)
      const eventIdsWithStatus = Object.entries(userRsvpMap)
        .filter(([_, status]) => status === rsvpStatus)
        .map(([eventId, _]) => parseInt(eventId));

      // Filter events to only include those with matching RSVP status
      events = events.filter((e: any) => eventIdsWithStatus.includes(e.id));
    }

    // Attach user's RSVP status and bookmark status to each event
    const eventsWithUserData = events.map((event: any) => ({
      ...event,
      userRsvpStatus: userRsvpMap[event.id] || null,
      isBookmarked: userBookmarkSet.has(event.id),
    }));

    res.json({ events: eventsWithUserData });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json(buildErrorResponse('Error fetching events', error));
  }
});

router.get('/api/events/public', async (_req, res) => {
  try {
    const allEvents = await storage.getAllEvents();
    const events = allEvents.filter((event: any) => event.isPublic);
    res.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json(buildErrorResponse('Error fetching public events', error));
  }
});

router.get('/api/events/upcoming', async (_req, res) => {
  try {
    const now = new Date();
    const all = await storage.getAllEvents();
    // Filter out private events from app-wide upcoming list
    const upcoming = all
      .filter((e: any) => !e.deletedAt && e.isPrivate !== true && new Date(e.eventDate) >= new Date(now.toDateString()))
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json(buildErrorResponse('Error fetching upcoming events', error));
  }
});

router.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json(buildErrorResponse('Error fetching event', error));
  }
});

// Create event - requires community admin or app admin
router.post('/api/events', requireAuth, async (req, res) => {
  // DEBUG: Version marker to confirm deployment
  console.info('[Events] POST /api/events - Handler v2 (with detailed error handling)');

  try {
    const userId = requireSessionUserId(req);
    console.info('[Events] User ID from session:', userId);

    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      isVirtual,
      location,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      virtualMeetingUrl,
      isPublic,
      communityId,
      startsAt // Support legacy format
    } = req.body || {};

    // Support both new format (eventDate, startTime, endTime) and legacy format (startsAt)
    let finalEventDate: string;
    let finalStartTime: string;
    let finalEndTime: string;

    if (startsAt) {
      // Legacy format
      const start = new Date(startsAt);
      if (isNaN(start.getTime()) || start.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'startsAt must be in the future' });
      }
      finalEventDate = start.toISOString().slice(0, 10);
      finalStartTime = start.toISOString().slice(11, 19);
      finalEndTime = start.toISOString().slice(11, 19);
    } else {
      // New format
      if (!title || !description || !eventDate || !startTime) {
        return res.status(400).json({ error: 'title, description, eventDate, and startTime are required' });
      }
      finalEventDate = eventDate;
      finalStartTime = startTime;
      finalEndTime = endTime || startTime;
    }

    // Check if user is the app owner (unique privilege for "The Connection" events)
    const user = await storage.getUser(userId);
    console.info('[Events] User lookup result:', user ? { id: user.id, username: user.username, isAdmin: user.isAdmin } : 'null');

    const isAppAdmin = user?.isAdmin === true;
    // Only Janelle (app owner) can create events hosted by "The Connection" (no community)
    // Community admins can create events for their communities (which can be public or private)
    const isAppOwner = user?.username === 'Janelle';
    console.info('[Events] Auth check:', { isAppAdmin, isAppOwner, communityId, userId, username: user?.username });

    // Only app owner (Janelle) can create events without a community (hosted by "The Connection")
    // All other users must specify a communityId for their community events
    if (!communityId && !isAppOwner) {
      console.warn('[Events] Rejecting: communityId required - only Janelle can create "The Connection" events');
      return res.status(400).json({ error: 'Please select a community for your event' });
    }

    // If communityId is provided, verify it exists and check authorization
    let community = null;
    if (communityId) {
      community = await storage.getCommunity(communityId);
      if (!community) {
        return res.status(404).json({ error: 'Community not found' });
      }

      // Authorization check for community events:
      // 1. User is app admin (can create events for any community)
      // 2. OR user is community owner/moderator (can create events for their communities)
      const isCommunityAdmin = await storage.isCommunityModerator(communityId, userId);

      if (!isAppAdmin && !isCommunityAdmin) {
        return res.status(403).json({
          error: 'Only community admins can create events for this community'
        });
      }
    }
    // If no communityId, user must be admin (already checked above)

    // Build event payload
    const payload = {
      title,
      description,
      eventDate: finalEventDate,
      startTime: finalStartTime,
      endTime: finalEndTime,
      isVirtual: isVirtual ?? false,
      location: location || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      latitude: latitude || null,
      longitude: longitude || null,
      virtualMeetingUrl: virtualMeetingUrl || null,
      isPublic: isPublic ?? true,
      communityId: communityId || null, // Explicitly null for "The Connection" events
      creatorId: userId,
    };

    let validated;
    try {
      validated = insertEventSchema.parse(payload as any);
    } catch (zodError: any) {
      // Surface Zod validation errors with details
      console.error('[Events] Zod validation error:', zodError.errors || zodError.message);
      return res.status(400).json({
        error: 'Validation error',
        details: zodError.errors || zodError.message,
        payload: { ...payload, creatorId: '[hidden]' }, // Log payload for debugging (hide sensitive data)
      });
    }

    // Log validated payload before database insert
    console.info('[Events] Creating event with validated payload:', JSON.stringify({ ...validated, creatorId: '[hidden]' }));
    console.info('[Events] communityId value:', validated.communityId, '| type:', typeof validated.communityId);

    let event;
    try {
      console.info('[Events] Calling storage.createEvent...');
      event = await storage.createEvent(validated);
      console.info('[Events] storage.createEvent returned:', event ? `Event ID ${event.id}` : 'null/undefined');
    } catch (dbError: any) {
      // Surface database errors with details
      console.error('[Events] Database error creating event:', dbError.message || dbError);
      console.error('[Events] Error code:', dbError.code);
      console.error('[Events] Error detail:', dbError.detail);
      console.error('[Events] Error constraint:', dbError.constraint);
      return res.status(500).json({
        error: 'Database error',
        message: dbError.message || 'Failed to insert event into database',
        code: dbError.code || 'UNKNOWN',
        detail: dbError.detail || null,
        constraint: dbError.constraint || null,
      });
    }

    // Verify event was actually created
    if (!event || !event.id) {
      console.error('[Events] Event creation returned but no event ID! Event:', event);
      return res.status(500).json({
        error: 'Event creation failed',
        message: 'Database insert succeeded but returned no event ID',
      });
    }

    console.info('[Events] Event created successfully with ID:', event.id);

    // Notify community members about new event
    if (event.communityId) {
      try {
        const community = await storage.getCommunity(event.communityId);
        const eventLocation = event.isVirtual ? 'Virtual Event' : (event.location || event.city || 'TBD');
        const eventTime = `${event.eventDate} at ${event.startTime}`;

        await notifyCommunityMembers(
          event.communityId,
          {
            title: `New event: ${truncateText(event.title, 40)}`,
            body: `${eventTime} - ${eventLocation}`,
            data: {
              type: 'event_created',
              eventId: event.id,
              communityId: event.communityId,
            },
            category: 'event',
          },
          [userId] // Exclude event creator
        );
        console.info(`[Events] Notified community ${event.communityId} about new event ${event.id}`);
      } catch (notifError) {
        console.error('[Events] Error sending event creation notification:', notifError);
      }
    }

    res.status(201).json(event);
  } catch (error: any) {
    // Always log the full error for debugging
    console.error('[Events] Unhandled error creating event:', error);

    // Return detailed error info (temporarily for debugging)
    res.status(500).json({
      error: 'Error creating event',
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      // Include error name to help identify the type
      type: error?.name || error?.constructor?.name || 'Error',
    });
  }
});

// Update event - requires event creator or community admin
router.patch('/api/events/:id', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    // Check if event exists
    const existingEvent = await storage.getEvent(eventId);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Authorization: must be event creator or community admin
    const user = await storage.getUser(userId);
    const isEventCreator = existingEvent.creatorId === userId;
    const isAppAdmin = user?.isAdmin === true;
    const isCommunityAdmin = existingEvent.communityId
      ? await storage.isCommunityModerator(existingEvent.communityId, userId)
      : false;

    if (!isEventCreator && !isAppAdmin && !isCommunityAdmin) {
      return res.status(403).json({ error: 'Only event creator or community admins can update this event' });
    }

    // Build update payload (only include fields that are provided)
    const updatePayload: any = {};
    const allowedFields = ['title', 'description', 'eventDate', 'startTime', 'endTime', 'isVirtual',
                           'location', 'address', 'city', 'state', 'zipCode', 'virtualMeetingUrl', 'isPublic'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatePayload[field] = req.body[field];
      }
    }

    // Update event
    const updatedEvent = await storage.updateEvent(eventId, updatePayload);

    // Notify RSVPed users about event update
    if (existingEvent.communityId) {
      try {
        const changes = Object.keys(updatePayload)
          .filter(key => ['title', 'eventDate', 'startTime', 'location', 'isVirtual'].includes(key))
          .join(', ');

        if (changes) {
          await notifyEventAttendees(
            eventId,
            {
              title: `Event updated: ${truncateText(updatedEvent.title, 40)}`,
              body: `Changes: ${changes}`,
              data: {
                type: 'event_updated',
                eventId: updatedEvent.id,
              },
              category: 'event',
            },
            [userId] // Exclude the person making the update
          );
          console.info(`[Events] Notified attendees about event ${eventId} update`);
        }
      } catch (notifError) {
        console.error('[Events] Error sending event update notification:', notifError);
      }
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json(buildErrorResponse('Error updating event', error));
  }
});

router.delete('/api/events/:id', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const ev = await storage.getEvent(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    if (ev.creatorId !== userId) return res.status(403).json({ message: 'Only creator can delete event' });

    const ok = await storage.deleteEvent(eventId);
    if (!ok) return res.status(404).json({ message: 'Event not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json(buildErrorResponse('Error deleting event', error));
  }
});

// RSVP to an event
router.post('/api/events/:id/rsvp', requireAuth, async (req, res) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.info(`[RSVP][${requestId}] RSVP request received for event ${req.params.id}`);

  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { status } = req.body; // 'going', 'maybe', 'not_going'

    console.info(`[RSVP][${requestId}] Processing: userId=${userId}, eventId=${eventId}, status=${status}`);

    // Accept both old format ('attending', 'maybe', 'declined') and new format ('going', 'maybe', 'not_going')
    const validStatuses = ['going', 'maybe', 'not_going', 'attending', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be going, maybe, or not_going' });
    }

    // Normalize to new format for storage
    let normalizedStatus = status;
    if (status === 'attending') normalizedStatus = 'going';
    if (status === 'declined') normalizedStatus = 'not_going';

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get count before RSVP to detect threshold crossing
    const rsvpsBefore = await storage.getEventRSVPs(eventId);
    const attendingCountBefore = rsvpsBefore.filter(
      r => r.status === 'going' || r.status === 'maybe' || r.status === 'interested'
    ).length;

    // Upsert RSVP (creates or updates)
    const rsvp = await storage.upsertEventRSVP(eventId, userId, normalizedStatus);

    // Check if we just crossed the 25 RSVP threshold
    const rsvpsAfter = await storage.getEventRSVPs(eventId);
    const attendingCountAfter = rsvpsAfter.filter(
      r => r.status === 'going' || r.status === 'maybe' || r.status === 'interested'
    ).length;

    // If we just hit 25 RSVPs and event has location, notify nearby users
    if (attendingCountBefore < 25 && attendingCountAfter >= 25) {
      console.info(`[Events] Event ${eventId} reached 25 RSVPs! Notifying nearby users...`);

      // Check if event has location data
      if (event.latitude && event.longitude) {
        const eventLat = parseFloat(String(event.latitude));
        const eventLon = parseFloat(String(event.longitude));

        if (!isNaN(eventLat) && !isNaN(eventLon)) {
          try {
            // Get all users who already RSVP'd to exclude them
            const rsvpedUserIds = rsvpsAfter.map(r => r.userId);

            const eventLocation = event.isVirtual ? 'Virtual Event' : (event.location || event.city || 'TBD');
            const eventTime = `${event.eventDate} at ${event.startTime}`;

            // Notify users within 20 miles (async, don't block response)
            notifyNearbyUsers(
              eventId,
              eventLat,
              eventLon,
              20, // 20 miles radius
              {
                title: `🔥 Popular event near you!`,
                body: `${truncateText(event.title, 50)} - ${attendingCountAfter} attending - ${eventTime}`,
                data: {
                  type: 'popular_event',
                  eventId: event.id,
                  rsvpCount: attendingCountAfter,
                },
                category: 'event',
              },
              rsvpedUserIds // Exclude users who already RSVP'd
            ).catch(error => {
              console.error('[Events] Error notifying nearby users:', error);
            });
          } catch (error) {
            console.error('[Events] Error processing nearby notifications:', error);
          }
        } else {
          console.warn(`[Events] Event ${eventId} has invalid coordinates`);
        }
      } else {
        console.info(`[Events] Event ${eventId} has no location data, skipping nearby notifications`);
      }
    }

    res.json(rsvp);
  } catch (error) {
    console.error('Error creating RSVP:', error);
    res.status(500).json(buildErrorResponse('Error creating RSVP', error));
  }
});

// Get RSVPs for an event
router.get('/api/events/:id/rsvps', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const rsvps = await storage.getEventRSVPs(eventId);
    res.json(rsvps);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    res.status(500).json(buildErrorResponse('Error fetching RSVPs', error));
  }
});

// Get current user's RSVP for an event
router.get('/api/events/:id/my-rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const rsvp = await storage.getUserEventRSVP(eventId, userId);
    res.json(rsvp || null);
  } catch (error) {
    console.error('Error fetching user RSVP:', error);
    res.status(500).json(buildErrorResponse('Error fetching user RSVP', error));
  }
});

// Delete/cancel RSVP
router.delete('/api/events/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const rsvp = await storage.getUserEventRSVP(eventId, userId);
    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    await storage.deleteEventRSVP(rsvp.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    res.status(500).json(buildErrorResponse('Error deleting RSVP', error));
  }
});

// ============================================================================
// EVENT BOOKMARK ENDPOINTS
// ============================================================================

// Bookmark an event
router.post('/api/events/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const bookmark = await storage.bookmarkEvent(eventId, userId);
    res.status(201).json({ success: true, bookmark });
  } catch (error) {
    console.error('Error bookmarking event:', error);
    res.status(500).json(buildErrorResponse('Error bookmarking event', error));
  }
});

// Unbookmark an event
router.delete('/api/events/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const success = await storage.unbookmarkEvent(eventId, userId);
    if (!success) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ success: true, message: 'Event unbookmarked successfully' });
  } catch (error) {
    console.error('Error unbookmarking event:', error);
    res.status(500).json(buildErrorResponse('Error unbookmarking event', error));
  }
});

// Get user's bookmarked events
router.get('/api/events/bookmarks', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const events = await storage.getUserBookmarkedEvents(userId);

    // Filter out events from blocked users
    const blockedIds = await storage.getBlockedUserIdsFor(userId);
    const filteredEvents = blockedIds && blockedIds.length > 0
      ? events.filter((e: any) => !blockedIds.includes(e.creatorId))
      : events;

    res.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching bookmarked events:', error);
    res.status(500).json(buildErrorResponse('Error fetching bookmarked events', error));
  }
});

// Check if event is bookmarked
router.get('/api/events/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const isBookmarked = await storage.hasUserBookmarkedEvent(eventId, userId);
    res.json({ isBookmarked });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    res.status(500).json(buildErrorResponse('Error checking bookmark status', error));
  }
});

// ============================================================================
// V2 EVENT ROUTES (Hardened Service Pattern)
// These routes use the new events service for structured results
// ============================================================================

/**
 * Helper to get or generate requestId
 */
function getRequestId(req: any): string {
  return req.headers['x-request-id'] as string || uuidv4();
}

/**
 * Map service result to HTTP response
 */
function mapStatusToHttpCode(status: string): number {
  switch (status) {
    case 'OK':
      return 200;
    case 'EVENT_NOT_FOUND':
    case 'COMMUNITY_NOT_FOUND':
      return 404;
    case 'NOT_AUTHORIZED':
      return 403;
    case 'EVENT_CANCELED':
    case 'INVALID_DATE':
    case 'INVALID_INPUT':
      return 400;
    case 'ERROR':
    default:
      return 500;
  }
}

// GET /api/events/v2 - List events with service
router.get('/api/events/v2', async (req, res) => {
  const requestId = getRequestId(req);
  const userId = getSessionUserId(req);

  const filters = {
    communityId: req.query.communityId ? parseInt(req.query.communityId as string) : undefined,
    isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
    status: (req.query.status as any) || 'ACTIVE',
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    cursor: req.query.cursor as string,
  };

  const result = await listEventsService(filters, userId, requestId);
  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// GET /api/events/:id/v2 - Get event with access check
router.get('/api/events/:id/v2', async (req, res) => {
  const requestId = getRequestId(req);
  const eventId = parseInt(req.params.id);
  const userId = getSessionUserId(req);

  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: { reason: 'Invalid event ID' },
    });
  }

  const result = await resolveEventAccess(eventId, userId, requestId);
  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// POST /api/events/v2 - Create event with service
router.post('/api/events/v2', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const actorId = requireSessionUserId(req);

  const params = {
    title: req.body.title,
    description: req.body.description,
    eventDate: req.body.eventDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    isVirtual: req.body.isVirtual,
    location: req.body.location,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    virtualMeetingUrl: req.body.virtualMeetingUrl,
    isPublic: req.body.isPublic,
    communityId: req.body.communityId,
    locationProvider: req.body.locationProvider,
    placeId: req.body.placeId,
    locationText: req.body.locationText,
  };

  const result = await createEventService(params, actorId, requestId);
  res.setHeader('x-request-id', requestId);
  res.status(result.success ? 201 : mapStatusToHttpCode(result.status)).json(result);
});

// PATCH /api/events/:id/v2 - Update event with service
router.patch('/api/events/:id/v2', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const eventId = parseInt(req.params.id);
  const actorId = requireSessionUserId(req);

  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: { reason: 'Invalid event ID' },
    });
  }

  const params = {
    title: req.body.title,
    description: req.body.description,
    eventDate: req.body.eventDate,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    isVirtual: req.body.isVirtual,
    location: req.body.location,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zipCode: req.body.zipCode,
    latitude: req.body.latitude,
    longitude: req.body.longitude,
    virtualMeetingUrl: req.body.virtualMeetingUrl,
    isPublic: req.body.isPublic,
    locationProvider: req.body.locationProvider,
    placeId: req.body.placeId,
    locationText: req.body.locationText,
  };

  const result = await updateEventService(eventId, params, actorId, requestId);
  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

// DELETE /api/events/:id/v2 - Cancel event (soft delete)
router.delete('/api/events/:id/v2', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const eventId = parseInt(req.params.id);
  const actorId = requireSessionUserId(req);

  if (isNaN(eventId) || eventId <= 0) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      success: false,
      code: 'EVENT_INVALID_INPUT',
      requestId,
      diagnostics: { reason: 'Invalid event ID' },
    });
  }

  const result = await cancelEventService(eventId, actorId, requestId);
  res.setHeader('x-request-id', requestId);
  res.status(mapStatusToHttpCode(result.status)).json(result);
});

export default router;
