import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, time, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table schema - updated for Replit Auth
export const users = pgTable("users", {
  // Uses string id from Replit Auth
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  displayName: text("display_name"),
  bio: text("bio"),
  isVerifiedApologeticsAnswerer: boolean("is_verified_apologetics_answerer").default(false),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type UpsertUser = typeof users.$inferInsert;

// Communities table schema
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  memberCount: integer("member_count").default(0),
  hasPrivateWall: boolean("has_private_wall").default(false),
  hasPublicWall: boolean("has_public_wall").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertCommunitySchema = createInsertSchema(communities).pick({
  name: true,
  description: true,
  slug: true,
  iconName: true, 
  iconColor: true,
  hasPrivateWall: true,
  hasPublicWall: true,
  createdBy: true,
});

// Community members table schema with roles
export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("member"), // "owner", "moderator", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertCommunityMemberSchema = createInsertSchema(communityMembers).pick({
  communityId: true,
  userId: true,
  role: true,
});

// Community Chat Rooms schema
export const communityChatRooms = pgTable("community_chat_rooms", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

export const insertCommunityChatRoomSchema = createInsertSchema(communityChatRooms).pick({
  communityId: true,
  name: true,
  description: true,
  isPrivate: true,
  createdBy: true,
});

// Chat Room Messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  chatRoomId: integer("chat_room_id").references(() => communityChatRooms.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  isSystemMessage: boolean("is_system_message").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  content: true,
  chatRoomId: true,
  senderId: true,
  isSystemMessage: true,
});

// Community Wall Posts schema
export const communityWallPosts = pgTable("community_wall_posts", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").references(() => communities.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPrivate: boolean("is_private").default(false), // For private wall posts
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityWallPostSchema = createInsertSchema(communityWallPosts).pick({
  communityId: true,
  authorId: true,
  content: true,
  imageUrl: true,
  isPrivate: true,
});

// Groups table schema (private groups)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  iconName: true,
  iconColor: true,
  isPrivate: true,
  createdBy: true,
});

// Group members table schema
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  isAdmin: true,
});

// Posts table schema
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  authorId: integer("author_id").references(() => users.id),
  upvotes: integer("upvotes").default(0),
  commentCount: integer("comment_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  content: true,
  imageUrl: true,
  communityId: true, 
  groupId: true,
  authorId: true,
});

// Comments table schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").references(() => posts.id).notNull(),
  authorId: integer("author_id").references(() => users.id),
  parentId: integer("parent_id").references(() => comments.id),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  postId: true,
  authorId: true,
  parentId: true,
});

// Apologetics resources schema
export const apologeticsResources = pgTable("apologetics_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // book, video, podcast, etc.
  iconName: text("icon_name").notNull(),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApologeticsResourceSchema = createInsertSchema(apologeticsResources).pick({
  title: true,
  description: true,
  type: true,
  iconName: true,
  url: true,
});

// Apologetics Q&A system
export const apologeticsTopics = pgTable("apologetics_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApologeticsTopicSchema = createInsertSchema(apologeticsTopics).pick({
  name: true,
  description: true,
  iconName: true,
  slug: true,
});

export const apologeticsQuestions = pgTable("apologetics_questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  topicId: integer("topic_id").references(() => apologeticsTopics.id).notNull(),
  status: text("status").notNull().default("open"), // open, answered, closed
  answerCount: integer("answer_count").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApologeticsQuestionSchema = createInsertSchema(apologeticsQuestions).pick({
  title: true,
  content: true,
  authorId: true,
  topicId: true,
  status: true,
});

export const apologeticsAnswers = pgTable("apologetics_answers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  questionId: integer("question_id").references(() => apologeticsQuestions.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  isVerifiedAnswer: boolean("is_verified_answer").default(false),
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApologeticsAnswerSchema = createInsertSchema(apologeticsAnswers).pick({
  content: true,
  questionId: true,
  authorId: true,
  isVerifiedAnswer: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communities.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertApologeticsResource = z.infer<typeof insertApologeticsResourceSchema>;
export type ApologeticsResource = typeof apologeticsResources.$inferSelect;

export type InsertApologeticsTopic = z.infer<typeof insertApologeticsTopicSchema>;
export type ApologeticsTopic = typeof apologeticsTopics.$inferSelect;

export type InsertApologeticsQuestion = z.infer<typeof insertApologeticsQuestionSchema>;
export type ApologeticsQuestion = typeof apologeticsQuestions.$inferSelect;

export type InsertApologeticsAnswer = z.infer<typeof insertApologeticsAnswerSchema>;
export type ApologeticsAnswer = typeof apologeticsAnswers.$inferSelect;

// Livestreams table schema
export const livestreams = pgTable("livestreams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  hostId: integer("host_id").references(() => users.id).notNull(),
  thumbnail: text("thumbnail"),
  status: text("status").notNull().default("upcoming"), // "live", "upcoming", "ended"
  viewerCount: integer("viewer_count").default(0),
  scheduledFor: timestamp("scheduled_for"),
  duration: text("duration"),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLivestreamSchema = createInsertSchema(livestreams).pick({
  title: true,
  description: true,
  hostId: true,
  thumbnail: true,
  status: true,
  scheduledFor: true,
  duration: true,
  tags: true,
});

export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;
export type Livestream = typeof livestreams.$inferSelect;

// Livestreamer application and approval system
export const livestreamerApplications = pgTable("livestreamer_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  ministryName: text("ministry_name"),
  ministryDescription: text("ministry_description").notNull(),
  ministerialExperience: text("ministerial_experience"),
  statementOfFaith: text("statement_of_faith").notNull(),
  socialMediaLinks: text("social_media_links"),
  referenceName: text("reference_name").notNull(),
  referenceContact: text("reference_contact").notNull(),
  referenceRelationship: text("reference_relationship").notNull(),
  sampleContentUrl: text("sample_content_url").notNull(),
  livestreamTopics: text("livestream_topics").notNull(),
  targetAudience: text("target_audience").notNull(),
  agreedToTerms: boolean("agreed_to_terms").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertLivestreamerApplicationSchema = createInsertSchema(livestreamerApplications).pick({
  userId: true,
  ministryName: true,
  ministryDescription: true,
  ministerialExperience: true,
  statementOfFaith: true,
  socialMediaLinks: true,
  referenceName: true,
  referenceContact: true,
  referenceRelationship: true,
  sampleContentUrl: true,
  livestreamTopics: true,
  targetAudience: true,
  agreedToTerms: true
});

// Creator tier and incentive structure
export const creatorTiers = pgTable("creator_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements").notNull(),
  benefits: text("benefits").notNull(),
  iconName: text("icon_name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreatorTierSchema = createInsertSchema(creatorTiers).pick({
  name: true,
  description: true,
  requirements: true,
  benefits: true,
  iconName: true,
  order: true,
});

// User-Creator tier relationship
export const userCreatorTiers = pgTable("user_creator_tiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tierId: integer("tier_id").references(() => creatorTiers.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  validUntil: timestamp("valid_until"),
});

export const insertUserCreatorTierSchema = createInsertSchema(userCreatorTiers).pick({
  userId: true,
  tierId: true,
  validUntil: true,
});

// Virtual gifts that can be sent during livestreams
export const virtualGifts = pgTable("virtual_gifts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  value: integer("value").notNull(), // Value in platform points/currency
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVirtualGiftSchema = createInsertSchema(virtualGifts).pick({
  name: true,
  description: true,
  iconName: true,
  value: true,
  isActive: true,
});

// Record of gifts sent during livestreams
export const livestreamGifts = pgTable("livestream_gifts", {
  id: serial("id").primaryKey(),
  livestreamId: integer("livestream_id").references(() => livestreams.id).notNull(),
  giftId: integer("gift_id").references(() => virtualGifts.id).notNull(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").defaultNow(),
});

export const insertLivestreamGiftSchema = createInsertSchema(livestreamGifts).pick({
  livestreamId: true,
  giftId: true,
  senderId: true,
  receiverId: true,
  message: true,
});

// Export additional types
export type InsertLivestreamerApplication = z.infer<typeof insertLivestreamerApplicationSchema>;
export type LivestreamerApplication = typeof livestreamerApplications.$inferSelect;

export type InsertCreatorTier = z.infer<typeof insertCreatorTierSchema>;
export type CreatorTier = typeof creatorTiers.$inferSelect;

export type InsertUserCreatorTier = z.infer<typeof insertUserCreatorTierSchema>;
export type UserCreatorTier = typeof userCreatorTiers.$inferSelect;

export type InsertVirtualGift = z.infer<typeof insertVirtualGiftSchema>;
export type VirtualGift = typeof virtualGifts.$inferSelect;

export type InsertLivestreamGift = z.infer<typeof insertLivestreamGiftSchema>;
export type LivestreamGift = typeof livestreamGifts.$inferSelect;

// Microblog posts (Twitter-like) schema
export const microblogs = pgTable("microblogs", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Optional image attachment
  authorId: integer("author_id").references(() => users.id).notNull(),
  communityId: integer("community_id").references(() => communities.id), // Optional community (public if null)
  groupId: integer("group_id").references(() => groups.id), // Optional private group (public if null)
  likeCount: integer("like_count").default(0),
  repostCount: integer("repost_count").default(0),
  replyCount: integer("reply_count").default(0),
  parentId: integer("parent_id").references(() => microblogs.id), // For replies to other microblogs
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMicroblogSchema = createInsertSchema(microblogs).pick({
  content: true,
  imageUrl: true,
  authorId: true,
  communityId: true,
  groupId: true,
  parentId: true,
});

// Microblog likes table for tracking user likes
export const microblogLikes = pgTable("microblog_likes", {
  id: serial("id").primaryKey(),
  microblogId: integer("microblog_id").references(() => microblogs.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMicroblogLikeSchema = createInsertSchema(microblogLikes).pick({
  microblogId: true,
  userId: true,
});

export type InsertMicroblog = z.infer<typeof insertMicroblogSchema>;
export type Microblog = typeof microblogs.$inferSelect;

export type InsertMicroblogLike = z.infer<typeof insertMicroblogLikeSchema>;
export type MicroblogLike = typeof microblogLikes.$inferSelect;

// Community Roles & Chat Room Types
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;

export type InsertCommunityChatRoom = z.infer<typeof insertCommunityChatRoomSchema>;
export type CommunityChatRoom = typeof communityChatRooms.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertCommunityWallPost = z.infer<typeof insertCommunityWallPostSchema>;
export type CommunityWallPost = typeof communityWallPosts.$inferSelect;

// ========================
// COMMUNITY EVENTS
// ========================
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"), // General location name
  address: text("address"), // Full street address
  city: text("city"), // City
  state: text("state"), // State or province
  zipCode: text("zip_code"), // Postal/ZIP code
  isVirtual: boolean("is_virtual").default(false),
  isPublic: boolean("is_public").default(false), // Allow events to be publicly visible
  showOnMap: boolean("show_on_map").default(true), // Whether to display the event on maps
  virtualMeetingUrl: text("virtual_meeting_url"),
  eventDate: date("event_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  imageUrl: text("image_url"),
  latitude: text("latitude"), // For map integration
  longitude: text("longitude"), // For map integration
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  location: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  isVirtual: true,
  isPublic: true,
  showOnMap: true,
  virtualMeetingUrl: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  imageUrl: true,
  latitude: true,
  longitude: true,
  communityId: true,
  groupId: true,
  creatorId: true,
});

export const eventRsvps = pgTable("event_rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull(), // attending, maybe, declined
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventRsvpSchema = createInsertSchema(eventRsvps).pick({
  eventId: true,
  userId: true,
  status: true,
});

// ========================
// PRAYER REQUESTS
// ========================
export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").default(false),
  privacyLevel: text("privacy_level").notNull(), // public, friends-only, group-only
  groupId: integer("group_id").references(() => groups.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  prayerCount: integer("prayer_count").default(0),
  isAnswered: boolean("is_answered").default(false),
  answeredDescription: text("answered_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).pick({
  title: true,
  content: true,
  isAnonymous: true,
  privacyLevel: true,
  groupId: true,
  authorId: true,
});

export const prayers = pgTable("prayers", {
  id: serial("id").primaryKey(),
  prayerRequestId: integer("prayer_request_id").notNull().references(() => prayerRequests.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPrayerSchema = createInsertSchema(prayers).pick({
  prayerRequestId: true,
  userId: true,
});

// ========================
// MENTORSHIP PROGRAM
// ========================
export const mentorProfiles = pgTable("mentor_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  spiritualGifts: text("spiritual_gifts").array(),
  areasOfExpertise: text("areas_of_expertise").array(),
  yearsOfFaith: integer("years_of_faith"),
  shortBio: text("short_bio").notNull(),
  availability: text("availability").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorProfileSchema = createInsertSchema(mentorProfiles).pick({
  userId: true,
  spiritualGifts: true,
  areasOfExpertise: true,
  yearsOfFaith: true,
  shortBio: true,
  availability: true,
});

export const mentorshipRequests = pgTable("mentorship_requests", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  message: text("message"),
  status: text("status").notNull(), // pending, accepted, declined
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequests).pick({
  mentorId: true,
  menteeId: true,
  message: true,
  status: true,
});

export const mentorshipRelationships = pgTable("mentorship_relationships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id),
  menteeId: integer("mentee_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  goals: jsonb("goals"),
});

export const insertMentorshipRelationshipSchema = createInsertSchema(mentorshipRelationships).pick({
  mentorId: true,
  menteeId: true,
  goals: true,
});

// ========================
// BIBLE STUDY TOOLS
// ========================
export const bibleReadingPlans = pgTable("bible_reading_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // days
  readings: jsonb("readings").notNull(), // Array of daily readings
  creatorId: integer("creator_id").references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBibleReadingPlanSchema = createInsertSchema(bibleReadingPlans).pick({
  title: true,
  description: true,
  duration: true,
  readings: true,
  creatorId: true,
  groupId: true,
  isPublic: true,
});

export const bibleReadingProgress = pgTable("bible_reading_progress", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").notNull().references(() => bibleReadingPlans.id),
  userId: integer("user_id").notNull().references(() => users.id),
  currentDay: integer("current_day").default(1),
  completedDays: jsonb("completed_days").default([]),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertBibleReadingProgressSchema = createInsertSchema(bibleReadingProgress).pick({
  planId: true,
  userId: true,
});

export const bibleStudyNotes = pgTable("bible_study_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  passage: text("passage"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBibleStudyNotesSchema = createInsertSchema(bibleStudyNotes).pick({
  userId: true,
  groupId: true,
  title: true,
  content: true,
  passage: true,
  isPublic: true,
});

export const verseMemorization = pgTable("verse_memorization", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verse: text("verse").notNull(),
  reference: text("reference").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  masteredDate: timestamp("mastered_date"),
  reviewDates: jsonb("review_dates").default([]),
  reminderFrequency: integer("reminder_frequency"), // days
});

export const insertVerseMemorizationSchema = createInsertSchema(verseMemorization).pick({
  userId: true,
  verse: true,
  reference: true,
  reminderFrequency: true,
});

// ========================
// CONTENT RECOMMENDATIONS
// ========================
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interests: jsonb("interests").default([]),
  favoriteTopics: jsonb("favorite_topics").default([]),
  engagementHistory: jsonb("engagement_history").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentRecommendations = pgTable("content_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // 'post', 'microblog', 'apologetics', 'bible_study', etc.
  contentId: integer("content_id").notNull(),
  score: integer("score").notNull(),
  reason: text("reason"),
  isViewed: boolean("is_viewed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  interests: true,
  favoriteTopics: true,
});

export const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).pick({
  userId: true,
  contentType: true,
  contentId: true,
  score: true,
  reason: true,
});

// ========================
// COMMUNITY CHALLENGES
// ========================
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // prayer, service, bible-reading
  duration: integer("duration").notNull(), // days
  goals: jsonb("goals").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  groupId: integer("group_id").references(() => groups.id),
  communityId: integer("community_id").references(() => communities.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challenges).pick({
  title: true,
  description: true,
  type: true,
  duration: true,
  goals: true,
  creatorId: true,
  groupId: true,
  communityId: true,
  startDate: true,
  endDate: true,
});

export const challengeParticipants = pgTable("challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  progress: jsonb("progress").default({}),
  isCompleted: boolean("is_completed").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).pick({
  challengeId: true,
  userId: true,
});

export const challengeTestimonials = pgTable("challenge_testimonials", {
  id: serial("id").primaryKey(),
  challengeId: integer("challenge_id").notNull().references(() => challenges.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChallengeTestimonialSchema = createInsertSchema(challengeTestimonials).pick({
  challengeId: true,
  userId: true,
  content: true,
});

// ========================
// RESOURCE SHARING
// ========================
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // book, podcast, video, article
  url: text("url"),
  author: text("author"),
  imageUrl: text("image_url"),
  tags: text("tags").array(),
  averageRating: integer("average_rating").default(0),
  submitterId: integer("submitter_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  title: true,
  description: true,
  type: true,
  url: true,
  author: true,
  imageUrl: true,
  tags: true,
  submitterId: true,
});

export const resourceRatings = pgTable("resource_ratings", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceRatingSchema = createInsertSchema(resourceRatings).pick({
  resourceId: true,
  userId: true,
  rating: true,
  review: true,
});

export const resourceCollections = pgTable("resource_collections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceCollectionSchema = createInsertSchema(resourceCollections).pick({
  title: true,
  description: true,
  creatorId: true,
  isPublic: true,
});

export const collectionResources = pgTable("collection_resources", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull().references(() => resourceCollections.id),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertCollectionResourceSchema = createInsertSchema(collectionResources).pick({
  collectionId: true,
  resourceId: true,
});

// ========================
// COMMUNITY SERVICE
// ========================
export const serviceProjects = pgTable("service_projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  date: date("date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  organizerId: integer("organizer_id").notNull().references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  groupId: integer("group_id").references(() => groups.id),
  volunteerLimit: integer("volunteer_limit"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceProjectSchema = createInsertSchema(serviceProjects).pick({
  title: true,
  description: true,
  location: true,
  date: true,
  startTime: true,
  endTime: true,
  organizerId: true,
  communityId: true,
  groupId: true,
  volunteerLimit: true,
  imageUrl: true,
});

export const serviceVolunteers = pgTable("service_volunteers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull(), // signed-up, confirmed, attended, cancelled
  hoursServed: integer("hours_served"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceVolunteerSchema = createInsertSchema(serviceVolunteers).pick({
  projectId: true,
  userId: true,
  status: true,
});

export const serviceTestimonials = pgTable("service_testimonials", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => serviceProjects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceTestimonialSchema = createInsertSchema(serviceTestimonials).pick({
  projectId: true,
  userId: true,
  content: true,
  imageUrl: true,
});

// Type exports for all community features
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;

export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;

export type Prayer = typeof prayers.$inferSelect;
export type InsertPrayer = z.infer<typeof insertPrayerSchema>;

export type MentorProfile = typeof mentorProfiles.$inferSelect;
export type InsertMentorProfile = z.infer<typeof insertMentorProfileSchema>;

export type MentorshipRequest = typeof mentorshipRequests.$inferSelect;
export type InsertMentorshipRequest = z.infer<typeof insertMentorshipRequestSchema>;

export type MentorshipRelationship = typeof mentorshipRelationships.$inferSelect;
export type InsertMentorshipRelationship = z.infer<typeof insertMentorshipRelationshipSchema>;

export type BibleReadingPlan = typeof bibleReadingPlans.$inferSelect;
export type InsertBibleReadingPlan = z.infer<typeof insertBibleReadingPlanSchema>;

export type BibleReadingProgress = typeof bibleReadingProgress.$inferSelect;
export type InsertBibleReadingProgress = z.infer<typeof insertBibleReadingProgressSchema>;

export type BibleStudyNote = typeof bibleStudyNotes.$inferSelect;
export type InsertBibleStudyNote = z.infer<typeof insertBibleStudyNotesSchema>;

export type VerseMemorization = typeof verseMemorization.$inferSelect;
export type InsertVerseMemorization = z.infer<typeof insertVerseMemorizationSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type ContentRecommendation = typeof contentRecommendations.$inferSelect;
export type InsertContentRecommendation = z.infer<typeof insertContentRecommendationSchema>;

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;

export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;

export type ChallengeTestimonial = typeof challengeTestimonials.$inferSelect;
export type InsertChallengeTestimonial = z.infer<typeof insertChallengeTestimonialSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type ResourceRating = typeof resourceRatings.$inferSelect;
export type InsertResourceRating = z.infer<typeof insertResourceRatingSchema>;

export type ResourceCollection = typeof resourceCollections.$inferSelect;
export type InsertResourceCollection = z.infer<typeof insertResourceCollectionSchema>;

export type CollectionResource = typeof collectionResources.$inferSelect;
export type InsertCollectionResource = z.infer<typeof insertCollectionResourceSchema>;

export type ServiceProject = typeof serviceProjects.$inferSelect;
export type InsertServiceProject = z.infer<typeof insertServiceProjectSchema>;

export type ServiceVolunteer = typeof serviceVolunteers.$inferSelect;
export type InsertServiceVolunteer = z.infer<typeof insertServiceVolunteerSchema>;

export type ServiceTestimonial = typeof serviceTestimonials.$inferSelect;
export type InsertServiceTestimonial = z.infer<typeof insertServiceTestimonialSchema>;
