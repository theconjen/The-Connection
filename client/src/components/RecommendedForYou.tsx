import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sparkles, TrendingUp, Heart, MessageCircle, Share, Clock, ChevronRight } from 'lucide-react';
import { usePersonalizedFeed, useContentTracking } from '../hooks/useRecommendations';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

interface RecommendedForYouProps {
  section: 'feed' | 'forums' | 'apologetics';
  maxItems?: number;
  showHeader?: boolean;
}

export function RecommendedForYou({ 
  section, 
  maxItems = 3, 
  showHeader = true 
}: RecommendedForYouProps) {
  const { data: recommendations, isLoading, error, refetch, isFetching } = usePersonalizedFeed(maxItems * 2);
  const { trackView, trackLike, trackShare } = useContentTracking();

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-12 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations?.microblogs?.length) {
    return (
      <Card className="border-l-4 border-l-pink-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            Recommended For You
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No recommendations available yet</p>
          <p className="text-sm text-gray-400 mb-4">
            Interact with content to get personalized recommendations
          </p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh Recommendations
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredContent = recommendations.microblogs
    .slice(0, maxItems)
    .map(item => ({
      ...item,
      section: section,
    }));

  return (
    <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600" />
              Recommended For You
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {recommendations.algorithm || 'Faith-based AI'}
              </Badge>
              <Button
                onClick={() => refetch()}
                disabled={isFetching}
                variant="ghost"
                size="sm"
              >
                <TrendingUp className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Personalized for your spiritual journey
          </p>
        </CardHeader>
      )}

      <CardContent className="space-y-3">
        {filteredContent.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            onClick={() => trackView(item.id, 'microblog')}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(item.user?.displayName || item.user?.username || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {item.user?.displayName || item.user?.username || 'Anonymous'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Score: {item.score}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(item.createdAt))} ago
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                  {item.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-pink-600">
                    <TrendingUp className="w-3 h-3" />
                    <span>{item.reason}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        trackLike(item.id, 'microblog');
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {item.likeCount || 0}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      {item.replyCount || 0}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        trackShare(item.id, 'microblog');
                      }}
                      className="h-7 px-2 text-xs"
                    >
                      <Share className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredContent.length === 0 && (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No recommendations available</p>
          </div>
        )}

        {/* View More Link */}
        {showHeader && filteredContent.length > 0 && (
          <div className="pt-3 border-t">
            <Link href={`/${section === 'feed' ? 'microblogs' : section}`}>
              <Button variant="ghost" size="sm" className="w-full text-pink-600 hover:text-pink-700">
                View More Recommendations
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}