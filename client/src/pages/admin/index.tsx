import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, Users, User, Layout, CheckCircle, AlertCircle, BarChart4, Activity, GraduationCap, BookOpen, Shield } from 'lucide-react';
import AdminLayout from '../../components/layouts/admin-layout';
import { apiUrl } from '../../lib/env';

interface ApplicationSummary {
  id: number | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt?: string;
  reviewedAt?: string | null;
}

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected?: number;
  reviewedToday?: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  // Query to fetch apologist scholar applications count
  const { data: pendingApologistApplications = [], isLoading: isLoadingApologistApplications } = useQuery<ApplicationSummary[]>({
    queryKey: ['/api/admin/apologist-scholar-applications'],
    retry: false,
    enabled: !!(isAuthenticated && user?.isAdmin),
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/admin/apologist-scholar-applications'));
      if (!res.ok) throw new Error('Failed to fetch apologist scholar applications');
      return res.json();
    }
  });

  // Query to fetch pending moderation reports
  const { data: moderationReports = [], isLoading: isLoadingReports } = useQuery<any[]>({
    queryKey: ['/api/admin/reports', 'pending'],
    retry: false,
    enabled: !!(isAuthenticated && user?.isAdmin),
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/admin/reports?status=pending'));
      if (!res.ok) throw new Error('Failed to fetch moderation reports');
      return res.json();
    }
  });

  // Count pending apologist scholar applications
  const pendingApologistCount = Array.isArray(pendingApologistApplications)
    ? pendingApologistApplications.filter(app => app.status === 'pending').length
    : 0;

  // Total applications count
  const totalApologistCount = Array.isArray(pendingApologistApplications) ? pendingApologistApplications.length : 0;
  const approvedApologistCount = Array.isArray(pendingApologistApplications)
    ? pendingApologistApplications.filter(app => app.status === 'approved').length
    : 0;

  return (
    <AdminLayout>
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
                {isLoadingApologistApplications ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  totalApologistCount
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
                {isLoadingApologistApplications ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  pendingApologistCount
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
                {isLoadingApologistApplications ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  approvedApologistCount
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
              <p className="text-sm font-medium text-gray-500">Pending Reports</p>
              <p className="text-2xl font-bold">
                {isLoadingReports ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  moderationReports.length
                )}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Apologist Scholar Applications Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Apologist Scholar Applications</CardTitle>
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Review and manage apologist scholar applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Applications</p>
                {isLoadingApologistApplications ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{pendingApologistCount}</span>
                    {pendingApologistCount > 0 && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Needs Attention
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {pendingApologistCount > 0 ? (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full">
              <Link href="/admin/apologist-scholar-applications">Manage Applications</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Content Moderation Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Content Moderation</CardTitle>
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Review reported content and manage user safety</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Reports</p>
                {isLoadingReports ? (
                  <Loader2 className="mt-1 h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{moderationReports.length}</span>
                    {moderationReports.length > 0 && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Requires Review
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {moderationReports.length > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild className="w-full" variant={moderationReports.length > 0 ? "default" : "outline"}>
              <Link href="/admin/moderation">Review Reports</Link>
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

        {/* Apologetics Resources Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Apologetics Resources</CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <CardDescription>Publish new books, videos, and podcasts to the public hub.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Add curated materials that will immediately appear on the Apologetics page for members and seekers.
            </p>
          </CardContent>
          <CardFooter className="mt-auto">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/apologetics-resources">Manage Resources</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}