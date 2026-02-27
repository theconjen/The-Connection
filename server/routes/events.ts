import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertEventSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { notifyCommunityMembers, notifyEventAttendees, notifyNearbyUsers, notifyUserWithPreferences, getUserDisplayName, truncateText } from '../services/notificationHelper';
import { broadcastEngagementUpdate } from '../socketInstance';
import {
  createEvent as createEventService,
  updateEvent as updateEventService,
  cancelEvent as cancelEventService,
  listEvents as listEventsService,
  resolveEventAccess,
} from '../services/events';

const router = Router();

router.get('/events', async (req, res) => {
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
      events = await storage.getNearbyEvents(latitude, longitude, distance);

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

      // For community pages, check if user is a member to show non-public events
      if (userId) {
        const isMember = await storage.isCommunityMember(userId, communityId);
        if (!isMember) {
          // Non-members can only see public events from this community
          events = events.filter((e: any) => e.isPublic === true);
        }
        // Members can see all events including non-public ones
      } else {
        // Unauthenticated users can only see public events
        events = events.filter((e: any) => e.isPublic === true);
      }
    } else {
      // App-wide listing: only show public events
      // Events with isPublic=true should appear on the main Events page
      // Events without isPublic (or isPublic=false) are community-only events
      // Exception: Events with no communityId (e.g., "The Connection" events) should always show if public
      events = events.filter((e: any) => e.isPublic === true);
    }

    // Filter out past events - only return today and future events
    // This reduces data sent to clients and improves performance
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    events = events.filter((e: any) => {
      if (!e.eventDate) return true; // Keep events without dates (fail-safe)

      // Parse eventDate - handles "2026-01-12" and "2026-01-12 00:00:00" formats
      const dateStr = String(e.eventDate).split(' ')[0]; // Get just the date part
      const eventDate = new Date(dateStr + 'T00:00:00'); // Parse as local time

      if (isNaN(eventDate.getTime())) return true; // Keep if can't parse (fail-safe)

      return eventDate >= today;
    });

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

    // Fetch host user info for all events
    const creatorIds = [...new Set(events.map((e: any) => e.creatorId).filter(Boolean))];
    const hostUsers: Record<number, any> = {};
    for (const creatorId of creatorIds) {
      try {
        const user = await storage.getUser(creatorId);
        if (user) {
          hostUsers[creatorId] = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatarUrl: user.avatarUrl || null,
          };
        }
      } catch (e) {
        // Skip if user not found
      }
    }

    // Get user's connections (people they follow) who are going to each event
    let connectionsGoingMap: Record<number, { count: number; names: string[] }> = {};
    if (userId) {
      try {
        // Get all user IDs that this user follows
        const following = await storage.getUserFollowing(userId);
        const followingIds = following.map((f: any) => f.id);

        if (followingIds.length > 0) {
          // For each event, check which connections are going
          for (const event of events) {
            const eventRsvps = await storage.getEventRSVPs(event.id);
            const goingRsvps = eventRsvps.filter((r: any) =>
              r.status === 'going' && followingIds.includes(r.userId)
            );

            if (goingRsvps.length > 0) {
              // Get names of connections going (first 3 for display)
              const connectionNames: string[] = [];
              for (const rsvp of goingRsvps.slice(0, 3)) {
                const user = following.find((f: any) => f.id === rsvp.userId);
                if (user) {
                  connectionNames.push(user.displayName || user.username);
                }
              }
              connectionsGoingMap[event.id] = {
                count: goingRsvps.length,
                names: connectionNames
              };
            }
          }
        }
      } catch (err) {
        console.error('Error fetching connections going to events:', err);
        // Continue without connections data
      }
    }

    // Attach user's RSVP status, bookmark status, host info, and connections going to each event
    const eventsWithUserData = events.map((event: any) => ({
      ...event,
      hostUserId: event.creatorId, // Reliable host identifier
      userRsvpStatus: userRsvpMap[event.id] || null,
      isBookmarked: userBookmarkSet.has(event.id),
      host: hostUsers[event.creatorId] || null,
      connectionsGoing: connectionsGoingMap[event.id] || { count: 0, names: [] },
    }));

    res.json({ events: eventsWithUserData });
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || 'NO_CODE';
    console.error('Error fetching events:', errorMessage, errorCode, error);
    res.status(500).json({
      message: 'Error fetching events',
      // Temporarily expose error for debugging - remove after fixing
      debug: { message: errorMessage, code: errorCode }
    });
  }
});

router.get('/events/public', async (_req, res) => {
  try {
    const allEvents = await storage.getAllEvents();

    // Filter to public events and exclude past events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = allEvents.filter((event: any) => {
      if (!event.isPublic) return false;

      // Filter out past events
      if (!event.eventDate) return true;
      const dateStr = String(event.eventDate).split(' ')[0];
      const eventDate = new Date(dateStr + 'T00:00:00');
      if (isNaN(eventDate.getTime())) return true;
      return eventDate >= today;
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json(buildErrorResponse('Error fetching public events', error));
  }
});

router.get('/events/upcoming', async (_req, res) => {
  try {
    const now = new Date();
    const all = await storage.getAllEvents();
    // Filter to only show public events in app-wide upcoming list
    const upcoming = all
      .filter((e: any) => !e.deletedAt && e.isPublic === true && new Date(e.eventDate) >= new Date(now.toDateString()))
      .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    res.json(upcoming);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json(buildErrorResponse('Error fetching upcoming events', error));
  }
});

// My Events - returns events user is hosting, going to, or has marked maybe
router.get('/events/my', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    // Get all events
    const allEvents = await storage.getAllEvents();

    // Get user's RSVPs
    const userRsvps = await storage.getUserRSVPs(userId);
    const rsvpMap: Record<number, string> = {};
    userRsvps.forEach((rsvp: any) => {
      rsvpMap[rsvp.eventId] = rsvp.status;
    });

    // Get user's bookmarks
    const bookmarkedIds = await storage.getUserEventBookmarkIds(userId);
    const bookmarkSet = new Set(bookmarkedIds);

    // Categorize events
    const hosting: any[] = [];
    const going: any[] = [];
    const maybe: any[] = [];
    const saved: any[] = [];

    // Fetch host info for all events we might include
    const hostUsers: Record<number, any> = {};

    for (const event of allEvents) {
      const isHosting = (event as any).creatorId === userId;
      const rsvpStatus = rsvpMap[(event as any).id];
      const isBookmarked = bookmarkSet.has((event as any).id);

      // Skip if user has no relationship with this event
      if (!isHosting && !rsvpStatus && !isBookmarked) continue;

      // Get host info if not already cached
      const creatorId = (event as any).creatorId;
      if (creatorId && !hostUsers[creatorId]) {
        try {
          const user = await storage.getUser(creatorId);
          if (user) {
            hostUsers[creatorId] = {
              id: user.id,
              username: user.username,
              displayName: user.displayName || user.username,
              avatarUrl: user.avatarUrl || null,
            };
          }
        } catch (e) {
          // Skip
        }
      }

      // Enrich event with user data
      const enrichedEvent = {
        ...event,
        hostUserId: creatorId, // Reliable host identifier
        host: hostUsers[creatorId] || null,
        userRsvpStatus: rsvpStatus || null,
        isBookmarked,
      };

      // Categorize
      if (isHosting) {
        hosting.push(enrichedEvent);
      }
      if (rsvpStatus === 'going') {
        going.push(enrichedEvent);
      } else if (rsvpStatus === 'maybe') {
        maybe.push(enrichedEvent);
      }
      if (isBookmarked && !isHosting && rsvpStatus !== 'going' && rsvpStatus !== 'maybe') {
        saved.push(enrichedEvent);
      }
    }

    // Filter out past events from going/maybe/saved (but keep ALL hosting events)
    // This allows hosts to manage past events while hiding them from attendees
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isUpcoming = (event: any): boolean => {
      if (!event.eventDate) return true;
      const dateStr = String(event.eventDate).split(' ')[0];
      const eventDate = new Date(dateStr + 'T00:00:00');
      if (isNaN(eventDate.getTime())) return true;
      return eventDate >= today;
    };

    const filteredGoing = going.filter(isUpcoming);
    const filteredMaybe = maybe.filter(isUpcoming);
    const filteredSaved = saved.filter(isUpcoming);
    // hosting: Keep all (past and future) so hosts can manage them

    // Sort each section by event date
    const sortByDate = (a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    hosting.sort(sortByDate);
    filteredGoing.sort(sortByDate);
    filteredMaybe.sort(sortByDate);
    filteredSaved.sort(sortByDate);

    res.json({
      hosting,
      going: filteredGoing,
      maybe: filteredMaybe,
      saved: filteredSaved,
      counts: {
        hosting: hosting.length,
        going: filteredGoing.length,
        maybe: filteredMaybe.length,
        saved: filteredSaved.length,
      },
    });
  } catch (error) {
    console.error('Error fetching my events:', error);
    res.status(500).json(buildErrorResponse('Error fetching my events', error));
  }
});

router.get('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = getSessionUserId(req);
    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Get host user info
    let host = null;
    if ((event as any).creatorId) {
      try {
        const user = await storage.getUser((event as any).creatorId);
        if (user) {
          host = {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatarUrl: user.avatarUrl || null,
          };
        }
      } catch (e) {
        // Skip if user not found
      }
    }

    // Get user's RSVP status and bookmark status if authenticated
    let userRsvpStatus = null;
    let isBookmarked = false;
    let attendeeCount = 0;

    try {
      const rsvps = await storage.getEventRSVPs(eventId);
      attendeeCount = rsvps.filter((r: any) => r.status === 'going').length;

      if (userId) {
        const userRsvp = rsvps.find((r: any) => r.userId === userId);
        userRsvpStatus = userRsvp?.status || null;
        isBookmarked = await storage.hasUserBookmarkedEvent(eventId, userId);
      }
    } catch (e) {
      // Continue without RSVP data
    }

    res.json({
      ...event,
      hostUserId: (event as any).creatorId, // Reliable host identifier
      host,
      userRsvpStatus,
      isBookmarked,
      attendeeCount,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json(buildErrorResponse('Error fetching event', error));
  }
});

// ============================================================================
// HOST-ONLY EVENT MANAGEMENT ENDPOINTS
// ============================================================================

// Get RSVPs for event (host only) - returns attendees grouped by status
router.get('/events/:id/rsvps/manage', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if user is the host
    if ((event as any).creatorId !== userId) {
      return res.status(403).json({ error: 'Only the event host can view attendee details' });
    }

    // Get all RSVPs with user info
    const rsvps = await storage.getEventRSVPs(eventId);

    // Fetch user info for all attendees
    const attendeesWithInfo = await Promise.all(
      rsvps.map(async (rsvp: any) => {
        const user = await storage.getUser(rsvp.userId);
        return {
          id: rsvp.id,
          userId: rsvp.userId,
          status: rsvp.status,
          createdAt: rsvp.createdAt,
          user: user ? {
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatarUrl: user.avatarUrl || null,
          } : null,
        };
      })
    );

    // Group by status
    const going = attendeesWithInfo.filter(a => a.status === 'going');
    const maybe = attendeesWithInfo.filter(a => a.status === 'maybe');
    const notGoing = attendeesWithInfo.filter(a => a.status === 'not_going');

    res.json({
      going,
      maybe,
      notGoing,
      counts: {
        going: going.length,
        maybe: maybe.length,
        notGoing: notGoing.length,
        total: attendeesWithInfo.length,
      },
    });
  } catch (error) {
    console.error('Error fetching event RSVPs:', error);
    res.status(500).json(buildErrorResponse('Error fetching event RSVPs', error));
  }
});

// Cancel event (host only) - soft delete using deleteEvent
router.post('/events/:id/cancel', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const event = await storage.getEvent(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if user is the host
    if ((event as any).creatorId !== userId) {
      return res.status(403).json({ error: 'Only the event host can cancel this event' });
    }

    // Notify attendees before cancellation
    try {
      await notifyEventAttendees(
        eventId,
        {
          title: `Event cancelled: ${truncateText((event as any).title, 40)}`,
          body: 'This event has been cancelled by the host.',
          data: {
            type: 'event_cancelled',
            eventId,
          },
          category: 'event',
        },
        [userId] // Exclude the host
      );
    } catch (notifError) {
      console.error('[Events] Error sending cancellation notification:', notifError);
    }

    // Delete the event (storage handles soft vs hard delete)
    await storage.deleteEvent(eventId);

    res.json({
      message: 'Event cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling event:', error);
    res.status(500).json(buildErrorResponse('Error cancelling event', error));
  }
});

// Create event - requires community admin or app admin
router.post('/events', requireAuth, async (req, res) => {
  // DEBUG: Version marker to confirm deployment
  console.info('[Events] POST /api/events - Handler v3 (hardened hostUserId)');

  try {
    const userId = requireSessionUserId(req);
    console.info('[Events] User ID from session:', userId);

    // SECURITY: Extract only allowed fields from body
    // hostUserId is NEVER accepted from client - always derived from authenticated user
    const {
      title,
      description,
      category, // Event type: Sunday Service, Worship, Bible Study, etc.
      eventDate,
      eventEndDate, // For multi-day events (e.g., conferences)
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
      imageUrl, // Event flyer/poster image (base64 or URL)
      startsAt, // Support legacy format
      // Explicitly destructure and IGNORE these fields if client sends them
      hostUserId: _ignoredHostUserId,
      creatorId: _ignoredCreatorId,
    } = req.body || {};

    // Log if client attempted to set hostUserId (potential security probe)
    if (req.body?.hostUserId !== undefined) {
      console.warn('[Events] SECURITY: Client attempted to set hostUserId - ignored. IP:', req.ip);
    }

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
      category: category || null, // Event type: Sunday Service, Worship, Bible Study, etc.
      eventDate: finalEventDate,
      eventEndDate: eventEndDate || null, // For multi-day events (e.g., conferences)
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
      imageUrl: imageUrl || null, // Event flyer/poster image
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

    // DEV-ONLY: Log created event ownership for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.info('[Events] DEV: Created event ownership:', {
        eventId: event.id,
        hostUserId: event.creatorId,
        title: event.title,
      });
    }

    // Build host object for response
    let host = null;
    try {
      const hostUser = await storage.getUser(event.creatorId);
      if (hostUser) {
        host = {
          id: hostUser.id,
          username: hostUser.username,
          displayName: hostUser.displayName || hostUser.username,
          avatarUrl: hostUser.avatarUrl || null,
        };
      }
    } catch (e) {
      console.warn('[Events] Could not fetch host user for response:', e);
    }

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

    // Return event with hostUserId and host object
    res.status(201).json({
      ...event,
      hostUserId: event.creatorId, // Explicit host identifier
      host,
    });
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
router.patch('/events/:id', requireAuth, async (req, res) => {
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
    const allowedFields = ['title', 'description', 'category', 'eventDate', 'eventEndDate', 'startTime', 'endTime', 'isVirtual',
                           'location', 'address', 'city', 'state', 'zipCode', 'latitude', 'longitude',
                           'virtualMeetingUrl', 'isPublic', 'imageUrl', 'imagePosition',
                           'targetGender', 'targetAgeGroup'];

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

router.delete('/events/:id', requireAuth, async (req, res) => {
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
router.post('/events/:id/rsvp', requireAuth, async (req, res) => {
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

    // Check if we just crossed the 20 RSVP threshold (popular event)
    const rsvpsAfter = await storage.getEventRSVPs(eventId);
    const attendingCountAfter = rsvpsAfter.filter(
      r => r.status === 'going' || r.status === 'maybe' || r.status === 'interested'
    ).length;

    // Broadcast engagement update for real-time RSVP count sync
    broadcastEngagementUpdate({
      type: 'rsvp',
      targetType: 'event',
      targetId: eventId,
      count: attendingCountAfter,
      userId,
      action: normalizedStatus === 'not_going' ? 'remove' : 'add',
    });

    // Notify event host about new RSVP (skip if self-RSVP or cancellation)
    if (normalizedStatus !== 'not_going' && event.createdBy && event.createdBy !== userId) {
      const rsvpUser = await storage.getUser(userId);
      const rsvpName = getUserDisplayName(rsvpUser);
      const statusLabel = normalizedStatus === 'going' ? 'is going to' : 'is interested in';

      notifyUserWithPreferences(event.createdBy, {
        title: `New RSVP for ${truncateText(event.title, 40)}`,
        body: `${rsvpName} ${statusLabel} your event`,
        data: {
          type: 'event_rsvp',
          eventId: event.id,
          userId,
          status: normalizedStatus,
        },
        category: 'event',
      }).catch(error => {
        console.error('[Events] Error notifying event host about RSVP:', error);
      });
    }

    // If we just hit 20 RSVPs, notify users about popular event
    if (attendingCountBefore < 20 && attendingCountAfter >= 20) {
      console.info(`[Events] Event ${eventId} reached 20 RSVPs! This event is trending!`);

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
router.get('/events/:id/rsvps', async (req, res) => {
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

// Get connections going to this event (people you follow who RSVP'd going)
router.get('/events/:id/connections-going', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get users the current user follows
    const following = await storage.getUserFollowing(userId);
    const followingIds = following.map((f: any) => f.id);

    if (followingIds.length === 0) {
      return res.json({ count: 0, names: [] });
    }

    // Get RSVPs for this event
    const rsvps = await storage.getEventRSVPs(eventId);
    const goingRsvps = rsvps.filter((r: any) =>
      r.status === 'going' && followingIds.includes(r.userId)
    );

    // Get names of connections going
    const connectionNames: string[] = [];
    for (const rsvp of goingRsvps) {
      const user = await storage.getUser(rsvp.userId);
      if (user) {
        connectionNames.push(user.displayName || user.username || 'User');
      }
    }

    res.json({
      count: goingRsvps.length,
      names: connectionNames
    });
  } catch (error) {
    console.error('Error fetching connections going:', error);
    res.status(500).json(buildErrorResponse('Error fetching connections', error));
  }
});

// Get current user's RSVP for an event
router.get('/events/:id/my-rsvp', requireAuth, async (req, res) => {
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
router.delete('/events/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const rsvp = await storage.getUserEventRSVP(eventId, userId);
    if (!rsvp) {
      return res.status(404).json({ error: 'RSVP not found' });
    }

    await storage.deleteEventRSVP(rsvp.id);

    // Get updated count and broadcast for real-time sync
    const rsvpsAfter = await storage.getEventRSVPs(eventId);
    const attendingCount = rsvpsAfter.filter(
      (r: any) => r.status === 'going' || r.status === 'maybe' || r.status === 'interested'
    ).length;

    broadcastEngagementUpdate({
      type: 'rsvp',
      targetType: 'event',
      targetId: eventId,
      count: attendingCount,
      userId,
      action: 'remove',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    res.status(500).json(buildErrorResponse('Error deleting RSVP', error));
  }
});

// ============================================================================
// EVENT ATTENDANCE CONFIRMATION ENDPOINTS
// ============================================================================

// Helper to check if an event has ended
function isEventEnded(event: any): boolean {
  if (!event || !event.eventDate) return false;
  const dateStr = String(event.eventDate).split(' ')[0];
  const endTime = event.endTime || '23:59:59';
  const eventEndDate = new Date(`${dateStr}T${endTime}`);
  return eventEndDate < new Date();
}

// Confirm attendance at a past event
router.post('/events/:id/confirm-attendance', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify user had RSVP 'going'
    const rsvp = await storage.getUserEventRSVP(eventId, userId);
    if (!rsvp || rsvp.status !== 'going') {
      return res.status(400).json({ error: 'No RSVP found or status is not "going"' });
    }

    // Check if already confirmed
    if ((rsvp as any).confirmedAt) {
      return res.json({
        success: true,
        message: 'Attendance already confirmed',
        alreadyConfirmed: true,
      });
    }

    // Verify event has ended
    if (!isEventEnded(event)) {
      return res.status(400).json({ error: 'Event has not ended yet' });
    }

    // Confirm attendance
    const updated = await storage.confirmEventAttendance(eventId, userId);

    res.json({
      success: true,
      message: 'Attendance confirmed! Event added to your profile.',
      rsvp: updated,
    });
  } catch (error) {
    console.error('Error confirming attendance:', error);
    res.status(500).json(buildErrorResponse('Error confirming attendance', error));
  }
});

// Get pending attendance confirmations for current user
router.get('/events/pending-confirmations', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    const events = await storage.getPendingAttendanceConfirmations(userId);

    // Enrich events with host info
    const enrichedEvents = await Promise.all(events.map(async (event: any) => {
      let host = null;
      if (event.creatorId) {
        try {
          const user = await storage.getUser(event.creatorId);
          if (user) {
            host = {
              id: user.id,
              username: user.username,
              displayName: user.displayName || user.username,
              avatarUrl: user.avatarUrl || null,
            };
          }
        } catch (e) { /* ignore */ }
      }
      return { ...event, host };
    }));

    res.json({ events: enrichedEvents });
  } catch (error) {
    console.error('Error fetching pending confirmations:', error);
    res.status(500).json(buildErrorResponse('Error fetching pending confirmations', error));
  }
});

// Get user's confirmed attended events (for profile)
router.get('/users/:userId/attended-events', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const events = await storage.getConfirmedAttendedEvents(userId);

    // Enrich events with community name if applicable
    const enrichedEvents = await Promise.all(events.map(async (event: any) => {
      let communityName = null;
      if (event.communityId) {
        try {
          const community = await storage.getCommunity(event.communityId);
          if (community) {
            communityName = community.name;
          }
        } catch (e) { /* ignore */ }
      }
      return {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        location: event.location || event.city,
        imageUrl: event.imageUrl,
        communityId: event.communityId,
        communityName,
      };
    }));

    res.json({ events: enrichedEvents, count: enrichedEvents.length });
  } catch (error) {
    console.error('Error fetching attended events:', error);
    res.status(500).json(buildErrorResponse('Error fetching attended events', error));
  }
});

// ============================================================================
// EVENT BOOKMARK ENDPOINTS
// ============================================================================

// Bookmark an event
router.post('/events/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    // Check if event exists
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const bookmark = await storage.bookmarkEvent(eventId, userId);

    // Broadcast for real-time bookmark sync
    broadcastEngagementUpdate({
      type: 'bookmark',
      targetType: 'event',
      targetId: eventId,
      userId,
      action: 'add',
    });

    res.status(201).json({ success: true, bookmark });
  } catch (error) {
    console.error('Error bookmarking event:', error);
    res.status(500).json(buildErrorResponse('Error bookmarking event', error));
  }
});

// Unbookmark an event
router.delete('/events/:id/bookmark', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    const success = await storage.unbookmarkEvent(eventId, userId);
    if (!success) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Broadcast for real-time bookmark sync
    broadcastEngagementUpdate({
      type: 'bookmark',
      targetType: 'event',
      targetId: eventId,
      userId,
      action: 'remove',
    });

    res.json({ success: true, message: 'Event unbookmarked successfully' });
  } catch (error) {
    console.error('Error unbookmarking event:', error);
    res.status(500).json(buildErrorResponse('Error unbookmarking event', error));
  }
});

// Get user's bookmarked events
router.get('/events/bookmarks', requireAuth, async (req, res) => {
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
router.get('/events/:id/bookmark', requireAuth, async (req, res) => {
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
// EVENT ANNOUNCEMENTS - Host can message all attendees
// ============================================================================

// Send announcement to all RSVPed attendees (host only)
router.post('/events/:id/announce', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { message } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 500) {
      return res.status(400).json({ error: 'Message cannot exceed 500 characters' });
    }

    // Get the event
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the host
    const hostId = (event as any).hostUserId || (event as any).creatorId;
    if (hostId !== userId) {
      return res.status(403).json({ error: 'Only the event host can send announcements' });
    }

    // Get all RSVPs for this event
    const rsvps = await storage.getEventRSVPs(eventId);

    // Filter to only "going" and "maybe" attendees (not "not_going")
    const attendeeIds = rsvps
      .filter((rsvp: any) => rsvp.status === 'going' || rsvp.status === 'maybe')
      .map((rsvp: any) => rsvp.userId)
      .filter((id: number) => id !== userId); // Exclude the host

    if (attendeeIds.length === 0) {
      return res.status(400).json({ error: 'No attendees to notify' });
    }

    // Get host info for the notification
    const host = await storage.getUser(userId);
    const hostName = host?.displayName || host?.username || 'Event Host';

    // Send notification to each attendee
    const notificationPromises = attendeeIds.map(async (attendeeId: number) => {
      try {
        await storage.createNotification({
          userId: attendeeId,
          type: 'event_announcement',
          title: `Update from ${truncateText((event as any).title, 30)}`,
          body: message.trim(),
          data: JSON.stringify({
            eventId,
            eventTitle: (event as any).title,
            hostId: userId,
            hostName,
            announcementType: 'host_message',
          }),
          isRead: false,
        });
      } catch (notifError) {
        console.error(`[Events] Failed to create notification for user ${attendeeId}:`, notifError);
      }
    });

    await Promise.all(notificationPromises);

    console.info(`[Events] Host ${userId} sent announcement to ${attendeeIds.length} attendees for event ${eventId}`);

    res.json({
      success: true,
      message: 'Announcement sent successfully',
      recipientCount: attendeeIds.length,
    });
  } catch (error) {
    console.error('Error sending event announcement:', error);
    res.status(500).json(buildErrorResponse('Error sending announcement', error));
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
router.get('/events/v2', async (req, res) => {
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
router.get('/events/:id/v2', async (req, res) => {
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
router.post('/events/v2', requireAuth, async (req, res) => {
  const requestId = getRequestId(req);
  const actorId = requireSessionUserId(req);

  const params = {
    title: req.body.title,
    description: req.body.description,
    eventDate: req.body.eventDate,
    eventEndDate: req.body.eventEndDate,
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
router.patch('/events/:id/v2', requireAuth, async (req, res) => {
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
    eventEndDate: req.body.eventEndDate,
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
router.delete('/events/:id/v2', requireAuth, async (req, res) => {
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

// ============================================================================
// EVENT INVITATIONS
// ============================================================================

// Invite users to an event (attendees or creator can invite)
router.post('/events/:id/invite', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { inviteeIds, sendDm } = req.body;

    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    if (!inviteeIds || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return res.status(400).json({ message: 'User IDs to invite are required' });
    }

    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if inviter is creator or attendee
    const isCreator = event.creatorId === userId;
    const rsvp = await storage.getUserEventRSVP(eventId, userId);
    const isAttendee = rsvp && (rsvp.status === 'going' || rsvp.status === 'maybe');

    if (!isCreator && !isAttendee) {
      return res.status(403).json({ message: 'Only event creator or attendees can invite others' });
    }

    const inviterName = await getUserDisplayName(userId);
    const results = [];

    for (const inviteeId of inviteeIds) {
      if (!Number.isFinite(inviteeId)) continue;

      // Check if invitee exists
      const invitee = await storage.getUser(inviteeId);
      if (!invitee) continue;

      // Check if already invited
      const existingInvitation = await storage.getEventInvitation(eventId, inviteeId);
      if (existingInvitation) {
        results.push({ inviteeId, status: 'already_invited' });
        continue;
      }

      // Check if already attending
      const existingRsvp = await storage.getUserEventRSVP(eventId, inviteeId);
      if (existingRsvp) {
        results.push({ inviteeId, status: 'already_attending' });
        continue;
      }

      // Create invitation
      const invitation = await storage.createEventInvitation({
        eventId,
        inviterId: userId,
        inviteeId,
        status: 'pending'
      });

      // Send notification
      const eventDate = new Date(event.eventDate);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      await notifyUserWithPreferences(inviteeId, {
        title: 'Event Invitation',
        body: `${inviterName} invited you to "${truncateText(event.title, 30)}" on ${formattedDate}`,
        data: { eventId, invitationId: invitation.id, type: 'event_invite' },
        category: 'event'
      });

      // Optionally send DM with invitation
      if (sendDm) {
        const dmContent = JSON.stringify({
          type: 'event_invite',
          eventId,
          eventName: event.title,
          eventDate: event.eventDate,
          eventTime: event.startTime,
          location: event.location,
          inviterName,
          invitationId: invitation.id
        });
        await storage.createDirectMessage({
          senderId: userId,
          receiverId: inviteeId,
          content: dmContent
        });
      }

      results.push({ inviteeId, status: 'invited', invitationId: invitation.id });
    }

    res.status(201).json({
      success: true,
      message: 'Invitations sent',
      results
    });
  } catch (error) {
    console.error('Error sending event invitations:', error);
    res.status(500).json(buildErrorResponse('Error sending invitations', error));
  }
});

// Get pending event invitations for current user
router.get('/event-invitations/pending', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);

    const invitations = await storage.getPendingEventInvitationsForUser(userId);

    // Enrich with event and inviter info
    const enrichedInvitations = await Promise.all(
      invitations.map(async (inv: any) => {
        const event = await storage.getEvent(inv.eventId);
        const inviter = await storage.getUser(inv.inviterId);
        const attendeeCount = event ? await storage.getEventAttendeeCount(inv.eventId) : 0;

        return {
          ...inv,
          event: event ? {
            id: event.id,
            title: event.title,
            description: event.description,
            eventDate: event.eventDate,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            address: event.address,
            city: event.city,
            state: event.state,
            isVirtual: event.isVirtual,
            virtualMeetingUrl: event.virtualMeetingUrl,
            imageUrl: event.imageUrl,
            attendeeCount
          } : null,
          inviter: inviter ? {
            id: inviter.id,
            username: inviter.username,
            displayName: inviter.displayName,
            avatarUrl: inviter.avatarUrl
          } : null
        };
      })
    );

    res.json(enrichedInvitations);
  } catch (error) {
    console.error('Error fetching pending event invitations:', error);
    res.status(500).json(buildErrorResponse('Error fetching invitations', error));
  }
});

// Accept event invitation (auto-RSVP as 'going')
router.post('/event-invitations/:id/accept', requireAuth, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(invitationId)) {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    const invitation = await storage.getEventInvitationById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify invitation is for this user
    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Get event to verify it exists and hasn't passed
    const event = await storage.getEvent(invitation.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event no longer exists' });
    }

    // Check if event has passed
    const eventDate = new Date(event.eventDate);
    if (eventDate < new Date()) {
      await storage.updateEventInvitationStatus(invitationId, 'expired');
      return res.status(400).json({ message: 'Event has already passed' });
    }

    // Create or update RSVP as 'going'
    const existingRsvp = await storage.getUserEventRSVP(invitation.eventId, userId);
    if (existingRsvp) {
      await storage.upsertEventRSVP(invitation.eventId, userId, 'going');
    } else {
      await storage.createEventRSVP({
        eventId: invitation.eventId,
        userId,
        status: 'going'
      });
    }

    // Update invitation status
    await storage.updateEventInvitationStatus(invitationId, 'accepted');

    // Notify inviter
    const inviteeName = await getUserDisplayName(userId);
    await notifyUserWithPreferences(invitation.inviterId, {
      title: 'Invitation Accepted',
      body: `${inviteeName} accepted your invitation to "${truncateText(event.title, 30)}"`,
      data: { eventId: invitation.eventId, type: 'event_invite_accepted' },
      category: 'event'
    });

    res.json({
      success: true,
      message: 'You are now attending this event',
      eventId: invitation.eventId
    });
  } catch (error) {
    console.error('Error accepting event invitation:', error);
    res.status(500).json(buildErrorResponse('Error accepting invitation', error));
  }
});

// Decline event invitation
router.post('/event-invitations/:id/decline', requireAuth, async (req, res) => {
  try {
    const invitationId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);

    if (!Number.isFinite(invitationId)) {
      return res.status(400).json({ message: 'Invalid invitation ID' });
    }

    const invitation = await storage.getEventInvitationById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Verify invitation is for this user
    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Update invitation status
    await storage.updateEventInvitationStatus(invitationId, 'declined');

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Error declining event invitation:', error);
    res.status(500).json(buildErrorResponse('Error declining invitation', error));
  }
});

// Haversine formula for calculating distance between two coordinates in miles
function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

// Invite all users within a radius of a Connection Hosted event
// Only available for events without a communityId (Connection Hosted)
// Only the event creator can use this endpoint
router.post('/events/:id/invite-nearby', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { radiusMiles = 30, sendNotifications = true } = req.body;

    // Validate radius (1-100 miles)
    const radius = Math.min(Math.max(parseFloat(radiusMiles) || 30, 1), 100);

    // Get event
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only Connection Hosted events (communityId is null)
    if (event.communityId !== null) {
      return res.status(403).json({
        message: 'This feature is only available for Connection Hosted events'
      });
    }

    // Only event creator can invite nearby users
    if (event.creatorId !== userId) {
      return res.status(403).json({
        message: 'Only the event creator can invite nearby users'
      });
    }

    // Event must have location data
    if (!event.latitude || !event.longitude) {
      return res.status(400).json({
        message: 'Event must have location coordinates to invite nearby users'
      });
    }

    const eventLat = parseFloat(String(event.latitude));
    const eventLon = parseFloat(String(event.longitude));

    if (isNaN(eventLat) || isNaN(eventLon)) {
      return res.status(400).json({
        message: 'Event has invalid location coordinates'
      });
    }

    // Get all users
    const allUsers = await storage.getAllUsers();

    // Get existing RSVPs and invitations to exclude
    const existingRsvps = await storage.getEventRSVPs(eventId);
    const rsvpedUserIds = new Set(existingRsvps.map(r => r.userId));

    // Get inviter info
    const inviterName = await getUserDisplayName(userId);
    const formattedDate = new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // Find nearby users and create invitations
    const results: Array<{ userId: number; status: string; distance?: number }> = [];
    let invitedCount = 0;
    let skippedCount = 0;

    for (const user of allUsers) {
      // Skip the inviter
      if (user.id === userId) continue;

      // Skip users already RSVP'd
      if (rsvpedUserIds.has(user.id)) {
        skippedCount++;
        continue;
      }

      // Skip users without location data
      if (!user.latitude || !user.longitude) continue;

      const userLat = parseFloat(String(user.latitude));
      const userLon = parseFloat(String(user.longitude));

      if (isNaN(userLat) || isNaN(userLon)) continue;

      // Calculate distance
      const distance = calculateDistanceMiles(eventLat, eventLon, userLat, userLon);

      // Skip users outside radius
      if (distance > radius) continue;

      // Check if already invited
      const existingInvitation = await storage.getEventInvitation(eventId, user.id);
      if (existingInvitation) {
        results.push({ userId: user.id, status: 'already_invited', distance: Math.round(distance * 10) / 10 });
        skippedCount++;
        continue;
      }

      // Create invitation
      const invitation = await storage.createEventInvitation({
        eventId,
        inviterId: userId,
        inviteeId: user.id,
        status: 'pending'
      });

      // Send notification if enabled
      if (sendNotifications) {
        await notifyUserWithPreferences(user.id, {
          title: `📍 Event near you!`,
          body: `${inviterName} invited you to "${truncateText(event.title, 30)}" on ${formattedDate} (${Math.round(distance)} mi away)`,
          data: { eventId, invitationId: invitation.id, type: 'event_invite' },
          category: 'event',
        });
      }

      results.push({
        userId: user.id,
        status: 'invited',
        distance: Math.round(distance * 10) / 10
      });
      invitedCount++;
    }

    console.info(`[Events] Invited ${invitedCount} nearby users within ${radius} miles of event ${eventId}, skipped ${skippedCount}`);

    res.json({
      success: true,
      message: `Invited ${invitedCount} users within ${radius} miles`,
      invitedCount,
      skippedCount,
      radiusMiles: radius,
      results
    });
  } catch (error) {
    console.error('Error inviting nearby users:', error);
    res.status(500).json(buildErrorResponse('Error inviting nearby users', error));
  }
});

// Get count of users within radius (preview before inviting)
router.get('/events/:id/nearby-users-count', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const radiusMiles = parseFloat(req.query.radius as string) || 30;

    // Validate radius (1-100 miles)
    const radius = Math.min(Math.max(radiusMiles, 1), 100);

    // Get event
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only Connection Hosted events
    if (event.communityId !== null) {
      return res.status(403).json({
        message: 'This feature is only available for Connection Hosted events'
      });
    }

    // Only event creator can check
    if (event.creatorId !== userId) {
      return res.status(403).json({
        message: 'Only the event creator can view nearby user counts'
      });
    }

    // Event must have location data
    if (!event.latitude || !event.longitude) {
      return res.status(400).json({
        message: 'Event must have location coordinates'
      });
    }

    const eventLat = parseFloat(String(event.latitude));
    const eventLon = parseFloat(String(event.longitude));

    if (isNaN(eventLat) || isNaN(eventLon)) {
      return res.status(400).json({
        message: 'Event has invalid location coordinates'
      });
    }

    // Get all users and count nearby ones
    const allUsers = await storage.getAllUsers();
    const existingRsvps = await storage.getEventRSVPs(eventId);
    const rsvpedUserIds = new Set(existingRsvps.map(r => r.userId));

    let nearbyCount = 0;
    let alreadyRsvpdCount = 0;
    let alreadyInvitedCount = 0;

    for (const user of allUsers) {
      if (user.id === userId) continue;
      if (!user.latitude || !user.longitude) continue;

      const userLat = parseFloat(String(user.latitude));
      const userLon = parseFloat(String(user.longitude));
      if (isNaN(userLat) || isNaN(userLon)) continue;

      const distance = calculateDistanceMiles(eventLat, eventLon, userLat, userLon);
      if (distance > radius) continue;

      if (rsvpedUserIds.has(user.id)) {
        alreadyRsvpdCount++;
        continue;
      }

      const existingInvitation = await storage.getEventInvitation(eventId, user.id);
      if (existingInvitation) {
        alreadyInvitedCount++;
        continue;
      }

      nearbyCount++;
    }

    res.json({
      radiusMiles: radius,
      eligibleToInvite: nearbyCount,
      alreadyRsvpd: alreadyRsvpdCount,
      alreadyInvited: alreadyInvitedCount,
      totalNearby: nearbyCount + alreadyRsvpdCount + alreadyInvitedCount
    });
  } catch (error) {
    console.error('Error counting nearby users:', error);
    res.status(500).json(buildErrorResponse('Error counting nearby users', error));
  }
});

// ============================================================================
// RECURRING EVENTS
// ============================================================================

// Create a recurring event (generates instances)
router.post('/events/recurring', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) return;

    const { recurrenceRule, recurrenceEndDate, instances = 12, ...eventData } = req.body;

    if (!recurrenceRule) {
      return res.status(400).json({ error: 'recurrenceRule is required (iCal RRULE format)' });
    }

    // Create the parent event
    const parentEvent = await storage.createEvent({
      ...eventData,
      creatorId: userId,
      recurrenceRule,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    });

    // Parse recurrence and generate instances
    const generatedEvents = [parentEvent];
    const freq = recurrenceRule.match(/FREQ=(\w+)/)?.[1];
    const interval = parseInt(recurrenceRule.match(/INTERVAL=(\d+)/)?.[1] || '1');

    if (freq && eventData.eventDate) {
      const baseDate = new Date(eventData.eventDate);
      const endDateStr = eventData.eventEndDate;
      const baseDuration = endDateStr ? (new Date(endDateStr).getTime() - baseDate.getTime()) : 0;

      for (let i = 1; i < instances; i++) {
        const instanceDate = new Date(baseDate);

        switch (freq) {
          case 'DAILY':
            instanceDate.setDate(instanceDate.getDate() + (i * interval));
            break;
          case 'WEEKLY':
            instanceDate.setDate(instanceDate.getDate() + (i * 7 * interval));
            break;
          case 'MONTHLY':
            instanceDate.setMonth(instanceDate.getMonth() + (i * interval));
            break;
        }

        // Stop if past recurrence end date
        if (recurrenceEndDate && instanceDate > new Date(recurrenceEndDate)) break;

        const instanceEndDate = baseDuration > 0
          ? new Date(instanceDate.getTime() + baseDuration).toISOString().split('T')[0]
          : undefined;

        try {
          const instance = await storage.createEvent({
            ...eventData,
            creatorId: userId,
            eventDate: instanceDate.toISOString().split('T')[0],
            eventEndDate: instanceEndDate,
            parentEventId: parentEvent.id,
          });
          generatedEvents.push(instance);
        } catch (e) {
          console.error(`Failed to create recurring instance ${i}:`, e);
        }
      }
    }

    res.status(201).json({
      parentEvent,
      instances: generatedEvents.length,
      events: generatedEvents,
    });
  } catch (error) {
    console.error('Error creating recurring event:', error);
    res.status(500).json(buildErrorResponse('Error creating recurring event', error));
  }
});

// ============================================================================
// QR CHECK-IN
// ============================================================================

// Check in to an event
router.post('/events/:id/checkin', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const userId = requireSessionUserId(req);
    if (!userId) return;

    const { method } = req.body; // 'qr' or 'manual'

    const { db } = await import('../db');
    const { eventCheckins } = await import('@shared/schema');
    const { and, eq } = await import('drizzle-orm');

    // Check if already checked in
    const existing = await db.select()
      .from(eventCheckins)
      .where(and(eq(eventCheckins.eventId, eventId), eq(eventCheckins.userId, userId)));

    if (existing.length > 0) {
      return res.json({ message: 'Already checked in', checkin: existing[0] });
    }

    const [checkin] = await db.insert(eventCheckins).values({
      eventId,
      userId,
      method: method || 'manual',
    } as any).returning();

    res.status(201).json(checkin);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json(buildErrorResponse('Error checking in', error));
  }
});

// Get check-ins for an event (host only)
router.get('/events/:id/checkins', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const userId = requireSessionUserId(req);
    if (!userId) return;

    // Verify user is the event creator
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.creatorId !== userId) {
      return res.status(403).json({ error: 'Only the event host can view check-ins' });
    }

    const { db } = await import('../db');
    const { eventCheckins, users } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const checkins = await db.select({
      id: eventCheckins.id,
      userId: eventCheckins.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      checkedInAt: eventCheckins.checkedInAt,
      method: eventCheckins.method,
    })
    .from(eventCheckins)
    .innerJoin(users, eq(eventCheckins.userId, users.id))
    .where(eq(eventCheckins.eventId, eventId));

    res.json(checkins);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    res.status(500).json(buildErrorResponse('Error fetching check-ins', error));
  }
});

// ============================================================================
// EVENT TEMPLATES
// ============================================================================

// Save an event as a template
router.post('/event-templates', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) return;

    const { name, templateData, communityId } = req.body;

    if (!name || !templateData) {
      return res.status(400).json({ error: 'name and templateData are required' });
    }

    const { db } = await import('../db');
    const { eventTemplates } = await import('@shared/schema');

    const [template] = await db.insert(eventTemplates).values({
      creatorId: userId,
      communityId: communityId || null,
      name,
      templateData,
    } as any).returning();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating event template:', error);
    res.status(500).json(buildErrorResponse('Error creating event template', error));
  }
});

// List event templates
router.get('/event-templates', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) return;

    const communityId = req.query.communityId ? parseInt(req.query.communityId as string) : undefined;

    const { db } = await import('../db');
    const { eventTemplates } = await import('@shared/schema');
    const { eq, or, and, isNull, desc } = await import('drizzle-orm');

    let results;
    if (communityId) {
      results = await db.select().from(eventTemplates)
        .where(or(
          eq(eventTemplates.creatorId, userId),
          eq(eventTemplates.communityId, communityId)
        ))
        .orderBy(desc(eventTemplates.createdAt));
    } else {
      results = await db.select().from(eventTemplates)
        .where(eq(eventTemplates.creatorId, userId))
        .orderBy(desc(eventTemplates.createdAt));
    }

    res.json(results);
  } catch (error) {
    console.error('Error listing event templates:', error);
    res.status(500).json(buildErrorResponse('Error listing event templates', error));
  }
});

// Create event from template
router.post('/events/from-template/:templateId', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) return;

    const templateId = parseInt(req.params.templateId);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const { db } = await import('../db');
    const { eventTemplates } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');

    const templates = await db.select().from(eventTemplates).where(eq(eventTemplates.id, templateId));
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templates[0];
    const data = template.templateData as any;

    // Merge template data with overrides from request body
    const eventData = {
      ...data,
      ...req.body,
      creatorId: userId,
      communityId: req.body.communityId || template.communityId || data.communityId,
    };

    // eventDate and startTime/endTime must be provided
    if (!eventData.eventDate || !eventData.startTime || !eventData.endTime) {
      return res.status(400).json({
        error: 'eventDate, startTime, and endTime are required when creating from template',
      });
    }

    const event = await storage.createEvent(eventData);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event from template:', error);
    res.status(500).json(buildErrorResponse('Error creating event from template', error));
  }
});

// Delete an event template
router.delete('/event-templates/:id', requireAuth, async (req, res) => {
  try {
    const userId = requireSessionUserId(req);
    if (!userId) return;

    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const { db } = await import('../db');
    const { eventTemplates } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    const result = await db.delete(eventTemplates)
      .where(and(eq(eventTemplates.id, templateId), eq(eventTemplates.creatorId, userId)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Template not found or not owned by you' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event template:', error);
    res.status(500).json(buildErrorResponse('Error deleting event template', error));
  }
});

export default router;
