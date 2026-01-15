/**
 * Keyword Extraction Utility
 *
 * Extracts meaningful keywords from microblog content, similar to Twitter's trending algorithm.
 * Filters out stop words, extracts significant terms, and identifies trending topics.
 *
 * This complements hashtag tracking by capturing what people are talking about
 * even when they don't use hashtags.
 */

export interface ExtractedKeyword {
  keyword: string;      // lowercase normalized keyword
  displayKeyword: string; // original casing for display
  isProperNoun: boolean;  // capitalized word (likely important)
  frequency: number;      // how many times it appears in this post
}

/**
 * Comprehensive stop words list (English)
 * These are filtered out as they don't contribute to trending topics
 */
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',

  // Pronouns
  'i', 'me', 'my', 'mine', 'myself',
  'you', 'your', 'yours', 'yourself', 'yourselves',
  'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself',
  'we', 'us', 'our', 'ours', 'ourselves',
  'they', 'them', 'their', 'theirs', 'themselves',

  // Common verbs (to be, to have, to do)
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'done',

  // Modal verbs
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',

  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'of', 'off', 'over', 'under', 'again',

  // Conjunctions
  'and', 'but', 'or', 'nor', 'yet', 'so', 'as', 'if', 'when', 'where',
  'while', 'because', 'although', 'though', 'unless', 'until', 'whether',

  // Question words
  'what', 'who', 'whom', 'whose', 'which', 'why', 'how',

  // Common adverbs
  'very', 'really', 'just', 'too', 'also', 'still', 'already', 'always',
  'never', 'often', 'sometimes', 'usually', 'here', 'there', 'now', 'then',

  // Determiners
  'this', 'that', 'these', 'those', 'some', 'any', 'all', 'each', 'every',
  'no', 'none', 'either', 'neither', 'both', 'such', 'another', 'other',

  // Numbers (common)
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',

  // Common verbs to filter
  'get', 'got', 'getting', 'go', 'going', 'went', 'gone',
  'make', 'made', 'making', 'take', 'took', 'taken', 'taking',
  'see', 'saw', 'seen', 'seeing', 'come', 'came', 'coming',
  'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking',
  'look', 'looked', 'looking', 'want', 'wanted', 'wanting',
  'give', 'gave', 'given', 'giving', 'use', 'used', 'using',
  'find', 'found', 'finding', 'tell', 'told', 'telling',
  'ask', 'asked', 'asking', 'work', 'worked', 'working',
  'seem', 'seemed', 'seeming', 'feel', 'felt', 'feeling',
  'try', 'tried', 'trying', 'leave', 'left', 'leaving',
  'call', 'called', 'calling',

  // Common words to filter
  'like', 'more', 'than', 'out', 'only', 'time', 'way',
  'even', 'new', 'good', 'first', 'last', 'long', 'great',
  'little', 'own', 'old', 'right', 'big', 'high', 'different',
  'small', 'large', 'next', 'early', 'young', 'important',

  // Social media filler
  'lol', 'lmao', 'omg', 'tbh', 'imo', 'imho', 'btw', 'fyi',
]);

/**
 * Christian-specific terms that should ALWAYS be kept (boost priority)
 * Even if they might normally be filtered, these are important for a Christian platform
 */
const CHRISTIAN_PRIORITY_TERMS = new Set([
  'god', 'jesus', 'christ', 'lord', 'holy', 'spirit', 'father', 'son',
  'prayer', 'pray', 'praying', 'prayers', 'blessed', 'blessing', 'blessings',
  'faith', 'faithful', 'believe', 'believing', 'believer', 'believers',
  'worship', 'worshiping', 'worshipping', 'worshiper', 'worshipper',
  'church', 'ministry', 'pastor', 'sermon', 'service', 'gospel',
  'bible', 'scripture', 'scriptures', 'word', 'testament',
  'grace', 'mercy', 'love', 'hope', 'peace', 'joy',
  'salvation', 'saved', 'redeemed', 'redemption',
  'forgiveness', 'forgive', 'forgiven', 'forgiving',
  'praise', 'praising', 'glorify', 'glory', 'hallelujah', 'amen',
  'disciple', 'disciples', 'apostle', 'apostles',
  'kingdom', 'heaven', 'eternal', 'eternity',
  'testimony', 'testify', 'witness', 'witnessing',
  'fellowship', 'community', 'communion',
  'repent', 'repentance', 'sin', 'righteousness',
  'miracle', 'miracles', 'heal', 'healing', 'healed',
  'baptism', 'baptize', 'baptized',
]);

/**
 * Extract meaningful keywords from content
 *
 * @param content - The microblog content to extract keywords from
 * @returns Array of extracted keywords with metadata
 */
export function extractKeywords(content: string): ExtractedKeyword[] {
  // Remove hashtags (they're tracked separately)
  const contentWithoutHashtags = content.replace(/#\w+/g, '');

  // Remove URLs
  const contentWithoutUrls = contentWithoutHashtags.replace(/https?:\/\/[^\s]+/g, '');

  // Remove mentions (@username)
  const contentWithoutMentions = contentWithoutUrls.replace(/@\w+/g, '');

  // Remove punctuation but keep apostrophes for contractions
  const cleanContent = contentWithoutMentions.replace(/[^\w\s']/g, ' ');

  // Split into words
  const words = cleanContent.split(/\s+/).filter(w => w.length > 0);

  // Track keyword frequencies
  const keywordMap = new Map<string, { displayKeyword: string; isProperNoun: boolean; count: number }>();

  for (const word of words) {
    // Skip very short words (unless they're Christian priority terms)
    if (word.length < 3 && !CHRISTIAN_PRIORITY_TERMS.has(word.toLowerCase())) {
      continue;
    }

    const normalized = word.toLowerCase();

    // Check if it's a Christian priority term (always keep)
    const isChristianTerm = CHRISTIAN_PRIORITY_TERMS.has(normalized);

    // Skip stop words (unless it's a Christian priority term)
    if (!isChristianTerm && STOP_WORDS.has(normalized)) {
      continue;
    }

    // Skip pure numbers
    if (/^\d+$/.test(word)) {
      continue;
    }

    // Check if it's a proper noun (starts with capital letter)
    const isProperNoun = /^[A-Z]/.test(word);

    // Track the keyword
    if (keywordMap.has(normalized)) {
      const existing = keywordMap.get(normalized)!;
      existing.count++;
      // Prefer capitalized version if this one is proper noun
      if (isProperNoun && !existing.isProperNoun) {
        existing.displayKeyword = word;
        existing.isProperNoun = true;
      }
    } else {
      keywordMap.set(normalized, {
        displayKeyword: word,
        isProperNoun,
        count: 1,
      });
    }
  }

  // Convert to array and filter
  const keywords: ExtractedKeyword[] = [];

  for (const [keyword, data] of keywordMap.entries()) {
    // Apply additional filters

    // Boost Christian terms - always include them
    const isChristianTerm = CHRISTIAN_PRIORITY_TERMS.has(keyword);

    // Skip keywords that appear only once unless they're proper nouns or Christian terms
    if (data.count === 1 && !data.isProperNoun && !isChristianTerm) {
      continue;
    }

    keywords.push({
      keyword,
      displayKeyword: data.displayKeyword,
      isProperNoun: data.isProperNoun,
      frequency: data.count,
    });
  }

  // Sort by frequency (most frequent first)
  keywords.sort((a, b) => {
    // Prioritize Christian terms
    const aIsChristian = CHRISTIAN_PRIORITY_TERMS.has(a.keyword);
    const bIsChristian = CHRISTIAN_PRIORITY_TERMS.has(b.keyword);
    if (aIsChristian && !bIsChristian) return -1;
    if (!aIsChristian && bIsChristian) return 1;

    // Then sort by frequency
    return b.frequency - a.frequency;
  });

  return keywords;
}

/**
 * Sanitize keyword input (for API queries)
 */
export function sanitizeKeyword(input: string): string {
  return input.trim().toLowerCase().replace(/[^\w]/g, '');
}
