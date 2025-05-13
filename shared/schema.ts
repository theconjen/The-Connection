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
