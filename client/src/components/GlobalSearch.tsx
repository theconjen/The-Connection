import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "wouter";
import {
  Search,
  X,
  Users,
  MessageCircle,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock
} from "lucide-react";

type SearchCategory = 'all' | 'apologetics' | 'forms' | 'accounts' | 'communities';

interface SearchResult {
  id: string;
  type: 'user' | 'post' | 'community' | 'event' | 'verse' | 'question';
  title: string;
  content?: string;
  author?: {
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  community?: {
    id: string;
    name: string;
  };
  path: string;
  tags?: string[];
  createdAt?: string;
}

interface GlobalSearchProps {
  isVisible: boolean;
  onClose: () => void;
  placeholder?: string;
}

export default function GlobalSearch({ isVisible, onClose, placeholder = "Search communities, posts, people, and more..." }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Focus input when visible
  useEffect(() => {
    if (isVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isVisible]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedQuery.trim()) return [];

      const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const results: SearchResult[] = [];

      // Transform users
      data.users?.forEach((user: any) => {
        results.push({
          id: user.id.toString(),
          type: 'user',
          title: user.displayName || user.username,
          author: {
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
          },
          path: `/profile/${user.username}`
        });
      });

      // Transform communities
      data.communities?.forEach((community: any) => {
        results.push({
          id: community.id.toString(),
          type: 'community',
          title: community.name,
          content: community.description,
          path: `/communities/${community.slug || community.id}`,
          tags: community.tags || []
        });
      });

      // Transform posts
      data.posts?.forEach((post: any) => {
        results.push({
          id: post.id.toString(),
          type: 'post',
          title: post.title,
          content: post.content?.substring(0, 150),
          path: `/posts/${post.id}`,
          createdAt: post.createdAt
        });
      });

      // Transform events
      data.events?.forEach((event: any) => {
        results.push({
          id: event.id.toString(),
          type: 'event',
          title: event.title,
          content: event.description?.substring(0, 150),
          path: `/events/${event.id}`,
          createdAt: event.createdAt
        });
      });

      // Transform microblogs (shown as posts)
      data.microblogs?.forEach((microblog: any) => {
        results.push({
          id: microblog.id.toString(),
          type: 'post',
          title: microblog.content.substring(0, 60) + '...',
          content: microblog.content,
          path: `/microblogs`,
          createdAt: microblog.createdAt
        });
      });

      // Transform apologetics questions
      data.apologeticsQuestions?.forEach((question: any) => {
        results.push({
          id: question.id.toString(),
          type: 'question',
          title: question.title,
          content: question.content?.substring(0, 150),
          path: `/apologetics/questions/${question.id}`,
          createdAt: question.createdAt
        });
      });

      return results;
    },
    enabled: debouncedQuery.length > 0
  });

  const handleClose = () => {
    setQuery("");
    setDebouncedQuery("");
    onClose();
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4 text-blue-600" />;
      case 'community': return <Users className="h-4 w-4 text-purple-600" />;
      case 'post': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'verse': return <BookOpen className="h-4 w-4 text-orange-600" />;
      case 'event': return <Calendar className="h-4 w-4 text-indigo-600" />;
      case 'question': return <Sparkles className="h-4 w-4 text-amber-600" />;
      default: return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return 'Person';
      case 'community': return 'Community';
      case 'post': return 'Post';
      case 'verse': return 'Verse';
      case 'event': return 'Event';
      case 'question': return 'Apologetics';
      default: return 'Result';
    }
  };

  const getCategoryForResult = (result: SearchResult): SearchCategory => {
    if (result.type === 'user') return 'accounts';
    if (result.type === 'community') return 'communities';
    if (result.type === 'question') return 'apologetics';

    // Heuristic to surface form-related content even if the backend doesn't yet have a dedicated type
    const normalizedPath = result.path.toLowerCase();
    if (normalizedPath.includes('/forms') || normalizedPath.includes('/form') || normalizedPath.includes('application')) {
      return 'forms';
    }

    return 'all';
  };

  const filteredResults = (searchResults || []).filter((result) => {
    if (activeCategory === 'all') return true;
    return getCategoryForResult(result) === activeCategory;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
      <div className="w-full max-w-2xl mx-4">
        <Card className="shadow-2xl">
          <CardContent className="p-4">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsTyping(e.target.value.length > 0);
                }}
                placeholder={placeholder}
                className="pl-10 pr-10 h-12 text-base"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[{ id: 'all', label: 'All' }, { id: 'apologetics', label: 'Apologetics' }, { id: 'forms', label: 'Forms' }, { id: 'accounts', label: 'Accounts' }, { id: 'communities', label: 'Communities' }] as const
                .map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? 'secondary' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.label}
                  </Button>
                ))}
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && debouncedQuery && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}

              {!isLoading && debouncedQuery && searchResults?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{debouncedQuery}"</p>
                  <p className="text-sm mt-1">Try different keywords or check spelling</p>
                </div>
              )}

              {!isLoading && debouncedQuery && searchResults && searchResults.length > 0 && filteredResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No {activeCategory} results for "{debouncedQuery}"</p>
                  <p className="text-sm mt-1">Try switching tabs to see other result types.</p>
                </div>
              )}

              {!debouncedQuery && (
                <div className="py-8">
                  <div className="text-center text-muted-foreground mb-6">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search communities, posts, and people</p>
                  </div>
                  
                  {/* Quick Links */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Access</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/communities" onClick={handleClose}>
                        <Button variant="ghost" className="w-full justify-start h-auto p-3">
                          <Users className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Communities</div>
                            <div className="text-xs text-muted-foreground">Find groups</div>
                          </div>
                        </Button>
                      </Link>
                      <Link href="/microblogs" onClick={handleClose}>
                        <Button variant="ghost" className="w-full justify-start h-auto p-3">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Feed</div>
                            <div className="text-xs text-muted-foreground">Latest posts</div>
                          </div>
                        </Button>
                      </Link>
                      <Link href="/events" onClick={handleClose}>
                        <Button variant="ghost" className="w-full justify-start h-auto p-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div className="text-left">
                            <div className="font-medium">Events</div>
                            <div className="text-xs text-muted-foreground">Upcoming events</div>
                          </div>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {filteredResults.length > 0 && (
                <div className="space-y-2">
                  {filteredResults.map((result) => (
                    <Link key={result.id} href={result.path} onClick={handleClose}>
                      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-shrink-0 mt-0.5">
                          {result.type === 'user' ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={result.author?.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {getInitials(result.author?.displayName || result.author?.username || result.title)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            getTypeIcon(result.type)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{result.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {getTypeLabel(result.type)}
                            </Badge>
                          </div>
                          
                          {result.content && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {result.content}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            {result.author && result.type !== 'user' && (
                              <>
                                <span>{result.author.displayName || result.author.username}</span>
                                <span>•</span>
                              </>
                            )}
                            {result.community && (
                              <>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-3 w-3" />
                                  <span>{result.community.name}</span>
                                </div>
                                <span>•</span>
                              </>
                            )}
                            {result.createdAt && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>2 days ago</span>
                              </div>
                            )}
                          </div>
                          
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {result.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{result.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}