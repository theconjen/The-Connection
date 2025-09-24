import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Heart, MessageCircle, Share, Users, Star, TrendingUp } from 'lucide-react';
import { useContentTracking } from '../hooks/useRecommendations';
import type { RecommendedMicroblog, RecommendedCommunity } from '../hooks/useRecommendations';
import { formatDistanceToNow } from 'date-fns';

interface PersonalizedFeedCardProps {
  microblog?: RecommendedMicroblog;
  community?: RecommendedCommunity;
}

export function PersonalizedFeedCard({ microblog, community }: PersonalizedFeedCardProps) {
  const { trackView, trackLike, trackShare } = useContentTracking();
  const [isLiked, setIsLiked] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  // Track view when component mounts (only once)
  React.useEffect(() => {
    if (!hasViewed && (microblog || community)) {
      const contentId = microblog?.id || community?.id || 0;
      const contentType = microblog ? 'microblog' : 'community';
      trackView(contentId, contentType);
      setHasViewed(true);
    }
  }, [microblog, community, hasViewed, trackView]);

  if (microblog) {
    return (
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-pink-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(microblog.user?.displayName || microblog.user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {microblog.user?.displayName || microblog.user?.username || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(microblog.createdAt))} ago
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              <Badge variant="secondary" className="text-xs">
                Score: {microblog.score}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">{microblog.content}</p>
          
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <TrendingUp className="w-3 h-3" />
            <span>{microblog.reason}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsLiked(!isLiked);
                  trackLike(microblog.id, 'microblog');
                }}
                className={`flex items-center gap-1 ${isLiked ? 'text-pink-600' : 'text-gray-500'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{microblog.likeCount}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-1 text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{microblog.replyCount}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => trackShare(microblog.id, 'microblog')}
                className="flex items-center gap-1 text-gray-500"
              >
                <Share className="w-4 h-4" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (community) {
    return (
      <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: community.iconColor }}
            >
              <span className="text-lg">{community.iconName}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{community.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <Badge variant="secondary" className="text-xs">
                    Score: {Math.round(community.score)}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{community.description}</p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {community.memberCount} members
                  </span>
                  
                  <span className="flex items-center gap-1 text-blue-600">
                    <TrendingUp className="w-3 h-3" />
                    {community.reason}
                  </span>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => trackView(community.id, 'community')}
                  className="h-7 text-xs"
                >
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}