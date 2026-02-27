/**
 * Admin Analytics Page
 * Shows platform-wide statistics, trends, and moderation metrics with charts
 */

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2, Users, Shield, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { apiUrl } from '../../lib/env';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// --- Types ---

interface OverviewData {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  pendingReports: number;
}

interface SignupsByDay {
  signupsByDay: Array<{ date: string; count: number }>;
}

interface ContentByDay {
  contentByDay: Array<{ date: string; microblogs: number; events: number }>;
}

interface ModerationData {
  reportsByStatus: { pending: number; reviewed: number; dismissed: number };
  suspensionsByType: { warning: number; suspension: number; ban: number };
}

// --- Helper to safely fetch with fallback ---

async function fetchWithFallback<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(apiUrl(url), { credentials: 'include' });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

// --- Stat Card Component ---

function StatCard({
  title,
  value,
  description,
  colorClass = '',
}: {
  title: string;
  value: number | string;
  description: string;
  colorClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={`text-3xl ${colorClass}`}>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// --- Fallback Card for unavailable data ---

function DataUnavailableCard({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Data not available</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center py-8">
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unable to load this data. The endpoint may not be configured yet.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  // Fetch overview metrics
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery<OverviewData>({
    queryKey: ['admin-analytics-overview'],
    queryFn: () =>
      fetchWithFallback('/api/admin/analytics/overview', {
        totalUsers: 0,
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        pendingReports: 0,
      }),
    retry: false,
    staleTime: 60_000,
  });

  // Fetch signup trend (last 30 days)
  const {
    data: signupData,
    isLoading: signupLoading,
    isError: signupError,
  } = useQuery<SignupsByDay>({
    queryKey: ['admin-analytics-users'],
    queryFn: () =>
      fetchWithFallback('/api/admin/analytics/users', { signupsByDay: [] }),
    retry: false,
    staleTime: 60_000,
  });

  // Fetch content creation trend
  const {
    data: contentData,
    isLoading: contentLoading,
    isError: contentError,
  } = useQuery<ContentByDay>({
    queryKey: ['admin-analytics-content'],
    queryFn: () =>
      fetchWithFallback('/api/admin/analytics/content', { contentByDay: [] }),
    retry: false,
    staleTime: 60_000,
  });

  // Fetch moderation stats
  const {
    data: moderationData,
    isLoading: moderationLoading,
    isError: moderationError,
  } = useQuery<ModerationData>({
    queryKey: ['admin-analytics-moderation'],
    queryFn: () =>
      fetchWithFallback('/api/admin/analytics/moderation', {
        reportsByStatus: { pending: 0, reviewed: 0, dismissed: 0 },
        suspensionsByType: { warning: 0, suspension: 0, ban: 0 },
      }),
    retry: false,
    staleTime: 60_000,
  });

  const isInitialLoading = overviewLoading && signupLoading && contentLoading && moderationLoading;

  // Format date labels for charts (e.g. "Jan 15")
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-500">Platform statistics, trends, and moderation metrics</p>
      </div>

      {isInitialLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Overview Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Overview
            </h2>
            {overviewError || !overview ? (
              <DataUnavailableCard title="User Overview" />
            ) : (
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard
                  title="Total Users"
                  value={overview.totalUsers.toLocaleString()}
                  description="All registered accounts"
                />
                <StatCard
                  title="Daily Active Users"
                  value={overview.dailyActiveUsers.toLocaleString()}
                  description="Active in last 24 hours"
                  colorClass="text-green-600"
                />
                <StatCard
                  title="Weekly Active Users"
                  value={overview.weeklyActiveUsers.toLocaleString()}
                  description="Active in last 7 days"
                  colorClass="text-blue-600"
                />
                <StatCard
                  title="Monthly Active Users"
                  value={overview.monthlyActiveUsers.toLocaleString()}
                  description="Active in last 30 days"
                  colorClass="text-purple-600"
                />
              </div>
            )}
          </div>

          {/* Section 2: Signup Trend Line Chart */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Signup Trend (Last 30 Days)
            </h2>
            {signupError || !signupData || signupData.signupsByDay.length === 0 ? (
              <DataUnavailableCard title="Signup Trend" />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={signupData.signupsByDay}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        labelFormatter={formatDate}
                        formatter={(value: number) => [value, 'New signups']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Signups"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section 3: Content Creation Bar Chart */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Content Creation (Last 30 Days)
            </h2>
            {contentError || !contentData || contentData.contentByDay.length === 0 ? (
              <DataUnavailableCard title="Content Creation" />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={contentData.contentByDay}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={formatDate} />
                      <Legend />
                      <Bar
                        dataKey="microblogs"
                        fill="#6366f1"
                        name="Advice Posts"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="events"
                        fill="#f59e0b"
                        name="Events"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Section 4: Moderation Stats */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Moderation Overview
            </h2>
            {moderationError || !moderationData ? (
              <DataUnavailableCard title="Moderation Overview" />
            ) : (
              <div className="space-y-4">
                {/* Reports by Status */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Reports by Status</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                      title="Pending Reports"
                      value={moderationData.reportsByStatus.pending}
                      description="Awaiting moderator review"
                      colorClass="text-amber-600"
                    />
                    <StatCard
                      title="Reviewed Reports"
                      value={moderationData.reportsByStatus.reviewed}
                      description="Action taken by moderator"
                      colorClass="text-green-600"
                    />
                    <StatCard
                      title="Dismissed Reports"
                      value={moderationData.reportsByStatus.dismissed}
                      description="No action required"
                      colorClass="text-gray-600"
                    />
                  </div>
                </div>

                {/* Suspensions by Type */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Suspensions by Type</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                      title="Warnings"
                      value={moderationData.suspensionsByType.warning}
                      description="Users warned"
                      colorClass="text-yellow-600"
                    />
                    <StatCard
                      title="Suspensions"
                      value={moderationData.suspensionsByType.suspension}
                      description="Temporary suspensions"
                      colorClass="text-orange-600"
                    />
                    <StatCard
                      title="Bans"
                      value={moderationData.suspensionsByType.ban}
                      description="Permanent bans"
                      colorClass="text-red-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
