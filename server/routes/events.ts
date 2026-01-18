import { Router } from 'express';
import { insertEventSchema } from '@shared/schema';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage-optimized';
import { getSessionUserId, requireSessionUserId } from '../utils/session';
import { buildErrorResponse } from '../utils/errors';
import { notifyCommunityMembers, notifyEventAttendees, notifyNearbyUsers, truncateText } from '../services/notificationHelper';

const router = Router();

router.get('/api/events', async (req, res) => {
  try {
    const filter = req.query.filter as string;
    const userId = getSessionUserId(req);
    const rsvpStatus = req.query.rsvpStatus as string; // 'going', 'maybe', 'not_going'

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

    // Filter by RSVP status if requested
    if (rsvpStatus && userId) {
      // Map frontend status values to backend values for compatibility
      // Frontend may send: 'going', 'maybe', 'not_going'
      // Backend stores: 'attending', 'maybe', 'declined'
      const backendStatus =
        rsvpStatus === 'going' ? 'attending' :
        rsvpStatus === 'not_going' ? 'declined' :
        rsvpStatus; // 'maybe' or already correct values pass through

      // Get all RSVPs for the user
      const userRsvps = await storage.getUserRSVPs(userId);

      // Get event IDs that match the requested status
      const eventIdsWithStatus = userRsvps
        .filter((rsvp: any) => rsvp.status === backendStatus)
        .map((rsvp: any) => rsvp.eventId);

      // Filter events to only include those with matching RSVP status
      events = events.filter((e: any) => eventIdsWithStatus.includes(e.id));
    }

    res.json({ events });
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
    const upcoming = all.filter((e: any) => !e.deletedAt && new Date(e.eventDate) >= new Date(now.toDateString())).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
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
  try {
    const userId = requireSessionUserId(req);
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

    // Require communityId for all events
    if (!communityId) {
      return res.status(400).json({ error: 'communityId is required - events must belong to a community' });
    }

    // Verify community exists
    const community = await storage.getCommunity(communityId);
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Authorization check:
    // 1. User is app admin (can create events for any community)
    // 2. OR user is community owner/moderator (can create events for their communities)
    const user = await storage.getUser(userId);
    const isAppAdmin = user?.isAdmin === true;
    const isCommunityAdmin = await storage.isCommunityModerator(communityId, userId);

    if (!isAppAdmin && !isCommunityAdmin) {
      return res.status(403).json({
        error: 'Only community admins can create events for this community'
      });
    }

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
      virtualMeetingUrl: virtualMeetingUrl || null,
      isPublic: isPublic ?? true,
      communityId,
      creatorId: userId,
    };

    const validated = insertEventSchema.parse(payload as any);
    const event = await storage.createEvent(validated);

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
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json(buildErrorResponse('Error creating event', error));
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
  try {
    const eventId = parseInt(req.params.id);
    const userId = requireSessionUserId(req);
    const { status } = req.body; // 'attending', 'maybe', 'declined'

    if (!['attending', 'maybe', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be attending, maybe, or declined' });
    }

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
    const rsvp = await storage.upsertEventRSVP(eventId, userId, status);

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

export default router;
