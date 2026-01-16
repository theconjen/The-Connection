import {
  User, InsertUser,
  Community, InsertCommunity,
  CommunityMember, InsertCommunityMember,
  CommunityInvitation, InsertCommunityInvitation,
  CommunityChatRoom, InsertCommunityChatRoom,
  ChatMessage, InsertChatMessage,
  CommunityWallPost, InsertCommunityWallPost,
  Post, InsertPost,
  Comment, InsertComment,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  ApologeticsResource, InsertApologeticsResource,
  ApologeticsAnswererPermission, InsertApologeticsAnswererPermission,
  Livestream, InsertLivestream,
  LivestreamerApplication, InsertLivestreamerApplication,
  ApologistScholarApplication, InsertApologistScholarApplication,
  Microblog, InsertMicroblog,
  MicroblogLike, InsertMicroblogLike,
  MicroblogRepost, InsertMicroblogRepost,
  MicroblogBookmark, InsertMicroblogBookmark,
  PostBookmark, InsertPostBookmark,
  Hashtag, InsertHashtag,
  MicroblogHashtag, InsertMicroblogHashtag,
  PostHashtag, InsertPostHashtag,
  Keyword, InsertKeyword,
  MicroblogKeyword, InsertMicroblogKeyword,
  PostKeyword, InsertPostKeyword,
  UserPreferences, InsertUserPreferences,

  // Apologetics system
  ApologeticsTopic, InsertApologeticsTopic,
  ApologeticsQuestion, InsertApologeticsQuestion,
  ApologeticsAnswer, InsertApologeticsAnswer,
  apologeticsAnswererPermissions,

  // Community Events
  Event, InsertEvent,
  EventRsvp, InsertEventRsvp,

  // Prayer system
  PrayerRequest, InsertPrayerRequest,
  Prayer, InsertPrayer,

  // Bible study tools
  BibleReadingPlan, InsertBibleReadingPlan,
  BibleReadingProgress, InsertBibleReadingProgress,
  BibleStudyNote, InsertBibleStudyNote,

  // Direct messaging
  Message, InsertMessage,

  // Moderation types
  ContentReport, InsertContentReport,
  UserBlock, InsertUserBlock,

  // Database tables
  users, communities, communityMembers, communityInvitations, communityChatRooms, chatMessages, communityWallPosts,
  posts, comments, groups, groupMembers, apologeticsResources,
  livestreams, microblogs, microblogLikes, microblogReposts, microblogBookmarks, postBookmarks,
  hashtags, microblogHashtags, postHashtags,
  keywords, microblogKeywords, postKeywords,
  apologeticsTopics, apologeticsQuestions, apologeticsAnswers,
  events, eventRsvps, prayerRequests, prayers,
  bibleReadingPlans, bibleReadingProgress, bibleStudyNotes,
  livestreamerApplications, apologistScholarApplications,
  userPreferences, messages, userFollows,
  // moderation tables
    contentReports, userBlocks, pushTokens, notifications
} from "@shared/schema";
import { postVotes, commentVotes } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, inArray, like, ilike, isNull } from "drizzle-orm";
import { whereNotDeleted, andNotDeleted } from "./db/helpers";
import { geocodeAddress } from "./geocoding";
import softDelete from './db/softDelete';
import { extractHashtags } from './utils/hashtagExtractor';
import { extractKeywords } from './utils/keywordExtractor';

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function coerceCoordinate(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

// Add this safety utility class at the top of the file, after imports
class StorageSafety {
  private static implementedMethods = new Set([
    'getUser', 'getUserById', 'getUserByUsername', 'getUserByEmail',
    'searchUsers', 'getAllUsers', 'updateUser', 'createUser',
    'updateUserPassword', 'setVerifiedApologeticsAnswerer',
    'getVerifiedApologeticsAnswerers', 'getAllCommunities',
    'searchCommunities', 'getPublicCommunitiesAndUserCommunities',
    'getCommunity', 'getCommunityBySlug', 'createCommunity',
    'updateCommunity', 'deleteCommunity', 'getCommunityMembers',
    'getCommunityMember', 'getUserCommunities', 'addCommunityMember',
    'updateCommunityMemberRole', 'removeCommunityMember', 'isCommunityMember',
    'isCommunityOwner', 'isCommunityModerator', 'createCommunityInvitation',
    'getCommunityInvitations', 'getCommunityInvitationByToken',
    'getCommunityInvitationById', 'updateCommunityInvitationStatus',
    'deleteCommunityInvitation', 'getCommunityInvitationByEmailAndCommunity',
    'getCommunityRooms', 'getPublicCommunityRooms', 'getCommunityRoom',
    'createCommunityRoom', 'updateCommunityRoom', 'deleteCommunityRoom',
    'getChatMessages', 'getChatMessagesAfter', 'createChatMessage',
    'deleteChatMessage', 'getCommunityWallPosts', 'getCommunityWallPost',
    'createCommunityWallPost', 'updateCommunityWallPost', 'deleteCommunityWallPost',
    'getAllPosts', 'getPost', 'getPostsByCommunitySlug', 'getPostsByGroupId',
    'getUserPosts', 'createPost', 'updatePost', 'deletePost', 'upvotePost', 'hasUserLikedPost', 'getComment',
    'getCommentsByPostId', 'createComment', 'upvoteComment', 'getGroup',
    'getGroupsByUserId', 'createGroup', 'addGroupMember', 'getGroupMembers',
    'isGroupAdmin', 'isGroupMember', 'getAllApologeticsResources',
    'getApologeticsResource', 'createApologeticsResource', 'getPublicPrayerRequests',
    'getAllPrayerRequests', 'getPrayerRequest', 'getUserPrayerRequests',
    'getGroupPrayerRequests', 'getPrayerRequestsVisibleToUser', 'createPrayerRequest',
    'updatePrayerRequest', 'markPrayerRequestAsAnswered', 'deletePrayerRequest',
    'createPrayer', 'getPrayersForRequest', 'getUserPrayedRequests', 'getAllApologeticsTopics',
    'getApologeticsTopic', 'getApologeticsTopicBySlug', 'createApologeticsTopic',
    'getAllApologeticsQuestions', 'getApologeticsQuestion', 'getApologeticsQuestionsByTopic',
    'createApologeticsQuestion', 'updateApologeticsQuestionStatus',
    'getApologeticsAnswererPermissions', 'setApologeticsAnswererPermissions',
    'getApologeticsAnswersByQuestion', 'createApologeticsAnswer', 'getAllEvents',
    'getEvent', 'getUserEvents', 'getNearbyEvents', 'createEvent', 'updateEvent', 'deleteEvent',
    'createEventRSVP', 'getEventRSVPs', 'getUserEventRSVP', 'upsertEventRSVP',
    'deleteEventRSVP', 'getAllMicroblogs', 'getMicroblog', 'getUserMicroblogs',
    'createMicroblog', 'updateMicroblog', 'deleteMicroblog', 'likeMicroblog',
    'unlikeMicroblog', 'getUserLikedMicroblogs', 'hasUserLikedMicroblog',
    'hasUserRepostedMicroblog', 'hasUserBookmarkedMicroblog', 'getAllLivestreams',
    'createLivestream', 'getLivestreamerApplicationByUserId',
    'getPendingLivestreamerApplications', 'createLivestreamerApplication',
    'updateLivestreamerApplication', 'isApprovedLivestreamer',
    'getApologistScholarApplicationByUserId', 'getPendingApologistScholarApplications',
    'createApologistScholarApplication', 'updateApologistScholarApplication',
    'getAllLivestreamerApplications', 'getAllApologistScholarApplications',
    'getLivestreamerApplicationStats', 'updateLivestreamerApplicationStatus', 'deleteUser',
    'getAllBibleReadingPlans', 'getBibleReadingPlan', 'createBibleReadingPlan',
    'getBibleReadingProgress', 'createBibleReadingProgress', 'markDayCompleted',
    'getBibleStudyNotes', 'getBibleStudyNote', 'createBibleStudyNote',
    'updateBibleStudyNote', 'deleteBibleStudyNote', 'getDirectMessages', 'createDirectMessage',
    'getUserConversations', 'markMessageAsRead', 'markConversationAsRead', 'getUnreadMessageCount',
    'updateUserPreferences', 'getUserPreferences', 'bookmarkPost', 'unbookmarkPost',
    'getUserBookmarkedPosts', 'hasUserBookmarkedPost', 'togglePostVote', 'toggleCommentVote',
    'createContentReport', 'createUserBlock', 'getBlockedUserIdsFor', 'removeUserBlock'
  ]);

  static isMethodImplemented(methodName: string): boolean {
    return this.implementedMethods.has(methodName);
  }

  static createSafeFallback<T>(methodName: string, fallback: T): T {
    if (!this.isMethodImplemented(methodName)) {
      console.warn(`Method ${methodName} not fully implemented, using fallback`);
    }
    return fallback;
  }
}

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  searchUsers(searchTerm: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User>;
  getVerifiedApologeticsAnswerers(): Promise<User[]>;
  getApologeticsAnswererPermissions(userId: number): Promise<number[]>;
  setApologeticsAnswererPermissions(userId: number, topicIds: number[]): Promise<number[]>;

  // User Follow methods
  getUserFollowers(userId: number): Promise<any[]>;
  getUserFollowing(userId: number): Promise<any[]>;
  getUserFollow(followerId: number, followingId: number): Promise<any | undefined>;
  createUserFollow(follow: { followerId: number; followingId: number }): Promise<any>;
  deleteUserFollow(followerId: number, followingId: number): Promise<boolean>;
  isUserFollowing(followerId: number, followingId: number): Promise<boolean>;

  // Community methods
  getAllCommunities(): Promise<Community[]>;
  searchCommunities(searchTerm: string): Promise<Community[]>;
  getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  updateCommunity(id: number, community: Partial<Community>): Promise<Community>;
  deleteCommunity(id: number): Promise<boolean>;
  
  // Community Invitations
  createCommunityInvitation(invitation: InsertCommunityInvitation): Promise<CommunityInvitation>;
  getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]>;
  getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined>;
  getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined>;
  updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation>;
  deleteCommunityInvitation(id: number): Promise<boolean>;
  getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined>;
  
  // Community Members & Roles
  getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]>;
  getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined>;
  getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]>;
  addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
  updateCommunityMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember>;
  removeCommunityMember(communityId: number, userId: number): Promise<boolean>;
  isCommunityMember(communityId: number, userId: number): Promise<boolean>;
  isCommunityOwner(communityId: number, userId: number): Promise<boolean>;
  isCommunityModerator(communityId: number, userId: number): Promise<boolean>;
  
  // Community Chat Rooms
  getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]>;
  getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]>;
  getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined>;
  createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom>;
  updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom>;
  deleteCommunityRoom(id: number): Promise<boolean>;
  
  // Chat Messages
  getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]>;
  getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: number): Promise<boolean>;
  
  // Community Wall Posts
  getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]>;
  getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined>;
  createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost>;
  updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost>;
  deleteCommunityWallPost(id: number): Promise<boolean>;
  
  // Post methods
  getAllPosts(filter?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]>;
  getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]>;
  getUserPosts(userId: number): Promise<any[]>;
  getFollowingPosts(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, data: Partial<Post>): Promise<Post>;
  deletePost(id: number): Promise<boolean>;
  upvotePost(id: number): Promise<Post>;
  searchPosts(searchTerm: string): Promise<Post[]>;
  hasUserLikedPost(postId: number, userId: number): Promise<boolean>;

  // Comment methods
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  upvoteComment(id: number): Promise<Comment>;
  
  // Group methods
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByUserId(userId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Group member methods
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  isGroupAdmin(groupId: number, userId: number): Promise<boolean>;
  isGroupMember(groupId: number, userId: number): Promise<boolean>;
  
  // Apologetics resource methods
  getAllApologeticsResources(): Promise<ApologeticsResource[]>;
  getApologeticsResource(id: number): Promise<ApologeticsResource | undefined>;
  createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource>;
  
  // Prayer Request methods
  getPublicPrayerRequests(): Promise<PrayerRequest[]>;
  getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]>;
  getPrayerRequest(id: number): Promise<PrayerRequest | undefined>;
  getUserPrayerRequests(userId: number): Promise<PrayerRequest[]>;
  getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]>;
  getCommunityPrayerRequests(communityId: number): Promise<PrayerRequest[]>;
  getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]>;
  createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest>;
  markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest>;
  deletePrayerRequest(id: number): Promise<boolean>;
  searchPrayerRequests(searchTerm: string): Promise<PrayerRequest[]>;
  
  // Prayer methods
  createPrayer(prayer: InsertPrayer): Promise<Prayer>;
  getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]>;
  getUserPrayedRequests(userId: number): Promise<number[]>;
  
  // Apologetics Q&A methods
  getAllApologeticsTopics(): Promise<ApologeticsTopic[]>;
  getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined>;
  getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined>;
  createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic>;
  
  getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]>;
  getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined>;
  getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]>;
  createApologeticsQuestion(question: InsertApologeticsQuestion): Promise<ApologeticsQuestion>;
  updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion>;
  searchApologeticsQuestions(searchTerm: string): Promise<ApologeticsQuestion[]>;
  
  getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]>;
  createApologeticsAnswer(answer: InsertApologeticsAnswer): Promise<ApologeticsAnswer>;
  upvoteApologeticsAnswer(id: number): Promise<ApologeticsAnswer>;
  incrementApologeticsQuestionViews(id: number): Promise<void>;

  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getUserEvents(userId: number): Promise<Event[]>;
  getNearbyEvents(latitude: number, longitude: number, radius: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event>;
  deleteEvent(id: number): Promise<boolean>;
  searchEvents(searchTerm: string): Promise<Event[]>;
  
  // Event RSVP methods
  createEventRSVP(rsvp: InsertEventRsvp): Promise<EventRsvp>;
  getEventRSVPs(eventId: number): Promise<EventRsvp[]>;
  getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined>;
  upsertEventRSVP(eventId: number, userId: number, status: string): Promise<EventRsvp>;
  deleteEventRSVP(id: number): Promise<boolean>;
  
  // Microblog methods
  getAllMicroblogs(): Promise<Microblog[]>;
  getMicroblog(id: number): Promise<Microblog | undefined>;
  getUserMicroblogs(userId: number): Promise<Microblog[]>;
  getFollowingMicroblogs(userId: number): Promise<Microblog[]>;
  createMicroblog(microblog: InsertMicroblog): Promise<Microblog>;
  updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog>;
  deleteMicroblog(id: number): Promise<boolean>;
  searchMicroblogs(searchTerm: string): Promise<Microblog[]>;
  
  // Microblog like methods
  likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike>;
  unlikeMicroblog(microblogId: number, userId: number): Promise<boolean>;
  getUserLikedMicroblogs(userId: number): Promise<Microblog[]>;

  // Microblog repost methods
  repostMicroblog(microblogId: number, userId: number): Promise<MicroblogRepost>;
  unrepostMicroblog(microblogId: number, userId: number): Promise<boolean>;

  // Microblog bookmark methods
  bookmarkMicroblog(microblogId: number, userId: number): Promise<MicroblogBookmark>;
  unbookmarkMicroblog(microblogId: number, userId: number): Promise<boolean>;
  getUserBookmarkedMicroblogs(userId: number): Promise<Microblog[]>;

  // Microblog engagement check methods
  hasUserLikedMicroblog(microblogId: number, userId: number): Promise<boolean>;
  hasUserRepostedMicroblog(microblogId: number, userId: number): Promise<boolean>;
  hasUserBookmarkedMicroblog(microblogId: number, userId: number): Promise<boolean>;

  // Post bookmark methods
  bookmarkPost(postId: number, userId: number): Promise<PostBookmark>;
  unbookmarkPost(postId: number, userId: number): Promise<boolean>;
  getUserBookmarkedPosts(userId: number): Promise<Post[]>;
  hasUserBookmarkedPost(postId: number, userId: number): Promise<boolean>;

  // Hashtag methods
  getOrCreateHashtag(tag: string, displayTag: string): Promise<Hashtag>;
  linkHashtagToMicroblog(microblogId: number, hashtagId: number): Promise<void>;
  linkHashtagToPost(postId: number, hashtagId: number): Promise<void>;
  getTrendingHashtags(limit?: number): Promise<Hashtag[]>;
  getMicroblogsByHashtag(hashtagTag: string, limit?: number): Promise<Microblog[]>;
  getPostsByHashtag(hashtagTag: string, limit?: number): Promise<any[]>;
  processMicroblogHashtags(microblogId: number, content: string): Promise<void>;
  processPostHashtags(postId: number, title: string, content: string): Promise<void>;

  // Keyword methods
  getOrCreateKeyword(keyword: string, displayKeyword: string): Promise<any>;
  linkKeywordToMicroblog(microblogId: number, keywordId: number, frequency: number): Promise<void>;
  linkKeywordToPost(postId: number, keywordId: number, frequency: number): Promise<void>;
  getTrendingKeywords(limit?: number): Promise<any[]>;
  getMicroblogsByKeyword(keyword: string, limit?: number): Promise<Microblog[]>;
  getPostsByKeyword(keyword: string, limit?: number): Promise<any[]>;
  processMicroblogKeywords(microblogId: number, content: string): Promise<void>;
  processPostKeywords(postId: number, title: string, content: string): Promise<void>;
  updateTrendingScores(): Promise<void>;
  updateKeywordTrendingScores(): Promise<void>;

  // Livestream methods
  getAllLivestreams(): Promise<Livestream[]>;
  createLivestream(livestream: InsertLivestream): Promise<Livestream>;
  
  // Livestreamer application methods
  getLivestreamerApplicationByUserId(userId: number): Promise<LivestreamerApplication | undefined>;
  getPendingLivestreamerApplications(): Promise<LivestreamerApplication[]>;
  createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication>;
  updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication>;
  isApprovedLivestreamer(userId: number): Promise<boolean>;
  
  // Apologist Scholar application methods
  getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined>;
  getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]>;
  createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication>;
  updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication>;
  
  // Admin methods
  getAllLivestreamerApplications(): Promise<LivestreamerApplication[]>;
  getAllApologistScholarApplications(): Promise<ApologistScholarApplication[]>;
  getLivestreamerApplicationStats(): Promise<any>;
  updateLivestreamerApplicationStatus(id: number, status: string, reviewNotes?: string): Promise<LivestreamerApplication>;
  deleteUser(userId: number): Promise<boolean>;
  
  // Bible Reading Plan methods
  getAllBibleReadingPlans(): Promise<BibleReadingPlan[]>;
  getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined>;
  createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan>;
  
  // Bible Reading Progress methods
  getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined>;
  createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress>;
  markDayCompleted(progressId: number, day: string): Promise<BibleReadingProgress>;
  
  // Bible Study Note methods
  getBibleStudyNotes(userId: number): Promise<BibleStudyNote[]>;
  getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined>;
  createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote>;
  updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote>;
  deleteBibleStudyNote(id: number): Promise<boolean>;
  
  // Direct Messaging methods
  getDirectMessages(userId1: number, userId2: number): Promise<any[]>;
  createDirectMessage(message: any): Promise<any>;
  getUserConversations(userId: number): Promise<any[]>;
  markMessageAsRead(messageId: string, userId: number): Promise<boolean>;
  markConversationAsRead(userId: number, otherUserId: number): Promise<number>;
  getUnreadMessageCount(userId: number): Promise<number>;
  // Push notification methods
  savePushToken(token: { userId: number; token: string; platform?: string; lastUsed?: Date }): Promise<any>;
  getUserPushTokens(userId: number): Promise<any[]>;
  deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'>;
  // Notifications
  getUserNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(id: number, userId: number): Promise<boolean>;
  createNotification(notification: { userId: number; title: string; body: string; data?: any; category?: string }): Promise<any>;
  // Moderation methods
  createContentReport(report: InsertContentReport): Promise<ContentReport>;
  createUserBlock(block: InsertUserBlock): Promise<UserBlock>;
  getBlockedUserIdsFor(blockerId: number): Promise<number[]>;
  // Remove a user block (unblock)
  removeUserBlock(blockerId: number, blockedId: number): Promise<boolean>;
  // Voting helpers
  togglePostVote(postId: number, userId: number, voteType?: 'upvote' | 'downvote'): Promise<{ voted: boolean; post?: Post }>;
  toggleCommentVote(commentId: number, userId: number, voteType?: 'upvote' | 'downvote'): Promise<{ voted: boolean; comment?: Comment }>;
  // Email verification helper
  getUserByEmailVerificationToken(token: string): Promise<User | undefined>;
  // Admin moderation helpers
  getReports?(filter?: { status?: string; limit?: number }): Promise<ContentReport[]>;
  getReportById?(id: number): Promise<ContentReport | undefined>;
  updateReport?(id: number, update: Partial<ContentReport> & { status?: string; moderatorNotes?: string | null; moderatorId?: number | null; resolvedAt?: Date | null }): Promise<ContentReport>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private data = {
    users: [] as User[],
    communities: [
      {
        id: 1,
        name: "Prayer Requests",
        description: "Share your prayer requests and pray for others in the community.",
        slug: "prayer-requests",
        iconName: "pray",
        iconColor: "primary",
        interestTags: JSON.stringify(["prayer", "support", "community"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: new Date(),
        deletedAt: null
      },
      {
        id: 2,
        name: "Bible Study",
        description: "Discuss and study the Bible together with fellow believers.",
        slug: "bible-study",
        iconName: "book",
        iconColor: "secondary",
        interestTags: JSON.stringify(["bible", "study", "scripture"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: new Date(),
        deletedAt: null
      },
      {
        id: 3,
        name: "Christian Apologetics",
        description: "Discuss and learn about defending the Christian faith.",
        slug: "apologetics",
        iconName: "shield",
        iconColor: "accent",
        interestTags: JSON.stringify(["apologetics", "defense", "faith"]),
        city: null,
        state: null,
        isLocalCommunity: false,
        latitude: null,
        longitude: null,
        memberCount: 1,
        createdBy: 1,
        isPrivate: false,
        hasPrivateWall: true,
        hasPublicWall: true,
        createdAt: new Date(),
        deletedAt: null
      }
    ] as Community[],
    communityMembers: [] as CommunityMember[],
    communityInvitations: [] as CommunityInvitation[],
    communityChatRooms: [] as CommunityChatRoom[],
    chatMessages: [] as ChatMessage[],
    communityWallPosts: [] as CommunityWallPost[],
    posts: [] as Post[],
    comments: [] as Comment[],
    groups: [] as Group[],
    groupMembers: [] as GroupMember[],
    apologeticsResources: [] as ApologeticsResource[],
    livestreams: [] as Livestream[],
    prayerRequests: [] as PrayerRequest[],
    prayers: [] as Prayer[],
    apologeticsTopics: [] as ApologeticsTopic[],
    apologeticsQuestions: [] as ApologeticsQuestion[],
    apologeticsAnswers: [] as ApologeticsAnswer[],
    events: [] as Event[],
    eventRsvps: [] as EventRsvp[],
    microblogs: [] as Microblog[],
    microblogLikes: [] as MicroblogLike[],
    microblogReposts: [] as MicroblogRepost[],
    microblogBookmarks: [] as MicroblogBookmark[],
    livestreamerApplications: [] as LivestreamerApplication[],
    apologistScholarApplications: [] as ApologistScholarApplication[],
    apologeticsAnswererPermissions: [] as ApologeticsAnswererPermission[],
    bibleReadingPlans: [] as BibleReadingPlan[],
    bibleReadingProgress: [] as BibleReadingProgress[],
    bibleStudyNotes: [] as BibleStudyNote[],
    userPreferences: [] as UserPreferences[],
    messages: [] as Message[],
    // Moderation in-memory stores
    contentReports: [] as any[],
    userBlocks: [] as any[],
  };
  
  private nextId = 1;
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.data.users.find(u => u.id === id);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.data.users.find(u => u.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find(u => u.email === email);
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    const term = searchTerm.toLowerCase();
    return this.data.users.filter(u => 
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.displayName?.toLowerCase().includes(term)
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return this.data.users.filter(u => !u.deletedAt).map(u => ({ ...u }));
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...userData };
    return this.data.users[userIndex];
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    let userPref = this.data.userPreferences.find(p => p.userId === userId);
    
    if (!userPref) {
      userPref = {
        id: this.nextId++,
        userId,
        interests: null,
        favoriteTopics: null,
        engagementHistory: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.data.userPreferences.push(userPref);
    }
    
    Object.assign(userPref, preferences, { updatedAt: new Date() });
    return userPref;
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    return this.data.userPreferences.find(p => p.userId === userId);
  }

  // Push token methods (in-memory)
  async savePushToken(token: any): Promise<any> {
    const existing = this.data.messages.find ? null : null; // no-op to keep TS happy
    const found = this.data.posts.find ? null : null;
    // Simple behavior: avoid duplicate by token
    const existingIdx = (this.data as any).pushTokens?.findIndex((p: any) => p.token === token.token) ?? -1;
    if (existingIdx !== -1) {
      (this.data as any).pushTokens[existingIdx] = { ...((this.data as any).pushTokens[existingIdx]), ...token, lastUsed: new Date() };
      return (this.data as any).pushTokens[existingIdx];
    }
    if (!(this.data as any).pushTokens) (this.data as any).pushTokens = [];
    const obj = { id: this.nextId++, ...token };
    (this.data as any).pushTokens.push(obj);
    return obj;
  }

  async getUserPushTokens(userId: number): Promise<any[]> {
    return ((this.data as any).pushTokens || []).filter((p: any) => p.userId === userId);
  }

  async deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'> {
    const arr = (this.data as any).pushTokens || [];
    const idx = arr.findIndex((p: any) => p.token === token);
    if (idx === -1) return 'notfound';
    if (arr[idx].userId !== userId) return 'forbidden';
    arr.splice(idx, 1);
    return 'deleted';
  }

  // Notifications (in-memory)
  async getUserNotifications(userId: number): Promise<any[]> {
    return ((this.data as any).notifications || []).filter((n: any) => n.userId === userId);
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const arr = (this.data as any).notifications || [];
    const n = arr.find((x: any) => x.id === id);
    if (!n) return false;
    if (n.userId !== userId) return false;
    n.isRead = true;
    return true;
  }
  
  async createUser(user: any): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      username: user.username,
      email: user.email,
      password: user.password,
      displayName: user.displayName || user.username,
      bio: user.bio || null,
      avatarUrl: user.avatarUrl || null,
      city: user.city || null,
      state: user.state || null,
      zipCode: user.zipCode || null,
        latitude: user.latitude || null,
        longitude: user.longitude || null,
      onboardingCompleted: user.onboardingCompleted || false,
      isVerifiedApologeticsAnswerer: false,
      isAdmin: user.isAdmin || false,
      loginAttempts: 0,
      lockoutUntil: null,
  profileVisibility: user.profileVisibility || 'public',
  showLocation: typeof user.showLocation === 'boolean' ? user.showLocation : true,
  showInterests: typeof user.showInterests === 'boolean' ? user.showInterests : true,
  notifyDms: typeof user.notifyDms === 'boolean' ? user.notifyDms : true,
  notifyCommunities: typeof user.notifyCommunities === 'boolean' ? user.notifyCommunities : true,
  notifyForums: typeof user.notifyForums === 'boolean' ? user.notifyForums : true,
  notifyFeed: typeof user.notifyFeed === 'boolean' ? user.notifyFeed : true,
  dmPrivacy: user.dmPrivacy || 'everyone',
  emailVerified: typeof user.emailVerified === 'boolean' ? user.emailVerified : false,
  smsVerified: typeof user.smsVerified === 'boolean' ? user.smsVerified : false,
  phoneNumber: user.phoneNumber || null,
  emailVerificationToken: user.emailVerificationToken || null,
  emailVerificationTokenHash: (user as any).emailVerificationTokenHash || null,
  emailVerificationExpiresAt: (user as any).emailVerificationExpiresAt || null,
  emailVerificationLastSentAt: (user as any).emailVerificationLastSentAt || null,
  emailVerifiedAt: (user as any).emailVerifiedAt || null,
  smsVerificationCode: user.smsVerificationCode || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    this.data.users.push(newUser);
    return newUser;
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.password = hashedPassword;
      return user;
    }
    return undefined;
  }
  
  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User> {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    
    user.isVerifiedApologeticsAnswerer = isVerified;
    return user;
  }
  
  async getVerifiedApologeticsAnswerers(): Promise<User[]> {
    return this.data.users.filter(u => u.isVerifiedApologeticsAnswerer && !u.deletedAt);
  }

  async getApologeticsAnswererPermissions(userId: number): Promise<number[]> {
    return this.data.apologeticsAnswererPermissions
      .filter(p => p.userId === userId)
      .map(p => p.topicId);
  }

  async setApologeticsAnswererPermissions(userId: number, topicIds: number[]): Promise<number[]> {
    const uniqueTopicIds = Array.from(new Set(topicIds.filter(id => Number.isFinite(id))));
    this.data.apologeticsAnswererPermissions = this.data.apologeticsAnswererPermissions.filter(p => p.userId !== userId);

    const now = new Date();
    const newPermissions: ApologeticsAnswererPermission[] = uniqueTopicIds.map(topicId => ({
      id: this.nextId++,
      userId,
      topicId,
      createdAt: now,
    }));

    this.data.apologeticsAnswererPermissions.push(...newPermissions);
    return uniqueTopicIds;
  }

  // Community methods
  async getAllCommunities(): Promise<Community[]> {
    return this.data.communities.filter(c => !c.deletedAt).map(c => ({ ...c }));
  }
  
  async searchCommunities(searchTerm: string): Promise<Community[]> {
    const term = searchTerm.toLowerCase();
    return this.data.communities.filter(c => 
      c.name.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term)
    );
  }
  
  async getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]> {
    let communities = this.data.communities.filter(c => !c.isPrivate && !c.deletedAt);
    
    if (userId) {
      const userCommunities = this.data.communityMembers
        .filter(m => m.userId === userId)
        .map(m => this.data.communities.find(c => c.id === m.communityId))
        .filter(Boolean) as Community[];
      
      // Merge and deduplicate
      const communityMap = new Map();
      [...communities, ...userCommunities].forEach(c => communityMap.set(c.id, c));
      communities = Array.from(communityMap.values());
    }
    
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      communities = communities.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    }
    
    return communities;
  }
  
  async getCommunity(id: number): Promise<Community | undefined> {
    return this.data.communities.find(c => c.id === id && !c.deletedAt);
  }
  
  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    return this.data.communities.find(c => c.slug === slug && !c.deletedAt);
  }
  
  async createCommunity(community: any): Promise<Community> {
    const newCommunity: Community = {
      id: this.nextId++,
      name: community.name,
      description: community.description,
      slug: community.slug,
      iconName: community.iconName,
      iconColor: community.iconColor,
      interestTags: community.interestTags || [],
      city: community.city || null,
      state: community.state || null,
      isLocalCommunity: community.isLocalCommunity || false,
      latitude: community.latitude || null,
      longitude: community.longitude || null,
      memberCount: 0,
      isPrivate: community.isPrivate || false,
      hasPrivateWall: community.hasPrivateWall || false,
      hasPublicWall: community.hasPublicWall || true,
      createdAt: new Date(),
      deletedAt: null,
      createdBy: community.createdBy
    };
    this.data.communities.push(newCommunity);
    return newCommunity;
  }
  
  async updateCommunity(id: number, community: Partial<Community>): Promise<Community> {
    const index = this.data.communities.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Community not found');
    
    this.data.communities[index] = { ...this.data.communities[index], ...community };
    return this.data.communities[index];
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    const comm = this.data.communities.find(c => c.id === id);
    if (!comm) return false;
    (comm as any).deletedAt = new Date();
    return true;
  }
  
  // Community invitation methods
  async createCommunityInvitation(invitation: any): Promise<CommunityInvitation> {
    const newInvitation: CommunityInvitation = {
      id: this.nextId++,
      communityId: invitation.communityId,
      inviterUserId: invitation.inviterUserId,
      inviteeEmail: invitation.inviteeEmail,
      inviteeUserId: invitation.inviteeUserId || null,
      status: invitation.status || "pending",
      token: invitation.token,
      createdAt: new Date(),
      expiresAt: invitation.expiresAt
    };
    this.data.communityInvitations.push(newInvitation);
    return newInvitation;
  }
  
  async getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]> {
    return this.data.communityInvitations
      .filter(i => i.communityId === communityId)
      .map(i => ({
        ...i,
        inviter: this.data.users.find(u => u.id === i.inviterUserId)!
      }));
  }
  
  async getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.token === token);
  }
  
  async getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.id === id);
  }
  
  async updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation> {
    const invitation = this.data.communityInvitations.find(i => i.id === id);
    if (!invitation) throw new Error('Invitation not found');
    
    invitation.status = status;
    return invitation;
  }
  
  async deleteCommunityInvitation(id: number): Promise<boolean> {
    const index = this.data.communityInvitations.findIndex(i => i.id === id);
    if (index === -1) return false;
    
    this.data.communityInvitations.splice(index, 1);
    return true;
  }
  
  async getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined> {
    return this.data.communityInvitations.find(i => i.inviteeEmail === email && i.communityId === communityId);
  }
  
  // Community member methods
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    return this.data.communityMembers
      .filter(m => m.communityId === communityId)
      .map(m => ({
        ...m,
        user: this.data.users.find(u => u.id === m.userId)!
      }));
  }
  
  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    return this.data.communityMembers.find(m => m.communityId === communityId && m.userId === userId);
  }
  
  async getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]> {
    const userMemberships = this.data.communityMembers.filter(m => m.userId === userId);
    return userMemberships.map(m => {
      const community = this.data.communities.find(c => c.id === m.communityId)!;
      const memberCount = this.data.communityMembers.filter(mem => mem.communityId === community.id).length;
      return { ...community, memberCount };
    });
  }
  
  async addCommunityMember(member: any): Promise<CommunityMember> {
    const newMember: CommunityMember = {
      id: this.nextId++,
      communityId: member.communityId,
      userId: member.userId,
      role: member.role || "member",
      joinedAt: new Date()
    };
    this.data.communityMembers.push(newMember);

    // Update member count
    const community = this.data.communities.find(c => c.id === member.communityId);
    if (community) {
      community.memberCount = (community.memberCount || 0) + 1;
    }

    return newMember;
  }
  
  async updateCommunityMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember> {
    const member = this.data.communityMembers.find(m => m.communityId === communityId && m.userId === userId);
    if (!member) throw new Error('Member not found');

    member.role = role;
    return member;
  }
  
  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const index = this.data.communityMembers.findIndex(m => m.communityId === communityId && m.userId === userId);
    if (index === -1) return false;
    
    this.data.communityMembers.splice(index, 1);
    
    // Update member count
    const community = this.data.communities.find(c => c.id === communityId);
    if (community && community.memberCount > 0) {
      community.memberCount--;
    }
    
    return true;
  }
  
  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    return this.data.communityMembers.some(m => m.communityId === communityId && m.userId === userId);
  }
  
  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === 'owner';
  }
  
  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    const member = await this.getCommunityMember(communityId, userId);
    return member?.role === 'moderator' || member?.role === 'owner';
  }
  
  // Community chat room methods
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return this.data.communityChatRooms.filter(r => r.communityId === communityId);
  }
  
  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return this.data.communityChatRooms.filter(r => r.communityId === communityId && !r.isPrivate);
  }
  
  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    return this.data.communityChatRooms.find(r => r.id === id);
  }
  
  async createCommunityRoom(room: any): Promise<CommunityChatRoom> {
    const newRoom: CommunityChatRoom = {
      id: this.nextId++,
      communityId: room.communityId,
      name: room.name,
      description: room.description || null,
      isPrivate: room.isPrivate || false,
      createdAt: new Date(),
      createdBy: room.createdBy
    };
    this.data.communityChatRooms.push(newRoom);
    return newRoom;
  }
  
  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    const room = this.data.communityChatRooms.find(r => r.id === id);
    if (!room) throw new Error('Room not found');
    
    Object.assign(room, data);
    return room;
  }
  
  async deleteCommunityRoom(id: number): Promise<boolean> {
    const index = this.data.communityChatRooms.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.data.communityChatRooms.splice(index, 1);
    return true;
  }
  
  // Chat message methods
  async getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]> {
    const messages = this.data.chatMessages
      .filter(m => m.chatRoomId === roomId)
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .map(m => ({
        ...m,
        sender: this.data.users.find(u => u.id === m.senderId)!
      }));
    
    return limit ? messages.slice(-limit) : messages;
  }
  
  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    const afterMessage = this.data.chatMessages.find(m => m.id === afterId);
    if (!afterMessage) return [];
    
    return this.data.chatMessages
      .filter(m => m.chatRoomId === roomId && new Date(m.createdAt!).getTime() > new Date(afterMessage.createdAt!).getTime())
      .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime())
      .map(m => ({
        ...m,
        sender: this.data.users.find(u => u.id === m.senderId)!
      }));
  }
  
  async createChatMessage(message: any): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: this.nextId++,
      content: message.content,
      chatRoomId: message.chatRoomId,
      senderId: message.senderId,
      isSystemMessage: message.isSystemMessage || false,
      createdAt: new Date()
    };
    this.data.chatMessages.push(newMessage);
    return newMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    const index = this.data.chatMessages.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.data.chatMessages.splice(index, 1);
    return true;
  }
  
  // Community wall post methods
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    const posts = this.data.communityWallPosts
      .filter(p => p.communityId === communityId && (isPrivate === undefined || p.isPrivate === isPrivate))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .map(p => ({
        ...p,
        author: this.data.users.find(u => u.id === p.authorId)!
      }));
    
    return posts;
  }
  
  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) return undefined;
    
    return {
      ...post,
      author: this.data.users.find(u => u.id === post.authorId)!
    };
  }
  
  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    const newPost: CommunityWallPost = {
      id: this.nextId++,
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      ...post,
    };
    this.data.communityWallPosts.push(newPost);
    return newPost;
  }
  
  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');
    
    Object.assign(post, data);
    return post;
  }
  
  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const post = this.data.communityWallPosts.find(p => p.id === id);
    if (!post) return false;
    (post as any).deletedAt = new Date();
    return true;
  }
  
  // Post methods
  async getAllPosts(filter?: string): Promise<Post[]> {
    let posts = this.data.posts.filter(p => !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.data.posts.find(p => p.id === id && !p.deletedAt);
  }
  
  async getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]> {
    // For in-memory storage, we'll need to find the community first
    const community = this.data.communities.find(c => c.slug === communitySlug);
    if (!community) return [];
    
  let posts = this.data.posts.filter(p => p.communityId === community.id && !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]> {
  let posts = this.data.posts.filter(p => p.groupId === groupId && !p.deletedAt);
    
    if (filter === 'top') {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (filter === 'hot') {
      posts.sort((a, b) => {
        const aScore = (a.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt!).getTime()) / (1000 * 60 * 60)));
        const bScore = (b.upvotes || 0) / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt!).getTime()) / (1000 * 60 * 60)));
        return bScore - aScore;
      });
    } else {
      posts.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    
    return posts;
  }
  
  async getUserPosts(userId: number): Promise<any[]> {
  const posts = this.data.posts.filter(p => p.authorId === userId && !p.deletedAt);
    const microblogs = this.data.microblogs.filter(m => m.authorId === userId);
    const wallPosts = this.data.communityWallPosts.filter(p => p.authorId === userId);

    return [
      ...posts.map(p => ({ ...p, type: 'post' })),
      ...microblogs.map(m => ({ ...m, type: 'microblog' })),
      ...wallPosts.map(p => ({ ...p, type: 'wall_post' }))
    ].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getFollowingPosts(_userId: number): Promise<Post[]> {
    // In-memory stub - not implemented
    return [];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost: Post = {
      id: this.nextId++,
      upvotes: 0,
      commentCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      ...post,
    };
    this.data.posts.push(newPost);
    return newPost;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const post = this.data.posts.find(p => p.id === id && !p.deletedAt);
    if (!post) {
      throw new Error('Post not found');
    }
    Object.assign(post, data, { updatedAt: new Date() });
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    const post = this.data.posts.find(p => p.id === id && !p.deletedAt);
    if (!post) {
      return false;
    }
    post.deletedAt = new Date();
    return true;
  }
  
  async upvotePost(id: number): Promise<Post> {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) throw new Error('Post not found');

    post.upvotes = (post.upvotes || 0) + 1;
    return post;
  }

  async searchPosts(searchTerm: string): Promise<Post[]> {
    const term = searchTerm.toLowerCase();
    return this.data.posts.filter(p =>
      !p.deletedAt && (
        p.title.toLowerCase().includes(term) ||
        p.content?.toLowerCase().includes(term)
      )
    );
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.data.comments.find(c => c.id === id);
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.data.comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: this.nextId++,
      upvotes: 0,
      createdAt: new Date(),
      ...comment,
    };
    this.data.comments.push(newComment);
    
    // Update post comment count
    const post = this.data.posts.find(p => p.id === newComment.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }
    
    return newComment;
  }
  
  async upvoteComment(id: number): Promise<Comment> {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) throw new Error('Comment not found');
    
    comment.upvotes = (comment.upvotes || 0) + 1;
    return comment;
  }
  
  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.data.groups.find(g => g.id === id);
  }
  
  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroups = this.data.groupMembers.filter(m => m.userId === userId);
    return userGroups.map(m => this.data.groups.find(g => g.id === m.groupId)!);
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const newGroup: Group = {
      id: this.nextId++,
      createdAt: new Date(),
      ...group,
    };
    this.data.groups.push(newGroup);
    return newGroup;
  }
  
  // Group member methods
  async addGroupMember(member: any): Promise<GroupMember> {
    const newMember: GroupMember = {
      id: this.nextId++,
      groupId: member.groupId,
      userId: member.userId,
      isAdmin: member.isAdmin || false,
      joinedAt: new Date()
    };
    this.data.groupMembers.push(newMember);
    return newMember;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return this.data.groupMembers.filter(m => m.groupId === groupId);
  }
  
  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = this.data.groupMembers.find(m => m.groupId === groupId && m.userId === userId);
    return member?.isAdmin === true;
  }
  
  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    return this.data.groupMembers.some(m => m.groupId === groupId && m.userId === userId);
  }
  
  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return [...this.data.apologeticsResources];
  }
  
  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    return this.data.apologeticsResources.find(r => r.id === id);
  }
  
  async createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const newResource: ApologeticsResource = {
      id: this.nextId++,
      createdAt: new Date(),
      ...resource,
    };
    this.data.apologeticsResources.push(newResource);
    return newResource;
  }
  
  // Prayer request methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.privacyLevel === 'public')
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]> {
    let requests = [...this.data.prayerRequests];
    
    if (filter === 'answered') {
      requests = requests.filter(p => p.isAnswered);
    } else if (filter === 'unanswered') {
      requests = requests.filter(p => !p.isAnswered);
    }
    
    // Add description field from title for compatibility
    return requests.map(p => ({ ...p, description: p.title }));
  }
  
  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    return request ? { ...request, description: request.title } as PrayerRequest & { description: string } : undefined;
  }
  
  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.authorId === userId)
      .map(p => ({ ...p, description: p.title }));
  }
  
  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.groupId === groupId)
      .map(p => ({ ...p, description: p.title }));
  }

  async getCommunityPrayerRequests(communityId: number): Promise<PrayerRequest[]> {
    return this.data.prayerRequests
      .filter(p => p.communityId === communityId)
      .map(p => ({ ...p, description: p.title }));
  }

  async getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]> {
    // Get user's groups
    const userGroups = this.data.groupMembers
      .filter(gm => gm.userId === userId)
      .map(gm => gm.groupId);
    
    return this.data.prayerRequests
      .filter(p => {
        // Public prayer requests
        if (p.privacyLevel === 'public') return true;
        // Prayer requests from groups the user is in
        if (p.privacyLevel === 'group-only' && p.groupId && userGroups.includes(p.groupId)) return true;
        // User's own prayer requests
        if (p.authorId === userId) return true;
        return false;
      })
      .map(p => ({ ...p, description: p.title }));
  }
  
  async createPrayerRequest(prayer: any): Promise<PrayerRequest> {
    const newPrayer: PrayerRequest = {
      id: this.nextId++,
      title: prayer.title,
      content: prayer.content,
      isAnonymous: prayer.isAnonymous,
      privacyLevel: prayer.privacyLevel,
      groupId: prayer.groupId,
      authorId: prayer.authorId,
      prayerCount: 0,
      isAnswered: false,
      answeredDescription: null,
      createdAt: new Date(),
      updatedAt: null
    };
    this.data.prayerRequests.push(newPrayer);
    return newPrayer;
  }
  
  async updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    if (!request) throw new Error('Prayer request not found');
    
    Object.assign(request, prayer, { updatedAt: new Date() });
    return request;
  }
  
  async markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest> {
    const request = this.data.prayerRequests.find(p => p.id === id);
    if (!request) throw new Error('Prayer request not found');
    
    request.isAnswered = true;
    request.answeredDescription = description;
    request.updatedAt = new Date();
    
    return request;
  }
  
  async deletePrayerRequest(id: number): Promise<boolean> {
    const index = this.data.prayerRequests.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.data.prayerRequests.splice(index, 1);
    return true;
  }

  async searchPrayerRequests(searchTerm: string): Promise<PrayerRequest[]> {
    const term = searchTerm.toLowerCase();
    return this.data.prayerRequests.filter(pr =>
      pr.title?.toLowerCase().includes(term) ||
      pr.description?.toLowerCase().includes(term)
    );
  }

  // Prayer methods
  async createPrayer(prayer: any): Promise<Prayer> {
    const newPrayer: Prayer = {
      id: this.nextId++,
      userId: prayer.userId,
      prayerRequestId: prayer.prayerRequestId,
      createdAt: new Date()
    };
    this.data.prayers.push(newPrayer);

    // Increment prayer count on the request
    const request = this.data.prayerRequests.find(p => p.id === prayer.prayerRequestId);
    if (request) {
      request.prayerCount = (request.prayerCount || 0) + 1;
    }

    return newPrayer;
  }
  
  async getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]> {
    return this.data.prayers.filter(p => p.prayerRequestId === prayerRequestId);
  }
  
  async getUserPrayedRequests(userId: number): Promise<number[]> {
    const userPrayers = this.data.prayers.filter(p => p.userId === userId);
    return Array.from(new Set(userPrayers.map(p => p.prayerRequestId)));
  }
  
  // Apologetics Q&A methods
  async getAllApologeticsTopics(): Promise<ApologeticsTopic[]> {
    return [...this.data.apologeticsTopics];
  }
  
  async getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined> {
    return this.data.apologeticsTopics.find(t => t.id === id);
  }
  
  async getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined> {
    return this.data.apologeticsTopics.find(t => t.slug === slug);
  }
  
  async createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic> {
    const newTopic: ApologeticsTopic = {
      id: this.nextId++,
      createdAt: new Date(),
      ...topic,
    };
    this.data.apologeticsTopics.push(newTopic);
    return newTopic;
  }
  
  async getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]> {
    let questions = [...this.data.apologeticsQuestions];
    
    if (filterByStatus) {
      questions = questions.filter(q => q.status === filterByStatus);
    }
    
    return questions.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined> {
    return this.data.apologeticsQuestions.find(q => q.id === id);
  }
  
  async getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]> {
    return this.data.apologeticsQuestions.filter(q => q.topicId === topicId);
  }
  
  async createApologeticsQuestion(question: any): Promise<ApologeticsQuestion> {
    const newQuestion: ApologeticsQuestion = {
      id: this.nextId++,
      title: question.title,
      content: question.content,
      authorId: question.authorId ?? question.askedBy,
      topicId: question.topicId,
      status: question.status || 'pending',
      requiresVerifiedAnswerer: Boolean(question.requiresVerifiedAnswerer),
      answerCount: 0,
      createdAt: new Date(),
      viewCount: 0
    };
    this.data.apologeticsQuestions.push(newQuestion);

    // Update topic question count
    const topic = this.data.apologeticsTopics.find(t => t.id === question.topicId);
    if (topic) {
      (topic as any).questionCount = ((topic as any).questionCount || 0) + 1;
    }

    return newQuestion;
  }
  
  async updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion> {
    const question = this.data.apologeticsQuestions.find(q => q.id === id);
    if (!question) throw new Error('Question not found');

    question.status = status;
    return question;
  }

  async searchApologeticsQuestions(searchTerm: string): Promise<ApologeticsQuestion[]> {
    const term = searchTerm.toLowerCase();
    return this.data.apologeticsQuestions.filter(q =>
      q.title.toLowerCase().includes(term) ||
      q.content.toLowerCase().includes(term)
    );
  }

  async getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]> {
    return this.data.apologeticsAnswers
      .filter(a => a.questionId === questionId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createApologeticsAnswer(answer: any): Promise<ApologeticsAnswer> {
    const newAnswer: ApologeticsAnswer = {
      id: this.nextId++,
      content: answer.content,
      authorId: answer.authorId ?? answer.answeredBy,
      questionId: answer.questionId,
      isVerifiedAnswer: answer.isVerifiedAnswer || false,
      upvotes: 0,
      createdAt: new Date()
    };
    this.data.apologeticsAnswers.push(newAnswer);
    return newAnswer;
  }

  async upvoteApologeticsAnswer(id: number): Promise<ApologeticsAnswer> {
    const answer = this.data.apologeticsAnswers.find(a => a.id === id);
    if (!answer) throw new Error('Answer not found');
    answer.upvotes = (answer.upvotes || 0) + 1;
    return answer;
  }

  async incrementApologeticsQuestionViews(id: number): Promise<void> {
    const question = this.data.apologeticsQuestions.find(q => q.id === id);
    if (question) {
      question.viewCount = (question.viewCount || 0) + 1;
    }
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return this.data.events.filter(e => !e.deletedAt).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    return this.data.events.find(e => e.id === id && !e.deletedAt);
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    return this.data.events.filter(e => e.creatorId === userId && !e.deletedAt);
  }

  async getNearbyEvents(latitude: number, longitude: number, radius: number): Promise<Event[]> {
    return this.data.events.filter(event => {
      if ((event as any).deletedAt) return false;
      const eventLat = coerceCoordinate((event as any).latitude);
      const eventLng = coerceCoordinate((event as any).longitude);
      if (eventLat === null || eventLng === null) return false;
      const distance = haversineDistanceMiles(latitude, longitude, eventLat, eventLng);
      return distance <= radius;
    }).sort((a, b) => new Date(a.eventDate as any).getTime() - new Date(b.eventDate as any).getTime());
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent = {
      id: this.nextId++,
      ...event,
      createdAt: new Date()
    } as Event;
    (newEvent as any).rsvpCount = 0;
    this.data.events.push(newEvent);
    return newEvent;
  }
  
  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const event = this.data.events.find(e => e.id === id);
    if (!event) throw new Error('Event not found');
    
    Object.assign(event, data);
    return event;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    const ev = this.data.events.find(e => e.id === id);
    if (!ev) return false;
    (ev as any).deletedAt = new Date();
    return true;
  }

  async searchEvents(searchTerm: string): Promise<Event[]> {
    const term = searchTerm.toLowerCase();
    return this.data.events.filter(e =>
      !(e as any).deletedAt && (
        e.title.toLowerCase().includes(term) ||
        e.description?.toLowerCase().includes(term) ||
        e.location?.toLowerCase().includes(term)
      )
    );
  }

  // Event RSVP methods
  async createEventRSVP(rsvp: any): Promise<EventRsvp> {
    const newRsvp: EventRsvp = {
      id: this.nextId++,
      userId: rsvp.userId,
      status: rsvp.status,
      eventId: rsvp.eventId,
      createdAt: new Date()
    };
    this.data.eventRsvps.push(newRsvp);

    // Update event RSVP count
    const event = this.data.events.find(e => e.id === rsvp.eventId);
    if (event) {
      (event as any).rsvpCount = ((event as any).rsvpCount || 0) + 1;
    }

    return newRsvp;
  }
  
  async getEventRSVPs(eventId: number): Promise<EventRsvp[]> {
    return this.data.eventRsvps.filter(r => r.eventId === eventId);
  }
  
  async getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    return this.data.eventRsvps.find(r => r.eventId === eventId && r.userId === userId);
  }
  
  async upsertEventRSVP(eventId: number, userId: number, status: string): Promise<EventRsvp> {
    let rsvp = this.data.eventRsvps.find(r => r.eventId === eventId && r.userId === userId);
    if (rsvp) {
      rsvp.status = status;
      return rsvp;
    }

    const created: EventRsvp = {
      id: this.nextId++,
      eventId,
      userId,
      status,
      createdAt: new Date(),
    };
    this.data.eventRsvps.push(created);

    const event = this.data.events.find(e => e.id === eventId);
    if (event) {
      (event as any).rsvpCount = ((event as any).rsvpCount || 0) + 1;
    }

    return created;
  }
  
  async deleteEventRSVP(id: number): Promise<boolean> {
    const index = this.data.eventRsvps.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    const rsvp = this.data.eventRsvps[index];
    this.data.eventRsvps.splice(index, 1);
    
    // Update event RSVP count
    const event = this.data.events.find(e => e.id === (rsvp as any).eventId);
    if (event && (event as any).rsvpCount > 0) {
      (event as any).rsvpCount--;
    }
    
    return true;
  }
  
  // Livestream methods
  async getAllLivestreams(): Promise<Livestream[]> {
    return [...this.data.livestreams].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async createLivestream(livestream: any): Promise<Livestream> {
    const newLivestream: Livestream = {
      id: this.nextId++,
      title: livestream.title,
      description: livestream.description || null,
      createdAt: new Date(),
      status: 'upcoming',
      hostId: livestream.hostId,
      thumbnail: livestream.thumbnail || null,
      viewerCount: 0,
      scheduledFor: livestream.scheduledFor,
      duration: livestream.duration || null,
      tags: livestream.tags || null,
      streamUrl: livestream.streamUrl || null,
      isLive: livestream.isLive || false
    };
    this.data.livestreams.push(newLivestream);
    return newLivestream;
  }
  
  // Microblog methods
  async getAllMicroblogs(): Promise<Microblog[]> {
    return [...this.data.microblogs].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    return this.data.microblogs.find(m => m.id === id);
  }
  
  async getUserMicroblogs(userId: number): Promise<Microblog[]> {
    return this.data.microblogs
      .filter(m => m.authorId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getFollowingMicroblogs(_userId: number): Promise<Microblog[]> {
    // In-memory stub - not implemented
    return [];
  }

  async createMicroblog(microblog: InsertMicroblog): Promise<Microblog> {
    const newMicroblog: Microblog = {
      id: this.nextId++,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      createdAt: new Date(),
      ...microblog,
    };
    this.data.microblogs.push(newMicroblog);
    return newMicroblog;
  }
  
  async updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog> {
    const microblog = this.data.microblogs.find(m => m.id === id);
    if (!microblog) throw new Error('Microblog not found');
    
    Object.assign(microblog, data);
    return microblog;
  }
  
  async deleteMicroblog(id: number): Promise<boolean> {
    const mb = this.data.microblogs.find(m => m.id === id);
    if (!mb) return false;
    (mb as any).deletedAt = new Date();
    return true;
  }

  async searchMicroblogs(searchTerm: string): Promise<Microblog[]> {
    const term = searchTerm.toLowerCase();
    return this.data.microblogs.filter(m =>
      !(m as any).deletedAt &&
      m.content.toLowerCase().includes(term)
    );
  }

  // Microblog like methods
  async likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike> {
    // Check if already liked
    const existingLike = this.data.microblogLikes.find(l => l.microblogId === microblogId && l.userId === userId);
    if (existingLike) {
      throw new Error('Already liked');
    }
    
    const newLike: MicroblogLike = {
      id: this.nextId++,
      microblogId,
      userId,
      createdAt: new Date()
    };
    this.data.microblogLikes.push(newLike);
    
    // Update microblog like count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog) {
      microblog.likeCount = (microblog.likeCount || 0) + 1;
    }
    
    return newLike;
  }
  
  async unlikeMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const index = this.data.microblogLikes.findIndex(l => l.microblogId === microblogId && l.userId === userId);
    if (index === -1) return false;
    
    this.data.microblogLikes.splice(index, 1);
    
    // Update microblog like count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog && microblog.likeCount > 0) {
      microblog.likeCount--;
    }
    
    return true;
  }
  
  async getUserLikedMicroblogs(userId: number): Promise<Microblog[]> {
    const userLikes = this.data.microblogLikes.filter(l => l.userId === userId);
    return userLikes.map(l => this.data.microblogs.find(m => m.id === l.microblogId)!);
  }

  async repostMicroblog(microblogId: number, userId: number): Promise<MicroblogRepost> {
    // Check if already reposted
    const existingRepost = this.data.microblogReposts.find(r => r.microblogId === microblogId && r.userId === userId);
    if (existingRepost) {
      throw new Error('Already reposted');
    }

    const newRepost: MicroblogRepost = {
      id: this.nextId++,
      microblogId,
      userId,
      createdAt: new Date()
    };
    this.data.microblogReposts.push(newRepost);

    // Update microblog repost count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog) {
      microblog.repostCount = (microblog.repostCount || 0) + 1;
    }

    return newRepost;
  }

  async unrepostMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const index = this.data.microblogReposts.findIndex(r => r.microblogId === microblogId && r.userId === userId);
    if (index === -1) return false;

    this.data.microblogReposts.splice(index, 1);

    // Update microblog repost count
    const microblog = this.data.microblogs.find(m => m.id === microblogId);
    if (microblog && microblog.repostCount > 0) {
      microblog.repostCount--;
    }

    return true;
  }

  async bookmarkMicroblog(microblogId: number, userId: number): Promise<MicroblogBookmark> {
    // Check if already bookmarked
    const existingBookmark = this.data.microblogBookmarks.find(b => b.microblogId === microblogId && b.userId === userId);
    if (existingBookmark) {
      throw new Error('Already bookmarked');
    }

    const newBookmark: MicroblogBookmark = {
      id: this.nextId++,
      microblogId,
      userId,
      createdAt: new Date()
    };
    this.data.microblogBookmarks.push(newBookmark);

    return newBookmark;
  }

  async unbookmarkMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const index = this.data.microblogBookmarks.findIndex(b => b.microblogId === microblogId && b.userId === userId);
    if (index === -1) return false;

    this.data.microblogBookmarks.splice(index, 1);
    return true;
  }

  async getUserBookmarkedMicroblogs(userId: number): Promise<Microblog[]> {
    const bookmarks = this.data.microblogBookmarks.filter(b => b.userId === userId);
    return bookmarks.map(b => this.data.microblogs.find(m => m.id === b.microblogId)!).filter(Boolean);
  }

  // Microblog engagement check methods
  async hasUserLikedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    return this.data.microblogLikes.some(like => like.microblogId === microblogId && like.userId === userId);
  }

  async hasUserRepostedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    return this.data.microblogReposts.some(repost => repost.microblogId === microblogId && repost.userId === userId);
  }

  async hasUserBookmarkedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    return this.data.microblogBookmarks.some(bookmark => bookmark.microblogId === microblogId && bookmark.userId === userId);
  }

  // Post bookmark methods
  async bookmarkPost(_postId: number, _userId: number): Promise<PostBookmark> {
    throw new Error('Not implemented in MemStorage');
  }

  async unbookmarkPost(_postId: number, _userId: number): Promise<boolean> {
    return false;
  }

  async getUserBookmarkedPosts(_userId: number): Promise<Post[]> {
    return [];
  }

  async hasUserBookmarkedPost(_postId: number, _userId: number): Promise<boolean> {
    return false;
  }

  async hasUserLikedPost(_postId: number, _userId: number): Promise<boolean> {
    return false;
  }

  // ============================================================================
  // Hashtag/Keyword stubs (not implemented for MemStorage)
  async getOrCreateHashtag(_tag: string, _displayTag: string): Promise<any> {
    throw new Error('Hashtags not implemented in MemStorage');
  }
  async linkHashtagToMicroblog(_microblogId: number, _hashtagId: number): Promise<void> {}
  async linkHashtagToPost(_postId: number, _hashtagId: number): Promise<void> {}
  async getTrendingHashtags(_limit?: number): Promise<any[]> {
    return [];
  }
  async getMicroblogsByHashtag(_hashtagTag: string, _limit?: number): Promise<any[]> {
    return [];
  }
  async getPostsByHashtag(_hashtagTag: string, _limit?: number): Promise<any[]> {
    return [];
  }
  async processMicroblogHashtags(_microblogId: number, _content: string): Promise<void> {}
  async processPostHashtags(_postId: number, _title: string, _content: string): Promise<void> {}

  async getOrCreateKeyword(_keyword: string, _displayKeyword: string): Promise<any> {
    throw new Error('Keywords not implemented in MemStorage');
  }
  async linkKeywordToMicroblog(_microblogId: number, _keywordId: number, _frequency: number): Promise<void> {}
  async linkKeywordToPost(_postId: number, _keywordId: number, _frequency: number): Promise<void> {}
  async getTrendingKeywords(_limit?: number): Promise<any[]> {
    return [];
  }
  async getMicroblogsByKeyword(_keyword: string, _limit?: number): Promise<any[]> {
    return [];
  }
  async getPostsByKeyword(_keyword: string, _limit?: number): Promise<any[]> {
    return [];
  }
  async processMicroblogKeywords(_microblogId: number, _content: string): Promise<void> {}
  async processPostKeywords(_postId: number, _title: string, _content: string): Promise<void> {}
  async updateTrendingScores(): Promise<void> {}
  async updateKeywordTrendingScores(): Promise<void> {}
}

// Database-backed storage implementation
export class DbStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.id, id), whereNotDeleted(users)));
    return result[0];
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.username, username), whereNotDeleted(users)));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(and(eq(users.email, email), whereNotDeleted(users)));
    return result[0];
  }
  
  async searchUsers(searchTerm: string): Promise<User[]> {
    const term = `%${searchTerm}%`;
    return await db.select().from(users).where(and(
      or(
        ilike(users.username, term),
        ilike(users.email, term),
        ilike(users.displayName, term)
      ),
      whereNotDeleted(users)
    ));
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).where(whereNotDeleted(users));
  }

  // Moderation methods (DB)
  async createContentReport(report: InsertContentReport): Promise<ContentReport> {
  const [row] = await db.insert(contentReports).values(report as any).returning();
    return row as ContentReport;
  }

  async createUserBlock(block: InsertUserBlock): Promise<UserBlock> {
    // Upsert to enforce uniqueness blocker+blocked
  const inserted = await db.insert(userBlocks).values(block as any).onConflictDoNothing().returning();
    if (inserted && inserted.length > 0) return inserted[0] as UserBlock;
    // If nothing inserted, fetch existing
    const existing = await db.select().from(userBlocks).where(and(eq(userBlocks.blockerId, (block as any).blockerId), eq(userBlocks.blockedId, (block as any).blockedId)));
    return existing[0] as UserBlock;
  }

  async getBlockedUserIdsFor(blockerId: number): Promise<number[]> {
    const rows = await db.select({ blockedId: userBlocks.blockedId }).from(userBlocks).where(eq(userBlocks.blockerId, blockerId));
    return rows.map(r => (r as any).blockedId as number);
  }

  // Remove a user block (DB)
  async removeUserBlock(blockerId: number, blockedId: number): Promise<boolean> {
    const res = await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
    // `res` may be a number of rows deleted or an object with rowCount depending on driver; normalize
    if (typeof (res as any).rowCount === 'number') {
      return (res as any).rowCount > 0;
    }
    if (typeof res === 'number') {
      return res > 0;
    }
    // Fallback: attempt to select to see if it still exists
    const remaining = await db.select().from(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
    return remaining.length === 0;
  }

  // Toggle post vote (DB) - supports upvote and downvote
  async togglePostVote(postId: number, userId: number, voteType: 'upvote' | 'downvote' = 'upvote'): Promise<{ voted: boolean; post?: Post }> {
    // Check existing vote
    const existing = await db.select().from(postVotes).where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));

    if (existing && existing.length > 0) {
      const existingVote = existing[0];
      // If clicking the same vote type, remove the vote
      if ((existingVote as any).voteType === voteType) {
        await db.delete(postVotes).where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
        // Decrement the appropriate count
        const field = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const updated = await db.update(posts)
          .set({ [field]: sql`GREATEST(${posts[field]} - 1, 0)` as any })
          .where(eq(posts.id, postId))
          .returning();
        return { voted: false, post: updated[0] } as any;
      } else {
        // If clicking opposite vote type, switch the vote
        await db.update(postVotes)
          .set({ voteType: voteType as any })
          .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));

        // Decrement old vote type, increment new vote type
        const oldField = voteType === 'upvote' ? 'downvotes' : 'upvotes';
        const newField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const updated = await db.update(posts)
          .set({
            [oldField]: sql`GREATEST(${posts[oldField]} - 1, 0)` as any,
            [newField]: sql`${posts[newField]} + 1` as any
          })
          .where(eq(posts.id, postId))
          .returning();
        return { voted: true, post: updated[0] } as any;
      }
    }

    // No existing vote, add new vote
    await db.insert(postVotes).values({ postId, userId, voteType: voteType as any } as any);
    const field = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    const updated = await db.update(posts)
      .set({ [field]: sql`${posts[field]} + 1` as any })
      .where(eq(posts.id, postId))
      .returning();
    return { voted: true, post: updated[0] } as any;
  }

  // Toggle comment vote (DB) - supports upvote and downvote
  async toggleCommentVote(commentId: number, userId: number, voteType: 'upvote' | 'downvote' = 'upvote'): Promise<{ voted: boolean; comment?: Comment }> {
    // Check existing vote
    const existing = await db.select().from(commentVotes).where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));

    if (existing && existing.length > 0) {
      const existingVote = existing[0];
      // If clicking the same vote type, remove the vote
      if ((existingVote as any).voteType === voteType) {
        await db.delete(commentVotes).where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));
        // Decrement the appropriate count
        const field = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const updated = await db.update(comments)
          .set({ [field]: sql`GREATEST(${comments[field]} - 1, 0)` as any })
          .where(eq(comments.id, commentId))
          .returning();
        return { voted: false, comment: updated[0] } as any;
      } else {
        // If clicking opposite vote type, switch the vote
        await db.update(commentVotes)
          .set({ voteType: voteType as any })
          .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));

        // Decrement old vote type, increment new vote type
        const oldField = voteType === 'upvote' ? 'downvotes' : 'upvotes';
        const newField = voteType === 'upvote' ? 'upvotes' : 'downvotes';
        const updated = await db.update(comments)
          .set({
            [oldField]: sql`GREATEST(${comments[oldField]} - 1, 0)` as any,
            [newField]: sql`${comments[newField]} + 1` as any
          })
          .where(eq(comments.id, commentId))
          .returning();
        return { voted: true, comment: updated[0] } as any;
      }
    }

    // No existing vote, add new vote
    await db.insert(commentVotes).values({ commentId, userId, voteType: voteType as any } as any);
    const field = voteType === 'upvote' ? 'upvotes' : 'downvotes';
    const updated = await db.update(comments)
      .set({ [field]: sql`${comments[field]} + 1` as any })
      .where(eq(comments.id, commentId))
      .returning();
    return { voted: true, comment: updated[0] } as any;
  }

  async getUserByEmailVerificationToken(token: string): Promise<User | undefined> {
    // Support both legacy plaintext token (`emailVerificationToken`) and
    // the newer hashed token (`emailVerificationTokenHash`) with expiry check.
    const tokenHash = token ? require('crypto').createHash('sha256').update(token).digest('hex') : null;

    // Prefer matching by hash and ensure it's not expired
    if (tokenHash) {
      const now = new Date();
      const rows = await db.select().from(users)
        .where(and(
          eq(users.emailVerificationTokenHash, tokenHash),
          or(eq(users.emailVerificationExpiresAt, null), sql`${users.emailVerificationExpiresAt} > ${now}`)
        ));
      if (rows && rows.length > 0) return rows[0] as User;
    }

    // Fallback: legacy plaintext token field
    const rowsLegacy = await db.select().from(users).where(eq(users.emailVerificationToken, token));
    return rowsLegacy[0] as User | undefined;
  }

  // Admin moderation helpers (DB)
  async getReports(filter?: { status?: string; limit?: number }): Promise<ContentReport[]> {
    const q = db.select().from(contentReports as any);
    if (filter?.status) q.where(eq((contentReports as any).status, filter.status as any));
    q.orderBy(desc((contentReports as any).createdAt));
    if (filter?.limit) q.limit(filter.limit as any);
    const rows = await q;
    return rows as ContentReport[];
  }

  async getReportById(id: number): Promise<ContentReport | undefined> {
    const rows = await db.select().from(contentReports as any).where(eq((contentReports as any).id, id as any));
    return rows[0] as ContentReport | undefined;
  }

  async updateReport(id: number, update: Partial<ContentReport> & { status?: string; moderatorNotes?: string | null; moderatorId?: number | null; resolvedAt?: Date | null }): Promise<ContentReport> {
    const updated = await db.update(contentReports as any).set(update as any).where(eq((contentReports as any).id, id as any)).returning();
    if (!updated || updated.length === 0) throw new Error('Report not found');
    return updated[0] as ContentReport;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    console.info('[DbStorage.updateUser] Updating user', id, 'with data:', userData);
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    if (!result[0]) throw new Error('User not found');
    console.info('[DbStorage.updateUser] Update successful, returning:', {
      id: result[0].id,
      location: result[0].location,
      denomination: result[0].denomination,
      homeChurch: result[0].homeChurch,
      favoriteBibleVerse: result[0].favoriteBibleVerse,
      testimony: result[0].testimony,
      interests: result[0].interests
    });
    return result[0];
  }
  
  async updateUserPreferences(userId: number, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // For now, just return a default preferences object
    // This can be expanded when the userPreferences table is properly set up
    return {
      id: 1,
      userId,
      interests: preferences.interests || null,
      favoriteTopics: preferences.favoriteTopics || null,
      engagementHistory: preferences.engagementHistory || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    // For now, return undefined since the table isn't fully implemented
    return undefined;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user as any).returning();
    return result[0];
  }
  
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const result = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).returning();
    return result[0];
  }
  
  async setVerifiedApologeticsAnswerer(userId: number, isVerified: boolean): Promise<User> {
    const result = await db.update(users).set({ isVerifiedApologeticsAnswerer: isVerified } as any).where(eq(users.id, userId)).returning();
    if (!result[0]) throw new Error('User not found');
    return result[0];
  }
  
  async getVerifiedApologeticsAnswerers(): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.isVerifiedApologeticsAnswerer, true), whereNotDeleted(users)));
  }

  async getApologeticsAnswererPermissions(userId: number): Promise<number[]> {
    const rows = await db.select().from(apologeticsAnswererPermissions).where(eq(apologeticsAnswererPermissions.userId, userId));
    return rows.map(r => r.topicId);
  }

  async setApologeticsAnswererPermissions(userId: number, topicIds: number[]): Promise<number[]> {
    const uniqueTopicIds = Array.from(new Set(topicIds.filter(id => Number.isFinite(id))));
    await db.delete(apologeticsAnswererPermissions).where(eq(apologeticsAnswererPermissions.userId, userId));

    if (uniqueTopicIds.length === 0) {
      return [];
    }

    const inserted = await db.insert(apologeticsAnswererPermissions)
      .values(uniqueTopicIds.map(topicId => ({ userId, topicId } as InsertApologeticsAnswererPermission)))
      .returning();

    return inserted.map(row => row.topicId);
  }

  // User Follow methods
  async getUserFollowers(userId: number): Promise<any[]> {
    const follows = await db.select()
      .from(userFollows)
      .where(eq(userFollows.followingId, userId));

    const followerIds = follows.map(f => f.followerId);
    if (followerIds.length === 0) return [];

    const followers = await db.select()
      .from(users)
      .where(inArray(users.id, followerIds));

    return follows.map(follow => {
      const user = followers.find(u => u.id === follow.followerId);
      return {
        id: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        profileImageUrl: user?.avatarUrl,
        followedAt: follow.createdAt,
      };
    });
  }

  async getUserFollowing(userId: number): Promise<any[]> {
    const follows = await db.select()
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    const followingIds = follows.map(f => f.followingId);
    if (followingIds.length === 0) return [];

    const following = await db.select()
      .from(users)
      .where(inArray(users.id, followingIds));

    return follows.map(follow => {
      const user = following.find(u => u.id === follow.followingId);
      return {
        id: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        profileImageUrl: user?.avatarUrl,
        followedAt: follow.createdAt,
      };
    });
  }

  async getUserFollow(followerId: number, followingId: number): Promise<any | undefined> {
    const [follow] = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))
      .limit(1);
    return follow;
  }

  async createUserFollow(follow: { followerId: number; followingId: number }): Promise<any> {
    const [created] = await db.insert(userFollows)
      .values(follow)
      .returning();
    return created;
  }

  async deleteUserFollow(followerId: number, followingId: number): Promise<boolean> {
    const result = await db.delete(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))
      .returning();
    return result.length > 0;
  }

  async isUserFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.getUserFollow(followerId, followingId);
    return !!follow;
  }

  // Community methods - simplified for now
  async getAllCommunities(): Promise<Community[]> {
    return await db.select().from(communities).where(whereNotDeleted(communities));
  }
  
  async searchCommunities(searchTerm: string): Promise<Community[]> {
    const term = `%${searchTerm}%`;
    return await db.select().from(communities).where(and(
      or(
        like(communities.name, term),
        like(communities.description, term)
      ),
      whereNotDeleted(communities)
    ));
  }

  /**
   * Get personalized community recommendations for a user
   * Uses recommendation algorithm to score and sort communities
   */
  async getRecommendedCommunities(userId: number, limit: number = 10): Promise<Community[]> {
    const { sortCommunitiesByRecommendation } = await import('./personalization/communityRecommender');

    // Get user data
    const user = await this.getUser(userId);
    if (!user) {
      return [];
    }

    // Get all public communities (excluding ones user is already a member of)
    const allCommunities = await db.select()
      .from(communities)
      .where(and(
        eq(communities.isPrivate, false),
        whereNotDeleted(communities)
      ));

    // Get communities user is already a member of
    const userCommunities = await db.select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const memberCommunityIds = new Set(userCommunities.map(m => m.communityId));

    // Filter out communities user is already in
    const availableCommunities = allCommunities.filter(
      c => !memberCommunityIds.has(c.id)
    );

    // Sort by recommendation score
    const recommended = sortCommunitiesByRecommendation(user, availableCommunities);

    // Return top N recommendations
    return recommended.slice(0, limit);
  }

  async getPublicCommunitiesAndUserCommunities(userId?: number, searchQuery?: string): Promise<Community[]> {
    let whereCondition = eq(communities.isPrivate, false);

    if (searchQuery) {
      const term = `%${searchQuery}%`;
      whereCondition = and(whereCondition, or(like(communities.name, term), like(communities.description, term)));
    }

    // Ensure we only return non-deleted communities at runtime
    whereCondition = and(whereCondition, whereNotDeleted(communities));

    const publicCommunities = await db.select().from(communities).where(whereCondition);

    // If no user ID, return public communities without membership info
    if (!userId) {
      return publicCommunities.map((c: any) => ({ ...c, isMember: false }));
    }

    // Get all communities where user is a member
    const userMembershipIds = await db
      .select({ communityId: communityMembers.communityId })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId))
      .then(rows => rows.map(r => r.communityId));

    // Get private communities where user is a member
    let privateMemberCommunities: any[] = [];
    if (userMembershipIds.length > 0) {
      let privateWhereCondition = and(
        eq(communities.isPrivate, true),
        inArray(communities.id, userMembershipIds),
        whereNotDeleted(communities)
      );

      if (searchQuery) {
        const term = `%${searchQuery}%`;
        privateWhereCondition = and(
          privateWhereCondition,
          or(like(communities.name, term), like(communities.description, term))
        );
      }

      privateMemberCommunities = await db
        .select()
        .from(communities)
        .where(privateWhereCondition);
    }

    // Combine all communities and add isMember flag
    const allCommunities = [...publicCommunities, ...privateMemberCommunities];
    return allCommunities.map((community: any) => ({
      ...community,
      isMember: userMembershipIds.includes(community.id),
    }));
  }
  
  async getCommunity(id: number): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(and(eq(communities.id, id), whereNotDeleted(communities)));
    return result[0];
  }
  
  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    const result = await db.select().from(communities).where(and(eq(communities.slug, slug), whereNotDeleted(communities)));
    return result[0];
  }
  
  async createCommunity(community: InsertCommunity): Promise<Community> {
    // Geocode the address if city/state are provided but no coordinates
    const comm: any = community as any; // local alias to appease TS for flexible payload
    let latitude = comm.latitude;
    let longitude = comm.longitude;

    if (!latitude && !longitude && (comm.city || comm.state)) {
      const geocodeResult = await geocodeAddress('', comm.city, comm.state);
      if ('latitude' in geocodeResult) {
        latitude = geocodeResult.latitude.toString();
        longitude = geocodeResult.longitude.toString();
      }
    }

    const communityData = {
      ...community,
      latitude,
      longitude
    };

    const result = await db.insert(communities).values(communityData as any).returning();
    return result[0];
  }
  
  async updateCommunity(id: number, community: Partial<Community>): Promise<Community> {
    // Geocode the address if city/state are updated but no new coordinates provided
    const comm: any = community as any;
    if ((comm.city || comm.state) && !comm.latitude && !comm.longitude) {
      const geocodeResult = await geocodeAddress('', comm.city, comm.state);
      if ('latitude' in geocodeResult) {
        comm.latitude = geocodeResult.latitude.toString();
        comm.longitude = geocodeResult.longitude.toString();
      }
    }

    const result = await db.update(communities).set(comm).where(eq(communities.id, id)).returning();
    if (!result[0]) throw new Error('Community not found');
    return result[0];
  }
  
  async deleteCommunity(id: number): Promise<boolean> {
    const result = await softDelete(db, communities, communities.id, id);
    // Drizzle's update may not expose rowCount in typed outputs; defensively return true
    return !!result;
  }
  
  // Get all members of a community with their user data
  async getCommunityMembers(communityId: number): Promise<(CommunityMember & { user: User })[]> {
    const members = await db.select()
      .from(communityMembers)
      .leftJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));

    // Deduplicate members by userId (in case of duplicate database records)
    const seen = new Set<number>();
    const uniqueMembers = members.filter(m => {
      if (seen.has(m.community_members.userId)) {
        return false;
      }
      seen.add(m.community_members.userId);
      return true;
    });

    return uniqueMembers.map(m => ({
      id: m.community_members.id,
      communityId: m.community_members.communityId,
      userId: m.community_members.userId,
      role: m.community_members.role,
      joinedAt: m.community_members.joinedAt,
      user: m.users as User
    }));
  }

  async getCommunityMember(communityId: number, userId: number): Promise<CommunityMember | undefined> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      )
      .limit(1);

    return member;
  }
  
  async getUserCommunities(userId: number): Promise<(Community & { memberCount: number })[]> {
    const memberships = await db.select()
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const communityIds = memberships.map(m => m.communityId);
    if (communityIds.length === 0) return [];

    const userCommunities = await db.select()
      .from(communities)
      .where(inArray(communities.id, communityIds));

    const communitiesWithCount = await Promise.all(
      userCommunities.map(async (community) => {
        const members = await db.select({ count: sql<number>`count(*)` })
          .from(communityMembers)
          .where(eq(communityMembers.communityId, community.id));
        return {
          ...community,
          memberCount: Number(members[0]?.count || 0)
        };
      })
    );

    return communitiesWithCount;
  }
  
  async addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember> {
    const [newMember] = await db.insert(communityMembers)
      .values({
        communityId: member.communityId,
        userId: member.userId,
        role: member.role || 'member',
      })
      .returning();

    // Update member count
    await db.execute(sql`
      UPDATE communities
      SET member_count = (
        SELECT COUNT(*)
        FROM community_members
        WHERE community_id = ${member.communityId}
      )
      WHERE id = ${member.communityId}
    `);

    return newMember;
  }

  async updateCommunityMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember> {
    const [updated] = await db.update(communityMembers)
      .set({ role })
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new Error('Community member not found');
    }

    return updated;
  }

  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const result = await db.delete(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ))
      .returning();

    if (result.length > 0) {
      // Update member count
      await db.execute(sql`
        UPDATE communities
        SET member_count = (
          SELECT COUNT(*)
          FROM community_members
          WHERE community_id = ${communityId}
        )
        WHERE id = ${communityId}
      `);
    }

    return result.length > 0;
  }

  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      ))
      .limit(1);

    return !!member;
  }
  
  async isCommunityOwner(communityId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId),
        eq(communityMembers.role, 'owner')
      ))
      .limit(1);

    return !!member;
  }

  async isCommunityModerator(communityId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(communityMembers)
      .where(and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId),
        or(
          eq(communityMembers.role, 'owner'),
          eq(communityMembers.role, 'moderator')
        )
      ))
      .limit(1);

    return !!member;
  }
  
  // Community invitation methods
  async createCommunityInvitation(invitation: InsertCommunityInvitation): Promise<CommunityInvitation> {
    const [newInvitation] = await db.insert(communityInvitations)
      .values(invitation)
      .returning();

    return newInvitation;
  }
  
  async getCommunityInvitations(communityId: number): Promise<(CommunityInvitation & { inviter: User })[]> {
    return [];
  }
  
  async getCommunityInvitationByToken(token: string): Promise<CommunityInvitation | undefined> {
    return undefined;
  }
  
  async getCommunityInvitationById(id: number): Promise<CommunityInvitation | undefined> {
    return undefined;
  }
  
  async updateCommunityInvitationStatus(id: number, status: string): Promise<CommunityInvitation> {
    throw new Error('Not implemented');
  }
  
  async deleteCommunityInvitation(id: number): Promise<boolean> {
    return false;
  }
  
  async getCommunityInvitationByEmailAndCommunity(email: string, communityId: number): Promise<CommunityInvitation | undefined> {
    const [invitation] = await db.select()
      .from(communityInvitations)
      .where(and(
        eq(communityInvitations.inviteeEmail, email),
        eq(communityInvitations.communityId, communityId)
      ))
      .limit(1);

    return invitation;
  }
  
  // Community chat room methods
  async getCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return await db.select()
      .from(communityChatRooms)
      .where(eq(communityChatRooms.communityId, communityId))
      .orderBy(communityChatRooms.name);
  }

  async getPublicCommunityRooms(communityId: number): Promise<CommunityChatRoom[]> {
    return await db.select()
      .from(communityChatRooms)
      .where(and(
        eq(communityChatRooms.communityId, communityId),
        eq(communityChatRooms.isPrivate, false)
      ))
      .orderBy(communityChatRooms.name);
  }

  async getCommunityRoom(id: number): Promise<CommunityChatRoom | undefined> {
    const [room] = await db.select()
      .from(communityChatRooms)
      .where(eq(communityChatRooms.id, id))
      .limit(1);
    return room;
  }

  async createCommunityRoom(room: InsertCommunityChatRoom): Promise<CommunityChatRoom> {
    const [newRoom] = await db.insert(communityChatRooms)
      .values(room as any)
      .returning();
    return newRoom;
  }

  async updateCommunityRoom(id: number, data: Partial<CommunityChatRoom>): Promise<CommunityChatRoom> {
    const [updated] = await db.update(communityChatRooms)
      .set(data)
      .where(eq(communityChatRooms.id, id))
      .returning();

    if (!updated) {
      throw new Error('Community room not found');
    }

    return updated;
  }

  async deleteCommunityRoom(id: number): Promise<boolean> {
    const result = await db.delete(communityChatRooms)
      .where(eq(communityChatRooms.id, id));
    return true;
  }
  
  // Chat message methods
  async getChatMessages(roomId: number, limit?: number): Promise<(ChatMessage & { sender: User })[]> {
    const query = db.select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.chatRoomId, roomId))
      .orderBy(chatMessages.createdAt);

    const messages = await (limit ? query.limit(limit) : query);

    return messages.map(m => ({
      id: m.chat_messages.id,
      content: m.chat_messages.content,
      chatRoomId: m.chat_messages.chatRoomId,
      senderId: m.chat_messages.senderId,
      isSystemMessage: m.chat_messages.isSystemMessage,
      createdAt: m.chat_messages.createdAt,
      sender: m.users as User
    }));
  }

  async getChatMessagesAfter(roomId: number, afterId: number): Promise<(ChatMessage & { sender: User })[]> {
    // First get the timestamp of the afterId message
    const [afterMessage] = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.id, afterId))
      .limit(1);

    if (!afterMessage) return [];

    const messages = await db.select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.senderId, users.id))
      .where(and(
        eq(chatMessages.chatRoomId, roomId),
        sql`${chatMessages.createdAt} > ${afterMessage.createdAt}`
      ))
      .orderBy(chatMessages.createdAt);

    return messages.map(m => ({
      id: m.chat_messages.id,
      content: m.chat_messages.content,
      chatRoomId: m.chat_messages.chatRoomId,
      senderId: m.chat_messages.senderId,
      isSystemMessage: m.chat_messages.isSystemMessage,
      createdAt: m.chat_messages.createdAt,
      sender: m.users as User
    }));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages)
      .values(message as any)
      .returning();
    return newMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    return false;
  }
  
  // Community wall post methods
  async getCommunityWallPosts(communityId: number, isPrivate?: boolean): Promise<(CommunityWallPost & { author: User })[]> {
    const query = db.select()
      .from(communityWallPosts)
      .leftJoin(users, eq(communityWallPosts.authorId, users.id))
      .where(and(
        eq(communityWallPosts.communityId, communityId),
        whereNotDeleted(communityWallPosts),
        isPrivate !== undefined ? eq(communityWallPosts.isPrivate, isPrivate) : sql`1=1`
      ))
      .orderBy(desc(communityWallPosts.createdAt));

    const results = await query;
    return results.map(r => ({
      id: r.community_wall_posts.id,
      communityId: r.community_wall_posts.communityId,
      authorId: r.community_wall_posts.authorId,
      content: r.community_wall_posts.content,
      imageUrl: r.community_wall_posts.imageUrl,
      isPrivate: r.community_wall_posts.isPrivate,
      likeCount: r.community_wall_posts.likeCount,
      commentCount: r.community_wall_posts.commentCount,
      createdAt: r.community_wall_posts.createdAt,
      deletedAt: r.community_wall_posts.deletedAt,
      author: r.users || {
        id: r.community_wall_posts.authorId,
        username: 'deleted',
        email: '',
        displayName: 'Deleted User'
      } as User
    }));
  }

  async getCommunityWallPost(id: number): Promise<(CommunityWallPost & { author: User }) | undefined> {
    const [result] = await db.select()
      .from(communityWallPosts)
      .leftJoin(users, eq(communityWallPosts.authorId, users.id))
      .where(and(eq(communityWallPosts.id, id), whereNotDeleted(communityWallPosts)))
      .limit(1);

    if (!result) return undefined;

    return {
      id: result.community_wall_posts.id,
      communityId: result.community_wall_posts.communityId,
      authorId: result.community_wall_posts.authorId,
      content: result.community_wall_posts.content,
      imageUrl: result.community_wall_posts.imageUrl,
      isPrivate: result.community_wall_posts.isPrivate,
      likeCount: result.community_wall_posts.likeCount,
      commentCount: result.community_wall_posts.commentCount,
      createdAt: result.community_wall_posts.createdAt,
      deletedAt: result.community_wall_posts.deletedAt,
      author: result.users as User
    };
  }

  async createCommunityWallPost(post: InsertCommunityWallPost): Promise<CommunityWallPost> {
    const [newPost] = await db.insert(communityWallPosts)
      .values({
        ...post,
        likeCount: 0,
        commentCount: 0,
      } as any)
      .returning();
    return newPost;
  }

  async updateCommunityWallPost(id: number, data: Partial<CommunityWallPost>): Promise<CommunityWallPost> {
    const [updated] = await db.update(communityWallPosts)
      .set(data)
      .where(and(eq(communityWallPosts.id, id), whereNotDeleted(communityWallPosts)))
      .returning();

    if (!updated) {
      throw new Error('Community wall post not found');
    }

    return updated;
  }
  
  async deleteCommunityWallPost(id: number): Promise<boolean> {
    const result = await softDelete(db, communityWallPosts, communityWallPosts.id, id);
    return !!result;
  }
  
  // Post methods
  async getAllPosts(filter?: string): Promise<Post[]> {
    let query = db.select()
      .from(posts)
      .where(whereNotDeleted(posts));

    // Apply sorting based on filter
    if (filter === 'top') {
      return await query.orderBy(desc(posts.upvotes));
    } else if (filter === 'hot') {
      // For hot, we'll use a combination of upvotes and recency
      return await query.orderBy(desc(posts.upvotes), desc(posts.createdAt));
    } else {
      // Default: newest first
      return await query.orderBy(desc(posts.createdAt));
    }
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select()
      .from(posts)
      .where(and(eq(posts.id, id), whereNotDeleted(posts)))
      .limit(1);
    return post;
  }
  
  async getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]> {
    // First find the community by slug
    const [community] = await db.select()
      .from(communities)
      .where(eq(communities.slug, communitySlug))
      .limit(1);

    if (!community) return [];

    // Get posts for this community
    let query = db.select()
      .from(posts)
      .where(and(
        eq(posts.communityId, community.id),
        whereNotDeleted(posts)
      ));

    // Apply sorting based on filter
    if (filter === 'top') {
      return await query.orderBy(desc(posts.upvotes));
    } else if (filter === 'hot') {
      return await query.orderBy(desc(posts.upvotes), desc(posts.createdAt));
    } else {
      return await query.orderBy(desc(posts.createdAt));
    }
  }

  async getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]> {
    let query = db.select()
      .from(posts)
      .where(and(
        eq(posts.groupId, groupId),
        whereNotDeleted(posts)
      ));

    // Apply sorting based on filter
    if (filter === 'top') {
      return await query.orderBy(desc(posts.upvotes));
    } else if (filter === 'hot') {
      return await query.orderBy(desc(posts.upvotes), desc(posts.createdAt));
    } else {
      return await query.orderBy(desc(posts.createdAt));
    }
  }
  
  async getUserPosts(userId: number): Promise<any[]> {
    const userPosts = await db.select()
      .from(posts)
      .where(and(
        eq(posts.authorId, userId),
        isNull(posts.deletedAt)
      ))
      .orderBy(desc(posts.createdAt));
    return userPosts;
  }

  async getFollowingPosts(userId: number): Promise<Post[]> {
    // Get IDs of users that this user follows
    const following = await db.select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get posts from followed users
    const followingPosts = await db.select()
      .from(posts)
      .where(and(
        sql`${posts.authorId} IN (${sql.join(followingIds.map(id => sql`${id}`), sql`, `)})`,
        isNull(posts.deletedAt)
      ))
      .orderBy(desc(posts.createdAt));

    return followingPosts;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts)
      .values({
        ...post,
        upvotes: 0,
        downvotes: 0,
        commentCount: 0,
      } as any)
      .returning();
    return newPost;
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post> {
    const [updated] = await db.update(posts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(posts.id, id), whereNotDeleted(posts)))
      .returning();
    if (!updated) {
      throw new Error('Post not found');
    }
    return updated;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await softDelete(db, posts, posts.id, id);
    return !!result;
  }
  
  async upvotePost(id: number): Promise<Post> {
    const [updated] = await db.update(posts)
      .set({ upvotes: sql`${posts.upvotes} + 1` })
      .where(and(eq(posts.id, id), whereNotDeleted(posts)))
      .returning();

    if (!updated) {
      throw new Error('Post not found');
    }

    return updated;
  }

  async searchPosts(searchTerm: string): Promise<Post[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(posts)
      .where(and(
        or(
          like(posts.title, term),
          like(posts.content, term)
        ),
        whereNotDeleted(posts)
      ));
  }

  async likePost(postId: number, userId: number): Promise<void> {
    // Check if already liked
    const existing = await db.select()
      .from(postVotes)
      .where(and(
        eq(postVotes.postId, postId),
        eq(postVotes.userId, userId)
      ))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Already liked');
    }

    // Create like (using upvote type)
    await db.insert(postVotes).values({
      postId,
      userId,
      voteType: 'upvote',
    } as any);

    // Increment like count
    await db.update(posts)
      .set({ upvotes: sql`${posts.upvotes} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(postId: number, userId: number): Promise<boolean> {
    const deleted = await db.delete(postVotes)
      .where(and(
        eq(postVotes.postId, postId),
        eq(postVotes.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return false;
    }

    // Decrement like count
    await db.update(posts)
      .set({ upvotes: sql`GREATEST(${posts.upvotes} - 1, 0)` })
      .where(eq(posts.id, postId));

    return true;
  }

  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const [vote] = await db.select()
      .from(postVotes)
      .where(and(
        eq(postVotes.postId, postId),
        eq(postVotes.userId, userId)
      ))
      .limit(1);

    return !!vote;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select()
      .from(comments)
      .where(and(eq(comments.id, id), whereNotDeleted(comments)))
      .limit(1);
    return comment;
  }
  
  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const postComments = await db.select()
      .from(comments)
      .where(and(
        eq(comments.postId, postId),
        whereNotDeleted(comments)
      ))
      .orderBy(desc(comments.createdAt));
    return postComments;
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments)
      .values({
        ...comment,
        upvotes: 0,
        downvotes: 0,
      } as any)
      .returning();

    // Update post comment count
    if (newComment.postId) {
      await db.update(posts)
        .set({ commentCount: sql`${posts.commentCount} + 1` })
        .where(eq(posts.id, newComment.postId));
    }

    return newComment;
  }
  
  async upvoteComment(id: number): Promise<Comment> {
    const [updated] = await db.update(comments)
      .set({ upvotes: sql`${comments.upvotes} + 1` })
      .where(and(eq(comments.id, id), whereNotDeleted(comments)))
      .returning();

    if (!updated) {
      throw new Error('Comment not found');
    }

    return updated;
  }
  
  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select()
      .from(groups)
      .where(eq(groups.id, id))
      .limit(1);
    return group;
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    const userGroups = await db.select()
      .from(groupMembers)
      .leftJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId));

    return userGroups.map(ug => ug.groups as Group).filter(Boolean);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups)
      .values(group as any)
      .returning();
    return newGroup;
  }

  // Group member methods
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [newMember] = await db.insert(groupMembers)
      .values(member as any)
      .returning();
    return newMember;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db.select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }

  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.role, 'admin')
      ))
      .limit(1);

    return !!member;
  }

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db.select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId)
      ))
      .limit(1);

    return !!member;
  }

  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return await db
      .select()
      .from(apologeticsResources)
      .orderBy(desc(apologeticsResources.createdAt));
  }

  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    const [resource] = await db
      .select()
      .from(apologeticsResources)
      .where(eq(apologeticsResources.id, id));

    return resource;
  }

  async createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const [created] = await db.insert(apologeticsResources).values(resource).returning();
    return created;
  }
  
  // Prayer request methods
  async getPublicPrayerRequests(): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.privacyLevel, 'public'))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getAllPrayerRequests(filter?: string): Promise<PrayerRequest[]> {
    let query = db.select().from(prayerRequests);

    if (filter === 'answered') {
      query = query.where(eq(prayerRequests.isAnswered, true));
    } else if (filter === 'active') {
      query = query.where(eq(prayerRequests.isAnswered, false));
    }

    return await query.orderBy(desc(prayerRequests.createdAt));
  }

  async getPrayerRequest(id: number): Promise<PrayerRequest | undefined> {
    const [prayer] = await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.id, id))
      .limit(1);
    return prayer;
  }

  async getUserPrayerRequests(userId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.authorId, userId))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getGroupPrayerRequests(groupId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.groupId, groupId))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getCommunityPrayerRequests(communityId: number): Promise<PrayerRequest[]> {
    return await db.select()
      .from(prayerRequests)
      .where(eq(prayerRequests.communityId, communityId))
      .orderBy(desc(prayerRequests.createdAt));
  }

  async getPrayerRequestsVisibleToUser(userId: number): Promise<PrayerRequest[]> {
    // Get user's groups
    const userGroups = await db.select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    const groupIds = userGroups.map(g => g.groupId);
    
    // Get prayer requests visible to user
    const conditions = [];
    
    // Public prayer requests
    conditions.push(eq(prayerRequests.privacyLevel, 'public'));
    
    // Prayer requests from groups the user is in
    if (groupIds.length > 0) {
      conditions.push(and(
        eq(prayerRequests.privacyLevel, 'group-only'),
        inArray(prayerRequests.groupId, groupIds)
      ));
    }
    
    // User's own prayer requests
    conditions.push(eq(prayerRequests.authorId, userId));
    
    return await db.select().from(prayerRequests).where(or(...conditions));
  }
  
  async createPrayerRequest(prayer: InsertPrayerRequest): Promise<PrayerRequest> {
    const [newPrayer] = await db.insert(prayerRequests)
      .values({
        ...prayer,
        prayerCount: 0,
        isAnswered: false,
        answeredDescription: null,
      } as any)
      .returning();
    return newPrayer;
  }

  async updatePrayerRequest(id: number, prayer: Partial<InsertPrayerRequest>): Promise<PrayerRequest> {
    const [updated] = await db.update(prayerRequests)
      .set({ ...prayer, updatedAt: new Date() })
      .where(eq(prayerRequests.id, id))
      .returning();

    if (!updated) {
      throw new Error('Prayer request not found');
    }

    return updated;
  }

  async markPrayerRequestAsAnswered(id: number, description: string): Promise<PrayerRequest> {
    const [updated] = await db.update(prayerRequests)
      .set({
        isAnswered: true,
        answeredDescription: description,
        updatedAt: new Date()
      })
      .where(eq(prayerRequests.id, id))
      .returning();

    if (!updated) {
      throw new Error('Prayer request not found');
    }

    return updated;
  }

  async deletePrayerRequest(id: number): Promise<boolean> {
    const result = await db.delete(prayerRequests)
      .where(eq(prayerRequests.id, id));
    return true;
  }

  async searchPrayerRequests(searchTerm: string): Promise<PrayerRequest[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(prayerRequests)
      .where(or(
        like(prayerRequests.title, term),
        like(prayerRequests.description, term)
      ));
  }

  // Prayer methods
  async createPrayer(prayer: InsertPrayer): Promise<Prayer> {
    const [newPrayer] = await db.insert(prayers)
      .values(prayer as any)
      .returning();

    // Increment prayer count on the prayer request
    await db.update(prayerRequests)
      .set({ prayerCount: sql`${prayerRequests.prayerCount} + 1` })
      .where(eq(prayerRequests.id, prayer.prayerRequestId));

    return newPrayer;
  }

  async getPrayersForRequest(prayerRequestId: number): Promise<Prayer[]> {
    return await db.select()
      .from(prayers)
      .where(eq(prayers.prayerRequestId, prayerRequestId))
      .orderBy(desc(prayers.prayedAt));
  }

  async getUserPrayedRequests(userId: number): Promise<number[]> {
    const prayers = await db.select({ prayerRequestId: prayers.prayerRequestId })
      .from(prayers)
      .where(eq(prayers.userId, userId));

    return prayers.map(p => p.prayerRequestId);
  }

  // Apologetics Q&A methods
  async getAllApologeticsTopics(): Promise<ApologeticsTopic[]> {
    return await db
      .select()
      .from(apologeticsTopics)
      .orderBy(desc(apologeticsTopics.createdAt));
  }

  async getApologeticsTopic(id: number): Promise<ApologeticsTopic | undefined> {
    const [topic] = await db
      .select()
      .from(apologeticsTopics)
      .where(eq(apologeticsTopics.id, id));

    return topic;
  }

  async getApologeticsTopicBySlug(slug: string): Promise<ApologeticsTopic | undefined> {
    const [topic] = await db
      .select()
      .from(apologeticsTopics)
      .where(eq(apologeticsTopics.slug, slug));

    return topic;
  }

  async createApologeticsTopic(topic: InsertApologeticsTopic): Promise<ApologeticsTopic> {
    const [created] = await db.insert(apologeticsTopics).values(topic).returning();
    return created;
  }

  async getAllApologeticsQuestions(filterByStatus?: string): Promise<ApologeticsQuestion[]> {
    let query: any = db.select().from(apologeticsQuestions);

    if (filterByStatus) {
      query = query.where(eq(apologeticsQuestions.status, filterByStatus));
    }

    return await query.orderBy(desc(apologeticsQuestions.createdAt));
  }

  async getApologeticsQuestion(id: number): Promise<ApologeticsQuestion | undefined> {
    const [question] = await db
      .select()
      .from(apologeticsQuestions)
      .where(eq(apologeticsQuestions.id, id));

    return question;
  }

  async getApologeticsQuestionsByTopic(topicId: number): Promise<ApologeticsQuestion[]> {
    return await db
      .select()
      .from(apologeticsQuestions)
      .where(eq(apologeticsQuestions.topicId, topicId))
      .orderBy(desc(apologeticsQuestions.createdAt));
  }

  async createApologeticsQuestion(question: InsertApologeticsQuestion): Promise<ApologeticsQuestion> {
    const [created] = await db.insert(apologeticsQuestions).values(question).returning();
    return created;
  }

  async updateApologeticsQuestionStatus(id: number, status: string): Promise<ApologeticsQuestion> {
    const [updated] = await db
      .update(apologeticsQuestions)
      .set({ status })
      .where(eq(apologeticsQuestions.id, id))
      .returning();

    if (!updated) throw new Error('Question not found');
    return updated;
  }

  async searchApologeticsQuestions(searchTerm: string): Promise<ApologeticsQuestion[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(apologeticsQuestions)
      .where(or(
        like(apologeticsQuestions.title, term),
        like(apologeticsQuestions.content, term)
      ));
  }

  async getApologeticsAnswersByQuestion(questionId: number): Promise<ApologeticsAnswer[]> {
    return await db
      .select()
      .from(apologeticsAnswers)
      .where(eq(apologeticsAnswers.questionId, questionId))
      .orderBy(desc(apologeticsAnswers.createdAt));
  }

  async createApologeticsAnswer(answer: InsertApologeticsAnswer): Promise<ApologeticsAnswer> {
    const [created] = await db.insert(apologeticsAnswers).values(answer).returning();
    return created;
  }

  async upvoteApologeticsAnswer(id: number): Promise<ApologeticsAnswer> {
    const answer = await db.select()
      .from(apologeticsAnswers)
      .where(eq(apologeticsAnswers.id, id))
      .limit(1);

    if (!answer || answer.length === 0) {
      throw new Error('Answer not found');
    }

    await db.update(apologeticsAnswers)
      .set({ upvotes: sql`${apologeticsAnswers.upvotes} + 1` })
      .where(eq(apologeticsAnswers.id, id));

    const updated = await db.select()
      .from(apologeticsAnswers)
      .where(eq(apologeticsAnswers.id, id))
      .limit(1);

    return updated[0];
  }

  async incrementApologeticsQuestionViews(id: number): Promise<void> {
    await db.update(apologeticsQuestions)
      .set({ viewCount: sql`${apologeticsQuestions.viewCount} + 1` })
      .where(eq(apologeticsQuestions.id, id));
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    // Events don't have soft delete (no deletedAt column)
    const allEvents = await db.select()
      .from(events)
      .orderBy(events.eventDate, events.startTime);
    return allEvents;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);
    return event;
  }
  
  async getUserEvents(userId: number): Promise<Event[]> {
    const userEvents = await db.select()
      .from(events)
      .where(eq(events.creatorId, userId))
      .orderBy(events.eventDate, events.startTime);
    return userEvents;
  }
  
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events)
      .values(event as any)
      .returning();
    return newEvent;
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<Event> {
    const [updated] = await db.update(events)
      .set(data as any)
      .where(eq(events.id, id))
      .returning();

    if (!updated) {
      throw new Error('Event not found');
    }

    return updated;
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    // Events don't have soft delete - use hard delete
    const result = await db.delete(events)
      .where(eq(events.id, id));
    return true;
  }

  async searchEvents(searchTerm: string): Promise<Event[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(events)
      .where(
        or(
          like(events.title, term),
          like(events.description, term),
          like(events.location, term)
        )
      );
  }

  async getNearbyEvents(latitude: number, longitude: number, radius: number): Promise<Event[]> {
    const rows = await db.select()
      .from(events)
      .where(and(
        sql`${events.latitude} IS NOT NULL`,
        sql`${events.longitude} IS NOT NULL`
      ));

    const filtered = rows.filter(event => {
      const eventLat = coerceCoordinate((event as any).latitude);
      const eventLng = coerceCoordinate((event as any).longitude);
      if (eventLat === null || eventLng === null) return false;
      const distance = haversineDistanceMiles(latitude, longitude, eventLat, eventLng);
      return distance <= radius;
    });

    return filtered.sort((a, b) => new Date(a.eventDate as any).getTime() - new Date(b.eventDate as any).getTime());
  }
  
  // Event RSVP methods
  async createEventRSVP(rsvp: InsertEventRsvp): Promise<EventRsvp> {
    const [newRsvp] = await db.insert(eventRsvps).values(rsvp as any).returning();
    return newRsvp as EventRsvp;
  }

  async getEventRSVPs(eventId: number): Promise<EventRsvp[]> {
    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
    return rsvps as EventRsvp[];
  }

  async getUserEventRSVP(eventId: number, userId: number): Promise<EventRsvp | undefined> {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(
        eq(eventRsvps.eventId, eventId),
        eq(eventRsvps.userId, userId)
      ));
    return rsvp as EventRsvp | undefined;
  }

  async upsertEventRSVP(eventId: number, userId: number, status: string): Promise<EventRsvp> {
    const values = { eventId, userId, status } as InsertEventRsvp;
    const [row] = await db.insert(eventRsvps).values(values as any).onConflictDoUpdate({
      target: [eventRsvps.eventId, eventRsvps.userId],
      set: { status },
    }).returning();
    return row as EventRsvp;
  }

  async deleteEventRSVP(id: number): Promise<boolean> {
    const result = await db.delete(eventRsvps).where(eq(eventRsvps.id, id));
    return true;
  }
  
  // Livestream methods
  async getAllLivestreams(): Promise<Livestream[]> {
    return await db.select()
      .from(livestreams)
      .orderBy(desc(livestreams.createdAt));
  }
  
  async createLivestream(livestream: InsertLivestream): Promise<Livestream> {
    const result = await db.insert(livestreams).values(livestream as any).returning();
    return result[0];
  }
  
  // Microblog methods
  async getAllMicroblogs(): Promise<Microblog[]> {
    const allMicroblogs = await db.select()
      .from(microblogs)
      .orderBy(desc(microblogs.createdAt));
    return allMicroblogs;
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    const [microblog] = await db.select()
      .from(microblogs)
      .where(eq(microblogs.id, id))
      .limit(1);
    return microblog;
  }
  
  async getUserMicroblogs(userId: number): Promise<Microblog[]> {
    const userMicroblogs = await db.select()
      .from(microblogs)
      .where(eq(microblogs.authorId, userId))
      .orderBy(desc(microblogs.createdAt));
    return userMicroblogs;
  }

  async getFollowingMicroblogs(userId: number): Promise<Microblog[]> {
    // Get IDs of users that this user follows
    const following = await db.select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get microblogs from followed users
    const followingMicroblogs = await db.select()
      .from(microblogs)
      .where(sql`${microblogs.authorId} IN (${sql.join(followingIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(microblogs.createdAt));

    return followingMicroblogs;
  }

  async createMicroblog(microblog: InsertMicroblog): Promise<Microblog> {
    const [newMicroblog] = await db.insert(microblogs)
      .values({
        ...microblog,
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
      } as any)
      .returning();
    return newMicroblog;
  }

  async updateMicroblog(id: number, data: Partial<Microblog>): Promise<Microblog> {
    const [updated] = await db.update(microblogs)
      .set(data)
      .where(eq(microblogs.id, id))
      .returning();

    if (!updated) {
      throw new Error('Microblog not found');
    }

    return updated;
  }

  async deleteMicroblog(id: number): Promise<boolean> {
    const result = await db.delete(microblogs)
      .where(eq(microblogs.id, id));
    return true;
  }

  async searchMicroblogs(searchTerm: string): Promise<Microblog[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(microblogs)
      .where(like(microblogs.content, term));
  }

  // Microblog like methods
  async likeMicroblog(microblogId: number, userId: number): Promise<MicroblogLike> {
    // Check if already liked
    const existing = await db
      .select()
      .from(microblogLikes)
      .where(and(
        eq(microblogLikes.microblogId, microblogId),
        eq(microblogLikes.userId, userId)
      ));

    if (existing.length > 0) {
      throw new Error('Already liked');
    }

    // Insert like
    const [newLike] = await db
      .insert(microblogLikes)
      .values({ microblogId, userId } as any)
      .returning();

    // Increment like count
    await db
      .update(microblogs)
      .set({ likeCount: sql`COALESCE(${microblogs.likeCount}, 0) + 1` as any })
      .where(eq(microblogs.id, microblogId));

    return newLike;
  }

  async unlikeMicroblog(microblogId: number, userId: number): Promise<boolean> {
    // Delete like
    const deleted = await db
      .delete(microblogLikes)
      .where(and(
        eq(microblogLikes.microblogId, microblogId),
        eq(microblogLikes.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) return false;

    // Decrement like count
    await db
      .update(microblogs)
      .set({ likeCount: sql`GREATEST(COALESCE(${microblogs.likeCount}, 0) - 1, 0)` as any })
      .where(eq(microblogs.id, microblogId));

    return true;
  }

  async getUserLikedMicroblogs(userId: number): Promise<Microblog[]> {
    const likes = await db
      .select()
      .from(microblogLikes)
      .where(eq(microblogLikes.userId, userId));

    const microblogIds = likes.map(l => l.microblogId);
    if (microblogIds.length === 0) return [];

    return await db
      .select()
      .from(microblogs)
      .where(inArray(microblogs.id, microblogIds));
  }

  // Microblog repost methods
  async repostMicroblog(microblogId: number, userId: number): Promise<MicroblogRepost> {
    // Check if already reposted
    const existing = await db
      .select()
      .from(microblogReposts)
      .where(and(
        eq(microblogReposts.microblogId, microblogId),
        eq(microblogReposts.userId, userId)
      ));

    if (existing.length > 0) {
      throw new Error('Already reposted');
    }

    // Insert repost
    const [newRepost] = await db
      .insert(microblogReposts)
      .values({ microblogId, userId } as any)
      .returning();

    // Increment repost count
    await db
      .update(microblogs)
      .set({ repostCount: sql`COALESCE(${microblogs.repostCount}, 0) + 1` as any })
      .where(eq(microblogs.id, microblogId));

    return newRepost;
  }

  async unrepostMicroblog(microblogId: number, userId: number): Promise<boolean> {
    // Delete repost
    const deleted = await db
      .delete(microblogReposts)
      .where(and(
        eq(microblogReposts.microblogId, microblogId),
        eq(microblogReposts.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) return false;

    // Decrement repost count
    await db
      .update(microblogs)
      .set({ repostCount: sql`GREATEST(COALESCE(${microblogs.repostCount}, 0) - 1, 0)` as any })
      .where(eq(microblogs.id, microblogId));

    return true;
  }

  // Microblog bookmark methods
  async bookmarkMicroblog(microblogId: number, userId: number): Promise<MicroblogBookmark> {
    // Check if already bookmarked
    const existing = await db
      .select()
      .from(microblogBookmarks)
      .where(and(
        eq(microblogBookmarks.microblogId, microblogId),
        eq(microblogBookmarks.userId, userId)
      ));

    if (existing.length > 0) {
      throw new Error('Already bookmarked');
    }

    // Insert bookmark
    const [newBookmark] = await db
      .insert(microblogBookmarks)
      .values({ microblogId, userId } as any)
      .returning();

    return newBookmark;
  }

  async unbookmarkMicroblog(microblogId: number, userId: number): Promise<boolean> {
    // Delete bookmark
    const deleted = await db
      .delete(microblogBookmarks)
      .where(and(
        eq(microblogBookmarks.microblogId, microblogId),
        eq(microblogBookmarks.userId, userId)
      ))
      .returning();

    return deleted.length > 0;
  }

  async getUserBookmarkedMicroblogs(userId: number): Promise<Microblog[]> {
    const bookmarks = await db
      .select()
      .from(microblogBookmarks)
      .where(eq(microblogBookmarks.userId, userId));

    // Filter out any bookmarks with invalid IDs
    const microblogIds = bookmarks
      .map(b => b.microblogId)
      .filter(id => id != null && !isNaN(id));

    if (microblogIds.length === 0) return [];

    return await db
      .select()
      .from(microblogs)
      .where(inArray(microblogs.id, microblogIds))
      .orderBy(desc(microblogs.createdAt));
  }

  // Microblog engagement check methods
  async hasUserLikedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(microblogLikes)
      .where(and(
        eq(microblogLikes.microblogId, microblogId),
        eq(microblogLikes.userId, userId)
      ))
      .limit(1);

    return !!like;
  }

  async hasUserRepostedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const [repost] = await db
      .select()
      .from(microblogReposts)
      .where(and(
        eq(microblogReposts.microblogId, microblogId),
        eq(microblogReposts.userId, userId)
      ))
      .limit(1);

    return !!repost;
  }

  async hasUserBookmarkedMicroblog(microblogId: number, userId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(microblogBookmarks)
      .where(and(
        eq(microblogBookmarks.microblogId, microblogId),
        eq(microblogBookmarks.userId, userId)
      ))
      .limit(1);

    return !!bookmark;
  }

  // ============================================================================
  // HASHTAG METHODS (DbStorage)
  // ============================================================================

  /**
   * Get or create hashtag by tag
   */
  async getOrCreateHashtag(tag: string, displayTag: string): Promise<Hashtag> {
    const normalized = tag.toLowerCase();

    const [existing] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.tag, normalized))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [newHashtag] = await db
      .insert(hashtags)
      .values({
        tag: normalized,
        displayTag,
        usageCount: 0,
        trendingScore: 0,
        lastUsedAt: new Date(),
      } as any)
      .returning();

    return newHashtag;
  }

  /**
   * Link hashtag to microblog
   */
  async linkHashtagToMicroblog(microblogId: number, hashtagId: number): Promise<void> {
    await db
      .insert(microblogHashtags)
      .values({ microblogId, hashtagId } as any)
      .onConflictDoNothing();
  }

  /**
   * Get trending hashtags (top N by trending score)
   */
  async getTrendingHashtags(limit: number = 10): Promise<Hashtag[]> {
    return await db
      .select()
      .from(hashtags)
      .orderBy(desc(hashtags.trendingScore))
      .limit(limit);
  }

  /**
   * Get microblogs by hashtag (sorted by engagement)
   */
  async getMicroblogsByHashtag(hashtagTag: string, limit: number = 20): Promise<Microblog[]> {
    const normalized = hashtagTag.toLowerCase();

    const [hashtag] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.tag, normalized))
      .limit(1);

    if (!hashtag) return [];

    const results = await db
      .select({ microblog: microblogs })
      .from(microblogHashtags)
      .innerJoin(microblogs, eq(microblogHashtags.microblogId, microblogs.id))
      .where(eq(microblogHashtags.hashtagId, hashtag.id))
      .orderBy(
        desc(sql`COALESCE(${microblogs.likeCount}, 0) + COALESCE(${microblogs.repostCount}, 0) + COALESCE(${microblogs.replyCount}, 0)`)
      )
      .limit(limit);

    return results.map(r => r.microblog);
  }

  /**
   * Update trending scores for all hashtags
   * Formula: (recent_usage * 10) + (recent_likes * 5) + (recent_reposts * 7) + (recent_comments * 3)
   */
  async updateTrendingScores(): Promise<void> {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    await db.execute(sql`
      UPDATE hashtags h
      SET
        trending_score = COALESCE(engagement_data.score, 0),
        updated_at = NOW()
      FROM (
        SELECT
          mh.hashtag_id,
          (COUNT(DISTINCT m.id) * 10 +
           SUM(COALESCE(m.like_count, 0)) * 5 +
           SUM(COALESCE(m.repost_count, 0)) * 7 +
           SUM(COALESCE(m.reply_count, 0)) * 3) as score
        FROM microblog_hashtags mh
        INNER JOIN microblogs m ON mh.microblog_id = m.id
        WHERE m.created_at >= ${fourHoursAgo}
        GROUP BY mh.hashtag_id
      ) engagement_data
      WHERE h.id = engagement_data.hashtag_id
    `);

    await db.execute(sql`
      UPDATE hashtags
      SET trending_score = 0, updated_at = NOW()
      WHERE id NOT IN (
        SELECT DISTINCT mh.hashtag_id
        FROM microblog_hashtags mh
        INNER JOIN microblogs m ON mh.microblog_id = m.id
        WHERE m.created_at >= ${fourHoursAgo}
      )
    `);
  }

  /**
   * Process hashtags when creating a microblog
   */
  async processMicroblogHashtags(microblogId: number, content: string): Promise<void> {
    
    const extractedHashtags = extractHashtags(content);

    for (const { tag, displayTag } of extractedHashtags) {
      const hashtag = await this.getOrCreateHashtag(tag, displayTag);
      await this.linkHashtagToMicroblog(microblogId, hashtag.id);

      await db
        .update(hashtags)
        .set({
          usageCount: sql`${hashtags.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hashtags.id, hashtag.id));
    }
  }

  // ============================================================================
  // KEYWORD METHODS (DbStorage)
  // ============================================================================

  /**
   * Get or create keyword by keyword string
   */
  async getOrCreateKeyword(keyword: string, displayKeyword: string, isProperNoun: boolean = false): Promise<any> {
    const normalized = keyword.toLowerCase();

    const [existing] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.keyword, normalized))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [newKeyword] = await db
      .insert(keywords)
      .values({
        keyword: normalized,
        displayKeyword,
        isProperNoun,
        usageCount: 0,
        trendingScore: 0,
        lastUsedAt: new Date(),
      } as any)
      .returning();

    return newKeyword;
  }

  /**
   * Link keyword to microblog
   */
  async linkKeywordToMicroblog(microblogId: number, keywordId: number, frequency: number): Promise<void> {
    await db
      .insert(microblogKeywords)
      .values({ microblogId, keywordId, frequency } as any)
      .onConflictDoNothing();
  }

  /**
   * Link keyword to post
   */
  async linkKeywordToPost(postId: number, keywordId: number, frequency: number): Promise<void> {
    await db
      .insert(postKeywords)
      .values({ postId, keywordId, frequency } as any)
      .onConflictDoNothing();
  }

  /**
   * Get trending keywords (top N by trending score)
   */
  async getTrendingKeywords(limit: number = 10): Promise<any[]> {
    return await db
      .select()
      .from(keywords)
      .orderBy(desc(keywords.trendingScore))
      .limit(limit);
  }

  /**
   * Get microblogs by keyword (sorted by engagement)
   */
  async getMicroblogsByKeyword(keyword: string, limit: number = 20): Promise<Microblog[]> {
    const normalized = keyword.toLowerCase();

    const [keywordRecord] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.keyword, normalized))
      .limit(1);

    if (!keywordRecord) return [];

    const results = await db
      .select({ microblog: microblogs })
      .from(microblogKeywords)
      .innerJoin(microblogs, eq(microblogKeywords.microblogId, microblogs.id))
      .where(eq(microblogKeywords.keywordId, keywordRecord.id))
      .orderBy(
        desc(sql`COALESCE(${microblogs.likeCount}, 0) + COALESCE(${microblogs.repostCount}, 0) + COALESCE(${microblogs.replyCount}, 0)`)
      )
      .limit(limit);

    return results.map(r => r.microblog);
  }

  /**
   * Get posts by keyword (sorted by engagement)
   */
  async getPostsByKeyword(keyword: string, limit: number = 20): Promise<any[]> {
    const normalized = keyword.toLowerCase();

    const [keywordRecord] = await db
      .select()
      .from(keywords)
      .where(eq(keywords.keyword, normalized))
      .limit(1);

    if (!keywordRecord) return [];

    const results = await db
      .select({ post: posts })
      .from(postKeywords)
      .innerJoin(posts, eq(postKeywords.postId, posts.id))
      .where(eq(postKeywords.keywordId, keywordRecord.id))
      .orderBy(
        desc(sql`COALESCE(${posts.upvotes}, 0) - COALESCE(${posts.downvotes}, 0)`)
      )
      .limit(limit);

    return results.map(r => r.post);
  }

  /**
   * Process keywords when creating a microblog
   */
  async processMicroblogKeywords(microblogId: number, content: string): Promise<void> {
    const { extractKeywords } = await import('./utils/keywordExtractor');
    const extractedKeywords = extractKeywords(content);

    for (const { keyword, displayKeyword, isProperNoun, frequency } of extractedKeywords) {
      const keywordRecord = await this.getOrCreateKeyword(keyword, displayKeyword, isProperNoun);
      await this.linkKeywordToMicroblog(microblogId, keywordRecord.id, frequency);

      await db
        .update(keywords)
        .set({
          usageCount: sql`${keywords.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(keywords.id, keywordRecord.id));
    }
  }

  /**
   * Process keywords when creating a post
   */
  async processPostKeywords(postId: number, title: string, content: string): Promise<void> {
    const { extractKeywords } = await import('./utils/keywordExtractor');
    const combinedText = `${title} ${content}`;
    const extractedKeywords = extractKeywords(combinedText);

    for (const { keyword, displayKeyword, isProperNoun, frequency } of extractedKeywords) {
      const keywordRecord = await this.getOrCreateKeyword(keyword, displayKeyword, isProperNoun);
      await this.linkKeywordToPost(postId, keywordRecord.id, frequency);

      await db
        .update(keywords)
        .set({
          usageCount: sql`${keywords.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(keywords.id, keywordRecord.id));
    }
  }

  /**
   * Update trending scores for all keywords
   * Formula: (recent_usage * 10) + (recent_likes * 5) + (recent_reposts * 7) + (recent_comments * 3)
   */
  async updateKeywordTrendingScores(): Promise<void> {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    // Update scores for keywords with recent activity
    await db.execute(sql`
      UPDATE keywords k
      SET
        trending_score = COALESCE(engagement_data.score, 0),
        updated_at = NOW()
      FROM (
        SELECT
          mk.keyword_id,
          (COUNT(DISTINCT m.id) * 10 +
           SUM(COALESCE(m.like_count, 0)) * 5 +
           SUM(COALESCE(m.repost_count, 0)) * 7 +
           SUM(COALESCE(m.reply_count, 0)) * 3) as score
        FROM microblog_keywords mk
        INNER JOIN microblogs m ON mk.microblog_id = m.id
        WHERE m.created_at >= ${fourHoursAgo}
        GROUP BY mk.keyword_id
      ) engagement_data
      WHERE k.id = engagement_data.keyword_id
    `);

    // Reset scores for keywords with no recent activity
    await db.execute(sql`
      UPDATE keywords
      SET trending_score = 0, updated_at = NOW()
      WHERE id NOT IN (
        SELECT DISTINCT mk.keyword_id
        FROM microblog_keywords mk
        INNER JOIN microblogs m ON mk.microblog_id = m.id
        WHERE m.created_at >= ${fourHoursAgo}
      )
    `);
  }

  // ============================================================================
  // POST BOOKMARK METHODS (DbStorage)
  // ============================================================================

  async bookmarkPost(postId: number, userId: number): Promise<PostBookmark> {
    // Check if already bookmarked
    const existing = await db
      .select()
      .from(postBookmarks)
      .where(and(
        eq(postBookmarks.postId, postId),
        eq(postBookmarks.userId, userId)
      ));

    if (existing.length > 0) {
      throw new Error('Already bookmarked');
    }

    // Insert bookmark
    const [newBookmark] = await db
      .insert(postBookmarks)
      .values({ postId, userId } as any)
      .returning();

    return newBookmark;
  }

  async unbookmarkPost(postId: number, userId: number): Promise<boolean> {
    // Delete bookmark
    const deleted = await db
      .delete(postBookmarks)
      .where(and(
        eq(postBookmarks.postId, postId),
        eq(postBookmarks.userId, userId)
      ))
      .returning();

    return deleted.length > 0;
  }

  async getUserBookmarkedPosts(userId: number): Promise<Post[]> {
    const bookmarks = await db
      .select()
      .from(postBookmarks)
      .where(eq(postBookmarks.userId, userId));

    // Filter out any bookmarks with invalid IDs
    const postIds = bookmarks
      .map(b => b.postId)
      .filter(id => id != null && !isNaN(id));

    if (postIds.length === 0) return [];

    return await db
      .select()
      .from(posts)
      .where(and(
        inArray(posts.id, postIds),
        isNull(posts.deletedAt)
      ))
      .orderBy(desc(posts.createdAt));
  }

  async hasUserBookmarkedPost(postId: number, userId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(postBookmarks)
      .where(and(
        eq(postBookmarks.postId, postId),
        eq(postBookmarks.userId, userId)
      ))
      .limit(1);

    return !!bookmark;
  }
  
  async createLivestreamerApplication(application: InsertLivestreamerApplication): Promise<LivestreamerApplication> {
    throw new Error('Not implemented');
  }
  
  async updateLivestreamerApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<LivestreamerApplication> {
    throw new Error('Not implemented');
  }
  
  async isApprovedLivestreamer(userId: number): Promise<boolean> {
    return false;
  }
  
  // Apologist Scholar application methods
  async getApologistScholarApplicationByUserId(userId: number): Promise<ApologistScholarApplication | undefined> {
    return undefined;
  }
  
  async getPendingApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return [];
  }
  
  async createApologistScholarApplication(application: InsertApologistScholarApplication): Promise<ApologistScholarApplication> {
    throw new Error('Not implemented');
  }
  
  async updateApologistScholarApplication(id: number, status: string, reviewNotes: string, reviewerId: number): Promise<ApologistScholarApplication> {
    throw new Error('Not implemented');
  }
  
  // Bible Reading Plan methods
  async getAllBibleReadingPlans(): Promise<BibleReadingPlan[]> {
    return [];
  }
  
  async getBibleReadingPlan(id: number): Promise<BibleReadingPlan | undefined> {
    return undefined;
  }
  
  async createBibleReadingPlan(plan: InsertBibleReadingPlan): Promise<BibleReadingPlan> {
    throw new Error('Not implemented');
  }
  
  // Bible Reading Progress methods
  async getBibleReadingProgress(userId: number, planId: number): Promise<BibleReadingProgress | undefined> {
    return undefined;
  }
  
  async createBibleReadingProgress(progress: InsertBibleReadingProgress): Promise<BibleReadingProgress> {
    throw new Error('Not implemented');
  }
  
  async markDayCompleted(progressId: number, day: string): Promise<BibleReadingProgress> {
    throw new Error('Not implemented');
  }
  
  // Bible Study Note methods
  async getBibleStudyNotes(userId: number): Promise<BibleStudyNote[]> {
    return [];
  }
  
  async getBibleStudyNote(id: number): Promise<BibleStudyNote | undefined> {
    return undefined;
  }
  
  async createBibleStudyNote(note: InsertBibleStudyNote): Promise<BibleStudyNote> {
    throw new Error('Not implemented');
  }
  
  async updateBibleStudyNote(id: number, data: Partial<BibleStudyNote>): Promise<BibleStudyNote> {
    throw new Error('Not implemented');
  }
  
  async deleteBibleStudyNote(id: number): Promise<boolean> {
    return false;
  }
  
  // Admin methods
  async getAllLivestreamerApplications(): Promise<LivestreamerApplication[]> {
    return await db.select().from(livestreamerApplications);
  }
  
  async getAllApologistScholarApplications(): Promise<ApologistScholarApplication[]> {
    return await db.select().from(apologistScholarApplications);
  }
  
  async getLivestreamerApplicationStats(): Promise<any> {
    const all = await db.select().from(livestreamerApplications);
    return {
      total: all.length,
      pending: all.filter(a => a.status === 'pending').length,
      approved: all.filter(a => a.status === 'approved').length,
      rejected: all.filter(a => a.status === 'rejected').length
    };
  }
  
  async updateLivestreamerApplicationStatus(id: number, status: string, reviewNotes?: string): Promise<LivestreamerApplication> {
    const result = await db.update(livestreamerApplications)
      .set({ 
        status: status as any,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date()
      })
      .where(eq(livestreamerApplications.id, id))
      .returning();
    
    if (!result[0]) throw new Error('Application not found');
    return result[0];
  }
  
  async deleteUser(userId: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, userId));
    return result.rowCount > 0;
  }
  
  // Direct Messaging methods
  async getDirectMessages(userId1: number, userId2: number): Promise<any[]> {
    const result = await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);

    // Enrich messages with sender and receiver user information
    const enrichedMessages = [];
    for (const msg of result) {
      const sender = await this.getUser(msg.senderId);
      const receiver = await this.getUser(msg.receiverId);

      enrichedMessages.push({
        ...msg,
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          displayName: sender.displayName,
          profileImageUrl: sender.profileImageUrl,
        } : null,
        receiver: receiver ? {
          id: receiver.id,
          username: receiver.username,
          displayName: receiver.displayName,
          profileImageUrl: receiver.profileImageUrl,
        } : null,
      });
    }

    return enrichedMessages;
  }
  
  async createDirectMessage(message: any): Promise<any> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getUserConversations(userId: number): Promise<any[]> {
    // Get all messages for this user
    const userMessages = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        createdAt: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));

    // Group by conversation partner
    const conversationMap = new Map();

    for (const msg of userMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!conversationMap.has(otherUserId)) {
        // Get unread count for this conversation
        const unreadMessages = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.senderId, otherUserId),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        conversationMap.set(otherUserId, {
          otherUserId,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: unreadMessages[0]?.count || 0
        });
      }
    }

    // Get user details for each conversation
    const conversations = [];
    for (const [otherUserId, conv] of conversationMap) {
      const otherUser = await this.getUser(otherUserId);
      conversations.push({
        id: otherUserId, // Add ID for mobile app
        otherUser: { // Nest user info
          id: otherUserId,
          username: otherUser?.username || 'Unknown',
          displayName: otherUser?.displayName,
          profileImageUrl: otherUser?.profileImageUrl
        },
        lastMessage: { // Nest last message info
          content: conv.lastMessage,
          createdAt: conv.lastMessageTime,
          senderId: conv.lastMessage?.senderId || otherUserId // Include sender for better context
        },
        unreadCount: conv.unreadCount
      });
    }

    return conversations;
  }

  async markMessageAsRead(messageId: string, userId: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(messages.id, messageId),
          eq(messages.receiverId, userId)
        )
      )
      .returning();

    return result.length > 0;
  }

  async markConversationAsRead(userId: number, otherUserId: number): Promise<number> {
    const result = await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      )
      .returning();

    return result.length;
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  // Push token + notifications (DB) - stubs until full implementation
  async savePushToken(token: any): Promise<any> {
    // Insert or update by token (unique). Return the row.
    const existing = await db.select().from(pushTokens).where(eq(pushTokens.token, token.token));
    if (existing && existing.length > 0) {
      const [row] = await db.update(pushTokens).set({ userId: token.userId, platform: token.platform || existing[0].platform, lastUsed: new Date() }).where(eq(pushTokens.token, token.token)).returning();
      return row;
    }

    const [inserted] = await db.insert(pushTokens).values({ userId: token.userId, token: token.token, platform: token.platform || 'unknown', lastUsed: token.lastUsed || new Date() } as any).returning();
    return inserted;
  }

  async getUserPushTokens(userId: number): Promise<any[]> {
    return await db.select().from(pushTokens).where(eq(pushTokens.userId, userId));
  }

  async deletePushToken(token: string, userId: number): Promise<'deleted'|'notfound'|'forbidden'> {
    const rows = await db.select().from(pushTokens).where(eq(pushTokens.token, token));
    if (!rows || rows.length === 0) return 'notfound';
    const row = rows[0] as any;
    if (row.userId !== userId) return 'forbidden';
    await db.delete(pushTokens).where(eq(pushTokens.token, token));
    return 'deleted';
  }

  async getUserNotifications(userId: number): Promise<any[]> {
    // Only return notifications for the user; order by newest
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(notifications.createdAt);
  }

  async markNotificationAsRead(id: number, userId: number): Promise<boolean> {
    const rows = await db.select().from(notifications).where(eq(notifications.id, id));
    if (!rows || rows.length === 0) return false;
    const n = rows[0] as any;
    if (n.userId !== userId) return false;
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return true;
  }

  async createNotification(notification: { userId: number; title: string; body: string; data?: any; category?: string }): Promise<any> {
    const [newNotification] = await db.insert(notifications)
      .values({
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        data: notification.data || null,
        category: notification.category || 'general',
        isRead: false
      })
      .returning();

    return newNotification;
  }
}

// Export storage instance - switch based on environment
export const storage: IStorage = process.env.USE_DB === 'true'
  ? new DbStorage()
  : new MemStorage();
