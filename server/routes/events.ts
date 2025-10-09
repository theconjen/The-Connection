import { Router } from 'express';
import { insertEventSchema } from '@shared/schema';
import { isAuthenticated } from '../auth';
import { storage } from '../storage-optimized';

const router = Router();

function getSessionUserId(req: any): number | undefined {
  const raw = req.session?.userId;
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return raw;
  const n = parseInt(String(raw));
  return Number.isFinite(n) ? n : undefined;
}

router.get('/api/events', async (req, res) => {
  try {
    const filter = req.query.filter as string;
    const userId = getSessionUserId(req);
    let events = await storage.getAllEvents();
    if (userId) {
      const blockedIds = await storage.getBlockedUserIdsFor(userId);
      if (blockedIds && blockedIds.length > 0) {
        events = events.filter((e: any) => !blockedIds.includes(e.creatorId));
      }
    }
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

router.get('/api/events/public', async (_req, res) => {
  try {
    const allEvents = await storage.getAllEvents();
    const events = allEvents.filter((event: any) => event.isPublic);
    res.json(events);
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ message: 'Error fetching public events' });
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
    res.status(500).json({ message: 'Error fetching upcoming events' });
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
    res.status(500).json({ message: 'Error fetching event' });
  }
});

// Accept minimal payload: title, description, startsAt (ISO), optional isPublic
router.post('/api/events', isAuthenticated, async (req, res) => {
  try {
    const userId = getSessionUserId(req)!;
    const { title, description, startsAt, isPublic } = req.body || {};
    if (!title || !description || !startsAt) return res.status(400).json({ message: 'title, description, startsAt required' });

    const start = new Date(startsAt);
    if (isNaN(start.getTime()) || start.getTime() <= Date.now()) return res.status(400).json({ message: 'startsAt must be in the future' });

    // Map minimal to schema fields
    const payload = {
      title,
      description,
      isPublic: !!isPublic,
      eventDate: start.toISOString().slice(0, 10), // YYYY-MM-DD
      startTime: start.toISOString().slice(11, 19), // HH:MM:SS
      endTime: start.toISOString().slice(11, 19),
      creatorId: userId,
    };

    const validated = insertEventSchema.parse(payload as any);
    const event = await storage.createEvent(validated);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
});

router.delete('/api/events/:id', isAuthenticated, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const userId = getSessionUserId(req)!;
    const ev = await storage.getEvent(eventId);
    if (!ev) return res.status(404).json({ message: 'Event not found' });
    if (ev.creatorId !== userId) return res.status(403).json({ message: 'Only creator can delete event' });

    const ok = await storage.deleteEvent(eventId);
    if (!ok) return res.status(404).json({ message: 'Event not found' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
});

export default router;
