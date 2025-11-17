/**
 * Web implementation of platform sharing using Web Share API
 */

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
}

export interface SharingAdapter {
  share: (options: ShareOptions) => Promise<void>;
  canShare: () => boolean;
}

const sharing: SharingAdapter = {
  async share(options: ShareOptions): Promise<void> {
    if (!navigator.share) {
      throw new Error('Web Share API is not supported in this browser');
    }

    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url,
      });
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('[Sharing.web] Failed to share:', error);
        throw error;
      }
    }
  },

  canShare(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  },
};

export default sharing;
