import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, Heart, MessageSquare, BookOpen, ChevronRight, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

interface FriendActivity {
  id: number;
  name: string;
  username: string;
  avatar?: string;
  activities: {
    prayerRequests: number;
    recentPosts: number;
    apologeticsContributions: number;
  };
  lastActivity: string;
}

export function FriendsSection() {
  // Mock friends data for now - in real implementation, this would fetch from API
  const { data: friends, isLoading } = useQuery({
    queryKey: ['/api/friends/activity'],
    queryFn: async () => {
      // Simulate API call - replace with real endpoint
      return [
        {
          id: 1,
          name: 'Sarah Johnson',
          username: 'sarah_j',
          activities: {
            prayerRequests: 2,
            recentPosts: 5,
            apologeticsContributions: 1,
          },
          lastActivity: '2 hours ago',
        },
        {
          id: 2,
          name: 'Michael Chen',
          username: 'mchen',
          activities: {
            prayerRequests: 0,
            recentPosts: 3,
            apologeticsContributions: 2,
          },
          lastActivity: '6 hours ago',
        },
        {
          id: 3,
          name: 'Pastor David',
          username: 'pastor_david',
          activities: {
            prayerRequests: 1,
            recentPosts: 8,
            apologeticsContributions: 4,
          },
          lastActivity: '1 day ago',
        },
      ] as FriendActivity[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Friends Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-1" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!friends?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Friends Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Connect with friends to see their activity</p>
          <Button size="sm">
            <Users className="w-4 h-4 mr-1" />
            Find Friends
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Friends Activity
          </CardTitle>
          <Link href="/friends">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {friends.slice(0, 3).map((friend) => (
          <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 dark:hover:bg-muted/70 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {friend.name.charAt(0)}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">{friend.name}</h4>
                <span className="text-xs text-muted-foreground">{friend.lastActivity}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {friend.activities.prayerRequests > 0 && (
                  <Link href="/prayer-requests">
                    <Badge
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-100 transition-colors"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      {friend.activities.prayerRequests} prayer{friend.activities.prayerRequests !== 1 ? 's' : ''}
                    </Badge>
                  </Link>
                )}
                
                {friend.activities.recentPosts > 0 && (
                  <Link href="/microblogs">
                    <Badge
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-100 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {friend.activities.recentPosts} post{friend.activities.recentPosts !== 1 ? 's' : ''}
                    </Badge>
                  </Link>
                )}
                
                {friend.activities.apologeticsContributions > 0 && (
                  <Link href="/apologetics">
                    <Badge
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40 dark:hover:text-green-100 transition-colors"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      {friend.activities.apologeticsContributions} answer{friend.activities.apologeticsContributions !== 1 ? 's' : ''}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {friends.length > 3 && (
          <div className="text-center pt-2 border-t">
            <Link href="/friends">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                See all {friends.length} friends
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}