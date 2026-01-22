/**
 * Bible API Service
 * Fetches Bible passages from bible-api.com (free, no API key required)
 * Uses WEB (World English Bible) - public domain, modern English
 */

const BIBLE_API_BASE = 'https://bible-api.com';
const DEFAULT_TRANSLATION = 'web'; // World English Bible (public domain)

interface BibleApiResponse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

interface BiblePassageResult {
  success: boolean;
  reference: string;
  text: string;
  translation: string;
  error?: string;
}

/**
 * Normalize a Bible reference to standard format
 * "Psalm86: 5-7" -> "Psalm 86:5-7"
 * "john3:16" -> "John 3:16"
 */
function normalizeReference(ref: string): string {
  let normalized = ref.trim();

  // Add space between book name and chapter number if missing
  // e.g., "Psalm86" -> "Psalm 86", "John3" -> "John 3"
  normalized = normalized.replace(/([a-zA-Z])(\d)/, '$1 $2');

  // Remove spaces around colons: "86: 5" -> "86:5"
  normalized = normalized.replace(/\s*:\s*/g, ':');

  // Remove spaces around dashes: "5 - 7" -> "5-7"
  normalized = normalized.replace(/\s*-\s*/g, '-');

  return normalized;
}

/**
 * Fetch a Bible passage from bible-api.com
 * @param reference - Bible reference (e.g., "John 3:16", "Romans 8:28-30")
 * @returns Promise with the passage text or error
 */
export async function fetchBiblePassage(reference: string): Promise<BiblePassageResult> {
  try {
    // Normalize and format reference for URL
    const normalizedRef = normalizeReference(reference);
    const formattedRef = normalizedRef.replace(/\s+/g, '+');
    const url = `${BIBLE_API_BASE}/${formattedRef}?translation=${DEFAULT_TRANSLATION}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.status}`);
    }

    const data: BibleApiResponse = await response.json();

    if (data.text) {
      // Clean up the passage text
      const passageText = data.text
        .trim()
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');

      return {
        success: true,
        reference: data.reference || reference,
        text: passageText,
        translation: 'WEB',
      };
    }

    // No passage found
    return {
      success: false,
      reference,
      text: reference,
      translation: '',
      error: 'Passage not found',
    };
  } catch (error) {
    // Return the original reference on error
    return {
      success: false,
      reference,
      text: reference,
      translation: '',
      error: error instanceof Error ? error.message : 'Failed to fetch passage',
    };
  }
}

/**
 * Check if a string looks like a Bible reference
 * @param text - Text to check
 * @returns true if it looks like a Bible reference
 */
export function looksLikeBibleReference(text: string): boolean {
  // Common Bible book patterns - flexible matching
  // Matches: "John 3:16", "Psalm86:5-7", "1 Corinthians 13", "Rom 8:28"
  const bibleRefPattern = /^(1|2|3|I|II|III)?\s*(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\s*of\s*Solomon|Songs?|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation|Gen|Exod?|Lev|Num|Deut|Josh|Judg|Sam|Kgs|Chr|Neh|Esth|Ps|Prov|Eccl|Isa|Jer|Lam|Ezek|Dan|Hos|Obad|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt?|Mk|Lk|Jn|Rom|Cor|Gal|Eph|Phil|Col|Thess?|Tim|Phlm|Heb|Jas|Pet|Rev)\s*\d/i;

  return bibleRefPattern.test(text.trim());
}
