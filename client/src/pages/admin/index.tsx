import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Video, User, Layout, CheckCircle, AlertCircle, BarChart4, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // Query to fetch pending livestreamer applications count
  const { data: pendingApplications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/admin/applications/livestreamer'],
    retry: false,
    enabled: isAuthenticated && user?.isAdmin,
  });

  // Query to fetch application stats
  const { data: applicationStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/livestreamer-applications/stats'],
    retry: false,
    enabled: isAuthenticated && user?.isAdmin,
  });

  // Check if user is admin
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  // Count pending applications
  const pendingCount = pendingApplications?.filter((app: any) => app.status === 'pending')?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage the Christian community platform</p>
      </div>

      {/* Admin Stats Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  applicationStats?.total || 0
                )}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  applicationStats?.pending || 0
                )}
              </p>
            </div>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  applicationStats?.approved || 0
                )}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Reviewed Today</p>
              <p className="text-2xl font-bold">
                {isLoadingStats ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  applicationStats?.reviewedToday || 0
                )}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <BarChart4 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Livestreamer Applications Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Livestreamer Applications</CardTitle>
              <Video className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Review and manage livestreamer applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                {isLoadingApplications ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{pendingCount}</span>
                    {pendingCount > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Needs Attention
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pendingCount > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/admin/livestreamer-applications">Manage Applications</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Application Statistics Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Application Statistics</CardTitle>
              <BarChart4 className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>View detailed insights and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Track application trends, approval rates, and processing metrics with interactive charts and visualizations.
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/application-stats">View Statistics</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Users Management Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">User Management</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              View, edit, and manage user accounts, roles, and permissions across the platform.
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Admin Users Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Admin Users</CardTitle>
              <User className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Manage administrator accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              View and manage administrator accounts with platform-wide access and permissions.
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/admin-users">Manage Admin Users</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Platform Settings Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Platform Settings</CardTitle>
              <Layout className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Configure platform-wide settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Manage global platform settings, feature toggles, and system configurations.
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/settings">Platform Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}