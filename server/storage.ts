import { 
  User, InsertUser, 
  Community, InsertCommunity,
  Post, InsertPost,
  Comment, InsertComment,
  Group, InsertGroup,
  GroupMember, InsertGroupMember,
  ApologeticsResource, InsertApologeticsResource,
  Livestream, InsertLivestream,
  users, communities, posts, comments, groups, groupMembers, apologeticsResources, livestreams
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, SQL, sql } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Community methods
  getAllCommunities(): Promise<Community[]>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunityBySlug(slug: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  
  // Post methods
  getAllPosts(filter?: string): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  getPostsByCommunitySlug(communitySlug: string, filter?: string): Promise<Post[]>;
  getPostsByGroupId(groupId: number, filter?: string): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  upvotePost(id: number): Promise<Post>;
  
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
  
  // Apologetics resource methods
  getAllApologeticsResources(): Promise<ApologeticsResource[]>;
  getApologeticsResource(id: number): Promise<ApologeticsResource | undefined>;
  createApologeticsResource(resource: InsertApologeticsResource): Promise<ApologeticsResource>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private communities: Map<number, Community>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private groups: Map<number, Group>;
  private groupMembers: Map<number, GroupMember>;
  private apologeticsResources: Map<number, ApologeticsResource>;
  
  private userIdCounter: number;
  private communityIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private groupIdCounter: number;
  private groupMemberIdCounter: number;
  private apologeticsResourceIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.communities = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.apologeticsResources = new Map();
    
    this.userIdCounter = 1;
    this.communityIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.groupIdCounter = 1;
    this.groupMemberIdCounter = 1;
    this.apologeticsResourceIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Sample communities
    this.createCommunity({
      name: "Prayer Requests",
      description: "Share your prayer requests and pray for others in the community.",
      slug: "prayer-requests",
      iconName: "pray",
      iconColor: "primary",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Bible Study",
      description: "Discuss and study the Bible together with fellow believers.",
      slug: "bible-study",
      iconName: "book",
      iconColor: "secondary",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Theology",
      description: "Dive deep into theological discussions and doctrinal topics.",
      slug: "theology",
      iconName: "church",
      iconColor: "accent",
      createdBy: 1
    });
    
    this.createCommunity({
      name: "Christian Life",
      description: "Share experiences and advice about living as a Christian in today's world.",
      slug: "christian-life",
      iconName: "heart",
      iconColor: "red",
      createdBy: 1
    });
    
    // Sample apologetics resources
    this.createApologeticsResource({
      title: "Introduction to Christian Apologetics",
      description: "A beginner's guide to defending the faith with reason and evidence.",
      type: "book",
      iconName: "book-reader",
      url: "#"
    });
    
    this.createApologeticsResource({
      title: "Responding to Common Objections",
      description: "Learn how to address common challenges to the Christian faith.",
      type: "video",
      iconName: "video",
      url: "#"
    });
    
    this.createApologeticsResource({
      title: "Faith in a Skeptical World",
      description: "A podcast exploring faith in a world of doubt and questioning.",
      type: "podcast",
      iconName: "headphones",
      url: "#"
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Community methods
  async getAllCommunities(): Promise<Community[]> {
    return Array.from(this.communities.values());
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    return this.communities.get(id);
  }

  async getCommunityBySlug(slug: string): Promise<Community | undefined> {
    return Array.from(this.communities.values()).find(
      (community) => community.slug === slug,
    );
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const id = this.communityIdCounter++;
    const now = new Date();
    const community: Community = {
      ...insertCommunity,
      id,
      memberCount: 0,
      createdAt: now
    };
    this.communities.set(id, community);
    return community;
  }

  // Post methods
  async getAllPosts(filter: string = "popular"): Promise<Post[]> {
    const posts = Array.from(this.posts.values());
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular - combination of recency and upvotes
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostsByCommunitySlug(communitySlug: string, filter: string = "popular"): Promise<Post[]> {
    const community = await this.getCommunityBySlug(communitySlug);
    if (!community) return [];
    
    const posts = Array.from(this.posts.values()).filter(
      (post) => post.communityId === community.id
    );
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async getPostsByGroupId(groupId: number, filter: string = "popular"): Promise<Post[]> {
    const posts = Array.from(this.posts.values()).filter(
      (post) => post.groupId === groupId
    );
    
    if (filter === "latest") {
      return posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (filter === "top") {
      return posts.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      // Default: popular
      return posts.sort((a, b) => {
        const aScore = a.upvotes + (Date.now() - a.createdAt.getTime()) / 86400000;
        const bScore = b.upvotes + (Date.now() - b.createdAt.getTime()) / 86400000;
        return bScore - aScore;
      });
    }
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const now = new Date();
    const post: Post = {
      ...insertPost,
      id,
      upvotes: 0,
      commentCount: 0,
      createdAt: now
    };
    this.posts.set(id, post);
    return post;
  }

  async upvotePost(id: number): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) {
      throw new Error("Post not found");
    }
    
    const updatedPost = { ...post, upvotes: post.upvotes + 1 };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  // Comment methods
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = {
      ...insertComment,
      id,
      upvotes: 0,
      createdAt: now
    };
    this.comments.set(id, comment);
    
    // Update post comment count
    const post = this.posts.get(insertComment.postId);
    if (post) {
      const updatedPost = { ...post, commentCount: post.commentCount + 1 };
      this.posts.set(post.id, updatedPost);
    }
    
    return comment;
  }

  async upvoteComment(id: number): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    
    const updatedComment = { ...comment, upvotes: comment.upvotes + 1 };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  // Group methods
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByUserId(userId: number): Promise<Group[]> {
    // Get all group memberships for this user
    const memberships = Array.from(this.groupMembers.values())
      .filter((member) => member.userId === userId);
    
    // Get the groups
    const groupIds = memberships.map((member) => member.groupId);
    return Array.from(this.groups.values())
      .filter((group) => groupIds.includes(group.id));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const now = new Date();
    const group: Group = {
      ...insertGroup,
      id,
      createdAt: now
    };
    this.groups.set(id, group);
    return group;
  }

  // Group member methods
  async addGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const id = this.groupMemberIdCounter++;
    const now = new Date();
    const member: GroupMember = {
      ...insertMember,
      id,
      joinedAt: now
    };
    this.groupMembers.set(id, member);
    return member;
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values())
      .filter((member) => member.groupId === groupId);
  }

  async isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = Array.from(this.groupMembers.values()).find(
      (m) => m.groupId === groupId && m.userId === userId
    );
    return member ? member.isAdmin : false;
  }

  // Apologetics resource methods
  async getAllApologeticsResources(): Promise<ApologeticsResource[]> {
    return Array.from(this.apologeticsResources.values());
  }

  async getApologeticsResource(id: number): Promise<ApologeticsResource | undefined> {
    return this.apologeticsResources.get(id);
  }

  async createApologeticsResource(insertResource: InsertApologeticsResource): Promise<ApologeticsResource> {
    const id = this.apologeticsResourceIdCounter++;
    const now = new Date();
    const resource: ApologeticsResource = {
      ...insertResource,
      id,
      createdAt: now
    };
    this.apologeticsResources.set(id, resource);
    return resource;
  }
}

export const storage = new MemStorage();
