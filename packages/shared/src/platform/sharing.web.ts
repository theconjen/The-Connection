/**
 * Web implementation of sharing using Web Share API (with react-share fallback)
 */

import { Sharing, ShareOptions, ShareResult } from './sharing';

class WebSharing implements Sharing {
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      // Try native Web Share API first (supported in modern browsers)
      if (navigator.share) {
        await navigator.share({
          url: options.url,
          title: options.title,
          text: options.message,
        });
        return { success: true };
      }

      // Fallback: Copy URL to clipboard
      if (options.url) {
        await navigator.clipboard.writeText(options.url);
        return { success: true };
      }

      return {
        success: false,
        error: 'No share method available',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      };
    }
  }

  isAvailable(): boolean {
    return !!(navigator.share || navigator.clipboard);
  }
}

export const sharing = new WebSharing();
