/**
 * Christian Feed Algorithm
 * Promotes unity, Christ-likeness, healthy debate, and enjoyment
 */

import { Microblog, Post } from '@shared/schema';

const VALUE_KEYWORDS = {
  unity: [
    'together', 'unity', 'community', 'fellowship', 'brother', 'sister',
    'family', 'church', 'gather', 'worship', 'join', 'united', 'bond'
  ],
  christlikeness: [
    'love', 'grace', 'mercy', 'forgiveness', 'compassion', 'kindness',
    'humility', 'servant', 'faith', 'hope', 'patience', 'peace', 'joy',
    'prayer', 'bless', 'grateful', 'praise'
  ],
  debate: [
    'discuss', 'question', 'think', 'perspective', 'consider', 'explore',
    'understand', 'learn', 'study', 'scripture', 'theology', 'respectfully'
  ],
  enjoyment: [
    'joy', 'celebrate', 'happy', 'blessed', 'grateful', 'amazing',
    'wonderful', 'inspired', 'encouraged', 'testimony', 'miracle'
  ],
};

const NEGATIVE_PATTERNS = [
  'hate', 'angry', 'division', 'fight', 'attack', 'condemn',
  'toxic', 'bitter', 'hostile'
];

export function calculateChristianValueScores(content: string) {
  const lowerContent = content.toLowerCase();

  const unityMatches = VALUE_KEYWORDS.unity.filter(kw => lowerContent.includes(kw)).length;
  const christlikenessMatches = VALUE_KEYWORDS.christlikeness.filter(kw => lowerContent.includes(kw)).length;
  const debateMatches = VALUE_KEYWORDS.debate.filter(kw => lowerContent.includes(kw)).length;
  const enjoymentMatches = VALUE_KEYWORDS.enjoyment.filter(kw => lowerContent.includes(kw)).length;

  const negativeMatches = NEGATIVE_PATTERNS.filter(p => lowerContent.includes(p)).length;
  const negativePenalty = Math.min(negativeMatches * 10, 50);

  const hasBibleReference = /\b(genesis|exodus|matthew|john|acts|romans|psalm|proverbs)\s+\d+:\d+/i.test(content);
  const bibleBoost = hasBibleReference ? 15 : 0;

  const isPrayerRequest = /#prayer(request)?/i.test(content);
  const prayerBoost = isPrayerRequest ? 10 : 0;

  const unityScore = Math.min(100, (unityMatches * 15) + bibleBoost + prayerBoost - negativePenalty);
  const christlikenessScore = Math.min(100, (christlikenessMatches * 10) + bibleBoost + prayerBoost - negativePenalty);
  const debateScore = Math.min(100, (debateMatches * 20) + bibleBoost - (negativePenalty * 0.5));
  const enjoymentScore = Math.min(100, (enjoymentMatches * 12) + bibleBoost + prayerBoost - negativePenalty);

  const totalScore =
    (christlikenessScore * 0.35) +
    (unityScore * 0.30) +
    (enjoymentScore * 0.20) +
    (debateScore * 0.15);

  return { totalScore };
}

export function calculateEngagementScore(microblog: Microblog): number {
  const likes = microblog.likeCount || 0;
  const reposts = microblog.repostCount || 0;
  const comments = microblog.replyCount || 0;

  return (comments * 5) + (reposts * 3) + (likes * 1);
}

export function calculateRecencyScore(createdAt: Date): number {
  const now = new Date().getTime();
  const postTime = new Date(createdAt).getTime();
  const ageInHours = (now - postTime) / (1000 * 60 * 60);

  if (ageInHours <= 2) return 100;
  if (ageInHours <= 6) return 80;
  if (ageInHours <= 12) return 60;
  if (ageInHours <= 24) return 40;
  if (ageInHours <= 48) return 20;
  return 10;
}

export function calculateFeedScore(microblog: Microblog): number {
  const valueScores = calculateChristianValueScores(microblog.content);
  const engagementScore = calculateEngagementScore(microblog);
  const recencyScore = calculateRecencyScore(microblog.createdAt!);

  const baseScore =
    (valueScores.totalScore * 0.40) +
    (Math.min(engagementScore, 100) * 0.30) +
    (recencyScore * 0.20);

  const hasHashtags = /#\w+/.test(microblog.content);
  const diversityBonus = hasHashtags ? 10 : 0;

  return baseScore + diversityBonus;
}

export function sortByFeedScore(microblogs: Microblog[]): Microblog[] {
  return microblogs
    .map(m => ({ ...m, feedScore: calculateFeedScore(m) }))
    .sort((a, b) => b.feedScore - a.feedScore);
}

// ============================================================================
// POST (FORUM) SCORING FUNCTIONS
// ============================================================================

export function calculatePostEngagementScore(post: Post): number {
  const upvotes = post.upvoteCount || 0;
  const downvotes = post.downvoteCount || 0;
  const comments = post.commentCount || 0;

  // Weight comments heavily for forum posts (encourages discussion)
  // Net votes (upvotes - downvotes) with diminishing penalty for downvotes
  const netVotes = upvotes - (downvotes * 0.5);

  return (comments * 10) + (netVotes * 2);
}

export function calculatePostFeedScore(post: Post): number {
  // Combine title and content for scoring
  const fullContent = `${post.title} ${post.content}`;
  const valueScores = calculateChristianValueScores(fullContent);
  const engagementScore = calculatePostEngagementScore(post);
  const recencyScore = calculateRecencyScore(post.createdAt!);

  const baseScore =
    (valueScores.totalScore * 0.40) +
    (Math.min(engagementScore, 100) * 0.30) +
    (recencyScore * 0.20);

  const hasHashtags = /#\w+/.test(fullContent);
  const diversityBonus = hasHashtags ? 10 : 0;

  return baseScore + diversityBonus;
}

export function sortPostsByFeedScore(posts: Post[]): Post[] {
  return posts
    .map(p => ({ ...p, feedScore: calculatePostFeedScore(p) }))
    .sort((a, b) => b.feedScore - a.feedScore);
}
