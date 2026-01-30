/**
 * Admin Analytics Page
 * Shows platform-wide statistics and metrics
 */

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2, Users, MessageSquare, Calendar, BookOpen, Heart, TrendingUp, Activity } from 'lucide-react';
import { apiUrl } from '../../lib/env';

interface PlatformStats {
  users: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    active: number;
  };
  communities: {
    total: number;
    members: number;
  };
  content: {
    microblogs: number;
    events: number;
    prayerRequests: number;
    apologeticsArticles: number;
  };
  engagement: {
    messagesThisWeek: number;
    eventsThisMonth: number;
  };
}

export default function AnalyticsPage() {
  // Fetch platform stats
  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['/api/admin/platform-stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/admin/platform-stats'));
      if (!res.ok) {
        // Return default stats if endpoint doesn't exist
        return {
          users: { total: 0, newThisWeek: 0, newThisMonth: 0, active: 0 },
          communities: { total: 0, members: 0 },
          content: { microblogs: 0, events: 0, prayerRequests: 0, apologeticsArticles: 0 },
          engagement: { messagesThisWeek: 0, eventsThisMonth: 0 }
        };
      }
      return res.json();
    },
    retry: false
  });

  // Fetch user count as a fallback
  const { data: userCount } = useQuery<{ count: number }>({
    queryKey: ['/api/admin/users/count'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/admin/users?count=true'));
      if (!res.ok) return { count: 0 };
      const data = await res.json();
      return { count: Array.isArray(data) ? data.length : data.count || 0 };
    },
    retry: false
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500">Platform statistics and metrics</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Statistics
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.users?.total || userCount?.count || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">All registered accounts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>New This Week</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    +{stats?.users?.newThisWeek || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Users joined in last 7 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>New This Month</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">
                    +{stats?.users?.newThisMonth || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Users joined in last 30 days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active Users</CardDescription>
                  <CardTitle className="text-3xl text-purple-600">
                    {stats?.users?.active || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Active in last 7 days</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Content Statistics
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Advice Posts
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.content?.microblogs || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.content?.events || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Prayer Requests
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.content?.prayerRequests || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Apologetics Articles
                  </CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.content?.apologeticsArticles || 0}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>

          {/* Community Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community Statistics
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Communities</CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.communities?.total || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Active community groups</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Memberships</CardDescription>
                  <CardTitle className="text-3xl">
                    {stats?.communities?.members || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Users in communities</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Engagement Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Engagement
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Messages This Week</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {stats?.engagement?.messagesThisWeek || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Direct and community messages</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Events This Month</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">
                    {stats?.engagement?.eventsThisMonth || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Events created this month</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
