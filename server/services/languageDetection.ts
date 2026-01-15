/**
 * Language Detection Service
 * Detects language of content and manages user language preferences
 */

import { franc } from 'franc-min';

// ISO 639-3 to ISO 639-1 mapping for common languages
const ISO_MAP: Record<string, string> = {
  'eng': 'en',  // English
  'ara': 'ar',  // Arabic
  'spa': 'es',  // Spanish
  'fra': 'fr',  // French
  'deu': 'de',  // German
  'por': 'pt',  // Portuguese
  'rus': 'ru',  // Russian
  'zho': 'zh',  // Chinese
  'jpn': 'ja',  // Japanese
  'kor': 'ko',  // Korean
  'ita': 'it',  // Italian
  'nld': 'nl',  // Dutch
  'pol': 'pl',  // Polish
  'tur': 'tr',  // Turkish
  'vie': 'vi',  // Vietnamese
  'tha': 'th',  // Thai
  'swe': 'sv',  // Swedish
  'dan': 'da',  // Danish
  'fin': 'fi',  // Finnish
  'nor': 'no',  // Norwegian
  'ukr': 'uk',  // Ukrainian
  'heb': 'he',  // Hebrew
  'hin': 'hi',  // Hindi
  'urd': 'ur',  // Urdu
  'ben': 'bn',  // Bengali
  'tam': 'ta',  // Tamil
  'tel': 'te',  // Telugu
  'mar': 'mr',  // Marathi
  'guj': 'gu',  // Gujarati
  'kan': 'kn',  // Kannada
  'mal': 'ml',  // Malayalam
};

/**
 * Detect the language of given text
 * @param text - Text content to analyze
 * @returns ISO 639-1 language code (e.g., 'en', 'ar', 'es') or 'en' as default
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length < 10) {
    // Too short to reliably detect, default to English
    return 'en';
  }

  // Remove URLs, mentions, hashtags for better detection
  const cleanText = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#\w+/g, '')
    .trim();

  if (cleanText.length < 10) {
    return 'en';
  }

  try {
    // franc returns ISO 639-3 codes
    const detected = franc(cleanText, { minLength: 10 });

    // If franc couldn't detect (returns 'und' for undefined)
    if (detected === 'und') {
      return 'en';
    }

    // Convert ISO 639-3 to ISO 639-1
    return ISO_MAP[detected] || 'en';
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en';
  }
}

/**
 * Calculate user's preferred languages based on engagement data
 * @param languageEngagement - Object with language codes as keys and engagement counts as values
 * @returns Array of language codes ordered by preference
 */
export function calculatePreferredLanguages(
  languageEngagement: Record<string, number>
): string[] {
  // Sort languages by engagement count (descending)
  const sorted = Object.entries(languageEngagement)
    .sort(([, a], [, b]) => b - a)
    .map(([lang]) => lang);

  // Always include English as fallback if not already present
  if (!sorted.includes('en')) {
    sorted.push('en');
  }

  // Return top 3 languages
  return sorted.slice(0, 3);
}

/**
 * Update language engagement for a user based on an interaction
 * @param currentEngagement - Current language engagement object
 * @param language - Language code to update
 * @param weight - Weight of the interaction (like=1, share=2, comment=3)
 * @returns Updated language engagement object
 */
export function updateLanguageEngagement(
  currentEngagement: Record<string, number>,
  language: string,
  weight: number = 1
): Record<string, number> {
  const updated = { ...currentEngagement };
  updated[language] = (updated[language] || 0) + weight;
  return updated;
}

/**
 * Calculate language match score for filtering
 * @param contentLanguage - Language of the content
 * @param userPreferredLanguages - User's preferred languages in order
 * @returns Score from 0-100 (100 = perfect match, 0 = no match)
 */
export function calculateLanguageMatchScore(
  contentLanguage: string | null | undefined,
  userPreferredLanguages: string[]
): number {
  if (!contentLanguage || !userPreferredLanguages.length) {
    // No language data available, give neutral score
    return 50;
  }

  const index = userPreferredLanguages.indexOf(contentLanguage);

  if (index === -1) {
    // Language not in user's preferences
    return 20; // Low score but not zero (allow some diversity)
  }

  // Higher score for higher-ranked languages
  // 1st preference: 100, 2nd: 80, 3rd: 60
  return 100 - (index * 20);
}

/**
 * Get language name from code for display purposes
 */
export function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    'en': 'English',
    'ar': 'Arabic',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'it': 'Italian',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish',
    'vi': 'Vietnamese',
    'th': 'Thai',
    'sv': 'Swedish',
    'da': 'Danish',
    'fi': 'Finnish',
    'no': 'Norwegian',
    'uk': 'Ukrainian',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'ur': 'Urdu',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada',
    'ml': 'Malayalam',
  };

  return names[code] || code.toUpperCase();
}
