import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loader2, AlertTriangle, ExternalLink, XCircle, CheckCircle2, Activity } from 'lucide-react';
import AdminLayout from '../../components/layouts/admin-layout';
import { apiUrl } from '../../lib/env';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';

interface SentryAlert {
  id: number;
  sentryEventId: string | null;
  resource: string;
  action: string;
  title: string;
  message: string | null;
  level: string | null;
  sentryUrl: string | null;
  project: string | null;
  isDismissed: boolean;
  dismissedAt: string | null;
  createdAt: string;
}

interface AlertStats {
  activeCount: number;
  last24hCount: number;
}

function levelBadgeVariant(level: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (level) {
    case 'fatal': return 'destructive';
    case 'error': return 'destructive';
    case 'warning': return 'default';
    default: return 'secondary';
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SentryAlertsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('active');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  const enabled = !!(isAuthenticated && user?.isAdmin);

  const { data: stats, isLoading: loadingStats } = useQuery<AlertStats>({
    queryKey: ['/api/admin/sentry-alerts/stats'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/admin/sentry-alerts/stats'));
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled,
    refetchInterval: 30000,
  });

  const dismissed = tab === 'dismissed';
  const resourceParam = resourceFilter !== 'all' ? `&resource=${resourceFilter}` : '';

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery<SentryAlert[]>({
    queryKey: ['/api/admin/sentry-alerts', dismissed, resourceFilter],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/admin/sentry-alerts?dismissed=${dismissed}${resourceParam}`));
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return res.json();
    },
    enabled,
    refetchInterval: 30000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await fetch(apiUrl(`/api/admin/sentry-alerts/${alertId}/dismiss`), {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to dismiss alert');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sentry-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sentry-alerts/stats'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to dismiss alert', variant: 'destructive' });
    },
  });

  const dismissAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl('/api/admin/sentry-alerts/dismiss-all'), {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to dismiss all');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sentry-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sentry-alerts/stats'] });
      toast({ title: 'Done', description: `Dismissed ${data.dismissed} alerts` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to dismiss all alerts', variant: 'destructive' });
    },
  });

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sentry Alerts</h1>
        <p className="text-gray-500">Monitor errors and performance alerts from Sentry</p>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.activeCount ?? 0}
              </span>
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Last 24 Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {loadingStats ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.last24hCount ?? 0}
              </span>
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and tabs */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="issue">Issues</SelectItem>
              <SelectItem value="event_alert">Event Alerts</SelectItem>
              <SelectItem value="metric_alert">Metric Alerts</SelectItem>
            </SelectContent>
          </Select>

          {tab === 'active' && alerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => dismissAllMutation.mutate()}
              disabled={dismissAllMutation.isPending}
            >
              {dismissAllMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              Dismiss All
            </Button>
          )}
        </div>
      </div>

      {/* Alert list */}
      {loadingAlerts ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-gray-500">
          {tab === 'active' ? 'No active alerts' : 'No dismissed alerts'}
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="overflow-hidden">
              <div className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={levelBadgeVariant(alert.level)}>
                      {alert.level || 'info'}
                    </Badge>
                    <Badge variant="outline">{alert.resource}</Badge>
                    {alert.project && (
                      <span className="text-xs text-gray-400">{alert.project}</span>
                    )}
                    <span className="text-xs text-gray-400">{timeAgo(alert.createdAt)}</span>
                  </div>
                  <p className="font-medium truncate">{alert.title}</p>
                  {alert.message && (
                    <p className="text-sm text-gray-500 truncate">{alert.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {alert.sentryUrl && (
                    <a
                      href={alert.sentryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {!alert.isDismissed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissMutation.mutate(alert.id)}
                      disabled={dismissMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
