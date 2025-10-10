import { storage } from "./storage.js";
const WEIGHTS = {
  INTEREST_MATCH: 0.35,
  // How closely content matches user interests
  RECENCY: 0.25,
  // How recent the content is
  POPULARITY: 0.2,
  // How popular/engaged the content is
  AUTHOR_AFFINITY: 0.1,
  // User's history with this author's content
  CONTENT_DIVERSITY: 0.1
  // Prioritize diverse content types
};
async function getRecommendationsForUser(userId, limit = 10) {
  try {
    const userPreferences = await storage.getUserPreferences(userId);
    if (!userPreferences) {
      return getPopularContent(limit);
    }
    const posts = await storage.getAllPosts();
    const microblogs = await storage.getAllMicroblogs();
    const apologeticsTopics = await storage.getAllApologeticsTopics();
    const bibleReadingPlans = await storage.getAllBibleReadingPlans();
    const events = await storage.getAllEvents();
    const communities = await storage.getAllCommunities();
    const prayerRequests = await storage.getPrayerRequestsVisibleToUser(userId);
    const allContent = [
      ...posts.map(postToContentItem),
      ...microblogs.map(microblogToContentItem),
      ...apologeticsTopics.map(apologeticsToContentItem),
      ...bibleReadingPlans.map(bibleReadingPlanToContentItem),
      ...events.map(eventToContentItem),
      ...communities.map(communityToContentItem),
      ...prayerRequests.map(prayerRequestToContentItem)
    ];
    const scoredContent = allContent.map((item) => ({
      ...item,
      score: calculateRecommendationScore(item, userPreferences)
    }));
    return scoredContent.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, limit);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return [];
  }
}
async function getPopularContent(limit) {
  try {
    const posts = await storage.getAllPosts();
    const microblogs = await storage.getAllMicroblogs();
    const apologeticsTopics = await storage.getAllApologeticsTopics();
    const events = await storage.getAllEvents();
    const allContent = [
      ...posts.map(postToContentItem),
      ...microblogs.map(microblogToContentItem),
      ...apologeticsTopics.map(apologeticsToContentItem),
      ...events.map(eventToContentItem)
    ];
    const scoredContent = allContent.map((item) => ({
      ...item,
      score: (item.engagementScore || 0) + (isRecent(item.createdAt) ? 5 : 0)
    }));
    return ensureContentDiversity(
      scoredContent.sort((a, b) => (b.score || 0) - (a.score || 0)),
      limit
    );
  } catch (error) {
    console.error("Error getting popular content:", error);
    return [];
  }
}
function calculateRecommendationScore(item, userPreferences) {
  const interestScore = calculateInterestScore(item, userPreferences.interests) * WEIGHTS.INTEREST_MATCH;
  const recencyScore = calculateRecencyScore(item.createdAt) * WEIGHTS.RECENCY;
  const popularityScore = (item.engagementScore || 0) * WEIGHTS.POPULARITY;
  const authorAffinityScore = calculateAuthorAffinityScore(
    item.author?.id,
    userPreferences.engagementHistory
  ) * WEIGHTS.AUTHOR_AFFINITY;
  const diversityScore = calculateDiversityScore(
    item.type,
    userPreferences.engagementHistory
  ) * WEIGHTS.CONTENT_DIVERSITY;
  return interestScore + recencyScore + popularityScore + authorAffinityScore + diversityScore;
}
function calculateInterestScore(item, userInterests) {
  if (!userInterests || userInterests.length === 0 || !item.tags) {
    return 0.5;
  }
  const contentKeywords = [...item.tags || [], ...item.topics || []];
  let matchCount = 0;
  for (const interest of userInterests) {
    if (contentKeywords.some(
      (keyword) => keyword.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(keyword.toLowerCase())
    )) {
      matchCount++;
    }
  }
  return userInterests.length > 0 ? matchCount / userInterests.length : 0;
}
function calculateRecencyScore(createdAt) {
  if (!createdAt) return 0;
  const now = /* @__PURE__ */ new Date();
  const contentDate = new Date(createdAt);
  const ageInDays = (now.getTime() - contentDate.getTime()) / (1e3 * 60 * 60 * 24);
  if (ageInDays < 1) return 1;
  if (ageInDays < 7) return 0.8;
  if (ageInDays < 30) return 0.5;
  if (ageInDays < 90) return 0.3;
  return 0.1;
}
function calculateAuthorAffinityScore(authorId, engagementHistory) {
  if (!authorId || !engagementHistory || engagementHistory.length === 0) {
    return 0.5;
  }
  const authorInteractions = engagementHistory.filter(
    (item) => item.authorId === authorId
  ).length;
  return Math.min(authorInteractions / 5, 1);
}
function calculateDiversityScore(contentType, engagementHistory) {
  if (!engagementHistory || engagementHistory.length === 0) {
    return 0.5;
  }
  const recentHistory = engagementHistory.slice(0, 20);
  const typeInteractions = recentHistory.filter(
    (item) => item.contentType === contentType
  ).length;
  return 1 - typeInteractions / recentHistory.length;
}
function isRecent(createdAt) {
  if (!createdAt) return false;
  const now = /* @__PURE__ */ new Date();
  const contentDate = new Date(createdAt);
  const ageInDays = (now.getTime() - contentDate.getTime()) / (1e3 * 60 * 60 * 24);
  return ageInDays < 7;
}
function ensureContentDiversity(content, limit) {
  const contentByType = content.reduce((groups, item) => {
    groups[item.type] = groups[item.type] || [];
    groups[item.type].push(item);
    return groups;
  }, {});
  const contentTypes = Object.keys(contentByType);
  const itemsPerType = Math.max(1, Math.floor(limit / contentTypes.length));
  let result = [];
  for (const type of contentTypes) {
    result = result.concat(contentByType[type].slice(0, itemsPerType));
  }
  if (result.length < limit) {
    const remaining = content.filter((item) => !result.includes(item));
    result = result.concat(remaining.slice(0, limit - result.length));
  }
  return result.slice(0, limit);
}
function postToContentItem(post) {
  return {
    id: post.id,
    type: "post",
    title: post.title,
    description: post.content,
    createdAt: post.createdAt,
    author: post.authorId ? { id: post.authorId, username: "" } : void 0,
    engagementScore: (post.upvotes || 0) + (post.commentCount || 0) * 2
  };
}
function microblogToContentItem(microblog) {
  return {
    id: microblog.id,
    type: "microblog",
    title: microblog.content.substring(0, 50) + (microblog.content.length > 50 ? "..." : ""),
    description: microblog.content,
    createdAt: microblog.createdAt,
    author: microblog.authorId ? { id: microblog.authorId, username: "" } : void 0,
    engagementScore: (microblog.likes || 0) + (microblog.replyCount || 0) * 2
  };
}
function apologeticsToContentItem(topic) {
  return {
    id: topic.id,
    type: "apologetics",
    title: topic.name,
    description: topic.description,
    topics: [topic.name],
    createdAt: topic.createdAt,
    engagementScore: 5
    // Base engagement score for apologetics topics
  };
}
function bibleReadingPlanToContentItem(plan) {
  return {
    id: plan.id,
    type: "bible_study",
    title: plan.title,
    description: plan.description,
    createdAt: plan.createdAt,
    author: plan.creatorId ? { id: plan.creatorId, username: "" } : void 0,
    tags: ["bible", "study", "reading plan"]
  };
}
function eventToContentItem(event) {
  return {
    id: event.id,
    type: "event",
    title: event.title,
    description: event.description,
    createdAt: event.createdAt,
    tags: ["event", event.isVirtual ? "virtual" : "in-person"],
    engagementScore: 5
    // Base engagement score for events
  };
}
function communityToContentItem(community) {
  return {
    id: community.id,
    type: "community",
    title: community.name,
    description: community.description,
    createdAt: community.createdAt,
    tags: ["community", community.iconName],
    engagementScore: community.memberCount || 0
  };
}
function prayerRequestToContentItem(prayer) {
  return {
    id: prayer.id,
    type: "prayer_request",
    title: prayer.title,
    description: prayer.content,
    createdAt: prayer.createdAt,
    author: prayer.authorId ? { id: prayer.authorId, username: "" } : void 0,
    tags: ["prayer", prayer.privacyLevel],
    engagementScore: prayer.prayerCount || 0
  };
}
export {
  getRecommendationsForUser
};
