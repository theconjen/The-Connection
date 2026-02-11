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
  EventBookmark, InsertEventBookmark,
  EventInvitation, InsertEventInvitation,
  eventInvitations,

  // Prayer system
  PrayerRequest, InsertPrayerRequest,
  Prayer, InsertPrayer,

  // Bible study tools
  BibleReadingPlan, InsertBibleReadingPlan,
  BibleReadingProgress, InsertBibleReadingProgress,
  BibleStudyNote, InsertBibleStudyNote,

  // Direct messaging
  Message, InsertMessage,
  MessageReaction, InsertMessageReaction,

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
  events, eventRsvps, eventBookmarks, prayerRequests, prayers,
  bibleReadingPlans, bibleReadingProgress, bibleStudyNotes,
  livestreamerApplications, apologistScholarApplications,
  userPreferences, messages, messageReactions, userFollows,
  // moderation tables
  contentReports, userBlocks, pushTokens, notifications,
  // polls tables
  polls, pollOptions, pollVotes,
  Poll, InsertPoll, PollOption, InsertPollOption, PollVote, InsertPollVote,
  // organizations tables
  organizations, organizationUsers, organizationLeaders,
  orgBilling, userChurchAffiliations, churchInvitationRequests,
  orgMembershipRequests, orgMeetingRequests,
  ordinationPrograms, ordinationApplications, ordinationReviews, organizationActivityLogs,
  OrgBilling, InsertOrgBilling,
  OrganizationLeader, InsertOrganizationLeader,
  UserChurchAffiliation, InsertUserChurchAffiliation,
  ChurchInvitationRequest, InsertChurchInvitationRequest,
  OrgMembershipRequest, InsertOrgMembershipRequest,
  OrgMeetingRequest, InsertOrgMeetingRequest,
  OrdinationProgram, InsertOrdinationProgram,
  OrdinationApplication, InsertOrdinationApplication,
  OrdinationReview, InsertOrdinationReview,
  OrganizationActivityLog, InsertOrganizationActivityLog,
  Organization, InsertOrganization,
  OrganizationUser, InsertOrganizationUser,
  // Sermons
  sermons, sermonViews,
  Sermon, InsertSermon, SermonView, InsertSermonView,
} from "@shared/schema";
import { postVotes, commentVotes } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, lt, gt, sql, inArray, like, ilike, isNull } from "drizzle-orm";
import { whereNotDeleted, andNotDeleted } from "./db/helpers";
import { geocodeAddress } from "./geocoding";
import softDelete from './db/softDelete';
import { extractHashtags } from './utils/hashtagExtractor';
import { extractKeywords } from './utils/keywordExtractor';
import { isOrgBillingStatus, isOrgTier } from "../shared/orgTierPlans";

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

function assertValidOrgBillingInput(data: { tier?: unknown; status?: unknown }) {
  if (data.tier !== undefined && !isOrgTier(data.tier)) {
    throw new Error('Invalid org billing tier');
  }
  if (data.status !== undefined && !isOrgBillingStatus(data.status)) {
    throw new Error('Invalid org billing status');
  }
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
    'createEventRSVP', 'getEventRSVPs', 'getUserEventRSVP', 'getUserRSVPs', 'upsertEventRSVP',
    'deleteEventRSVP', 'createEventInvitation', 'getEventInvitation', 'getEventInvitationById',
    'getPendingEventInvitationsForUser', 'updateEventInvitationStatus', 'getEventAttendeeCount',
    'getAllMicroblogs', 'getMicroblog', 'getUserMicroblogs',
    'createMicroblog', 'updateMicroblog', 'deleteMicroblog', 'likeMicroblog',
    'unlikeMicroblog', 'getUserLikedMicroblogs', 'hasUserLikedMicroblog',
    'hasUserRepostedMicroblog', 'hasUserBookmarkedMicroblog', 'getMicroblogLikeCount',
    'getMicroblogReplies', 'getAllLivestreams',
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
    'createContentReport', 'createUserBlock', 'getBlockedUserIdsFor', 'removeUserBlock',
    'userHasPermission', 'getQaArea', 'getQaTag', 'createUserQuestion', 'autoAssignQuestion',
    'getUserQuestions', 'getInboxQuestions', 'userCanAccessQuestion', 'getQuestionMessages',
    'createQuestionMessage', 'getQuestionMessage', 'updateQuestionMessage', 'getUserQuestionById', 'getActiveAssignment', 'updateQuestionStatus',
    'updateAssignmentStatus', 'getQuestionAssignment', 'declineAssignment', 'grantPermission',
    'revokePermission', 'getAllResponders'
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
  createUserFollow(follow: { followerId: number; followingId: number; status?: string }): Promise<any>;
  updateFollowStatus(followerId: number, followingId: number, status: 'pending' | 'accepted'): Promise<any | undefined>;
  deleteUserFollow(followerId: number, followingId: number): Promise<boolean>;
  isUserFollowing(followerId: number, followingId: number): Promise<boolean>;
  getPendingFollowRequests(userId: number): Promise<any[]>;
  getFollowRequestStatus(followerId: number, followingId: number): Promise<'none' | 'pending' | 'accepted'>;

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
  getPendingCommunityInvitationsForUser(userId: number): Promise<CommunityInvitation[]>;

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
  getUserRSVPs(userId: number): Promise<EventRsvp[]>;
  upsertEventRSVP(eventId: number, userId: number, status: string): Promise<EventRsvp>;
  deleteEventRSVP(id: number): Promise<boolean>;

  // Event Invitation methods
  createEventInvitation(invitation: InsertEventInvitation): Promise<EventInvitation>;
  getEventInvitation(eventId: number, inviteeId: number): Promise<EventInvitation | undefined>;
  getEventInvitationById(id: number): Promise<EventInvitation | undefined>;
  getPendingEventInvitationsForUser(userId: number): Promise<EventInvitation[]>;
  updateEventInvitationStatus(id: number, status: string): Promise<EventInvitation>;
  getEventAttendeeCount(eventId: number): Promise<number>;

  // Microblog methods
  getAllMicroblogs(options?: { topic?: string; limit?: number }): Promise<Microblog[]>;
  getMicroblog(id: number): Promise<Microblog | undefined>;
  getUserMicroblogs(userId: number): Promise<Microblog[]>;
  getFollowingMicroblogs(userId: number, options?: { topic?: string; limit?: number }): Promise<Microblog[]>;

  // Batch loading methods (eliminates N+1 queries)
  getUsersByIds?(ids: number[]): Promise<Map<number, User>>;
  getUserLikedMicroblogIds?(userId: number, microblogIds: number[]): Promise<Set<number>>;
  getUserRepostedMicroblogIds?(userId: number, microblogIds: number[]): Promise<Set<number>>;
  getUserBookmarkedMicroblogIds?(userId: number, microblogIds: number[]): Promise<Set<number>>;
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
  getMicroblogLikeCount(microblogId: number): Promise<number>;
  getMicroblogReplies(microblogId: number): Promise<Microblog[]>;

  // Post bookmark methods
  bookmarkPost(postId: number, userId: number): Promise<PostBookmark>;
  unbookmarkPost(postId: number, userId: number): Promise<boolean>;
  getUserBookmarkedPosts(userId: number): Promise<Post[]>;
  hasUserBookmarkedPost(postId: number, userId: number): Promise<boolean>;

  // Event bookmark methods
  bookmarkEvent(eventId: number, userId: number): Promise<EventBookmark>;
  unbookmarkEvent(eventId: number, userId: number): Promise<boolean>;
  getUserBookmarkedEvents(userId: number): Promise<Event[]>;
  hasUserBookmarkedEvent(eventId: number, userId: number): Promise<boolean>;
  getUserEventBookmarkIds(userId: number): Promise<number[]>;

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

  // Poll methods
  createPoll(poll: { question: string; endsAt?: Date | null; allowMultiple?: boolean }): Promise<any>;
  getPoll(id: number): Promise<any | undefined>;
  getPollOptions(pollId: number): Promise<any[]>;
  createPollOption(option: { pollId: number; text: string; orderIndex?: number }): Promise<any>;
  getPollWithOptions(pollId: number, userId?: number): Promise<any | null>;
  castPollVotes(pollId: number, userId: number, optionIds: number[]): Promise<any[]>;
  removeUserPollVotes(pollId: number, userId: number): Promise<void>;
  getUserPollVotes(pollId: number, userId: number): Promise<number[]>;

  // Explore feed methods
  getExploreFeedMicroblogs(options: {
    topic?: string;
    postType?: string;
    cursor?: Date;
    limit: number;
  }): Promise<any[]>;

  // ============================================================================
  // ORGANIZATION METHODS
  // ============================================================================

  // Organization CRUD
  getOrganization(id: number): Promise<any | undefined>;
  getOrganizationBySlug(slug: string): Promise<any | undefined>;
  createOrganization(org: any): Promise<any>;
  updateOrganization(id: number, data: any): Promise<any>;
  deleteOrganization(id: number): Promise<boolean>;

  // Slug generation (server-side, collision-safe)
  generateUniqueSlug(name: string): Promise<string>;

  // Public directory (cursor-paginated)
  getPublicOrganizations(options: {
    limit?: number;
    cursor?: string;
    q?: string;
    city?: string;
    state?: string;
    denomination?: string;
  }): Promise<{ items: any[]; nextCursor: string | null }>;
  searchOrganizations(searchTerm: string): Promise<any[]>;

  // Billing (for tier enforcement)
  getOrgBilling(orgId: number): Promise<any | undefined>;
  createOrgBilling(billing: any): Promise<any>;
  updateOrgBilling(orgId: number, data: any): Promise<any>;

  // Membership
  getOrganizationMembers(orgId: number): Promise<any[]>;
  getOrganizationMember(orgId: number, userId: number): Promise<any | undefined>;
  getUserOrganizations(userId: number): Promise<any[]>;
  getUserRoleInOrg(orgId: number, userId: number): Promise<string | null>;
  addOrganizationMember(member: any): Promise<any>;
  updateOrganizationMemberRole(orgId: number, userId: number, role: string): Promise<any>;
  removeOrganizationMember(orgId: number, userId: number): Promise<boolean>;
  isOrganizationAdmin(orgId: number, userId: number): Promise<boolean>;
  isOrganizationMember(orgId: number, userId: number): Promise<boolean>;

  // Soft affiliations
  hasAffiliation(orgId: number, userId: number): Promise<boolean>;
  getUserChurchAffiliations(userId: number): Promise<any[]>;
  addUserChurchAffiliation(affiliation: any): Promise<any>;
  removeUserChurchAffiliation(userId: number, affiliationId: number): Promise<boolean>;

  // Membership requests
  getPendingMembershipRequest(orgId: number, userId: number): Promise<any | null>;
  createMembershipRequest(request: any): Promise<any>;
  getMembershipRequests(orgId: number): Promise<any[]>;
  approveMembershipRequest(requestId: number, reviewerId: number): Promise<void>;
  declineMembershipRequest(requestId: number, reviewerId: number): Promise<void>;

  // Meeting requests
  countOrgMeetingRequestsThisMonth(orgId: number): Promise<number>;
  createMeetingRequest(request: any): Promise<any>;
  getMeetingRequests(orgId: number): Promise<any[]>;
  updateMeetingRequestStatus(requestId: number, status: string, closedBy?: number): Promise<void>;

  // Ordination programs
  getOrdinationPrograms(orgId: number): Promise<any[]>;
  getOrdinationProgram(id: number): Promise<any | undefined>;
  createOrdinationProgram(program: any): Promise<any>;
  updateOrdinationProgram(id: number, data: any): Promise<any>;

  // Ordination applications
  getOrdinationApplications(orgId: number): Promise<any[]>;
  getUserOrdinationApplications(userId: number): Promise<any[]>;
  createOrdinationApplication(app: any): Promise<any>;
  getOrdinationReviews(applicationId: number): Promise<any[]>;
  createOrdinationReview(review: any): Promise<any>;

  // Organization leaders (About / Leadership section)
  getOrganizationLeaders(orgId: number): Promise<any[]>;
  getOrganizationLeader(id: number): Promise<any | undefined>;
  createOrganizationLeader(data: any): Promise<any>;
  updateOrganizationLeader(id: number, orgId: number, data: any): Promise<any>;
  deleteOrganizationLeader(id: number, orgId: number): Promise<boolean>;

  // Activity logs (admin-only, safe metadata)
  logOrganizationActivity(log: any): Promise<void>;
  getOrganizationActivityLogs(orgId: number, limit?: number): Promise<any[]>;

  // Sermons (org video library)
  createSermon(data: any): Promise<any>;
  listOrgSermons(orgId: number, opts?: { includeDeleted?: boolean }): Promise<any[]>;
  getSermonById(id: number): Promise<any | undefined>;
  updateSermon(id: number, data: any): Promise<any>;
  softDeleteSermon(id: number): Promise<boolean>;
  incrementSermonView(sermonId: number, userId?: number, watchDuration?: number, completed?: boolean): Promise<void>;
  countOrgSermons(orgId: number): Promise<number>;
  updateSermonByMuxAssetId(muxAssetId: string, data: any): Promise<any | undefined>;
  updateSermonByMuxUploadId(muxUploadId: string, data: any): Promise<any | undefined>;
  getPublicOrgSermons(orgId: number, viewerIsMember: boolean): Promise<any[]>;
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
    eventInvitations: [] as EventInvitation[],
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

  async getPendingCommunityInvitationsForUser(userId: number): Promise<CommunityInvitation[]> {
    return this.data.communityInvitations.filter(i =>
      i.inviteeUserId === userId &&
      i.status === 'pending' &&
      i.inviterUserId !== userId && // Exclude self-invitations (join requests)
      new Date(i.expiresAt) > new Date()
    );
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

  async getUserRSVPs(userId: number): Promise<EventRsvp[]> {
    return this.data.eventRsvps.filter(r => r.userId === userId);
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

  // Event Invitation methods (MemStorage)
  async createEventInvitation(invitation: InsertEventInvitation): Promise<EventInvitation> {
    const newInvitation: EventInvitation = {
      id: this.nextId++,
      eventId: invitation.eventId,
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId,
      status: invitation.status || 'pending',
      createdAt: new Date(),
      respondedAt: null
    };
    this.data.eventInvitations.push(newInvitation);
    return newInvitation;
  }

  async getEventInvitation(eventId: number, inviteeId: number): Promise<EventInvitation | undefined> {
    return this.data.eventInvitations.find(i => i.eventId === eventId && i.inviteeId === inviteeId);
  }

  async getEventInvitationById(id: number): Promise<EventInvitation | undefined> {
    return this.data.eventInvitations.find(i => i.id === id);
  }

  async getPendingEventInvitationsForUser(userId: number): Promise<EventInvitation[]> {
    return this.data.eventInvitations.filter(i =>
      i.inviteeId === userId && i.status === 'pending'
    );
  }

  async updateEventInvitationStatus(id: number, status: string): Promise<EventInvitation> {
    const invitation = this.data.eventInvitations.find(i => i.id === id);
    if (!invitation) throw new Error('Invitation not found');
    invitation.status = status;
    invitation.respondedAt = new Date();
    return invitation;
  }

  async getEventAttendeeCount(eventId: number): Promise<number> {
    return this.data.eventRsvps.filter(r =>
      r.eventId === eventId && (r.status === 'going' || r.status === 'maybe')
    ).length;
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
  async getAllMicroblogs(options?: { topic?: string; limit?: number }): Promise<Microblog[]> {
    let result = [...this.data.microblogs]
      .filter(m => !m.parentId) // Only top-level posts
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    if (options?.topic) {
      result = result.filter(m => m.topic === options.topic);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }
  
  async getMicroblog(id: number): Promise<Microblog | undefined> {
    return this.data.microblogs.find(m => m.id === id);
  }
  
  async getUserMicroblogs(userId: number): Promise<Microblog[]> {
    return this.data.microblogs
      .filter(m => m.authorId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getFollowingMicroblogs(_userId: number, _options?: { topic?: string; limit?: number }): Promise<Microblog[]> {
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

  async getMicroblogLikeCount(microblogId: number): Promise<number> {
    return this.data.microblogLikes.filter(like => like.microblogId === microblogId).length;
  }

  async getMicroblogReplies(microblogId: number): Promise<Microblog[]> {
    return this.data.microblogs
      .filter(m => m.parentId === microblogId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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

  // Event bookmark stubs
  async bookmarkEvent(_eventId: number, _userId: number): Promise<EventBookmark> {
    throw new Error('Not implemented in MemStorage');
  }

  async unbookmarkEvent(_eventId: number, _userId: number): Promise<boolean> {
    return false;
  }

  async getUserBookmarkedEvents(_userId: number): Promise<Event[]> {
    return [];
  }

  async hasUserBookmarkedEvent(_eventId: number, _userId: number): Promise<boolean> {
    return false;
  }

  async getUserEventBookmarkIds(_userId: number): Promise<number[]> {
    return [];
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

  // Poll stubs (not implemented in MemStorage)
  async createPoll(_poll: { question: string; endsAt?: Date | null; allowMultiple?: boolean }): Promise<any> {
    throw new Error('Polls not implemented in MemStorage');
  }
  async getPoll(_id: number): Promise<any | undefined> {
    return undefined;
  }
  async getPollOptions(_pollId: number): Promise<any[]> {
    return [];
  }
  async createPollOption(_option: { pollId: number; text: string; orderIndex?: number }): Promise<any> {
    throw new Error('Polls not implemented in MemStorage');
  }
  async getPollWithOptions(_pollId: number, _userId?: number): Promise<any | null> {
    return null;
  }
  async castPollVotes(_pollId: number, _userId: number, _optionIds: number[]): Promise<any[]> {
    throw new Error('Polls not implemented in MemStorage');
  }
  async removeUserPollVotes(_pollId: number, _userId: number): Promise<void> {}
  async getUserPollVotes(_pollId: number, _userId: number): Promise<number[]> {
    return [];
  }
  async getExploreFeedMicroblogs(_options: {
    topic?: string;
    postType?: string;
    cursor?: Date;
    limit: number;
  }): Promise<any[]> {
    return this.data.microblogs;
  }

  // ============================================================================
  // ORGANIZATION METHODS (MemStorage stubs)
  // ============================================================================

  async getOrganization(_id: number): Promise<any | undefined> { return undefined; }
  async getOrganizationBySlug(_slug: string): Promise<any | undefined> { return undefined; }
  async createOrganization(org: any): Promise<any> { return { id: this.nextId++, ...org }; }
  async updateOrganization(_id: number, data: any): Promise<any> { return data; }
  async deleteOrganization(_id: number): Promise<boolean> { return true; }
  async generateUniqueSlug(name: string): Promise<string> { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
  async getPublicOrganizations(_options: any): Promise<{ items: any[]; nextCursor: string | null }> { return { items: [], nextCursor: null }; }
  async searchOrganizations(_searchTerm: string): Promise<any[]> { return []; }
  async getOrgBilling(_orgId: number): Promise<any | undefined> { return undefined; }
  async createOrgBilling(billing: any): Promise<any> {
    assertValidOrgBillingInput(billing ?? {});
    return { id: this.nextId++, ...billing };
  }
  async updateOrgBilling(_orgId: number, data: any): Promise<any> {
    assertValidOrgBillingInput(data ?? {});
    return data;
  }
  async getOrganizationMembers(_orgId: number): Promise<any[]> { return []; }
  async getOrganizationMember(_orgId: number, _userId: number): Promise<any | undefined> { return undefined; }
  async getUserOrganizations(_userId: number): Promise<any[]> { return []; }
  async getUserRoleInOrg(_orgId: number, _userId: number): Promise<string | null> { return null; }
  async addOrganizationMember(member: any): Promise<any> { return { id: this.nextId++, ...member }; }
  async updateOrganizationMemberRole(_orgId: number, _userId: number, role: string): Promise<any> { return { role }; }
  async removeOrganizationMember(_orgId: number, _userId: number): Promise<boolean> { return true; }
  async isOrganizationAdmin(_orgId: number, _userId: number): Promise<boolean> { return false; }
  async isOrganizationMember(_orgId: number, _userId: number): Promise<boolean> { return false; }
  async hasAffiliation(_orgId: number, _userId: number): Promise<boolean> { return false; }
  async getUserChurchAffiliations(_userId: number): Promise<any[]> { return []; }
  async addUserChurchAffiliation(affiliation: any): Promise<any> { return { id: this.nextId++, ...affiliation }; }
  async removeUserChurchAffiliation(_userId: number, _affiliationId: number): Promise<boolean> { return true; }
  async getPendingMembershipRequest(_orgId: number, _userId: number): Promise<any | null> { return null; }
  async createMembershipRequest(request: any): Promise<any> { return { id: this.nextId++, ...request }; }
  async getMembershipRequests(_orgId: number): Promise<any[]> { return []; }
  async approveMembershipRequest(_requestId: number, _reviewerId: number): Promise<void> {}
  async declineMembershipRequest(_requestId: number, _reviewerId: number): Promise<void> {}
  async countOrgMeetingRequestsThisMonth(_orgId: number): Promise<number> { return 0; }
  async createMeetingRequest(request: any): Promise<any> { return { id: this.nextId++, ...request }; }
  async getMeetingRequests(_orgId: number): Promise<any[]> { return []; }
  async updateMeetingRequestStatus(_requestId: number, _status: string, _closedBy?: number): Promise<void> {}
  async getOrdinationPrograms(_orgId: number): Promise<any[]> { return []; }
  async getOrdinationProgram(_id: number): Promise<any | undefined> { return undefined; }
  async createOrdinationProgram(program: any): Promise<any> { return { id: this.nextId++, ...program }; }
  async updateOrdinationProgram(_id: number, data: any): Promise<any> { return data; }
  async getOrdinationApplications(_orgId: number): Promise<any[]> { return []; }
  async getUserOrdinationApplications(_userId: number): Promise<any[]> { return []; }
  async createOrdinationApplication(app: any): Promise<any> { return { id: this.nextId++, ...app }; }
  async getOrdinationReviews(_applicationId: number): Promise<any[]> { return []; }
  async createOrdinationReview(review: any): Promise<any> { return { id: this.nextId++, ...review }; }
  async logOrganizationActivity(_log: any): Promise<void> {}
  async getOrganizationActivityLogs(_orgId: number, _limit?: number): Promise<any[]> { return []; }

  // Organization leaders (MemStorage stubs)
  async getOrganizationLeaders(_orgId: number): Promise<any[]> { return []; }
  async getOrganizationLeader(_id: number): Promise<any | undefined> { return undefined; }
  async createOrganizationLeader(data: any): Promise<any> { return { id: this.nextId++, ...data }; }
  async updateOrganizationLeader(_id: number, _orgId: number, data: any): Promise<any> { return data; }
  async deleteOrganizationLeader(_id: number, _orgId: number): Promise<boolean> { return true; }

  // Sermons (MemStorage stubs)
  async createSermon(data: any): Promise<any> { return { id: this.nextId++, ...data }; }
  async listOrgSermons(_orgId: number, _opts?: { includeDeleted?: boolean }): Promise<any[]> { return []; }
  async getSermonById(_id: number): Promise<any | undefined> { return undefined; }
  async updateSermon(_id: number, data: any): Promise<any> { return data; }
  async softDeleteSermon(_id: number): Promise<boolean> { return true; }
  async incrementSermonView(_sermonId: number, _userId?: number, _watchDuration?: number, _completed?: boolean): Promise<void> {}
  async countOrgSermons(_orgId: number): Promise<number> { return 0; }
  async updateSermonByMuxAssetId(_muxAssetId: string, data: any): Promise<any | undefined> { return data; }
  async updateSermonByMuxUploadId(_muxUploadId: string, data: any): Promise<any | undefined> { return data; }
  async getPublicOrgSermons(_orgId: number, _viewerIsMember: boolean): Promise<any[]> { return []; }
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

  // Batch load users by IDs (eliminates N+1 queries)
  async getUsersByIds(ids: number[]): Promise<Map<number, User>> {
    if (ids.length === 0) return new Map();
    const uniqueIds = [...new Set(ids)];
    const result = await db.select().from(users).where(
      and(
        inArray(users.id, uniqueIds),
        whereNotDeleted(users)
      )
    );
    return new Map(result.map(u => [u.id, u]));
  }

  // Batch check which microblogs a user has liked
  async getUserLikedMicroblogIds(userId: number, microblogIds: number[]): Promise<Set<number>> {
    if (microblogIds.length === 0) return new Set();
    const result = await db.select({ microblogId: microblogLikes.microblogId })
      .from(microblogLikes)
      .where(and(
        eq(microblogLikes.userId, userId),
        inArray(microblogLikes.microblogId, microblogIds)
      ));
    return new Set(result.map(r => r.microblogId));
  }

  // Batch check which microblogs a user has reposted
  async getUserRepostedMicroblogIds(userId: number, microblogIds: number[]): Promise<Set<number>> {
    if (microblogIds.length === 0) return new Set();
    const result = await db.select({ microblogId: microblogReposts.microblogId })
      .from(microblogReposts)
      .where(and(
        eq(microblogReposts.userId, userId),
        inArray(microblogReposts.microblogId, microblogIds)
      ));
    return new Set(result.map(r => r.microblogId));
  }

  // Batch check which microblogs a user has bookmarked
  async getUserBookmarkedMicroblogIds(userId: number, microblogIds: number[]): Promise<Set<number>> {
    if (microblogIds.length === 0) return new Set();
    const result = await db.select({ microblogId: microblogBookmarks.microblogId })
      .from(microblogBookmarks)
      .where(and(
        eq(microblogBookmarks.userId, userId),
        inArray(microblogBookmarks.microblogId, microblogIds)
      ));
    return new Set(result.map(r => r.microblogId));
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
      interests: result[0].interests,
      dateOfBirth: result[0].dateOfBirth
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
    // Only return accepted follows (not pending requests)
    const follows = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followingId, userId),
        eq(userFollows.status, 'accepted')
      ));

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
    // Only return accepted follows (not pending requests)
    const follows = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, userId),
        eq(userFollows.status, 'accepted')
      ));

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

  async createUserFollow(follow: { followerId: number; followingId: number; status?: string }): Promise<any> {
    // Use onConflictDoNothing for idempotency (UNIQUE constraint on follower_id, following_id)
    const status = follow.status || 'accepted';
    const inserted = await db.insert(userFollows)
      .values({ followerId: follow.followerId, followingId: follow.followingId, status })
      .onConflictDoNothing()
      .returning();
    if (inserted && inserted.length > 0) {
      return inserted[0];
    }
    // If nothing inserted, the follow already exists - fetch and return it
    const existing = await this.getUserFollow(follow.followerId, follow.followingId);
    return existing;
  }

  async updateFollowStatus(followerId: number, followingId: number, status: 'pending' | 'accepted'): Promise<any | undefined> {
    const [updated] = await db.update(userFollows)
      .set({ status })
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId)
      ))
      .returning();
    return updated;
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
    // Only return true for accepted follows
    const [follow] = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId),
        eq(userFollows.status, 'accepted')
      ))
      .limit(1);
    return !!follow;
  }

  async getPendingFollowRequests(userId: number): Promise<any[]> {
    // Get users who have requested to follow this user (pending status)
    const requests = await db.select()
      .from(userFollows)
      .where(and(
        eq(userFollows.followingId, userId),
        eq(userFollows.status, 'pending')
      ));

    const requesterIds = requests.map(r => r.followerId);
    if (requesterIds.length === 0) return [];

    const requesters = await db.select()
      .from(users)
      .where(inArray(users.id, requesterIds));

    return requests.map(request => {
      const user = requesters.find(u => u.id === request.followerId);
      return {
        id: request.id,
        userId: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        profileImageUrl: user?.avatarUrl,
        requestedAt: request.createdAt,
      };
    });
  }

  async getFollowRequestStatus(followerId: number, followingId: number): Promise<'none' | 'pending' | 'accepted'> {
    const follow = await this.getUserFollow(followerId, followingId);
    if (!follow) return 'none';
    return follow.status as 'pending' | 'accepted';
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

    // Get all communities where user is a member, including their role
    const userMemberships = await db
      .select({
        communityId: communityMembers.communityId,
        role: communityMembers.role
      })
      .from(communityMembers)
      .where(eq(communityMembers.userId, userId));

    const userMembershipMap = new Map(
      userMemberships.map(m => [m.communityId, m.role])
    );
    const userMembershipIds = userMemberships.map(m => m.communityId);

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

    // Combine all communities and add isMember flag + role
    const allCommunities = [...publicCommunities, ...privateMemberCommunities];
    return allCommunities.map((community: any) => {
      const isMember = userMembershipIds.includes(community.id);
      const role = userMembershipMap.get(community.id);
      return {
        ...community,
        isMember,
        role: isMember ? role : null,
        userRole: isMember ? role : null, // Add both for compatibility
      };
    });
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

  async getPendingCommunityInvitationsForUser(userId: number): Promise<CommunityInvitation[]> {
    const now = new Date();
    const invitations = await db.select()
      .from(communityInvitations)
      .where(and(
        eq(communityInvitations.inviteeUserId, userId),
        eq(communityInvitations.status, 'pending'),
        gt(communityInvitations.expiresAt, now)
      ))
      .orderBy(communityInvitations.createdAt);

    // Filter out self-invitations (join requests)
    return invitations.filter(inv => inv.inviterUserId !== inv.inviteeUserId);
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
    // First delete all RSVPs for this event (foreign key constraint)
    await db.delete(eventRsvps).where(eq(eventRsvps.eventId, id));

    // Also delete any bookmarks for this event
    try {
      await db.delete(eventBookmarks).where(eq(eventBookmarks.eventId, id));
    } catch (e) {
      // eventBookmarks table may not exist in all environments
    }

    // Then delete the event itself
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

  async getUserRSVPs(userId: number): Promise<EventRsvp[]> {
    const rsvps = await db
      .select()
      .from(eventRsvps)
      .where(eq(eventRsvps.userId, userId));
    return rsvps as EventRsvp[];
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

  // Event Invitation methods (DbStorage)
  async createEventInvitation(invitation: InsertEventInvitation): Promise<EventInvitation> {
    const [newInvitation] = await db.insert(eventInvitations).values(invitation as any).returning();
    return newInvitation as EventInvitation;
  }

  async getEventInvitation(eventId: number, inviteeId: number): Promise<EventInvitation | undefined> {
    const [invitation] = await db.select()
      .from(eventInvitations)
      .where(and(
        eq(eventInvitations.eventId, eventId),
        eq(eventInvitations.inviteeId, inviteeId)
      ))
      .limit(1);
    return invitation as EventInvitation | undefined;
  }

  async getEventInvitationById(id: number): Promise<EventInvitation | undefined> {
    const [invitation] = await db.select()
      .from(eventInvitations)
      .where(eq(eventInvitations.id, id))
      .limit(1);
    return invitation as EventInvitation | undefined;
  }

  async getPendingEventInvitationsForUser(userId: number): Promise<EventInvitation[]> {
    const invitations = await db.select()
      .from(eventInvitations)
      .where(and(
        eq(eventInvitations.inviteeId, userId),
        eq(eventInvitations.status, 'pending')
      ))
      .orderBy(desc(eventInvitations.createdAt));
    return invitations as EventInvitation[];
  }

  async updateEventInvitationStatus(id: number, status: string): Promise<EventInvitation> {
    const [updated] = await db.update(eventInvitations)
      .set({ status, respondedAt: new Date() })
      .where(eq(eventInvitations.id, id))
      .returning();
    return updated as EventInvitation;
  }

  async getEventAttendeeCount(eventId: number): Promise<number> {
    const rsvps = await db.select()
      .from(eventRsvps)
      .where(and(
        eq(eventRsvps.eventId, eventId),
        or(
          eq(eventRsvps.status, 'going'),
          eq(eventRsvps.status, 'maybe')
        )
      ));
    return rsvps.length;
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
  async getAllMicroblogs(options?: { topic?: string; limit?: number }): Promise<Microblog[]> {
    // Only return top-level posts (not replies)
    const conditions = [isNull(microblogs.parentId)];

    // Filter by topic at database level (not in memory)
    if (options?.topic) {
      conditions.push(eq(microblogs.topic, options.topic));
    }

    const limit = options?.limit || 100; // Default limit to prevent fetching entire table

    const allMicroblogs = await db.select()
      .from(microblogs)
      .where(and(...conditions))
      .orderBy(desc(microblogs.createdAt))
      .limit(limit);
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

  async getFollowingMicroblogs(userId: number, options?: { topic?: string; limit?: number }): Promise<Microblog[]> {
    // Get IDs of users that this user follows
    const following = await db.select({ followingId: userFollows.followingId })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Build conditions
    const conditions = [
      sql`${microblogs.authorId} IN (${sql.join(followingIds.map(id => sql`${id}`), sql`, `)})`,
      isNull(microblogs.parentId)
    ];

    // Filter by topic at database level
    if (options?.topic) {
      conditions.push(eq(microblogs.topic, options.topic));
    }

    const limit = options?.limit || 100;

    // Get microblogs from followed users (only top-level posts, not replies)
    const followingMicroblogs = await db.select()
      .from(microblogs)
      .where(and(...conditions))
      .orderBy(desc(microblogs.createdAt))
      .limit(limit);

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

  // Get actual like count for a microblog from the likes table
  async getMicroblogLikeCount(microblogId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(microblogLikes)
      .where(eq(microblogLikes.microblogId, microblogId));

    return result[0]?.count || 0;
  }

  // Get replies (child microblogs) for a microblog
  async getMicroblogReplies(microblogId: number): Promise<Microblog[]> {
    const replies = await db
      .select()
      .from(microblogs)
      .where(eq(microblogs.parentId, microblogId))
      .orderBy(desc(microblogs.createdAt));

    return replies;
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

  // ============================================================================
  // EVENT BOOKMARK METHODS
  // ============================================================================

  async bookmarkEvent(eventId: number, userId: number): Promise<EventBookmark> {
    // Check if already bookmarked
    const existing = await db
      .select()
      .from(eventBookmarks)
      .where(and(
        eq(eventBookmarks.eventId, eventId),
        eq(eventBookmarks.userId, userId)
      ));

    if (existing.length > 0) {
      // Return existing bookmark (idempotent)
      return existing[0];
    }

    // Insert bookmark
    const [newBookmark] = await db
      .insert(eventBookmarks)
      .values({ eventId, userId })
      .returning();

    return newBookmark;
  }

  async unbookmarkEvent(eventId: number, userId: number): Promise<boolean> {
    const deleted = await db
      .delete(eventBookmarks)
      .where(and(
        eq(eventBookmarks.eventId, eventId),
        eq(eventBookmarks.userId, userId)
      ))
      .returning();

    return deleted.length > 0;
  }

  async getUserBookmarkedEvents(userId: number): Promise<Event[]> {
    const bookmarks = await db
      .select()
      .from(eventBookmarks)
      .where(eq(eventBookmarks.userId, userId));

    const eventIds = bookmarks
      .map(b => b.eventId)
      .filter(id => id != null && !isNaN(id));

    if (eventIds.length === 0) return [];

    return await db
      .select()
      .from(events)
      .where(inArray(events.id, eventIds))
      .orderBy(desc(events.eventDate));
  }

  async hasUserBookmarkedEvent(eventId: number, userId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(eventBookmarks)
      .where(and(
        eq(eventBookmarks.eventId, eventId),
        eq(eventBookmarks.userId, userId)
      ))
      .limit(1);

    return !!bookmark;
  }

  async getUserEventBookmarkIds(userId: number): Promise<number[]> {
    const bookmarks = await db
      .select({ eventId: eventBookmarks.eventId })
      .from(eventBookmarks)
      .where(eq(eventBookmarks.userId, userId));

    return bookmarks.map(b => b.eventId);
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

    // Enrich messages with sender and receiver user information + reactions
    const enrichedMessages = [];
    for (const msg of result) {
      const sender = await this.getUser(msg.senderId);
      const receiver = await this.getUser(msg.receiverId);
      const reactions = await this.getMessageReactions(msg.id);

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
        reactions: reactions,
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
          lastMessageContent: msg.content,
          lastMessageTime: msg.createdAt,
          lastMessageSenderId: msg.senderId,
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
          avatarUrl: otherUser?.avatarUrl || null // Use avatarUrl for consistency
        },
        lastMessage: { // Nest last message info
          content: conv.lastMessageContent,
          createdAt: conv.lastMessageTime,
          senderId: conv.lastMessageSenderId // Include sender for better context
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

  // Get a single message by ID
  async getMessageById(messageId: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, messageId));
    return result[0];
  }

  // Toggle a reaction on a message (double-tap to heart)
  async toggleMessageReaction(
    messageId: string,
    userId: number,
    reaction: string = 'heart'
  ): Promise<{ added: boolean; reaction?: MessageReaction }> {
    // Check if reaction already exists
    const existing = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, messageId),
          eq(messageReactions.userId, userId),
          eq(messageReactions.reaction, reaction)
        )
      );

    if (existing.length > 0) {
      // Remove the reaction
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existing[0].id));
      return { added: false };
    } else {
      // Add the reaction
      const [newReaction] = await db
        .insert(messageReactions)
        .values({
          messageId,
          userId,
          reaction,
        })
        .returning();
      return { added: true, reaction: newReaction };
    }
  }

  // Get all reactions for a message
  async getMessageReactions(messageId: string): Promise<MessageReaction[]> {
    return await db
      .select()
      .from(messageReactions)
      .where(eq(messageReactions.messageId, messageId))
      .orderBy(messageReactions.createdAt);
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

  // ============================================================================
  // Q&A INBOX SYSTEM
  // ============================================================================

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: number): Promise<any[]> {
    const { userPermissions } = await import('@shared/schema');
    const results = await db
      .select()
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    return results;
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    const { userPermissions } = await import('@shared/schema');
    const result = await db
      .select()
      .from(userPermissions)
      .where(and(
        eq(userPermissions.userId, userId),
        eq(userPermissions.permission, permission)
      ))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Get Q&A area by ID
   */
  async getQaArea(areaId: number): Promise<any> {
    const { qaAreas } = await import('@shared/schema');
    const [area] = await db
      .select()
      .from(qaAreas)
      .where(eq(qaAreas.id, areaId))
      .limit(1);

    return area;
  }

  /**
   * Get Q&A tag by ID
   */
  async getQaTag(tagId: number): Promise<any> {
    const { qaTags } = await import('@shared/schema');
    const [tag] = await db
      .select()
      .from(qaTags)
      .where(eq(qaTags.id, tagId))
      .limit(1);

    return tag;
  }

  /**
   * Create a new user question
   */
  async createUserQuestion(data: {
    askerUserId: number;
    domain: string;
    areaId: number;
    tagId: number;
    questionText: string;
    status: string;
  }): Promise<any> {
    const { userQuestions } = await import('@shared/schema');
    const [question] = await db
      .insert(userQuestions)
      .values({
        askerUserId: data.askerUserId,
        domain: data.domain,
        areaId: data.areaId,
        tagId: data.tagId,
        questionText: data.questionText,
        status: data.status,
      } as any)
      .returning();

    return question;
  }

  /**
   * Auto-assign question to a responder
   * Currently assigns to Connection Research Team (env: RESEARCH_TEAM_USER_ID)
   * Future: Route based on area/tag expertise
   */
  async autoAssignQuestion(questionId: number): Promise<any> {
    const { questionAssignments } = await import('@shared/schema');

    // Get research team user ID from env (default to 1 for development)
    const researchTeamUserId = parseInt(process.env.RESEARCH_TEAM_USER_ID || '1', 10);

    const [assignment] = await db
      .insert(questionAssignments)
      .values({
        questionId,
        assignedToUserId: researchTeamUserId,
        assignedByUserId: null, // Auto-assigned by system
        status: 'assigned',
      } as any)
      .returning();

    // Update question status to 'routed'
    await this.updateQuestionStatus(questionId, 'routed');

    return assignment;
  }

  /**
   * Get all questions submitted by a user
   */
  async getUserQuestions(userId: number): Promise<any[]> {
    const { userQuestions, qaAreas, qaTags } = await import('@shared/schema');

    const questions = await db
      .select({
        question: userQuestions,
        area: qaAreas,
        tag: qaTags,
      })
      .from(userQuestions)
      .leftJoin(qaAreas, eq(userQuestions.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(userQuestions.tagId, qaTags.id))
      .where(eq(userQuestions.askerUserId, userId))
      .orderBy(desc(userQuestions.createdAt));

    return questions.map((row: any) => ({
      ...row.question,
      area: row.area,
      tag: row.tag,
    }));
  }

  /**
   * Get questions in responder's inbox
   */
  async getInboxQuestions(userId: number, status?: string): Promise<any[]> {
    const { userQuestions, questionAssignments, qaAreas, qaTags, users } = await import('@shared/schema');

    let query = db
      .select({
        question: userQuestions,
        assignment: questionAssignments,
        area: qaAreas,
        tag: qaTags,
        asker: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
        },
      })
      .from(questionAssignments)
      .innerJoin(userQuestions, eq(questionAssignments.questionId, userQuestions.id))
      .leftJoin(qaAreas, eq(userQuestions.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(userQuestions.tagId, qaTags.id))
      .leftJoin(users, eq(userQuestions.askerUserId, users.id))
      .where(eq(questionAssignments.assignedToUserId, userId));

    if (status) {
      query = query.where(
        and(
          eq(questionAssignments.assignedToUserId, userId),
          eq(questionAssignments.status, status)
        )
      );
    }

    const results = await query.orderBy(desc(userQuestions.createdAt));

    return results.map((row: any) => ({
      ...row.question,
      assignment: row.assignment,
      area: row.area,
      tag: row.tag,
      asker: row.asker,
    }));
  }

  /**
   * Check if user can access a question (either asker or assigned responder)
   */
  async userCanAccessQuestion(userId: number, questionId: number): Promise<boolean> {
    const { userQuestions, questionAssignments } = await import('@shared/schema');

    // Check if user is the asker
    const [question] = await db
      .select()
      .from(userQuestions)
      .where(eq(userQuestions.id, questionId))
      .limit(1);

    if (question && (question as any).askerUserId === userId) {
      return true;
    }

    // Check if user is assigned responder
    const assignment = await db
      .select()
      .from(questionAssignments)
      .where(
        and(
          eq(questionAssignments.questionId, questionId),
          eq(questionAssignments.assignedToUserId, userId)
        )
      )
      .limit(1);

    return assignment.length > 0;
  }

  /**
   * Get all messages in a question thread
   */
  async getQuestionMessages(questionId: number): Promise<any[]> {
    const { questionMessages, users } = await import('@shared/schema');

    const messages = await db
      .select({
        message: questionMessages,
        sender: {
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(questionMessages)
      .leftJoin(users, eq(questionMessages.senderUserId, users.id))
      .where(eq(questionMessages.questionId, questionId))
      .orderBy(questionMessages.createdAt);

    return messages.map((row: any) => ({
      ...row.message,
      sender: row.sender,
    }));
  }

  /**
   * Create a message in a question thread
   */
  async createQuestionMessage(data: {
    questionId: number;
    senderUserId: number;
    body: string;
  }): Promise<any> {
    const { questionMessages } = await import('@shared/schema');
    const [message] = await db
      .insert(questionMessages)
      .values({
        questionId: data.questionId,
        senderUserId: data.senderUserId,
        body: data.body,
      } as any)
      .returning();

    return message;
  }

  /**
   * Get a single question message by ID
   */
  async getQuestionMessage(messageId: number): Promise<any> {
    const { questionMessages } = await import('@shared/schema');
    const [message] = await db
      .select()
      .from(questionMessages)
      .where(eq(questionMessages.id, messageId))
      .limit(1);

    return message;
  }

  /**
   * Update a question message
   */
  async updateQuestionMessage(messageId: number, body: string): Promise<any> {
    const { questionMessages } = await import('@shared/schema');
    const [updated] = await db
      .update(questionMessages)
      .set({ body })
      .where(eq(questionMessages.id, messageId))
      .returning();

    return updated;
  }

  /**
   * Get a user question by ID
   */
  async getUserQuestionById(questionId: number): Promise<any> {
    const { userQuestions } = await import('@shared/schema');
    const [question] = await db
      .select()
      .from(userQuestions)
      .where(eq(userQuestions.id, questionId))
      .limit(1);

    return question;
  }

  /**
   * Get active assignment for a question
   */
  async getActiveAssignment(questionId: number): Promise<any> {
    const { questionAssignments } = await import('@shared/schema');
    const [assignment] = await db
      .select()
      .from(questionAssignments)
      .where(
        and(
          eq(questionAssignments.questionId, questionId),
          or(
            eq(questionAssignments.status, 'assigned'),
            eq(questionAssignments.status, 'accepted')
          )
        )
      )
      .orderBy(desc(questionAssignments.createdAt))
      .limit(1);

    return assignment;
  }

  /**
   * Update question status
   */
  async updateQuestionStatus(questionId: number, status: string): Promise<any> {
    const { userQuestions } = await import('@shared/schema');
    const [updated] = await db
      .update(userQuestions)
      .set({ status, updatedAt: new Date() })
      .where(eq(userQuestions.id, questionId))
      .returning();

    return updated;
  }

  /**
   * Update user question (general update method)
   */
  async updateUserQuestion(questionId: number, updates: Partial<{
    status: string;
    publishedPostId: number | null;
  }>): Promise<any> {
    const { userQuestions } = await import('@shared/schema');
    const [updated] = await db
      .update(userQuestions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userQuestions.id, questionId))
      .returning();

    return updated;
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId: number, status: string): Promise<any> {
    const { questionAssignments } = await import('@shared/schema');
    const [updated] = await db
      .update(questionAssignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(questionAssignments.id, assignmentId))
      .returning();

    return updated;
  }

  /**
   * Get assignment by ID
   */
  async getQuestionAssignment(assignmentId: number): Promise<any> {
    const { questionAssignments } = await import('@shared/schema');
    const [assignment] = await db
      .select()
      .from(questionAssignments)
      .where(eq(questionAssignments.id, assignmentId))
      .limit(1);

    return assignment;
  }

  /**
   * Decline an assignment
   */
  async declineAssignment(assignmentId: number, reason?: string): Promise<any> {
    const { questionAssignments } = await import('@shared/schema');
    const [updated] = await db
      .update(questionAssignments)
      .set({
        status: 'declined',
        reason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(questionAssignments.id, assignmentId))
      .returning();

    return updated;
  }

  /**
   * Grant permission to a user
   */
  async grantPermission(userId: number, permission: string, grantedBy: number): Promise<any> {
    const { userPermissions } = await import('@shared/schema');
    const [granted] = await db
      .insert(userPermissions)
      .values({
        userId,
        permission,
        grantedBy,
      } as any)
      .onConflictDoNothing()
      .returning();

    return granted;
  }

  /**
   * Revoke permission from a user
   */
  async revokePermission(userId: number, permission: string): Promise<boolean> {
    const { userPermissions } = await import('@shared/schema');
    const result = await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permission, permission)
        )
      );

    return true;
  }

  /**
   * Get all users with inbox_access permission
   */
  async getAllResponders(): Promise<any[]> {
    const { userPermissions, users } = await import('@shared/schema');

    const responders = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        permission: userPermissions.permission,
        grantedAt: userPermissions.grantedAt,
      })
      .from(userPermissions)
      .innerJoin(users, eq(userPermissions.userId, users.id))
      .where(eq(userPermissions.permission, 'inbox_access'));

    return responders;
  }

  // ============================================================================
  // LIBRARY POSTS (APOLOGETICS/POLEMICS WIKI ENTRIES)
  // ============================================================================

  /**
   * List library posts with filtering and pagination
   */
  async listLibraryPosts(params: {
    domain?: string;
    areaId?: number;
    tagId?: number;
    q?: string;
    status?: string;
    limit?: number;
    offset?: number;
    viewerUserId?: number;
  }): Promise<{ items: any[]; total: number }> {
    const { qaLibraryPosts, qaAreas, qaTags } = await import('@shared/schema');
    const { limit = 20, offset = 0, viewerUserId, domain, areaId, tagId, q, status } = params;

    let query = db
      .select({
        post: qaLibraryPosts,
        area: qaAreas,
        tag: qaTags,
      })
      .from(qaLibraryPosts)
      .leftJoin(qaAreas, eq(qaLibraryPosts.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(qaLibraryPosts.tagId, qaTags.id))
      .$dynamic();

    const conditions: any[] = [];

    // Domain filter
    if (domain) {
      conditions.push(eq(qaLibraryPosts.domain, domain));
    }

    // Area filter
    if (areaId) {
      conditions.push(eq(qaLibraryPosts.areaId, areaId));
    }

    // Tag filter
    if (tagId) {
      conditions.push(eq(qaLibraryPosts.tagId, tagId));
    }

    // Status filter - default to published only unless viewer is author
    if (status) {
      conditions.push(eq(qaLibraryPosts.status, status));
    } else if (!viewerUserId) {
      // No viewer = public only
      conditions.push(eq(qaLibraryPosts.status, 'published'));
    } else {
      // Viewer can see published + their own drafts
      conditions.push(
        or(
          eq(qaLibraryPosts.status, 'published'),
          and(
            eq(qaLibraryPosts.authorUserId, viewerUserId),
            eq(qaLibraryPosts.status, 'draft')
          )
        )
      );
    }

    // Search query
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          sql`${qaLibraryPosts.title} ILIKE ${searchTerm}`,
          sql`${qaLibraryPosts.bodyMarkdown} ILIKE ${searchTerm}`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Count total
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(qaLibraryPosts)
      .$dynamic();

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;

    // Get items with ordering
    const items = await query
      .orderBy(desc(qaLibraryPosts.publishedAt), desc(qaLibraryPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      items: items.map(row => ({
        ...row.post,
        area: row.area,
        tag: row.tag,
      })),
      total,
    };
  }

  /**
   * Get single library post by ID
   */
  async getLibraryPost(id: number, viewerUserId?: number, includeContributions = true): Promise<any> {
    const { qaLibraryPosts, qaAreas, qaTags, qaLibraryContributions } = await import('@shared/schema');

    const [result] = await db
      .select({
        post: qaLibraryPosts,
        area: qaAreas,
        tag: qaTags,
      })
      .from(qaLibraryPosts)
      .leftJoin(qaAreas, eq(qaLibraryPosts.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(qaLibraryPosts.tagId, qaTags.id))
      .where(eq(qaLibraryPosts.id, id))
      .limit(1);

    if (!result) return null;

    const post = result.post;

    // If draft, only author can view
    if (post.status === 'draft' && (!viewerUserId || post.authorUserId !== viewerUserId)) {
      return null;
    }

    // Fetch approved contributions
    let contributions = [];
    if (includeContributions) {
      const approvedContributions = await db
        .select()
        .from(qaLibraryContributions)
        .where(and(
          eq(qaLibraryContributions.postId, id),
          eq(qaLibraryContributions.status, 'approved')
        ))
        .orderBy(desc(qaLibraryContributions.createdAt));

      contributions = await Promise.all(
        approvedContributions.map(async (c: any) => {
          const contributor = await this.getUser(c.contributorUserId);
          return {
            ...c,
            contributor: contributor ? {
              id: contributor.id,
              username: contributor.username,
              displayName: contributor.displayName,
              avatarUrl: contributor.avatarUrl,
            } : undefined,
          };
        })
      );
    }

    return {
      ...post,
      area: result.area,
      tag: result.tag,
      contributions,
    };
  }

  /**
   * Create library post
   */
  async createLibraryPost(data: any, authorUserId: number): Promise<any> {
    const { qaLibraryPosts } = await import('@shared/schema');

    const postData: any = {
      ...data,
      authorUserId,
      authorDisplayName: 'Connection Research Team',
      status: data.status || 'draft',
      publishedAt: data.status === 'published' ? new Date() : null,
    };

    const [created] = await db
      .insert(qaLibraryPosts)
      .values(postData)
      .returning();

    return created;
  }

  /**
   * Update library post
   */
  async updateLibraryPost(id: number, data: any, authorUserId: number): Promise<any> {
    const { qaLibraryPosts } = await import('@shared/schema');

    // Get post to check ownership
    const [existing] = await db
      .select()
      .from(qaLibraryPosts)
      .where(eq(qaLibraryPosts.id, id))
      .limit(1);

    if (!existing) return null;

    // Allow: post author (the assigned apologist), user 19 (research team), admins
    const isOwner = existing.authorUserId === authorUserId;
    const isResearchTeam = authorUserId === 19;
    const user = await this.getUser(authorUserId);
    const isAdmin = user?.role === 'admin';

    if (!isOwner && !isResearchTeam && !isAdmin) {
      throw new Error('Unauthorized: only the assigned apologist or an admin can update this post');
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(qaLibraryPosts)
      .set(updateData)
      .where(eq(qaLibraryPosts.id, id))
      .returning();

    return updated;
  }

  /**
   * Publish library post
   */
  async publishLibraryPost(id: number, authorUserId: number): Promise<any> {
    const { qaLibraryPosts } = await import('@shared/schema');

    // Get post to check ownership
    const [existing] = await db
      .select()
      .from(qaLibraryPosts)
      .where(eq(qaLibraryPosts.id, id))
      .limit(1);

    if (!existing) return null;
    if (existing.authorUserId !== authorUserId && authorUserId !== 19) {
      throw new Error('Unauthorized: only author can publish post');
    }

    const [published] = await db
      .update(qaLibraryPosts)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(qaLibraryPosts.id, id))
      .returning();

    return published;
  }

  /**
   * Delete library post (soft delete via archived status)
   */
  async deleteLibraryPost(id: number, authorUserId: number): Promise<boolean> {
    const { qaLibraryPosts } = await import('@shared/schema');

    // Get post to check ownership
    const [existing] = await db
      .select()
      .from(qaLibraryPosts)
      .where(eq(qaLibraryPosts.id, id))
      .limit(1);

    if (!existing) return false;
    if (existing.authorUserId !== authorUserId && authorUserId !== 19) {
      throw new Error('Unauthorized: only author can delete post');
    }

    // Soft delete
    await db
      .update(qaLibraryPosts)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(qaLibraryPosts.id, id));

    return true;
  }

  /**
   * Increment view count for a library post
   * Called when a published article is viewed
   */
  async incrementLibraryPostViews(postId: number): Promise<void> {
    const { qaLibraryPosts } = await import('@shared/schema');

    await db
      .update(qaLibraryPosts)
      .set({
        viewCount: sql`COALESCE(${qaLibraryPosts.viewCount}, 0) + 1`,
      })
      .where(eq(qaLibraryPosts.id, postId));
  }

  /**
   * Get trending library posts based on view count and recency
   * Uses a weighted score: views + (recency bonus for posts in the last 7 days)
   */
  async getTrendingLibraryPosts(limit: number = 10, domain?: string): Promise<any[]> {
    const { qaLibraryPosts, qaAreas, qaTags } = await import('@shared/schema');

    const conditions: any[] = [
      eq(qaLibraryPosts.status, 'published'),
    ];

    if (domain) {
      conditions.push(eq(qaLibraryPosts.domain, domain));
    }

    // Calculate trending score: views + recency bonus
    // Posts from the last 7 days get a boost
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const posts = await db
      .select({
        post: qaLibraryPosts,
        area: qaAreas,
        tag: qaTags,
      })
      .from(qaLibraryPosts)
      .leftJoin(qaAreas, eq(qaLibraryPosts.areaId, qaAreas.id))
      .leftJoin(qaTags, eq(qaLibraryPosts.tagId, qaTags.id))
      .where(and(...conditions))
      .orderBy(
        // Order by views first, then by publishedAt for recency
        desc(qaLibraryPosts.viewCount),
        desc(qaLibraryPosts.publishedAt)
      )
      .limit(limit);

    return posts.map(row => ({
      ...row.post,
      area: row.area,
      tag: row.tag,
    }));
  }

  /**
   * Create library contribution
   */
  async createContribution(postId: number, contributorUserId: number, data: any): Promise<any> {
    const { qaLibraryContributions } = await import('@shared/schema');

    // Verify user can contribute
    const canContribute = await this.canAuthorLibraryPosts(contributorUserId);
    if (!canContribute) {
      throw new Error('Unauthorized: only verified apologists can contribute');
    }

    const contributionData: any = {
      postId,
      contributorUserId,
      type: data.type,
      payload: data.payload,
      status: 'pending',
    };

    const [created] = await db
      .insert(qaLibraryContributions)
      .values(contributionData)
      .returning();

    return created;
  }

  /**
   * List contributions for a post
   */
  async listContributions(postId: number): Promise<any> {
    const { qaLibraryContributions } = await import('@shared/schema');

    const contributions = await db
      .select()
      .from(qaLibraryContributions)
      .where(eq(qaLibraryContributions.postId, postId))
      .orderBy(desc(qaLibraryContributions.createdAt));

    // Enrich with contributor info
    const enriched = await Promise.all(
      contributions.map(async (c: any) => {
        const contributor = await this.getUser(c.contributorUserId);
        const reviewer = c.reviewedByUserId ? await this.getUser(c.reviewedByUserId) : null;

        return {
          ...c,
          contributor: contributor ? {
            id: contributor.id,
            username: contributor.username,
            displayName: contributor.displayName,
            avatarUrl: contributor.avatarUrl,
          } : undefined,
          reviewer: reviewer ? {
            id: reviewer.id,
            username: reviewer.username,
            displayName: reviewer.displayName,
          } : undefined,
        };
      })
    );

    return {
      contributions: enriched,
      total: enriched.length,
    };
  }

  /**
   * Approve contribution
   */
  async approveContribution(id: number, reviewerUserId: number): Promise<any> {
    const { qaLibraryContributions } = await import('@shared/schema');

    // Only user 19 can approve
    if (reviewerUserId !== 19) {
      throw new Error('Unauthorized: only admin can approve contributions');
    }

    const [updated] = await db
      .update(qaLibraryContributions)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
      })
      .where(eq(qaLibraryContributions.id, id))
      .returning();

    return updated;
  }

  /**
   * Reject contribution
   */
  async rejectContribution(id: number, reviewerUserId: number): Promise<any> {
    const { qaLibraryContributions } = await import('@shared/schema');

    // Only user 19 can reject
    if (reviewerUserId !== 19) {
      throw new Error('Unauthorized: only admin can reject contributions');
    }

    const [updated] = await db
      .update(qaLibraryContributions)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerUserId,
      })
      .where(eq(qaLibraryContributions.id, id))
      .returning();

    return updated;
  }

  /**
   * Check if user can author library posts
   */
  async canAuthorLibraryPosts(userId: number): Promise<boolean> {
    if (userId === 19) return true;

    const user = await this.getUser(userId);
    if (user?.role === 'admin') return true;
    if (user?.isVerifiedApologeticsAnswerer) return true;

    const hasPermission = await this.userHasPermission(userId, 'apologetics_post_access');
    return hasPermission;
  }

  // ============================================================================
  // POLL METHODS
  // ============================================================================

  async createPoll(poll: { question: string; endsAt?: Date | null; allowMultiple?: boolean }): Promise<any> {
    const [created] = await db.insert(polls).values({
      question: poll.question,
      endsAt: poll.endsAt || null,
      allowMultiple: poll.allowMultiple || false,
    }).returning();
    return created;
  }

  async getPoll(id: number): Promise<any | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async getPollOptions(pollId: number): Promise<any[]> {
    return await db.select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(asc(pollOptions.orderIndex));
  }

  async createPollOption(option: { pollId: number; text: string; orderIndex?: number }): Promise<any> {
    const [created] = await db.insert(pollOptions).values({
      pollId: option.pollId,
      text: option.text,
      orderIndex: option.orderIndex || 0,
    }).returning();
    return created;
  }

  async getPollWithOptions(pollId: number, userId?: number): Promise<any | null> {
    const poll = await this.getPoll(pollId);
    if (!poll) return null;

    const options = await this.getPollOptions(pollId);

    // Get user's votes if userId provided
    let userVotedOptionIds: number[] = [];
    if (userId) {
      userVotedOptionIds = await this.getUserPollVotes(pollId, userId);
    }

    // Calculate total votes
    const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

    return {
      ...poll,
      totalVotes,
      options: options.map(opt => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0,
        isVotedByUser: userVotedOptionIds.includes(opt.id),
      })),
      hasVoted: userVotedOptionIds.length > 0,
      isExpired: poll.endsAt ? new Date(poll.endsAt) < new Date() : false,
    };
  }

  async castPollVotes(pollId: number, userId: number, optionIds: number[]): Promise<any[]> {
    const votes: any[] = [];

    for (const optionId of optionIds) {
      // Check if already voted for this option
      const existing = await db.select()
        .from(pollVotes)
        .where(and(
          eq(pollVotes.pollId, pollId),
          eq(pollVotes.optionId, optionId),
          eq(pollVotes.userId, userId)
        ));

      if (existing.length > 0) {
        continue; // Already voted for this option, skip
      }

      // Create vote
      const [vote] = await db.insert(pollVotes).values({
        pollId,
        optionId,
        userId,
      }).returning();
      votes.push(vote);

      // Increment vote count on option
      await db.update(pollOptions)
        .set({ voteCount: sql`vote_count + 1` })
        .where(eq(pollOptions.id, optionId));
    }

    // Update total votes on poll
    await db.update(polls)
      .set({ totalVotes: sql`total_votes + ${votes.length}` })
      .where(eq(polls.id, pollId));

    // Update poll vote count on the associated microblog (for ranking)
    const [microblogWithPoll] = await db.select()
      .from(microblogs)
      .where(eq(microblogs.pollId, pollId));

    if (microblogWithPoll) {
      // We don't have a pollVoteCount column yet, but this would update it
      // For now, we'll skip this since we're using poll.totalVotes directly
    }

    return votes;
  }

  async removeUserPollVotes(pollId: number, userId: number): Promise<void> {
    // Get the options the user voted for
    const userVotes = await db.select()
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ));

    // Decrement vote counts for each option
    for (const vote of userVotes) {
      await db.update(pollOptions)
        .set({ voteCount: sql`GREATEST(vote_count - 1, 0)` })
        .where(eq(pollOptions.id, vote.optionId));
    }

    // Delete the votes
    const deletedCount = userVotes.length;
    await db.delete(pollVotes)
      .where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ));

    // Update total votes on poll
    if (deletedCount > 0) {
      await db.update(polls)
        .set({ totalVotes: sql`GREATEST(total_votes - ${deletedCount}, 0)` })
        .where(eq(polls.id, pollId));
    }
  }

  async getUserPollVotes(pollId: number, userId: number): Promise<number[]> {
    const votes = await db.select({ optionId: pollVotes.optionId })
      .from(pollVotes)
      .where(and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.userId, userId)
      ));
    return votes.map(v => v.optionId);
  }

  // ============================================================================
  // EXPLORE FEED METHODS
  // ============================================================================

  async getExploreFeedMicroblogs(options: {
    topic?: string;
    postType?: string;
    cursor?: Date;
    limit: number;
  }): Promise<any[]> {
    const conditions: any[] = [];

    // Only get top-level posts (not replies)
    conditions.push(isNull(microblogs.parentId));

    // Filter by topic
    if (options.topic) {
      conditions.push(eq(microblogs.topic, options.topic));
    }

    // Filter by post type
    if (options.postType) {
      conditions.push(eq(microblogs.postType, options.postType));
    }

    // Cursor-based pagination (get posts older than cursor)
    if (options.cursor) {
      conditions.push(lt(microblogs.createdAt, options.cursor));
    }

    // Only get non-deleted posts (if deletedAt exists)
    // conditions.push(isNull(microblogs.deletedAt));

    // Build query
    let query = db.select().from(microblogs);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query
      .orderBy(desc(microblogs.createdAt))
      .limit(options.limit);

    return results;
  }

  // Search microblogs/advice posts by content
  async searchMicroblogs(searchTerm: string, options?: { topic?: string; limit?: number }): Promise<Microblog[]> {
    const term = `%${searchTerm}%`;
    const conditions: any[] = [
      ilike(microblogs.content, term),
      isNull(microblogs.parentId), // Only top-level posts
    ];

    if (options?.topic) {
      conditions.push(eq(microblogs.topic, options.topic));
    }

    const results = await db.select()
      .from(microblogs)
      .where(and(...conditions))
      .orderBy(desc(microblogs.createdAt))
      .limit(options?.limit || 20);

    return results;
  }

  // ============================================================================
  // ORGANIZATION METHODS
  // ============================================================================

  // Organization CRUD
  async getOrganization(id: number): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async getOrganizationBySlug(slug: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.slug, slug));
    return result[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [result] = await db.insert(organizations).values(org).returning();
    return result;
  }

  async updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
    const [result] = await db.update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return result;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    const result = await db.delete(organizations).where(eq(organizations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Slug generation (server-side, collision-safe)
  async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    let slug = baseSlug;
    let counter = 2;

    while (true) {
      const existing = await db.select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Public directory (cursor-paginated)
  async getPublicOrganizations(options: {
    limit?: number;
    cursor?: string;
    q?: string;
    city?: string;
    state?: string;
    denomination?: string;
  }): Promise<{ items: Organization[]; nextCursor: string | null }> {
    const limit = options.limit || 20;
    const conditions: any[] = [];

    if (options.q) {
      const term = `%${options.q}%`;
      conditions.push(or(
        ilike(organizations.name, term),
        ilike(organizations.description, term)
      ));
    }

    if (options.city) {
      conditions.push(ilike(organizations.city, options.city));
    }

    if (options.state) {
      conditions.push(eq(organizations.state, options.state));
    }

    if (options.denomination) {
      // Support comma-separated denominations for tradition filtering
      const denominations = options.denomination.split(',').map(d => d.trim()).filter(Boolean);
      if (denominations.length === 1) {
        conditions.push(eq(organizations.denomination, denominations[0]));
      } else if (denominations.length > 1) {
        conditions.push(inArray(organizations.denomination, denominations));
      }
    }

    if (options.cursor) {
      // Cursor is the ID of the last item
      const cursorId = parseInt(options.cursor, 10);
      if (!isNaN(cursorId)) {
        conditions.push(gt(organizations.id, cursorId));
      }
    }

    let query = db.select().from(organizations);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const items = await query
      .orderBy(asc(organizations.id))
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const lastItem = items.pop();
      nextCursor = lastItem?.id.toString() || null;
    }

    return { items, nextCursor };
  }

  async searchOrganizations(searchTerm: string): Promise<Organization[]> {
    const term = `%${searchTerm}%`;
    return await db.select()
      .from(organizations)
      .where(or(
        ilike(organizations.name, term),
        ilike(organizations.description, term),
        ilike(organizations.city, term)
      ))
      .limit(20);
  }

  // Billing (for tier enforcement)
  async getOrgBilling(orgId: number): Promise<OrgBilling | undefined> {
    const result = await db.select()
      .from(orgBilling)
      .where(eq(orgBilling.organizationId, orgId));
    return result[0];
  }

  async createOrgBilling(billing: InsertOrgBilling): Promise<OrgBilling> {
    assertValidOrgBillingInput(billing ?? {});
    const [result] = await db.insert(orgBilling).values(billing).returning();
    return result;
  }

  async updateOrgBilling(orgId: number, data: Partial<OrgBilling>): Promise<OrgBilling> {
    assertValidOrgBillingInput(data ?? {});
    const [result] = await db.update(orgBilling)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orgBilling.organizationId, orgId))
      .returning();
    return result;
  }

  // Membership
  async getOrganizationMembers(orgId: number): Promise<(OrganizationUser & { user: User })[]> {
    const result = await db.select({
      id: organizationUsers.id,
      organizationId: organizationUsers.organizationId,
      userId: organizationUsers.userId,
      role: organizationUsers.role,
      joinedAt: organizationUsers.joinedAt,
      user: users
    })
      .from(organizationUsers)
      .innerJoin(users, eq(users.id, organizationUsers.userId))
      .where(eq(organizationUsers.organizationId, orgId));

    return result as any;
  }

  async getOrganizationMember(orgId: number, userId: number): Promise<OrganizationUser | undefined> {
    const result = await db.select()
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, orgId),
        eq(organizationUsers.userId, userId)
      ));
    return result[0];
  }

  async getUserOrganizations(userId: number): Promise<Organization[]> {
    const result = await db.select({
      organization: organizations
    })
      .from(organizationUsers)
      .innerJoin(organizations, eq(organizations.id, organizationUsers.organizationId))
      .where(eq(organizationUsers.userId, userId));

    return result.map(r => r.organization);
  }

  async getUserRoleInOrg(orgId: number, userId: number): Promise<string | null> {
    const result = await db.select({ role: organizationUsers.role })
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, orgId),
        eq(organizationUsers.userId, userId)
      ));
    return result[0]?.role || null;
  }

  async addOrganizationMember(member: InsertOrganizationUser): Promise<OrganizationUser> {
    const [result] = await db.insert(organizationUsers).values(member).returning();
    return result;
  }

  async updateOrganizationMemberRole(orgId: number, userId: number, role: string): Promise<OrganizationUser> {
    const [result] = await db.update(organizationUsers)
      .set({ role })
      .where(and(
        eq(organizationUsers.organizationId, orgId),
        eq(organizationUsers.userId, userId)
      ))
      .returning();
    return result;
  }

  async removeOrganizationMember(orgId: number, userId: number): Promise<boolean> {
    const result = await db.delete(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, orgId),
        eq(organizationUsers.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async isOrganizationAdmin(orgId: number, userId: number): Promise<boolean> {
    const role = await this.getUserRoleInOrg(orgId, userId);
    return role === 'owner' || role === 'admin';
  }

  async isOrganizationMember(orgId: number, userId: number): Promise<boolean> {
    const result = await db.select({ id: organizationUsers.id })
      .from(organizationUsers)
      .where(and(
        eq(organizationUsers.organizationId, orgId),
        eq(organizationUsers.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  // Soft affiliations
  async hasAffiliation(orgId: number, userId: number): Promise<boolean> {
    const result = await db.select({ id: userChurchAffiliations.id })
      .from(userChurchAffiliations)
      .where(and(
        eq(userChurchAffiliations.organizationId, orgId),
        eq(userChurchAffiliations.userId, userId)
      ))
      .limit(1);
    return result.length > 0;
  }

  async getUserChurchAffiliations(userId: number): Promise<UserChurchAffiliation[]> {
    return await db.select()
      .from(userChurchAffiliations)
      .where(eq(userChurchAffiliations.userId, userId))
      .orderBy(desc(userChurchAffiliations.createdAt));
  }

  async addUserChurchAffiliation(affiliation: InsertUserChurchAffiliation): Promise<UserChurchAffiliation> {
    const [result] = await db.insert(userChurchAffiliations).values(affiliation).returning();
    return result;
  }

  async removeUserChurchAffiliation(userId: number, affiliationId: number): Promise<boolean> {
    const result = await db.delete(userChurchAffiliations)
      .where(and(
        eq(userChurchAffiliations.id, affiliationId),
        eq(userChurchAffiliations.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async updateUserChurchAffiliation(
    userId: number,
    data: Partial<InsertUserChurchAffiliation>
  ): Promise<UserChurchAffiliation | null> {
    // Users can only have one church affiliation, so we upsert
    const existing = await db.select()
      .from(userChurchAffiliations)
      .where(eq(userChurchAffiliations.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const [result] = await db.update(userChurchAffiliations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userChurchAffiliations.userId, userId))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(userChurchAffiliations)
        .values({ userId, ...data } as InsertUserChurchAffiliation)
        .returning();
      return result;
    }
  }

  async getUserChurchAffiliation(userId: number): Promise<UserChurchAffiliation | null> {
    const result = await db.select()
      .from(userChurchAffiliations)
      .where(eq(userChurchAffiliations.userId, userId))
      .limit(1);
    return result[0] || null;
  }

  // Church invitation requests (for inviting churches to join the platform)
  async createChurchInvitationRequest(request: InsertChurchInvitationRequest): Promise<ChurchInvitationRequest> {
    const [result] = await db.insert(churchInvitationRequests).values(request).returning();
    return result;
  }

  async getChurchInvitationRequestsByUser(userId: number): Promise<ChurchInvitationRequest[]> {
    return await db.select()
      .from(churchInvitationRequests)
      .where(eq(churchInvitationRequests.requesterId, userId))
      .orderBy(desc(churchInvitationRequests.createdAt));
  }

  async getChurchInvitationRequestByEmail(email: string): Promise<ChurchInvitationRequest | null> {
    const result = await db.select()
      .from(churchInvitationRequests)
      .where(eq(churchInvitationRequests.churchEmail, email.toLowerCase()))
      .orderBy(desc(churchInvitationRequests.createdAt))
      .limit(1);
    return result[0] || null;
  }

  async updateChurchInvitationRequest(
    id: number,
    data: Partial<ChurchInvitationRequest>
  ): Promise<ChurchInvitationRequest | null> {
    const [result] = await db.update(churchInvitationRequests)
      .set(data)
      .where(eq(churchInvitationRequests.id, id))
      .returning();
    return result || null;
  }

  async getPendingChurchInvitationRequests(): Promise<ChurchInvitationRequest[]> {
    return await db.select()
      .from(churchInvitationRequests)
      .where(eq(churchInvitationRequests.status, 'pending'))
      .orderBy(churchInvitationRequests.createdAt);
  }

  // Membership requests
  async getPendingMembershipRequest(orgId: number, userId: number): Promise<OrgMembershipRequest | null> {
    const result = await db.select()
      .from(orgMembershipRequests)
      .where(and(
        eq(orgMembershipRequests.organizationId, orgId),
        eq(orgMembershipRequests.userId, userId),
        eq(orgMembershipRequests.status, 'pending')
      ))
      .limit(1);
    return result[0] || null;
  }

  async createMembershipRequest(request: InsertOrgMembershipRequest): Promise<OrgMembershipRequest> {
    const [result] = await db.insert(orgMembershipRequests).values(request).returning();
    return result;
  }

  async getMembershipRequests(orgId: number): Promise<OrgMembershipRequest[]> {
    return await db.select()
      .from(orgMembershipRequests)
      .where(eq(orgMembershipRequests.organizationId, orgId))
      .orderBy(desc(orgMembershipRequests.requestedAt));
  }

  async approveMembershipRequest(requestId: number, reviewerId: number): Promise<void> {
    // Get the request
    const [request] = await db.select()
      .from(orgMembershipRequests)
      .where(eq(orgMembershipRequests.id, requestId));

    if (!request) return;

    // Update request status
    await db.update(orgMembershipRequests)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerId
      })
      .where(eq(orgMembershipRequests.id, requestId));

    // Add as member
    await db.insert(organizationUsers)
      .values({
        organizationId: request.organizationId,
        userId: request.userId,
        role: 'member'
      })
      .onConflictDoNothing();
  }

  async declineMembershipRequest(requestId: number, reviewerId: number): Promise<void> {
    await db.update(orgMembershipRequests)
      .set({
        status: 'declined',
        reviewedAt: new Date(),
        reviewedByUserId: reviewerId
      })
      .where(eq(orgMembershipRequests.id, requestId));
  }

  // Meeting requests
  async countOrgMeetingRequestsThisMonth(orgId: number): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await db.select({ count: sql<number>`count(*)` })
      .from(orgMeetingRequests)
      .where(and(
        eq(orgMeetingRequests.organizationId, orgId),
        gt(orgMeetingRequests.createdAt, startOfMonth)
      ));

    return Number(result[0]?.count || 0);
  }

  async createMeetingRequest(request: InsertOrgMeetingRequest): Promise<OrgMeetingRequest> {
    const [result] = await db.insert(orgMeetingRequests).values(request).returning();
    return result;
  }

  async getMeetingRequests(orgId: number): Promise<OrgMeetingRequest[]> {
    return await db.select()
      .from(orgMeetingRequests)
      .where(eq(orgMeetingRequests.organizationId, orgId))
      .orderBy(desc(orgMeetingRequests.createdAt));
  }

  async updateMeetingRequestStatus(requestId: number, status: string, closedBy?: number): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'closed' && closedBy) {
      updateData.closedAt = new Date();
      updateData.closedByUserId = closedBy;
    }

    await db.update(orgMeetingRequests)
      .set(updateData)
      .where(eq(orgMeetingRequests.id, requestId));
  }

  // Ordination programs
  async getOrdinationPrograms(orgId: number): Promise<OrdinationProgram[]> {
    return await db.select()
      .from(ordinationPrograms)
      .where(eq(ordinationPrograms.organizationId, orgId))
      .orderBy(desc(ordinationPrograms.createdAt));
  }

  async getOrdinationProgram(id: number): Promise<OrdinationProgram | undefined> {
    const result = await db.select()
      .from(ordinationPrograms)
      .where(eq(ordinationPrograms.id, id));
    return result[0];
  }

  async createOrdinationProgram(program: InsertOrdinationProgram): Promise<OrdinationProgram> {
    const [result] = await db.insert(ordinationPrograms).values(program).returning();
    return result;
  }

  async updateOrdinationProgram(id: number, data: Partial<OrdinationProgram>): Promise<OrdinationProgram> {
    const [result] = await db.update(ordinationPrograms)
      .set(data)
      .where(eq(ordinationPrograms.id, id))
      .returning();
    return result;
  }

  // Ordination applications
  async getOrdinationApplications(orgId: number): Promise<OrdinationApplication[]> {
    // Get applications for all programs belonging to this org
    const programs = await this.getOrdinationPrograms(orgId);
    const programIds = programs.map(p => p.id);

    if (programIds.length === 0) return [];

    return await db.select()
      .from(ordinationApplications)
      .where(inArray(ordinationApplications.programId, programIds))
      .orderBy(desc(ordinationApplications.submittedAt));
  }

  async getUserOrdinationApplications(userId: number): Promise<OrdinationApplication[]> {
    return await db.select()
      .from(ordinationApplications)
      .where(eq(ordinationApplications.userId, userId))
      .orderBy(desc(ordinationApplications.submittedAt));
  }

  async createOrdinationApplication(app: InsertOrdinationApplication): Promise<OrdinationApplication> {
    const [result] = await db.insert(ordinationApplications).values(app).returning();
    return result;
  }

  async getOrdinationReviews(applicationId: number): Promise<OrdinationReview[]> {
    return await db.select()
      .from(ordinationReviews)
      .where(eq(ordinationReviews.applicationId, applicationId))
      .orderBy(desc(ordinationReviews.createdAt));
  }

  async createOrdinationReview(review: InsertOrdinationReview): Promise<OrdinationReview> {
    const [result] = await db.insert(ordinationReviews).values(review).returning();

    // Update application status based on review decision
    const statusMap: Record<string, string> = {
      'approve': 'approved',
      'reject': 'rejected',
      'request_info': 'under_review'
    };

    await db.update(ordinationApplications)
      .set({
        status: statusMap[review.decision] || 'under_review',
        updatedAt: new Date()
      })
      .where(eq(ordinationApplications.id, review.applicationId));

    return result;
  }

  // Activity logs (admin-only, safe metadata)
  async logOrganizationActivity(log: InsertOrganizationActivityLog): Promise<void> {
    await db.insert(organizationActivityLogs).values(log);
  }

  async getOrganizationActivityLogs(orgId: number, limit: number = 50): Promise<OrganizationActivityLog[]> {
    return await db.select()
      .from(organizationActivityLogs)
      .where(eq(organizationActivityLogs.organizationId, orgId))
      .orderBy(desc(organizationActivityLogs.createdAt))
      .limit(limit);
  }

  // Organization leaders (About / Leadership section)
  async getOrganizationLeaders(orgId: number): Promise<OrganizationLeader[]> {
    return await db.select()
      .from(organizationLeaders)
      .where(eq(organizationLeaders.organizationId, orgId))
      .orderBy(asc(organizationLeaders.sortOrder), asc(organizationLeaders.id));
  }

  async getOrganizationLeader(id: number): Promise<OrganizationLeader | undefined> {
    const result = await db.select()
      .from(organizationLeaders)
      .where(eq(organizationLeaders.id, id));
    return result[0];
  }

  async createOrganizationLeader(data: InsertOrganizationLeader): Promise<OrganizationLeader> {
    const [result] = await db.insert(organizationLeaders).values(data).returning();
    return result;
  }

  async updateOrganizationLeader(id: number, orgId: number, data: Partial<OrganizationLeader>): Promise<OrganizationLeader> {
    // Ensure we only update leaders belonging to the specified org (cross-org protection)
    const [result] = await db.update(organizationLeaders)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(organizationLeaders.id, id),
        eq(organizationLeaders.organizationId, orgId)
      ))
      .returning();
    return result;
  }

  async deleteOrganizationLeader(id: number, orgId: number): Promise<boolean> {
    // Ensure we only delete leaders belonging to the specified org (cross-org protection)
    const result = await db.delete(organizationLeaders)
      .where(and(
        eq(organizationLeaders.id, id),
        eq(organizationLeaders.organizationId, orgId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  // ==========================================================================
  // SERMONS (Org Video Library with Mux)
  // ==========================================================================

  async createSermon(data: InsertSermon): Promise<Sermon> {
    const [sermon] = await db.insert(sermons).values(data).returning();
    return sermon;
  }

  async listOrgSermons(orgId: number, opts?: { includeDeleted?: boolean }): Promise<Sermon[]> {
    const conditions = [eq(sermons.organizationId, orgId)];
    if (!opts?.includeDeleted) {
      conditions.push(isNull(sermons.deletedAt));
    }
    return await db.select()
      .from(sermons)
      .where(and(...conditions))
      .orderBy(desc(sermons.publishedAt), desc(sermons.createdAt));
  }

  async getSermonById(id: number): Promise<Sermon | undefined> {
    const result = await db.select()
      .from(sermons)
      .where(and(eq(sermons.id, id), isNull(sermons.deletedAt)));
    return result[0];
  }

  async updateSermon(id: number, data: Partial<Sermon>): Promise<Sermon> {
    const [sermon] = await db.update(sermons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sermons.id, id))
      .returning();
    return sermon;
  }

  async softDeleteSermon(id: number): Promise<boolean> {
    const [result] = await db.update(sermons)
      .set({ deletedAt: new Date() })
      .where(eq(sermons.id, id))
      .returning();
    return !!result;
  }

  async incrementSermonView(sermonId: number, userId?: number, watchDuration?: number, completed?: boolean): Promise<void> {
    // Increment view count on sermon
    await db.update(sermons)
      .set({ viewCount: sql`${sermons.viewCount} + 1` })
      .where(eq(sermons.id, sermonId));

    // Record view details
    await db.insert(sermonViews).values({
      sermonId,
      userId: userId || null,
      watchDuration: watchDuration || null,
      completed: completed || false,
    });
  }

  async countOrgSermons(orgId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(sermons)
      .where(and(
        eq(sermons.organizationId, orgId),
        isNull(sermons.deletedAt)
      ));
    return Number(result[0]?.count ?? 0);
  }

  async updateSermonByMuxAssetId(muxAssetId: string, data: Partial<Sermon>): Promise<Sermon | undefined> {
    const [sermon] = await db.update(sermons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sermons.muxAssetId, muxAssetId))
      .returning();
    return sermon;
  }

  async updateSermonByMuxUploadId(muxUploadId: string, data: Partial<Sermon>): Promise<Sermon | undefined> {
    const [sermon] = await db.update(sermons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sermons.muxUploadId, muxUploadId))
      .returning();
    return sermon;
  }

  async getPublicOrgSermons(orgId: number, viewerIsMember: boolean): Promise<Sermon[]> {
    // Filter by privacy level based on viewer's membership status
    const privacyConditions = viewerIsMember
      ? or(eq(sermons.privacyLevel, 'public'), eq(sermons.privacyLevel, 'members'))
      : eq(sermons.privacyLevel, 'public');

    return await db.select()
      .from(sermons)
      .where(and(
        eq(sermons.organizationId, orgId),
        isNull(sermons.deletedAt),
        eq(sermons.status, 'ready'),
        privacyConditions
        // Note: 'unlisted' is never included in lists
      ))
      .orderBy(desc(sermons.publishedAt), desc(sermons.createdAt));
  }
}

// Export storage instance - switch based on environment
export const storage: IStorage = process.env.USE_DB === 'true'
  ? new DbStorage()
  : new MemStorage();
