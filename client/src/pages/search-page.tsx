/**
 * Search Page
 *
 * Global search for users, communities, posts, and events.
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, Users, MessageSquare, Calendar, Building2, Loader2 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

interface SearchResults {
  users: Array<{
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  }>;
  communities: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
    memberCount?: number;
  }>;
  posts: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
  }>;
  events: Array<{
    id: number;
    title: string;
    description?: string;
    startTime: string;
  }>;
}

export default function SearchPage() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const initialQuery = new URLSearchParams(searchParams).get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults>({
    users: [],
    communities: [],
    posts: [],
    events: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], communities: [], posts: [], events: [] });
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Search users
      const usersRes = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const usersData = usersRes.ok ? await usersRes.json() : [];

      // Search communities
      const communitiesRes = await fetch(`/api/communities?search=${encodeURIComponent(searchQuery)}`);
      const communitiesData = communitiesRes.ok ? await communitiesRes.json() : [];

      // Search posts
      const postsRes = await fetch(`/api/posts?search=${encodeURIComponent(searchQuery)}`);
      const postsData = postsRes.ok ? await postsRes.json() : [];

      // Search events
      const eventsRes = await fetch(`/api/events?search=${encodeURIComponent(searchQuery)}`);
      const eventsData = eventsRes.ok ? await eventsRes.json() : [];

      setResults({
        users: Array.isArray(usersData) ? usersData : usersData.users || [],
        communities: Array.isArray(communitiesData) ? communitiesData : communitiesData.communities || [],
        posts: Array.isArray(postsData) ? postsData : postsData.posts || [],
        events: Array.isArray(eventsData) ? eventsData : eventsData.events || [],
      });
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      performSearch(query);
    }
  };

  const totalResults =
    results.users.length +
    results.communities.length +
    results.posts.length +
    results.events.length;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Search</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, communities, posts, events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : hasSearched ? (
        totalResults === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try different keywords or check your spelling.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
              <TabsTrigger value="users">Users ({results.users.length})</TabsTrigger>
              <TabsTrigger value="communities">Communities ({results.communities.length})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({results.posts.length})</TabsTrigger>
              <TabsTrigger value="events">Events ({results.events.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {results.users.slice(0, 3).map((user) => (
                <UserResult key={user.id} user={user} navigate={navigate} />
              ))}
              {results.communities.slice(0, 3).map((community) => (
                <CommunityResult key={community.id} community={community} navigate={navigate} />
              ))}
              {results.posts.slice(0, 3).map((post) => (
                <PostResult key={post.id} post={post} navigate={navigate} />
              ))}
              {results.events.slice(0, 3).map((event) => (
                <EventResult key={event.id} event={event} navigate={navigate} />
              ))}
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              {results.users.map((user) => (
                <UserResult key={user.id} user={user} navigate={navigate} />
              ))}
            </TabsContent>

            <TabsContent value="communities" className="space-y-4">
              {results.communities.map((community) => (
                <CommunityResult key={community.id} community={community} navigate={navigate} />
              ))}
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {results.posts.map((post) => (
                <PostResult key={post.id} post={post} navigate={navigate} />
              ))}
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              {results.events.map((event) => (
                <EventResult key={event.id} event={event} navigate={navigate} />
              ))}
            </TabsContent>
          </Tabs>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Search The Connection</h3>
            <p className="text-muted-foreground">
              Find users, communities, posts, and events.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function UserResult({ user, navigate }: { user: any; navigate: (path: string) => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar>
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user.displayName || user.username}</span>
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CommunityResult({ community, navigate }: { community: any; navigate: (path: string) => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate(`/communities/${community.slug}`)}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{community.name}</span>
        </div>
        {community.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{community.description}</p>
        )}
        {community.memberCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {community.memberCount} members
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PostResult({ post, navigate }: { post: any; navigate: (path: string) => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{post.title}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

function EventResult({ event, navigate }: { event: any; navigate: (path: string) => void }) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{event.title}</span>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(event.startTime).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
