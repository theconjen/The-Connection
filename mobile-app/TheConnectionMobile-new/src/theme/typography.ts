/**
 * Typography System - Figtree Font
 * Modern, clean sans-serif for readability across all screens
 */

export const typography = {
  // Font family mapping (weight-based files)
  family: {
    regular: 'Figtree-Regular',
    medium: 'Figtree-Medium',
    semibold: 'Figtree-SemiBold',
    bold: 'Figtree-Bold',
  },

  // Font sizes
  size: {
    h1: 24,       // Screen titles, major headings
    h2: 20,       // Card titles, event titles, section headers
    h3: 17,       // Subsection headers
    body: 16,     // Posts, answers, comments, main content
    bodySmall: 14,// Secondary content, captions
    caption: 12,  // Timestamps, counts, metadata
  },

  // Line heights (optimized for readability)
  line: {
    h1: 30,       // 1.25x
    h2: 26,       // 1.3x
    h3: 22,       // 1.29x
    body: 22,     // 1.375x (comfortable reading)
    bodySmall: 20,// 1.43x
    caption: 16,  // 1.33x
  },
} as const;

export type Typography = typeof typography;
export type FontWeightName = keyof typeof typography.family;
export type TextVariant =
  | 'title1'   // h1: Screen titles
  | 'title2'   // h2: Card/event titles
  | 'title3'   // h3: Subsection headers
  | 'body'     // Main content
  | 'bodySmall'// Secondary content
  | 'caption'; // Metadata

/**
 * Get default font weight for a text variant
 */
export function getDefaultWeightForVariant(variant: TextVariant): FontWeightName {
  switch (variant) {
    case 'title1':
      return 'bold';
    case 'title2':
    case 'title3':
      return 'semibold';
    case 'body':
    case 'bodySmall':
    case 'caption':
    default:
      return 'regular';
  }
}

/**
 * Get typography style for a variant
 */
export function getTypographyStyle(variant: TextVariant) {
  const s = typography.size;
  const l = typography.line;

  switch (variant) {
    case 'title1':
      return { fontSize: s.h1, lineHeight: l.h1 };
    case 'title2':
      return { fontSize: s.h2, lineHeight: l.h2 };
    case 'title3':
      return { fontSize: s.h3, lineHeight: l.h3 };
    case 'bodySmall':
      return { fontSize: s.bodySmall, lineHeight: l.bodySmall };
    case 'caption':
      return { fontSize: s.caption, lineHeight: l.caption };
    case 'body':
    default:
      return { fontSize: s.body, lineHeight: l.body };
  }
}
