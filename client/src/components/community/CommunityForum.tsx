import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquareText,
  Plus,
  TrendingUp,
  Clock,
  Users,
  Reply,
  Heart,
  MessageCircle,
  Search,
  Filter,
  Pin,
  Lock,
  Loader2,
  Send,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatDistance } from "date-fns";
import { useToast } from "../../hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Microblog, Community } from "@shared/schema";

interface CommunityForumProps {
  community: Community;
  isMember: boolean;
  isOwner: boolean;
  isModerator: boolean;
}

type ForumFilter = "all" | "recent" | "popular" | "answered" | "unanswered";
type SortOrder = "newest" | "oldest" | "popular" | "activity";

interface ExtendedMicroblog extends Microblog {
  author: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  replies?: ExtendedMicroblog[];
  isLiked?: boolean;
  recentReply?: {
    author: string;
    createdAt: string;
  };
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  topicCount?: number;
}

const forumCategories: ForumCategory[] = [
  { id: "general", name: "General Discussion", description: "Open discussions about anything", icon: "💬" },
  { id: "questions", name: "Questions & Help", description: "Ask questions and get help", icon: "❓" },
  { id: "announcements", name: "Announcements", description: "Community announcements", icon: "📢" },
  { id: "prayer", name: "Prayer Requests", description: "Share and pray together", icon: "🙏" },
  { id: "bible-study", name: "Bible Study", description: "Scripture discussion and study", icon: "📖" },
  { id: "fellowship", name: "Fellowship", description: "Connect and build relationships", icon: "🤝" },
];

export function CommunityForum({ community, isMember, isOwner, isModerator }: CommunityForumProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ForumFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("general");
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});

  // Fetch forum topics (using microblogs scoped to community)
  const {
    data: topics = [],
    isLoading,
    error,
    refetch,
  } = useQuery<ExtendedMicroblog[]>({
    queryKey: ["/microblogs", community.id, filter, sortOrder, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({
        communityId: community.id.toString(),
        filter,
        sort: sortOrder,
        category: selectedCategory,
        type: 'forum'
      });
  const response = await apiRequest('GET', `/microblogs?${params}`);
      return response.json();
    },
    enabled: isMember || !community.isPrivate,
  });

  // Create topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; category: string }) => {
  const response = await apiRequest("POST", "/microblogs", {
        content: `**${data.title}**\n\n${data.content}`,
        communityId: community.id,
        // Add category as metadata
        metadata: { category: data.category, isForumTopic: true },
      });
      return response.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/microblogs", community.id] });
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicCategory("general");
      setShowCreateTopic(false);
      toast({
        title: "Topic created",
        description: "Your discussion topic has been created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create topic",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reply to topic mutation
  const replyMutation = useMutation({
    mutationFn: async (data: { parentId: number; content: string }) => {
  const response = await apiRequest("POST", "/microblogs", {
        content: data.content,
        communityId: community.id,
        parentId: data.parentId,
      });
      return response.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["/microblogs", community.id] });
      setReplyContent({});
      toast({
        title: "Reply added",
        description: "Your reply has been added to the discussion.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like topic mutation
  const likeMutation = useMutation({
    mutationFn: async (topicId: number) => {
      await apiRequest("POST", `/microblogs/${topicId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/microblogs", community.id] });
    },
  });

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    createTopicMutation.mutate({
      title: newTopicTitle,
      content: newTopicContent,
      category: newTopicCategory,
    });
  };

  const handleReply = (parentId: number) => {
    const content = replyContent[parentId]?.trim();
    if (!content) return;
    replyMutation.mutate({ parentId, content });
  };

  const toggleTopicExpanded = (topicId: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const updateReplyContent = (topicId: number, content: string) => {
    setReplyContent(prev => ({ ...prev, [topicId]: content }));
  };

  const extractTopicTitle = (content: string): string => {
    const match = content.match(/^\*\*(.*?)\*\*/);
    return match ? match[1] : content.substring(0, 100);
  };

  const extractTopicContent = (content: string): string => {
    const withoutTitle = content.replace(/^\*\*(.*?)\*\*\n\n/, '');
    return withoutTitle;
  };

  const formatDate = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  };

  if (!isMember && community.isPrivate) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto mb-6 p-4 rounded-full bg-amber-50 dark:bg-amber-900/20 w-fit">
          <Lock className="h-12 w-12 text-amber-600 dark:text-amber-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Private Forum</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          This community's forum is private. Join the community to participate in discussions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forum Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Community Forum</h2>
          <p className="text-muted-foreground">Join the discussion</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Topic Button */}
          {isMember && (
            <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-topic">
                  <Plus className="h-4 w-4 mr-2" />
                  New Topic
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Start a New Discussion</DialogTitle>
                  <DialogDescription>
                    Create a new topic for the {community.name} community
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select value={newTopicCategory} onValueChange={setNewTopicCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {forumCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center">
                              <span className="mr-2">{category.icon}</span>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Topic Title</label>
                    <Input
                      placeholder="What's your topic about?"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      data-testid="input-topic-title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Provide more details about your topic..."
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      className="min-h-32 resize-none"
                      data-testid="textarea-topic-content"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateTopic(false)}
                    disabled={createTopicMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTopic}
                    disabled={!newTopicTitle.trim() || !newTopicContent.trim() || createTopicMutation.isPending}
                    data-testid="button-submit-topic"
                  >
                    {createTopicMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Create Topic
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {forumCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center">
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="activity">Recent Activity</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter} onValueChange={(value: ForumFilter) => setFilter(value)}>
          <SelectTrigger className="w-36">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="unanswered">Unanswered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-48" />
                    <div className="h-3 bg-muted rounded w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Topics List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {topics.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <MessageSquareText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start the first discussion in this community!
                </p>
                {isMember && (
                  <Button onClick={() => setShowCreateTopic(true)} data-testid="button-first-topic">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Discussion
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            topics.map((topic) => (
              <Card key={topic.id} className="overflow-hidden" data-testid={`topic-${topic.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          💬 General
                        </Badge>
                        {topic.replyCount > 10 && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg leading-tight mb-2">
                        {extractTopicTitle(topic.content)}
                      </h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={topic.author.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {topic.author.displayName?.[0] || topic.author.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{topic.author.displayName || topic.author.username}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(topic.createdAt.toString())}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center justify-end space-x-4">
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          <span>{topic.replyCount}</span>
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{topic.likeCount}</span>
                        </div>
                      </div>
                      {topic.recentReply && (
                        <div className="text-xs mt-1">
                          Last reply by {topic.recentReply.author}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Topic Preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {extractTopicContent(topic.content)}
                    </p>

                    {/* Topic Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={topic.isLiked ? "text-red-500" : ""}
                          onClick={() => likeMutation.mutate(topic.id)}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${topic.isLiked ? "fill-current" : ""}`} />
                          {topic.likeCount}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTopicExpanded(topic.id)}
                          data-testid={`button-expand-topic-${topic.id}`}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {expandedTopics.has(topic.id) ? 'Hide' : 'View'} Replies ({topic.replyCount})
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Replies */}
                    {expandedTopics.has(topic.id) && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Reply Input */}
                        {isMember && (
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user?.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {user?.displayName?.[0] || user?.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <Textarea
                                placeholder="Add your thoughts..."
                                className="min-h-20 resize-none"
                                value={replyContent[topic.id] || ""}
                                onChange={(e) => updateReplyContent(topic.id, e.target.value)}
                                data-testid={`textarea-reply-${topic.id}`}
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(topic.id)}
                                  disabled={!replyContent[topic.id]?.trim() || replyMutation.isPending}
                                  data-testid={`button-submit-reply-${topic.id}`}
                                >
                                  {replyMutation.isPending ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Reply className="h-3 w-3 mr-1" />
                                  )}
                                  Reply
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Replies List */}
                        {topic.replies?.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-3 pl-6 border-l-2 border-muted">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={reply.author.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {reply.author.displayName?.[0] || reply.author.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-muted p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-sm">
                                    {reply.author.displayName || reply.author.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reply.createdAt.toString())}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  <Heart className="h-3 w-3 mr-1" />
                                  {reply.likeCount}
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
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