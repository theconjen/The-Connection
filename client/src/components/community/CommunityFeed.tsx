import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Filter,
  Clock,
  TrendingUp,
  Users,
  Lock,
  Globe,
  Image,
  Plus,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CommunityWallPost, Community } from "@connection/shared/schema";

interface CommunityFeedProps {
  community: Community;
  isMember: boolean;
  isOwner: boolean;
  isModerator: boolean;
}

type FeedFilter = "all" | "public" | "private" | "recent" | "popular";

interface ExtendedWallPost extends CommunityWallPost {
  author: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  isLiked?: boolean;
  comments?: {
    id: number;
    content: string;
    author: {
      username: string;
      displayName?: string;
      avatarUrl?: string;
    };
    createdAt: string;
  }[];
}

export function CommunityFeed({ community, isMember, isOwner, isModerator }: CommunityFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPrivatePost, setIsPrivatePost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  // Fetch community wall posts
  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ExtendedWallPost[]>({
    queryKey: [`/api/communities/${community.id}/wall`, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ filter });
      const response = await apiRequest('GET', `/api/communities/${community.id}/wall?${params}`);
      return response.json();
    },
    enabled: Boolean(community && (isMember || (!community.hasPrivateWall && community.hasPublicWall))),
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; isPrivate: boolean }) => {
      const response = await apiRequest("POST", `/api/communities/${community.id}/wall`, {
        content: data.content,
        isPrivate: data.isPrivate,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/wall`] });
      setNewPostContent("");
      setShowCreatePost(false);
      toast({
        title: "Post created",
        description: "Your post has been shared with the community.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("POST", `/api/wall-posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/wall`] });
    },
  });

  // Unlike post mutation
  const unlikePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest("DELETE", `/api/wall-posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/wall`] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate({
      content: newPostContent,
      isPrivate: isPrivatePost,
    });
  };

  const handleLikePost = (post: ExtendedWallPost) => {
    if (post.isLiked) {
      unlikePostMutation.mutate(post.id);
    } else {
      likePostMutation.mutate(post.id);
    }
  };

  const toggleComments = (postId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const formatPostDate = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  if (!isMember && community.hasPrivateWall) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-6 p-4 rounded-full bg-amber-50 dark:bg-amber-900/20 w-fit">
          <Lock className="h-12 w-12 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Private Feed</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          This community has a private wall. Join the community to see posts and participate in discussions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Community Feed</h2>
          <p className="text-muted-foreground">Latest posts and discussions</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <Select value={filter} onValueChange={(value: FeedFilter) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              {isMember && (
                <>
                  <SelectItem value="public">Public Only</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Create Post Button */}
          {isMember && (
            <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-post">
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create a Post</DialogTitle>
                  <DialogDescription>
                    Share something with the {community.name} community
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-32 resize-none"
                    data-testid="textarea-post-content"
                  />

                  {community.hasPrivateWall && community.hasPublicWall && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Post Visibility:</span>
                      <Select
                        value={isPrivatePost ? "private" : "public"}
                        onValueChange={(value) => setIsPrivatePost(value === "private")}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              Public
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center">
                              <Lock className="h-4 w-4 mr-2" />
                              Members Only
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreatePost(false)}
                    disabled={createPostMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || createPostMutation.isPending}
                    data-testid="button-submit-post"
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Failed to load posts. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {(posts as ExtendedWallPost[]).length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to share something with the community!
                </p>
                {isMember && (
                  <Button onClick={() => setShowCreatePost(true)} data-testid="button-first-post">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            (posts as ExtendedWallPost[]).map((post: ExtendedWallPost) => (
              <Card key={post.id} className="overflow-hidden" data-testid={`post-${post.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatarUrl} />
                        <AvatarFallback>
                          {post.author.displayName?.[0] || post.author.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">
                          {post.author.displayName || post.author.username}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatPostDate(post.createdAt?.toString() || new Date().toISOString())}
                        </div>
                      </div>
                    </div>
                    {post.isPrivate && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Post Content */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                    {/* Post Image */}
                    {post.imageUrl && (
                      <div className="rounded-lg overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="w-full h-auto max-h-96 object-cover"
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={post.isLiked ? "text-red-500" : ""}
                          onClick={() => handleLikePost(post)}
                          data-testid={`button-like-post-${post.id}`}
                        >
                          <Heart
                            className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`}
                          />
                          {post.likeCount}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          data-testid={`button-comments-${post.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.commentCount}
                        </Button>

                        <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Comments Section */}
                    {expandedComments.has(post.id) && (
                      <div className="space-y-3 pt-4 border-t">
                        {/* Comment Input */}
                        {isMember && (
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user?.avatarUrl || undefined} />
                              <AvatarFallback>
                                {user?.displayName?.[0] || user?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex items-center space-x-2">
                              <Textarea
                                placeholder="Write a comment..."
                                className="min-h-8 resize-none"
                                rows={1}
                              />
                              <Button size="sm">
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Comments List */}
                        {post.comments?.map((comment: NonNullable<ExtendedWallPost['comments']>[0]) => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={comment.author.avatarUrl || undefined} />
                              <AvatarFallback>
                                {comment.author.displayName?.[0] ||
                                  comment.author.username[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted p-3 rounded-lg">
                              <div className="font-semibold text-sm">
                                {comment.author.displayName || comment.author.username}
                              </div>
                              <div className="text-sm">{comment.content}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatPostDate(comment.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
