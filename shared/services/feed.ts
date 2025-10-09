import { http } from '../http';
import { FeedZ, FeedPageZ, type Feed, type FeedPage } from '../app-schema';

export async function getFeed(): Promise<Feed> {
  return FeedZ.parse(await http('/api/feed'));
}

// Paginated version (back-compatible): will accept either legacy array or new object shape.
export async function getFeedPage(cursor?: string | null): Promise<FeedPage> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  // debug: expose to window for tests (will strip later)
  if (typeof window !== 'undefined') {
    (window as any).__LAST_FEED_CURSOR__ = cursor ?? null;
    console.debug('[getFeedPage]', `/api/feed${qs}`);
  }
  const res = await http(`/api/feed${qs}`);
  if (Array.isArray(res)) {
    return FeedPageZ.parse({ items: res, nextCursor: null });
  }
  return FeedPageZ.parse(res);
}
