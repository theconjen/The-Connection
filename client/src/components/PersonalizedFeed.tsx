import { useState, useEffect } from "react";
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
  Share2, 
  Bookmark,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  HandHeart,
  Calendar,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeedItem {
  id: string;
  type: 'post' | 'prayer' | 'event' | 'discussion' | 'verse' | 'community';
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    prayers?: number;
  };
  tags: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  community?: {
    id: string;
    name: string;
  };
}

interface PersonalizedFeedProps {
  className?: string;
  limit?: number;
}

export default function PersonalizedFeed({ className = "", limit = 10 }: PersonalizedFeedProps) {
  const { user } = useAuth() as AuthContextType;
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Mock personalized feed data - in production this would come from your recommendation API
  const { data: feedItems, isLoading, error } = useQuery({
    queryKey: ['personalized-feed', user?.id, activeFilter],
    queryFn: async (): Promise<FeedItem[]> => {
      // Simulate API call with mock personalized data
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockFeedItems: FeedItem[] = [
        {
          id: '1',
          type: 'post',
          title: 'Finding Hope in Difficult Times',
          content: 'I wanted to share how reading Psalm 23 this morning reminded me that even in our darkest valleys, we are never alone. God\'s presence is always with us, guiding and comforting us through every challenge...',
          author: {
            id: '1',
            username: 'faithfulserv',
            displayName: 'Sarah M.',
            avatarUrl: undefined
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          engagement: { likes: 24, comments: 8, shares: 3 },
          tags: ['hope', 'psalms', 'encouragement'],
          isLiked: false,
          isSaved: true,
          community: { id: '1', name: 'Daily Devotions' }
        },
        {
          id: '2',
          type: 'prayer',
          title: 'Prayer Request: Family Healing',
          content: 'My father is going through a difficult health challenge, and I would deeply appreciate your prayers for his healing and our family\'s strength during this time...',
          author: {
            id: '2',
            username: 'hopeinChrist',
            displayName: 'Michael T.',
          },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          engagement: { likes: 12, comments: 15, shares: 1, prayers: 47 },
          tags: ['prayer-request', 'healing', 'family'],
          isLiked: true,
          community: { id: '2', name: 'Prayer Circle' }
        },
        {
          id: '3',
          type: 'verse',
          title: 'Verse of the Day',
          content: '"For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future." - Jeremiah 29:11',
          author: {
            id: '3',
            username: 'verseoftheday',
            displayName: 'Daily Scripture',
          },
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          engagement: { likes: 89, comments: 23, shares: 45 },
          tags: ['verse', 'hope', 'future', 'gods-plan'],
          isLiked: true,
          isSaved: true
        },
        {
          id: '4',
          type: 'discussion',
          title: 'Understanding Grace in Modern Life',
          content: 'I\'ve been reflecting on how to better understand and apply God\'s grace in our daily lives. What does grace mean to you, and how do you experience it practically?',
          author: {
            id: '4',
            username: 'theologystudent',
            displayName: 'Pastor John',
          },
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          engagement: { likes: 31, comments: 42, shares: 7 },
          tags: ['grace', 'theology', 'discussion', 'spiritual-growth'],
          community: { id: '3', name: 'Apologetics & Theology' }
        },
        {
          id: '5',
          type: 'event',
          title: 'Youth Bible Study - This Friday 7PM',
          content: 'Join us this Friday for an engaging Bible study focused on the Beatitudes. We\'ll explore what it means to be blessed in God\'s kingdom. Pizza and fellowship afterwards!',
          author: {
            id: '5',
            username: 'youthpastor',
            displayName: 'Pastor Lisa',
          },
          createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
          engagement: { likes: 15, comments: 8, shares: 12 },
          tags: ['youth', 'bible-study', 'beatitudes', 'fellowship'],
          community: { id: '4', name: 'Youth Group' }
        }
      ];
      
      return mockFeedItems.slice(0, limit);
    },
    enabled: !!user
  });

  const filters = [
    { id: 'all', label: 'All', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'posts', label: 'Posts', icon: <MessageCircle className="h-4 w-4" /> },
    { id: 'prayers', label: 'Prayers', icon: <HandHeart className="h-4 w-4" /> },
    { id: 'verses', label: 'Verses', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'events', label: 'Events', icon: <Calendar className="h-4 w-4" /> },
  ];

  const getTypeIcon = (type: FeedItem['type']) => {
    switch (type) {
      case 'prayer': return <HandHeart className="h-4 w-4 text-purple-600" />;
      case 'verse': return <BookOpen className="h-4 w-4 text-green-600" />;
      case 'event': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'discussion': return <MessageCircle className="h-4 w-4 text-orange-600" />;
      case 'community': return <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />;
      default: return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Personalized Feed</h2>
        </div>
        <Badge variant="secondary" className="hidden sm:inline-flex">
          Tailored for you
        </Badge>
      </div>

      {/* Content Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.id)}
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            {filter.icon}
            <span>{filter.label}</span>
          </Button>
        ))}
      </div>

      {/* Feed Items */}
      <div className="space-y-4">
        {feedItems?.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.author.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {getInitials(item.author.displayName || item.author.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(item.type)}
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{item.author.displayName || item.author.username}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                      </div>
                      {item.community && (
                        <>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{item.community.name}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-foreground mb-3 line-clamp-3">
                {item.content}
              </p>
              
              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Engagement Actions */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center space-x-1 h-8 px-2 ${item.isLiked ? 'text-red-500' : ''}`}
                  >
                    <Heart className={`h-4 w-4 ${item.isLiked ? 'fill-current' : ''}`} />
                    <span>{item.engagement.likes}</span>
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="flex items-center space-x-1 h-8 px-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>{item.engagement.comments}</span>
                  </Button>
                  
                  {item.engagement.prayers && (
                    <Button variant="ghost" size="sm" className="flex items-center space-x-1 h-8 px-2 text-purple-600">
                      <HandHeart className="h-4 w-4" />
                      <span>{item.engagement.prayers}</span>
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 w-8 p-0 ${item.isSaved ? 'text-yellow-500' : ''}`}
                  >
                    <Bookmark className={`h-4 w-4 ${item.isSaved ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="w-full sm:w-auto">
          Load More Content
        </Button>
      </div>
    </div>
  );
}