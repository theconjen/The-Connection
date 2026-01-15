/**
 * Engagement Tracking Service
 * Tracks user interactions and updates language preferences
 */

import { storage } from '../storage-optimized';
import {
  updateLanguageEngagement,
  calculatePreferredLanguages,
} from './languageDetection';

// Weights for different interaction types
const INTERACTION_WEIGHTS = {
  view: 0.5,
  like: 2,
  comment: 3,
  share: 4,
  bookmark: 2,
  follow_author: 5,
};

/**
 * Track user engagement with content and update language preferences
 */
export async function trackEngagement(
  userId: number,
  contentId: number,
  contentType: 'post' | 'microblog',
  interactionType: keyof typeof INTERACTION_WEIGHTS,
  contentLanguage?: string | null
) {
  try {
    // If no language provided, try to get it from the content
    let language = contentLanguage;

    if (!language) {
      if (contentType === 'post') {
        const post = await storage.getPost(contentId);
        language = (post as any)?.detectedLanguage;
      } else if (contentType === 'microblog') {
        const microblog = await storage.getMicroblog(contentId);
        language = (microblog as any)?.detectedLanguage;
      }
    }

    // If we still don't have a language, skip tracking
    if (!language) {
      return;
    }

    // Get or create user preferences
    let preferences = await storage.getUserPreferences(userId);

    if (!preferences) {
      // Create new preferences
      await storage.createUserPreferences({
        userId,
        interests: [],
        favoriteTopics: [],
        engagementHistory: [],
        preferredLanguages: ['en'],
        languageEngagement: {},
      } as any);
      preferences = await storage.getUserPreferences(userId);
    }

    if (!preferences) {
      console.error('Failed to create user preferences for user:', userId);
      return;
    }

    // Update language engagement
    const weight = INTERACTION_WEIGHTS[interactionType] || 1;
    const currentEngagement = (preferences as any).languageEngagement || {};
    const updatedEngagement = updateLanguageEngagement(
      currentEngagement,
      language,
      weight
    );

    // Calculate new preferred languages
    const preferredLanguages = calculatePreferredLanguages(updatedEngagement);

    // Update user preferences
    await storage.updateUserPreferences(userId, {
      languageEngagement: updatedEngagement,
      preferredLanguages,
      updatedAt: new Date(),
    } as any);

    console.info(
      `[Engagement] User ${userId} ${interactionType} ${contentType} ${contentId} (${language})`
    );
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
}

/**
 * Track multiple content views in batch
 */
export async function trackBatchViews(
  userId: number,
  viewedContent: Array<{
    contentId: number;
    contentType: 'post' | 'microblog';
    language?: string | null;
  }>
) {
  try {
    for (const item of viewedContent) {
      await trackEngagement(
        userId,
        item.contentId,
        item.contentType,
        'view',
        item.language
      );
    }
  } catch (error) {
    console.error('Error tracking batch views:', error);
  }
}

/**
 * Get user's language preferences for filtering
 */
export async function getUserLanguagePreferences(userId: number): Promise<string[]> {
  try {
    const preferences = await storage.getUserPreferences(userId);

    if (!preferences) {
      return ['en']; // Default to English
    }

    const preferredLanguages = (preferences as any).preferredLanguages;

    if (!preferredLanguages || !Array.isArray(preferredLanguages)) {
      return ['en'];
    }

    return preferredLanguages;
  } catch (error) {
    console.error('Error getting user language preferences:', error);
    return ['en'];
  }
}
