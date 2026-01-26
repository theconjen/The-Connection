/**
 * Share URL Builder Utility
 *
 * Generates canonical share URLs for content that can be shared externally.
 * These URLs use short paths that work with deep linking and provide
 * rich previews when shared on social media.
 *
 * Canonical URL patterns:
 * - /a/:slugOrId - Apologetics articles
 * - /e/:eventId - Events
 * - /p/:postId - Posts
 * - /u/:username - User profiles
 */

import { Share, Platform } from 'react-native';

// Base URL for web app
const WEB_BASE_URL = 'https://theconnection.app';

// App store URLs
export const APP_STORE_URL = 'https://apps.apple.com/app/the-connection/id6738976084';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=app.theconnection.mobile';

/**
 * Get the appropriate app store URL for the current platform
 */
export function getAppStoreUrl(): string {
  return Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
}

/**
 * Build UTM parameters string
 * Always includes utm_campaign=content_share
 */
function buildUtmParams(utmSource?: string): string {
  const params = new URLSearchParams();
  if (utmSource) {
    params.set('utm_source', utmSource);
  }
  params.set('utm_medium', 'share');
  params.set('utm_campaign', 'content_share');
  return params.toString();
}

/**
 * Build a share URL for an apologetics article
 */
export function buildApologeticsShareUrl(idOrSlug: string | number, utmSource?: string): string {
  const base = `${WEB_BASE_URL}/a/${idOrSlug}`;
  const utmParams = buildUtmParams(utmSource);
  return utmParams ? `${base}?${utmParams}` : base;
}

/**
 * Build a share URL for an event
 */
export function buildEventShareUrl(eventId: number | string, utmSource?: string): string {
  const base = `${WEB_BASE_URL}/e/${eventId}`;
  const utmParams = buildUtmParams(utmSource);
  return utmParams ? `${base}?${utmParams}` : base;
}

/**
 * Build a share URL for a post
 */
export function buildPostShareUrl(postId: number | string, utmSource?: string): string {
  const base = `${WEB_BASE_URL}/p/${postId}`;
  const utmParams = buildUtmParams(utmSource);
  return utmParams ? `${base}?${utmParams}` : base;
}

/**
 * Build a share URL for a user profile
 */
export function buildProfileShareUrl(username: string, utmSource?: string): string {
  const base = `${WEB_BASE_URL}/u/${username}`;
  const utmParams = buildUtmParams(utmSource);
  return utmParams ? `${base}?${utmParams}` : base;
}

/**
 * Share content types
 */
export type ShareContentType = 'apologetics' | 'event' | 'post' | 'profile';

export interface ShareContent {
  type: ShareContentType;
  id: string | number;
  title: string;
  message?: string;
  imageUrl?: string;
}

/**
 * Build share data for a given content type
 */
export function buildShareData(content: ShareContent): { url: string; title: string; message: string } {
  const utmSource = Platform.OS === 'ios' ? 'ios_app' : 'android_app';
  let url: string;
  let defaultMessage: string;

  switch (content.type) {
    case 'apologetics':
      url = buildApologeticsShareUrl(content.id, utmSource);
      defaultMessage = `Check out this article: ${content.title}`;
      break;
    case 'event':
      url = buildEventShareUrl(content.id, utmSource);
      defaultMessage = `Join me at ${content.title}!`;
      break;
    case 'post':
      url = buildPostShareUrl(content.id, utmSource);
      defaultMessage = content.title ? `${content.title}` : 'Check out this post';
      break;
    case 'profile':
      url = buildProfileShareUrl(content.id as string, utmSource);
      defaultMessage = `Check out ${content.title}'s profile on The Connection`;
      break;
    default:
      throw new Error(`Unknown content type: ${content.type}`);
  }

  return {
    url,
    title: content.title,
    message: content.message || defaultMessage,
  };
}

/**
 * Share content using the native share sheet
 */
export async function shareContent(content: ShareContent): Promise<{ success: boolean; error?: string }> {
  try {
    const shareData = buildShareData(content);

    const result = await Share.share(
      {
        title: shareData.title,
        message: `${shareData.message}\n\n${shareData.url}`,
        url: Platform.OS === 'ios' ? shareData.url : undefined, // iOS supports separate URL
      },
      {
        dialogTitle: `Share ${content.type}`,
        subject: shareData.title, // For email sharing
      }
    );

    if (result.action === Share.sharedAction) {
      return { success: true };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, error: 'Share dismissed' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Share error:', error);
    return { success: false, error: error.message || 'Failed to share' };
  }
}

/**
 * Convenience functions for sharing specific content types
 */

export async function shareApologetics(
  idOrSlug: string | number,
  title: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return shareContent({
    type: 'apologetics',
    id: idOrSlug,
    title,
    message: customMessage,
  });
}

export async function shareEvent(
  eventId: number | string,
  title: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return shareContent({
    type: 'event',
    id: eventId,
    title,
    message: customMessage,
  });
}

export async function sharePost(
  postId: number | string,
  title: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return shareContent({
    type: 'post',
    id: postId,
    title,
    message: customMessage,
  });
}

export async function shareProfile(
  username: string,
  displayName: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  return shareContent({
    type: 'profile',
    id: username,
    title: displayName,
    message: customMessage,
  });
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(content: ShareContent): Promise<{ success: boolean; error?: string }> {
  try {
    const { Clipboard } = await import('expo-clipboard');
    const shareData = buildShareData(content);
    await Clipboard.setStringAsync(shareData.url);
    return { success: true };
  } catch (error: any) {
    console.error('Copy URL error:', error);
    return { success: false, error: error.message || 'Failed to copy URL' };
  }
}
