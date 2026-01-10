import { storage } from '../storage-optimized';
import { notifyEventAttendees } from './notificationHelper';

/**
 * Event Reminder Service
 *
 * Sends reminder notifications to users who RSVPed to events
 * 24 hours before the event starts.
 *
 * This service runs periodically (every hour) to check for upcoming events.
 */

// Track which events we've already sent reminders for
// Using in-memory Set for simplicity (will be reset on server restart)
const remindedEvents = new Set<number>();

/**
 * Get events that are starting in the next 24-25 hours
 * (We check 25 hours to account for the 1-hour interval between checks)
 */
async function getUpcomingEvents(): Promise<any[]> {
  try {
    const allEvents = await storage.getAllEvents();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const dayAfterTomorrow = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

    // Filter events that start between 24 and 25 hours from now
    const upcomingEvents = allEvents.filter(event => {
      if (!event.eventDate || !event.startTime) return false;

      // Parse event start time
      const eventStart = new Date(`${event.eventDate}T${event.startTime}`);

      // Check if event is in the reminder window (24-25 hours from now)
      return eventStart > tomorrow && eventStart <= dayAfterTomorrow;
    });

    return upcomingEvents;
  } catch (error) {
    console.error('[EventReminders] Error fetching upcoming events:', error);
    return [];
  }
}

/**
 * Send reminder for a single event
 */
async function sendEventReminder(event: any): Promise<void> {
  try {
    // Skip if we've already sent a reminder for this event
    if (remindedEvents.has(event.id)) {
      console.info(`[EventReminders] Reminder already sent for event ${event.id}`);
      return;
    }

    // Get event details for the notification
    const eventLocation = event.isVirtual
      ? 'Virtual Event'
      : event.location || event.city || 'TBD';

    const eventTime = `${event.eventDate} at ${event.startTime}`;

    // Format a nice reminder message
    const reminderBody = event.isVirtual && event.virtualMeetingUrl
      ? `Tomorrow: ${eventTime}\n${eventLocation}\n${event.virtualMeetingUrl}`
      : `Tomorrow: ${eventTime} at ${eventLocation}`;

    // Send notification to all RSVPed attendees
    await notifyEventAttendees(
      event.id,
      {
        title: `Reminder: ${event.title}`,
        body: reminderBody,
        data: {
          type: 'event_reminder',
          eventId: event.id,
          communityId: event.communityId,
        },
        category: 'event',
      },
      [] // Don't exclude anyone - send to all attendees
    );

    // Mark this event as reminded
    remindedEvents.add(event.id);

    console.info(`[EventReminders] Sent reminder for event ${event.id}: ${event.title}`);
  } catch (error) {
    console.error(`[EventReminders] Error sending reminder for event ${event.id}:`, error);
  }
}

/**
 * Check for upcoming events and send reminders
 * This function should be called periodically (e.g., every hour)
 */
export async function checkAndSendEventReminders(): Promise<void> {
  try {
    console.info('[EventReminders] Checking for events requiring reminders...');

    const upcomingEvents = await getUpcomingEvents();

    if (upcomingEvents.length === 0) {
      console.info('[EventReminders] No events requiring reminders at this time');
      return;
    }

    console.info(`[EventReminders] Found ${upcomingEvents.length} event(s) requiring reminders`);

    // Send reminders for each event
    for (const event of upcomingEvents) {
      await sendEventReminder(event);
    }

    console.info('[EventReminders] Reminder check complete');
  } catch (error) {
    console.error('[EventReminders] Error during reminder check:', error);
  }
}

/**
 * Start the event reminder scheduler
 * Checks for upcoming events every hour
 *
 * @returns Interval ID (can be used to stop the scheduler with clearInterval)
 */
export function startEventReminderScheduler(): NodeJS.Timeout {
  console.info('[EventReminders] Starting event reminder scheduler (checks every hour)');

  // Run immediately on startup
  checkAndSendEventReminders();

  // Then run every hour
  const intervalId = setInterval(() => {
    checkAndSendEventReminders();
  }, 60 * 60 * 1000); // 1 hour in milliseconds

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
 * Useful for testing or manual reset
 */
export function clearRemindedEventsCache(): void {
  remindedEvents.clear();
  console.info('[EventReminders] Reminded events cache cleared');
}

/**
 * Get statistics about the reminder system
 */
export function getReminderStats(): { remindedEventsCount: number } {
  return {
    remindedEventsCount: remindedEvents.size,
  };
}
