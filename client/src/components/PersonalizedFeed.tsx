/**
 * Personalized Feed Component
 * Matches the mobile HomeScreen structure:
 * - Community Advice (topic=QUESTION microblogs)
 * - Posts from joined communities
 * - Trending Articles (apologetics)
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "wouter";
import {
  Heart,
  MessageCircle,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  HelpCircle,
  TrendingUp,
  ChevronRight,
  Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PersonalizedFeedProps {
  className?: string;
  limit?: number;
}

interface AdvicePost {
  id: number;
  content: string;
  author?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  replyCount?: number;
}

interface CommunityPost {
  id: number;
  content: string;
  title?: string;
  authorId: number;
  communityId: number;
  createdAt: string;
  author?: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  community?: {
    id: number;
    name: string;
    slug: string;
  };
  likeCount?: number;
  commentCount?: number;
}

interface ApologeticsArticle {
  id: number;
  title: string;
  tldr?: string;
  domain: 'apologetics' | 'polemics';
  authorDisplayName: string;
  publishedAt: string;
  area?: { name: string };
}

export default function PersonalizedFeed({ className = "", limit = 10 }: PersonalizedFeedProps) {
  const { user } = useAuth() as AuthContextType;

  // Fetch Community Advice (microblogs with topic=QUESTION) - matches mobile
  const { data: adviceData, isLoading: adviceLoading } = useQuery<AdvicePost[]>({
    queryKey: ['community-advice'],
    queryFn: async () => {
      const res = await fetch('/api/microblogs?topic=QUESTION&limit=15');
      if (!res.ok) return [];
      const data = await res.json();
      // Handle both array response and paginated response
      const posts = Array.isArray(data) ? data : (data?.microblogs || data?.items || []);
      return posts;
    },
    enabled: !!user,
  });

  // Fetch community posts from joined communities (using same endpoint as mobile)
  const { data: communityPosts, isLoading: postsLoading } = useQuery<CommunityPost[]>({
    queryKey: ['community-posts-feed'],
    queryFn: async () => {
      const res = await fetch('/api/feed/home?limit=15');
      if (!res.ok) return [];
      const data = await res.json();
      return data?.posts || [];
    },
    enabled: !!user,
  });

  // Fetch trending apologetics articles
  const { data: articlesData, isLoading: articlesLoading } = useQuery<ApologeticsArticle[]>({
    queryKey: ['trending-articles-feed'],
    queryFn: async () => {
      const res = await fetch('/api/library/posts/trending?limit=5');
      if (!res.ok) {
        // Fallback to regular endpoint
        const fallbackRes = await fetch('/api/library/posts?status=published&limit=5');
        if (!fallbackRes.ok) return [];
        const data = await fallbackRes.json();
        return data?.posts?.items || [];
      }
      const data = await res.json();
      return data?.posts?.items || [];
    },
    enabled: !!user,
  });

  const advicePosts = adviceData || [];
  const posts = communityPosts || [];
  const articles = articlesData || [];
  const isLoading = adviceLoading || postsLoading || articlesLoading;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Join Our Community</h3>
        <p className="text-muted-foreground mb-4">Sign in to see personalized content based on your interests and activity.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-muted rounded-full"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasContent = advicePosts.length > 0 || posts.length > 0 || articles.length > 0;

  if (!hasContent) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Join a Community</h3>
        <p className="text-muted-foreground mb-4">
          Your feed shows posts from communities you've joined. Explore and join communities to see content here.
        </p>
        <Link href="/communities">
          <Button>Explore Communities</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Community Advice Section */}
      {advicePosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-pink-500" />
              <h2 className="text-lg font-semibold">Global Community</h2>
            </div>
            <Link href="/advice">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {advicePosts.slice(0, 5).map((post) => (
              <Link key={post.id} href={`/advice/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200 shrink-0">
                        <HelpCircle className="h-3 w-3 mr-1" />
                        Seeking Advice
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-3 text-sm line-clamp-3">{post.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" /> {post.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" /> {post.commentCount || post.replyCount || 0}
                        </span>
                      </div>
                      <span className="text-xs text-primary font-medium">Share your thoughts →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* From Your Communities Section */}
      {posts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Your Communities</h2>
            </div>
            <Link href="/communities">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {posts.slice(0, 10).map((post) => (
              <Link key={post.id} href={`/communities/${post.community?.slug || post.communityId}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    {/* Community badge */}
                    {post.community && (
                      <div className="flex items-center gap-1 text-xs text-primary mb-2">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{post.community.name}</span>
                      </div>
                    )}

                    {/* Author info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author?.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {getInitials(post.author?.displayName || post.author?.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {post.author?.displayName || post.author?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    {post.title && (
                      <h3 className="font-semibold mb-1 line-clamp-1">{post.title}</h3>
                    )}

                    {/* Content */}
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>

                    {/* Engagement */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" /> {post.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" /> {post.commentCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Articles Section */}
      {articles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Grow Your Faith</h2>
            </div>
            <Link href="/apologetics">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {articles.slice(0, 5).map((article) => (
              <Link key={article.id} href={`/apologetics/${article.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {article.domain === 'apologetics' ? 'Apologetics' : 'Polemics'}
                      </Badge>
                      {article.area && (
                        <span className="text-xs text-muted-foreground">{article.area.name}</span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1 line-clamp-2">{article.title}</h3>
                    {article.tldr && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.tldr}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{article.authorDisplayName}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
