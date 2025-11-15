/**
 * Platform-agnostic sharing interface
 *
 * Provides unified API for:
 * - Web: react-share (social media sharing)
 * - Native: react-native-share (native share sheet)
 */

export interface ShareOptions {
  /** URL to share */
  url?: string;
  /** Title of the content */
  title?: string;
  /** Message/description */
  message?: string;
  /** Subject (for email shares) */
  subject?: string;
}

export interface ShareResult {
  /** Whether the share was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

export interface Sharing {
  /**
   * Share content using native share dialog
   * @param options - Content to share
   */
  share(options: ShareOptions): Promise<ShareResult>;

  /**
   * Check if sharing is available on this platform
   */
  isAvailable(): boolean;
}

// Platform-specific implementation will be imported based on .web.ts or .native.ts extension
export { sharing } from './sharing.native';
