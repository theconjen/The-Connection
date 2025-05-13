import { pgTable, text, serial, integer, boolean, timestamp, relations } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
});

// Communities table schema
export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
  iconName: text("icon_name").notNull(),
  iconColor: text("icon_color").notNull(),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
});

export const insertCommunitySchema = createInsertSchema(communities).pick({
  name: true,
  description: true,
  slug: true,
  iconName: true, 
  iconColor: true,
  createdBy: true,
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
