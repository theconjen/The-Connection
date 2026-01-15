/**
 * Extract hashtags from microblog content
 * Matches #word patterns, preserving original casing
 */
export interface ExtractedHashtag {
  tag: string;        // lowercase for storage/lookup
  displayTag: string; // original casing for display
}

export function extractHashtags(content: string): ExtractedHashtag[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = content.matchAll(hashtagRegex);

  const uniqueTags = new Map<string, string>();

  for (const match of matches) {
    const displayTag = match[1];
    const tag = displayTag.toLowerCase();

    if (!uniqueTags.has(tag)) {
      uniqueTags.set(tag, displayTag);
    }
  }

  return Array.from(uniqueTags.entries()).map(([tag, displayTag]) => ({
    tag,
    displayTag,
  }));
}
