/**
 * Event helper functions
 */

interface EventHost {
  id: number;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

interface EventWithHost {
  hostUserId?: number;
  creatorId?: number;
  host?: EventHost | null;
}

/**
 * Check if the viewer is the host of an event
 * Uses multiple fields for reliability: hostUserId, host.id, creatorId
 */
export function isHost(event: EventWithHost | null | undefined, viewerId: number | null | undefined): boolean {
  if (!event || !viewerId) return false;

  // Check hostUserId first (preferred)
  if (event.hostUserId && event.hostUserId === viewerId) {
    return true;
  }

  // Check host.id
  if (event.host?.id && event.host.id === viewerId) {
    return true;
  }

  // Fallback to creatorId
  if (event.creatorId && event.creatorId === viewerId) {
    return true;
  }

  return false;
}

/**
 * Get the host display name from an event
 */
export function getHostDisplayName(event: EventWithHost | null | undefined): string | null {
  if (!event?.host) return null;
  return event.host.displayName || event.host.username || null;
}
