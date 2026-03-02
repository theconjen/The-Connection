import { storage } from '../storage-optimized';
import { notifyEventAttendees } from './notificationHelper';
import { wasNotificationSent } from './notificationDedup';

/**
 * Event Reminder Service
 *
 * Sends reminder notifications to users who RSVPed to events:
 * - 24 hours before the event starts
 * - 1 hour before the event starts
 *
 * This service runs periodically (every hour) to check for upcoming events.
 */

// Track which events we've already sent reminders for (separate sets for each window)
// Using in-memory Sets for simplicity (will be reset on server restart)
const remindedEvents24h = new Set<number>();
const remindedEvents1h = new Set<number>();

/**
 * Get events starting within a specific time window from now.
 * @param minHours - Minimum hours from now (inclusive lower bound)
 * @param maxHours - Maximum hours from now (exclusive upper bound)
 */
async function getEventsInWindow(minHours: number, maxHours: number): Promise<any[]> {
  try {
    const allEvents = await storage.getAllEvents();
    const now = Date.now();
    const minMs = now + minHours * 60 * 60 * 1000;
    const maxMs = now + maxHours * 60 * 60 * 1000;

    return allEvents.filter(event => {
      if (!event.eventDate || !event.startTime) return false;
      const eventStart = new Date(`${event.eventDate}T${event.startTime}`).getTime();
      return eventStart > minMs && eventStart <= maxMs;
    });
  } catch (error) {
    console.error('[EventReminders] Error fetching events in window:', error);
    return [];
  }
}

/**
 * Send reminder for a single event
 */
async function sendEventReminder(
  event: any,
  window: '24h' | '1h',
  remindedSet: Set<number>
): Promise<void> {
  try {
    // Fast path: check in-memory cache
    if (remindedSet.has(event.id)) {
      return;
    }

    // DB fallback: survives server restarts (25h window covers both 24h and 1h checks)
    const dedupKey = `${event.id}-${window}`;
    if (await wasNotificationSent('event_reminder', dedupKey, 25)) {
      remindedSet.add(event.id); // Warm the in-memory cache
      return;
    }

    const eventLocation = event.isVirtual
      ? 'Virtual Event'
      : event.location || event.city || 'TBD';

    const eventTime = `${event.eventDate} at ${event.startTime}`;

    const timeLabel = window === '24h' ? 'Tomorrow' : 'Starting soon';
    const reminderBody = event.isVirtual && event.virtualMeetingUrl
      ? `${timeLabel}: ${eventTime}\n${eventLocation}\n${event.virtualMeetingUrl}`
      : `${timeLabel}: ${eventTime} at ${eventLocation}`;

    await notifyEventAttendees(
      event.id,
      {
        title: `Reminder: ${event.title}`,
        body: reminderBody,
        data: {
          type: 'event_reminder',
          eventId: event.id,
          communityId: event.communityId,
          window,
          dedupKey,
        },
        category: 'event',
      },
      [] // Send to all attendees
    );

    remindedSet.add(event.id);
    console.info(`[EventReminders] Sent ${window} reminder for event ${event.id}: ${event.title}`);
  } catch (error) {
    console.error(`[EventReminders] Error sending ${window} reminder for event ${event.id}:`, error);
  }
}

/**
 * Check for upcoming events and send reminders
 * This function should be called periodically (e.g., every hour)
 */
export async function checkAndSendEventReminders(): Promise<void> {
  try {
    console.info('[EventReminders] Checking for events requiring reminders...');

    // 24-hour reminders: events starting 24-25 hours from now
    const events24h = await getEventsInWindow(24, 25);
    // 1-hour reminders: events starting 1-2 hours from now
    const events1h = await getEventsInWindow(1, 2);

    const total = events24h.length + events1h.length;
    if (total === 0) {
      console.info('[EventReminders] No events requiring reminders at this time');
      return;
    }

    console.info(`[EventReminders] Found ${events24h.length} event(s) for 24h reminder, ${events1h.length} for 1h reminder`);

    for (const event of events24h) {
      await sendEventReminder(event, '24h', remindedEvents24h);
    }

    for (const event of events1h) {
      await sendEventReminder(event, '1h', remindedEvents1h);
    }

    console.info('[EventReminders] Reminder check complete');
  } catch (error) {
    console.error('[EventReminders] Error during reminder check:', error);
  }
}

/**
 * Start the event reminder scheduler
 * Checks for upcoming events every hour
 */
export function startEventReminderScheduler(): NodeJS.Timeout {
  console.info('[EventReminders] Starting event reminder scheduler (checks every hour)');

  // Run immediately on startup
  checkAndSendEventReminders();

  // Then run every hour
  const intervalId = setInterval(() => {
    checkAndSendEventReminders();
  }, 60 * 60 * 1000);

  return intervalId;
}

/**
 * Stop the event reminder scheduler
 */
export function stopEventReminderScheduler(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.info('[EventReminders] Event reminder scheduler stopped');
}

/**
 * Clear the reminded events cache
 */
export function clearRemindedEventsCache(): void {
  remindedEvents24h.clear();
  remindedEvents1h.clear();
  console.info('[EventReminders] Reminded events cache cleared');
}

/**
 * Get statistics about the reminder system
 */
export function getReminderStats(): { remindedEvents24h: number; remindedEvents1h: number } {
  return {
    remindedEvents24h: remindedEvents24h.size,
    remindedEvents1h: remindedEvents1h.size,
  };
}
