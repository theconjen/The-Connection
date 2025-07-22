import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Sparkles, TrendingUp, Users, Brain, Loader2 } from 'lucide-react';
import { PersonalizedFeedCard } from './PersonalizedFeedCard';
import { usePersonalizedFeed } from '@/hooks/useRecommendations';

export function PersonalizedHomeFeed() {
  const [feedLimit, setFeedLimit] = useState(15);
  const { data: feed, isLoading, error, refetch, isFetching } = usePersonalizedFeed(feedLimit);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading personalized content...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load personalized feed</p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Algorithm Info Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-pink-600" />
              <CardTitle className="text-lg">Personalized For You</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {feed?.algorithm || 'Smart Algorithm'}
              </Badge>
              <Button
                onClick={() => refetch()}
                disabled={isFetching}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Content recommendations based on your interactions, follows, and community activity
          </p>
        </CardHeader>
      </Card>

      {/* Feed Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            All ({(feed?.microblogs?.length || 0) + (feed?.communities?.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Posts ({feed?.microblogs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Communities ({feed?.communities?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-4">
          {/* Interleave microblogs and communities */}
          {(() => {
            const allContent: Array<{ type: 'microblog' | 'community'; data: any; score: number }> = [
              ...(feed?.microblogs?.map(m => ({ type: 'microblog' as const, data: m, score: m.score })) || []),
              ...(feed?.communities?.map(c => ({ type: 'community' as const, data: c, score: c.score })) || []),
            ].sort((a, b) => b.score - a.score);

            return allContent.length > 0 ? (
              allContent.map((item, index) => (
                <PersonalizedFeedCard
                  key={`${item.type}-${item.data.id}`}
                  microblog={item.type === 'microblog' ? item.data : undefined}
                  community={item.type === 'community' ? item.data : undefined}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No personalized content available yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start interacting with posts and joining communities to improve recommendations!
                  </p>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        <TabsContent value="posts" className="space-y-3 mt-4">
          {feed?.microblogs?.length ? (
            feed.microblogs.map((microblog) => (
              <PersonalizedFeedCard key={microblog.id} microblog={microblog} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No recommended posts available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communities" className="space-y-3 mt-4">
          {feed?.communities?.length ? (
            feed.communities.map((community) => (
              <PersonalizedFeedCard key={community.id} community={community} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No recommended communities available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Algorithm Stats Footer */}
      {feed && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Updated: {new Date(feed.timestamp).toLocaleTimeString()}</span>
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                Algorithm learning from your interactions
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}