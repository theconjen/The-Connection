/**
 * Admin Suspension Management Page
 * Manage user warnings, suspensions, bans, and appeals
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/layouts/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Loader2,
  Shield,
  AlertTriangle,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  X,
  Users,
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

// --- Types ---

interface SuspensionRecord {
  id: number;
  userId: number;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  type: 'warning' | 'suspension' | 'ban';
  reason: string;
  expiresAt?: string;
  createdAt: string;
  status: 'active' | 'expired' | 'appealed';
  appealText?: string;
  appealStatus?: 'pending' | 'approved' | 'denied';
}

type FilterTab = 'all' | 'active' | 'expired' | 'appealed';

// --- Helper: format date ---

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// --- Type badge colors ---

function getTypeBadge(type: string) {
  switch (type) {
    case 'warning':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Warning
        </Badge>
      );
    case 'suspension':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          <Clock className="h-3 w-3 mr-1" />
          Suspension
        </Badge>
      );
    case 'ban':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <Ban className="h-3 w-3 mr-1" />
          Ban
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function getAppealBadge(appealStatus?: string) {
  if (!appealStatus) return null;
  switch (appealStatus) {
    case 'pending':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Appeal Pending
        </Badge>
      );
    case 'approved':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Appeal Approved
        </Badge>
      );
    case 'denied':
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          <XCircle className="h-3 w-3 mr-1" />
          Appeal Denied
        </Badge>
      );
    default:
      return null;
  }
}

export default function SuspensionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [appealReviewTarget, setAppealReviewTarget] = useState<SuspensionRecord | null>(null);

  // Suspend form state
  const [suspendForm, setSuspendForm] = useState({
    userSearch: '',
    userId: '',
    type: 'warning' as 'warning' | 'suspension' | 'ban',
    reason: '',
    expiresAt: '',
  });

  // Build query params
  const queryParams = activeTab !== 'all' ? `?status=${activeTab}` : '';

  // Fetch suspensions
  const {
    data: suspensionsResponse,
    isLoading,
    isError,
  } = useQuery<{ suspensions: SuspensionRecord[] }>({
    queryKey: ['admin-suspensions', activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/admin/suspensions${queryParams}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        return { suspensions: [] };
      }
      return res.json();
    },
    retry: false,
    staleTime: 30_000,
  });

  const suspensions = suspensionsResponse?.suspensions ?? [];

  // Suspend user mutation
  const suspendMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      type: string;
      reason: string;
      expiresAt?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${data.userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: data.type,
          reason: data.reason,
          expiresAt: data.expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to suspend user' }));
        throw new Error(err.error || err.message || 'Failed to suspend user');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'User suspended', description: 'The suspension has been applied.' });
      queryClient.invalidateQueries({ queryKey: ['admin-suspensions'] });
      setShowSuspendDialog(false);
      setSuspendForm({ userSearch: '', userId: '', type: 'warning', reason: '', expiresAt: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Appeal review mutation
  const appealMutation = useMutation({
    mutationFn: async (data: { suspensionId: number; action: 'approve' | 'deny' }) => {
      const res = await fetch(`/api/admin/suspensions/${data.suspensionId}/appeal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: data.action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to process appeal' }));
        throw new Error(err.error || err.message || 'Failed to process appeal');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      const action = variables.action === 'approve' ? 'approved' : 'denied';
      toast({ title: 'Appeal processed', description: `The appeal has been ${action}.` });
      queryClient.invalidateQueries({ queryKey: ['admin-suspensions'] });
      setAppealReviewTarget(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSuspendSubmit = () => {
    if (!suspendForm.userId.trim()) {
      toast({ title: 'Error', description: 'Please enter a user ID.', variant: 'destructive' });
      return;
    }
    if (!suspendForm.reason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason.', variant: 'destructive' });
      return;
    }
    suspendMutation.mutate({
      userId: suspendForm.userId.trim(),
      type: suspendForm.type,
      reason: suspendForm.reason.trim(),
      expiresAt: suspendForm.expiresAt || undefined,
    });
  };

  // Filter tabs
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'appealed', label: 'Appeals Pending' },
  ];

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Suspension Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage user warnings, suspensions, bans, and review appeals.
          </p>
        </div>
        <Button onClick={() => setShowSuspendDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Suspend User
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-3">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load suspensions</h3>
            <p className="text-gray-600">The suspension endpoint may not be configured yet.</p>
          </CardContent>
        </Card>
      ) : suspensions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suspensions found</h3>
            <p className="text-gray-600">
              {activeTab === 'all'
                ? 'No suspensions have been issued yet.'
                : `No ${activeTab} suspensions found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-500 mb-2">
            {suspensions.length} suspension{suspensions.length !== 1 ? 's' : ''}
          </div>

          {suspensions.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {record.avatarUrl ? (
                        <img
                          src={record.avatarUrl}
                          alt={record.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* User info + badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">
                          {record.displayName || record.username}
                        </span>
                        <span className="text-xs text-gray-500">@{record.username}</span>
                        {getTypeBadge(record.type)}
                        {record.appealStatus && getAppealBadge(record.appealStatus)}
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-gray-700 mb-1">{record.reason}</p>

                      {/* Dates */}
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>Issued: {formatDate(record.createdAt)}</span>
                        {record.expiresAt && <span>Expires: {formatDate(record.expiresAt)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex-shrink-0">
                    {record.appealStatus === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAppealReviewTarget(record)}
                      >
                        Review Appeal
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suspend User Dialog */}
      {showSuspendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Suspend User</h3>
                <p className="text-sm text-gray-600 mt-1">Issue a warning, suspension, or ban</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuspendDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {/* User ID input */}
              <div className="space-y-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input
                  id="user-id"
                  placeholder="Enter user ID"
                  value={suspendForm.userId}
                  onChange={(e) =>
                    setSuspendForm((prev) => ({ ...prev, userId: e.target.value }))
                  }
                />
              </div>

              {/* Suspension Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={suspendForm.type}
                  onValueChange={(value: 'warning' | 'suspension' | 'ban') =>
                    setSuspendForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe the reason for this action..."
                  value={suspendForm.reason}
                  onChange={(e) =>
                    setSuspendForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="min-h-[80px]"
                />
              </div>

              {/* Expiry Date (optional for suspension) */}
              {suspendForm.type === 'suspension' && (
                <div className="space-y-2">
                  <Label htmlFor="expires-at">Expires At (optional)</Label>
                  <Input
                    id="expires-at"
                    type="date"
                    value={suspendForm.expiresAt}
                    onChange={(e) =>
                      setSuspendForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSuspendDialog(false)}
                disabled={suspendMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSuspendSubmit}
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Apply Suspension'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Review Dialog */}
      {appealReviewTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Review Appeal</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Appeal from {appealReviewTarget.displayName || appealReviewTarget.username}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppealReviewTarget(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {/* Suspension Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Type:</span>
                  {getTypeBadge(appealReviewTarget.type)}
                </div>
                <div>
                  <span className="text-sm font-medium">Reason for suspension:</span>
                  <p className="text-sm text-gray-700 mt-1">{appealReviewTarget.reason}</p>
                </div>
                <div className="text-xs text-gray-500">
                  Issued: {formatDate(appealReviewTarget.createdAt)}
                  {appealReviewTarget.expiresAt &&
                    ` | Expires: ${formatDate(appealReviewTarget.expiresAt)}`}
                </div>
              </div>

              {/* Appeal Text */}
              <div>
                <span className="text-sm font-medium">Appeal message:</span>
                <div className="mt-1 p-3 bg-gray-50 rounded border">
                  <p className="text-sm">
                    {appealReviewTarget.appealText || 'No appeal message provided.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setAppealReviewTarget(null)}
                disabled={appealMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  appealMutation.mutate({
                    suspensionId: appealReviewTarget.id,
                    action: 'deny',
                  })
                }
                disabled={appealMutation.isPending}
              >
                {appealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Deny Appeal
              </Button>
              <Button
                onClick={() =>
                  appealMutation.mutate({
                    suspensionId: appealReviewTarget.id,
                    action: 'approve',
                  })
                }
                disabled={appealMutation.isPending}
              >
                {appealMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Approve Appeal
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
