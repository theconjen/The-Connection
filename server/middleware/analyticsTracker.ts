/**
 * Analytics Tracking Middleware
 * Logs key API actions to the analytics_events table for platform analytics.
 * Non-blocking — failures never affect the request.
 */

import { Request, Response, NextFunction } from 'express';
import { trackEvent, AnalyticsEventType } from '../services/analyticsService';
import { getSessionUserId } from '../utils/session';

// Map route patterns to analytics event types
const ROUTE_EVENT_MAP: Array<{
  method: string;
  pattern: RegExp;
  eventType: AnalyticsEventType;
}> = [
  { method: 'POST', pattern: /^\/api\/auth\/login$/, eventType: 'login' },
  { method: 'POST', pattern: /^\/api\/auth\/register$/, eventType: 'signup' },
  { method: 'POST', pattern: /^\/api\/posts$/, eventType: 'post_created' },
  { method: 'POST', pattern: /^\/api\/microblogs$/, eventType: 'microblog_created' },
  { method: 'POST', pattern: /^\/api\/events$/, eventType: 'event_created' },
  { method: 'POST', pattern: /^\/api\/events\/\d+\/rsvp$/, eventType: 'event_rsvp' },
  { method: 'POST', pattern: /^\/api\/communities\/[^/]+\/join$/, eventType: 'community_join' },
  { method: 'POST', pattern: /^\/api\/communities\/[^/]+\/leave$/, eventType: 'community_leave' },
  { method: 'GET', pattern: /^\/api\/search/, eventType: 'search' },
  { method: 'POST', pattern: /^\/api\/prayer-requests$/, eventType: 'prayer_created' },
  { method: 'POST', pattern: /^\/api\/reports$/, eventType: 'report_filed' },
];

/**
 * Express middleware that tracks analytics events after response is sent.
 * Only fires on successful (2xx) responses.
 */
export function analyticsTracker(req: Request, res: Response, next: NextFunction) {
  // Attach a listener for when the response finishes
  res.on('finish', () => {
    // Only track successful responses
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    const match = ROUTE_EVENT_MAP.find(
      r => r.method === req.method && r.pattern.test(req.originalUrl)
    );

    if (match) {
      const userId = getSessionUserId(req);
      // Fire and forget — don't await
      trackEvent(match.eventType, userId, {
        path: req.originalUrl,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}
