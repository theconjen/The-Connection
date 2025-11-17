/**
 * Native implementation of platform sharing using react-native-share
 */
import Share from 'react-native-share';

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
    try {
      const shareOptions: any = {
        title: options.title,
        message: options.text || options.url || '',
      };

      if (options.url) {
        shareOptions.url = options.url;
      }

      await Share.open(shareOptions);
    } catch (error) {
      // User cancelled share or error occurred
      if (error instanceof Error && error.message !== 'User did not share') {
        console.error('[Sharing.native] Failed to share:', error);
        throw error;
      }
    }
  },

  canShare(): boolean {
    return true; // Native sharing is always available
  },
};

export default sharing;
