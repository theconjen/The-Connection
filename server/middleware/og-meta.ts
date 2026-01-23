/**
 * OpenGraph Meta Tag Middleware
 *
 * Intercepts requests from social media crawlers for canonical URLs
 * and serves HTML with proper OG meta tags for rich link previews.
 *
 * Crawler detection based on common user agents from:
 * - Facebook (facebookexternalhit)
 * - Twitter (Twitterbot)
 * - LinkedIn (LinkedInBot)
 * - Slack (Slackbot)
 * - Discord (Discordbot)
 * - Telegram (TelegramBot)
 * - WhatsApp (WhatsApp)
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage-optimized';

const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot-LinkExpanding',
  'Slackbot',
  'Discordbot',
  'TelegramBot',
  'WhatsApp',
  'Googlebot',
  'bingbot',
  'Applebot',
];

const BASE_URL = 'https://theconnection.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`;
const SITE_NAME = 'The Connection';
const TWITTER_HANDLE = '@theconnectionapp';

function isCrawler(userAgent: string): boolean {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncate(text: string | null | undefined, length: number): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length - 3) + '...';
}

function generateOgHtml(meta: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  type?: string;
  author?: string;
  publishedTime?: string;
}): string {
  const ogImage = meta.image || DEFAULT_IMAGE;
  const ogType = meta.type || 'website';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}">

  <!-- OpenGraph -->
  <meta property="og:title" content="${escapeHtml(meta.title)}">
  <meta property="og:description" content="${escapeHtml(meta.description)}">
  <meta property="og:url" content="${escapeHtml(meta.url)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${SITE_NAME}">
  ${meta.author ? `<meta property="article:author" content="${escapeHtml(meta.author)}">` : ''}
  ${meta.publishedTime ? `<meta property="article:published_time" content="${escapeHtml(meta.publishedTime)}">` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${TWITTER_HANDLE}">
  <meta name="twitter:title" content="${escapeHtml(meta.title)}">
  <meta name="twitter:description" content="${escapeHtml(meta.description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">

  <!-- App Links -->
  <meta property="al:ios:app_store_id" content="6738976084">
  <meta property="al:ios:app_name" content="The Connection">
  <meta property="al:ios:url" content="theconnection://${meta.url.replace(BASE_URL, '')}">
  <meta property="al:android:package" content="app.theconnection.mobile">
  <meta property="al:android:app_name" content="The Connection">
  <meta property="al:android:url" content="theconnection://${meta.url.replace(BASE_URL, '')}">

  <!-- Redirect to SPA -->
  <script>window.location.href = "${escapeHtml(meta.url)}";</script>
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(meta.url)}">${escapeHtml(meta.title)}</a>...</p>
</body>
</html>`;
}

/**
 * Middleware to serve OG meta tags for social media crawlers
 */
export function ogMetaMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userAgent = req.get('user-agent') || '';

    // Only intercept for crawlers
    if (!isCrawler(userAgent)) {
      return next();
    }

    const path = req.path;

    try {
      // Handle /a/:slugOrId - Apologetics
      if (path.startsWith('/a/')) {
        const slugOrId = path.substring(3);
        return await handleApologeticsOg(slugOrId, res);
      }

      // Handle /e/:eventId - Events
      if (path.startsWith('/e/')) {
        const eventId = path.substring(3);
        return await handleEventOg(eventId, res);
      }

      // Handle /p/:postId - Posts
      if (path.startsWith('/p/')) {
        const postId = path.substring(3);
        return await handlePostOg(postId, res);
      }

      // Handle /u/:username - Profiles
      if (path.startsWith('/u/')) {
        const username = path.substring(3);
        return await handleProfileOg(username, res);
      }

      // Not a canonical URL, continue to next middleware
      next();
    } catch (error) {
      console.error('Error in OG meta middleware:', error);
      next();
    }
  };
}

async function handleApologeticsOg(slugOrId: string, res: Response) {
  let resource;
  const numericId = parseInt(slugOrId, 10);

  if (!isNaN(numericId)) {
    resource = await storage.getApologeticsResource(numericId);
  }

  if (!resource) {
    resource = await (storage as any).getApologeticsResourceBySlug?.(slugOrId);
  }

  if (!resource) {
    return res.status(404).send('Not found');
  }

  const slug = (resource as any).slug || `apologetics-${resource.id}`;
  const quickAnswer = (resource as any).quickAnswer || (resource as any).summary || resource.content?.substring(0, 200);

  const html = generateOgHtml({
    title: `${resource.title} | The Connection`,
    description: truncate(quickAnswer, 200),
    url: `${BASE_URL}/a/${slug}`,
    image: (resource as any).imageUrl,
    type: 'article',
    author: (resource as any).authorDisplayName || 'The Connection Team',
    publishedTime: resource.createdAt?.toISOString(),
  });

  res.set('Content-Type', 'text/html');
  res.send(html);
}

async function handleEventOg(eventId: string, res: Response) {
  const id = parseInt(eventId, 10);
  if (isNaN(id)) {
    return res.status(404).send('Not found');
  }

  const event = await storage.getEvent(id);
  if (!event || (event as any).isPrivate) {
    return res.status(404).send('Not found');
  }

  // Get host name
  let hostName = 'The Connection';
  if ((event as any).creatorId) {
    const creator = await storage.getUser((event as any).creatorId);
    if (creator) {
      hostName = creator.displayName || creator.username || 'The Connection';
    }
  }

  const locationDisplay = [
    (event as any).city,
    (event as any).state,
  ].filter(Boolean).join(', ') || ((event as any).isVirtual ? 'Online Event' : 'Location TBD');

  const eventDate = (event as any).eventDate || (event as any).startsAt;
  const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  const html = generateOgHtml({
    title: `${event.title} | The Connection`,
    description: truncate(`${dateStr} · ${locationDisplay} · Hosted by ${hostName}. ${event.description || ''}`, 200),
    url: `${BASE_URL}/e/${event.id}`,
    image: (event as any).imageUrl || (event as any).posterUrl,
    type: 'event',
  });

  res.set('Content-Type', 'text/html');
  res.send(html);
}

async function handlePostOg(postId: string, res: Response) {
  const id = parseInt(postId, 10);
  if (isNaN(id)) {
    return res.status(404).send('Not found');
  }

  const post = await storage.getPost(id);
  if (!post || (post as any).deletedAt) {
    return res.status(404).send('Not found');
  }

  // Get author info
  let authorName = 'Anonymous';
  if (post.userId) {
    const author = await storage.getUser(post.userId);
    if (author) {
      authorName = author.displayName || author.username || 'Anonymous';
    }
  }

  const title = post.title || `Post by ${authorName}`;
  const contentPreview = post.content?.substring(0, 200) || '';

  const html = generateOgHtml({
    title: `${title} | The Connection`,
    description: truncate(contentPreview, 200),
    url: `${BASE_URL}/p/${post.id}`,
    image: (post as any).imageUrl,
    type: 'article',
    author: authorName,
    publishedTime: post.createdAt?.toISOString(),
  });

  res.set('Content-Type', 'text/html');
  res.send(html);
}

async function handleProfileOg(username: string, res: Response) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    return res.status(404).send('Not found');
  }

  const displayName = user.displayName || user.username;
  const isPrivate = (user as any).profileVisibility === 'private' || (user as any).isPrivate;

  let description = `@${user.username} on The Connection`;
  if (!isPrivate && (user as any).bio) {
    description = truncate((user as any).bio, 150) + ` · @${user.username}`;
  }

  // Get follower count
  let followerCount = 0;
  try {
    const followers = await (storage as any).getFollowers?.(user.id);
    followerCount = followers?.length || 0;
  } catch {}

  if (followerCount > 0) {
    description += ` · ${followerCount} followers`;
  }

  const html = generateOgHtml({
    title: `${displayName} (@${user.username}) | The Connection`,
    description: description,
    url: `${BASE_URL}/u/${user.username}`,
    image: user.avatarUrl,
    type: 'profile',
  });

  res.set('Content-Type', 'text/html');
  res.send(html);
}

export default ogMetaMiddleware;
