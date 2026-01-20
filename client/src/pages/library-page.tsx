/**
 * Library Posts Page (Web)
 * Browse published apologetics and polemics library entries
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Flame, Plus, BookOpen } from 'lucide-react';

type Domain = 'apologetics' | 'polemics';

type LibraryPost = {
  id: number;
  domain: Domain;
  title: string;
  summary: string | null;
  tldr: string | null;
  authorDisplayName: string;
  publishedAt: string | null;
  area?: { id: number; name: string };
  tag?: { id: number; name: string };
};

export default function LibraryPage() {
  const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>(undefined);

  // Fetch current user capabilities
  const { data: meData } = useQuery<{
    user: any;
    capabilities: {
      canAuthorApologeticsPosts: boolean;
    };
  }>({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('Failed to fetch user data');
      return res.json();
    },
  });

  const canAuthor = meData?.capabilities?.canAuthorApologeticsPosts || false;

  // Fetch library posts
  const { data, isLoading } = useQuery<{
    posts: { items: LibraryPost[]; total: number };
    pagination: { limit: number; offset: number };
  }>({
    queryKey: ['/api/library/posts', { domain: selectedDomain, status: 'published' }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDomain) params.set('domain', selectedDomain);
      params.set('status', 'published');
      params.set('limit', '50');

      const res = await fetch(`/api/library/posts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch library posts');
      return res.json();
    },
  });

  // API returns { posts: { items: [...], total: N } }
  const posts = data?.posts?.items || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Library</h1>
          <p className="text-lg text-gray-600">
            Curated articles on Christian apologetics and polemics
          </p>
        </div>
        {canAuthor && (
          <Link href="/library/create">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Post
            </Button>
          </Link>
        )}
      </div>

      {/* Domain Filter */}
      <div className="flex gap-3 mb-8">
        <Button
          variant={!selectedDomain ? 'default' : 'outline'}
          onClick={() => setSelectedDomain(undefined)}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          All
        </Button>
        <Button
          variant={selectedDomain === 'apologetics' ? 'default' : 'outline'}
          onClick={() => setSelectedDomain('apologetics')}
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          Apologetics
        </Button>
        <Button
          variant={selectedDomain === 'polemics' ? 'default' : 'outline'}
          onClick={() => setSelectedDomain('polemics')}
          className="gap-2"
        >
          <Flame className="h-4 w-4" />
          Polemics
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Loading library posts...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-600 text-center max-w-md">
              {selectedDomain
                ? `No ${selectedDomain} posts available yet`
                : 'The library is empty'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid */}
      {!isLoading && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} href={`/library/${post.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant={post.domain === 'apologetics' ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {post.domain === 'apologetics' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Flame className="h-3 w-3" />
                      )}
                      {post.domain}
                    </Badge>
                    {post.area && (
                      <span className="text-sm text-gray-600">{post.area.name}</span>
                    )}
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  {post.summary && (
                    <CardDescription className="line-clamp-3 mt-2">
                      {post.summary}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm pt-4 border-t">
                    <span className="font-medium text-primary">{post.authorDisplayName}</span>
                    {post.publishedAt && (
                      <span className="text-gray-500">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
