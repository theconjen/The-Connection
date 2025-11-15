/**
 * React Native implementation of sharing using react-native-share
 */

import Share from 'react-native-share';
import { Sharing, ShareOptions, ShareResult } from './sharing';

class NativeSharing implements Sharing {
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      const shareOptions: any = {
        message: options.message || options.title || '',
      };

      if (options.url) {
        shareOptions.url = options.url;
      }

      if (options.title) {
        shareOptions.title = options.title;
      }

      if (options.subject) {
        shareOptions.subject = options.subject;
      }

      const result = await Share.open(shareOptions);

      return {
        success: result.success || false,
      };
    } catch (error: any) {
      // User cancelled - not an error
      if (error.message === 'User did not share') {
        return { success: false };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      };
    }
  }

  isAvailable(): boolean {
    // react-native-share is always available on native
    return true;
  }
}

export const sharing = new NativeSharing();
