/**
 * Admin Content Moderation Dashboard
 * Apple Store requirement: timely response to reports
 *
 * Enhanced with:
 * - Content type filter (post, microblog, comment, message, all)
 * - Reason filter dropdown
 * - Auto-flagged badge for items with 3+ reports
 * - Quick actions: Dismiss, Warn User, Remove Content, Suspend User
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Flag,
  MessageSquare,
  Users,
  Eye,
  Ban,
  Trash2,
  Shield,
  Loader2,
  Flame,
} from 'lucide-react';
import AdminLayout from '../../components/layouts/admin-layout';
import { useToast } from '../../hooks/use-toast';

interface ContentReport {
  id: number;
  contentType: string;
  contentId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  reportCount?: number;
  reporter: {
    id: number;
    username: string;
    displayName?: string;
    reputation?: {
      reputationScore: number;
      trustLevel: number;
      helpfulFlags: number;
      falseReports: number;
    };
  };
  content?: {
    id: number;
    content: string;
    authorId: number;
    author: {
      id: number;
      username: string;
      displayName?: string;
      reputation?: {
        reputationScore: number;
        trustLevel: number;
        totalReports: number;
        validReports: number;
        warnings: number;
        suspensions: number;
      };
    };
  };
  reportedUser?: {
    id: number;
    username: string;
    displayName?: string;
    isSuspended?: boolean;
    reputation?: {
      reputationScore: number;
      trustLevel: number;
      totalReports: number;
      validReports: number;
      warnings: number;
      suspensions: number;
    };
  };
}

type StatusFilter = 'pending' | 'resolved' | 'dismissed';
type ContentTypeFilter = 'all' | 'post' | 'microblog' | 'comment' | 'message';
type ReasonFilter = 'all' | 'spam' | 'harassment' | 'inappropriate' | 'hate_speech' | 'false_info' | 'other';

// Reason labels
const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  inappropriate: 'Inappropriate',
  hate_speech: 'Hate Speech',
  false_info: 'False Information',
  other: 'Other',
};

// Content type labels
const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  microblog: 'Microblog',
  comment: 'Comment',
  message: 'Message',
};

export default function AdminModerationPage() {
  const { toast } = useToast();

  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all');
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  // Apply client-side content type and reason filters
  const filteredReports = useMemo(() => {
    let result = reports;

    if (contentTypeFilter !== 'all') {
      result = result.filter(
        (r) => r.contentType.toLowerCase() === contentTypeFilter
      );
    }

    if (reasonFilter !== 'all') {
      result = result.filter((r) => r.reason === reasonFilter);
    }

    return result;
  }, [reports, contentTypeFilter, reasonFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?status=${filter}&limit=50`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Quick Actions ---

  const handleDismissReport = async (reportId: number) => {
    setQuickActionLoading(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: 'Report dismissed' });
        await fetchReports();
      } else {
        const error = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: error.message || 'Failed to dismiss report',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to dismiss report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleWarnUser = async (userId: number, username: string) => {
    if (!confirm(`Issue a warning to "${username}"?`)) return;

    setQuickActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'warning',
          reason: 'Content policy violation',
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: 'Warning issued', description: `User "${username}" has been warned.` });
        await fetchReports();
      } else {
        const error = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: error.message || 'Failed to warn user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error warning user:', error);
      toast({
        title: 'Error',
        description: 'Failed to warn user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleRemoveContent = async (reportId: number) => {
    if (!confirm('Remove this content? This action cannot be undone.')) return;

    setQuickActionLoading(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'action_taken',
          action: 'content_removed',
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: 'Content removed', description: 'The reported content has been removed.' });
        await fetchReports();
      } else {
        const error = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: error.message || 'Failed to remove content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing content:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: number, username: string) => {
    if (
      !confirm(
        `Are you sure you want to suspend user "${username}"? This will restrict their access to the platform.`
      )
    ) {
      return;
    }

    setQuickActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suspension',
          reason: reviewNotes.trim() || 'Content policy violation',
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'User suspended',
          description: `User "${username}" has been suspended.`,
        });
        await fetchReports();
      } else {
        const error = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: error.message || 'Failed to suspend user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setQuickActionLoading(null);
    }
  };

  // --- Existing handlers for the review modal ---

  const handleResolveReport = async (reportId: number, status: 'resolved' | 'dismissed') => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes: reviewNotes.trim() || undefined,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        await fetchReports();
        setSelectedReport(null);
        setReviewNotes('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (userId: number, username: string) => {
    if (
      !confirm(
        `PERMANENT ACTION\n\nAre you sure you want to DELETE the account for "${username}"?\n\nThis will:\n- Permanently delete their account\n- Remove all their content\n- Cannot be undone\n\nType the username to confirm.`
      )
    ) {
      return;
    }

    const confirmation = prompt(`Type "${username}" to confirm deletion:`);
    if (confirmation !== username) {
      alert('Username does not match. Account deletion cancelled.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reviewNotes.trim() || 'Severe policy violation',
        }),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Account deleted',
          description: `Account for "${username}" has been permanently deleted.`,
        });
        await fetchReports();
        setSelectedReport(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
  };

  // --- UI Helpers ---

  const getTrustLevelBadge = (trustLevel: number, score: number) => {
    const levels: Record<number, { label: string; color: string }> = {
      5: { label: 'Trusted', color: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Respected', color: 'bg-blue-100 text-blue-800' },
      3: { label: 'Active', color: 'bg-green-100 text-green-800' },
      2: { label: 'Member', color: 'bg-gray-100 text-gray-800' },
      1: { label: 'New', color: 'bg-gray-100 text-gray-600' },
    };

    const level = levels[trustLevel] || levels[1];

    return (
      <Badge className={level.color}>
        <Shield className="h-3 w-3 mr-1" />
        {level.label} ({score})
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'dismissed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getReasonLabel = (reason: string) => {
    return REASON_LABELS[reason] || reason;
  };

  const getContentTypeLabel = (contentType: string) => {
    return CONTENT_TYPE_LABELS[contentType.toLowerCase()] || contentType;
  };

  const isAutoFlagged = (report: ContentReport) => {
    return (report.reportCount ?? 0) >= 3;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Moderation</h1>
        <p className="text-gray-600">
          Review and manage reported content to maintain community standards.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Reports</SelectItem>
              <SelectItem value="resolved">Resolved Reports</SelectItem>
              <SelectItem value="dismissed">Dismissed Reports</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Content Type</label>
          <Select
            value={contentTypeFilter}
            onValueChange={(value: ContentTypeFilter) => setContentTypeFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="microblog">Microblog</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
              <SelectItem value="message">Message</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reason Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
          <Select
            value={reasonFilter}
            onValueChange={(value: ReasonFilter) => setReasonFilter(value)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="spam">Spam</SelectItem>
              <SelectItem value="harassment">Harassment</SelectItem>
              <SelectItem value="inappropriate">Inappropriate</SelectItem>
              <SelectItem value="hate_speech">Hate Speech</SelectItem>
              <SelectItem value="false_info">False Information</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No {filter} reports</h3>
            <p className="text-gray-600">
              {filter === 'pending'
                ? 'Great! There are no pending reports to review.'
                : `No ${filter} reports found matching your filters.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 mb-4">
            {filteredReports.length} {filter} report{filteredReports.length !== 1 ? 's' : ''}
            {(contentTypeFilter !== 'all' || reasonFilter !== 'all') && (
              <span className="ml-1">(filtered)</span>
            )}
          </div>

          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className={`hover:shadow-md transition-shadow ${
                isAutoFlagged(report) ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Status + Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {getStatusIcon(report.status)}
                      <Badge
                        variant={getStatusBadgeVariant(report.status) as any}
                        className="capitalize"
                      >
                        {report.status}
                      </Badge>
                      <Badge variant="outline">{getReasonLabel(report.reason)}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getContentTypeLabel(report.contentType)}
                      </Badge>
                      {/* Auto-flagged badge for 3+ reports */}
                      {isAutoFlagged(report) && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                          <Flame className="h-3 w-3 mr-1" />
                          Auto-flagged ({report.reportCount} reports)
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Reported by:</span>{' '}
                        {report.reporter.displayName || report.reporter.username}
                      </div>

                      {report.description && (
                        <div className="text-sm">
                          <span className="font-medium">Details:</span> {report.description}
                        </div>
                      )}

                      {report.content && (
                        <div className="p-3 bg-gray-50 rounded-lg border">
                          <div className="text-xs text-gray-500 mb-1">
                            Content by{' '}
                            {report.content.author.displayName || report.content.author.username}:
                          </div>
                          <p className="text-sm line-clamp-3">{report.content.content}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Reported {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  {report.status === 'pending' && (
                    <div className="ml-4 flex flex-col gap-2 flex-shrink-0">
                      {/* Detailed Review */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>

                      {/* Quick: Dismiss */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600"
                        disabled={quickActionLoading === report.id}
                        onClick={() => handleDismissReport(report.id)}
                      >
                        {quickActionLoading === report.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Dismiss
                      </Button>

                      {/* Quick: Remove Content */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        disabled={quickActionLoading === report.id}
                        onClick={() => handleRemoveContent(report.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>

                      {/* Quick: Warn User */}
                      {report.content?.author && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50"
                          disabled={quickActionLoading === report.content.author.id}
                          onClick={() =>
                            handleWarnUser(
                              report.content!.author.id,
                              report.content!.author.username
                            )
                          }
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Warn
                        </Button>
                      )}

                      {/* Quick: Suspend User */}
                      {(report.content?.author || report.reportedUser) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={
                            report.reportedUser?.isSuspended ||
                            quickActionLoading ===
                              (report.content?.author?.id || report.reportedUser?.id)
                          }
                          onClick={() => {
                            const user = report.content?.author || report.reportedUser;
                            if (user) {
                              handleSuspendUser(user.id, user.username);
                            }
                          }}
                        >
                          <Ban className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Review Report #{selectedReport.id}</h3>
              <p className="text-sm text-gray-600 mt-1">Take action on this content report</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Content Type:</span>{' '}
                  {getContentTypeLabel(selectedReport.contentType)}
                </div>
                <div>
                  <span className="font-medium">Reason:</span>{' '}
                  {getReasonLabel(selectedReport.reason)}
                </div>
                <div>
                  <span className="font-medium">Reporter:</span>{' '}
                  {selectedReport.reporter.displayName || selectedReport.reporter.username}
                </div>
                <div>
                  <span className="font-medium">Reported:</span>{' '}
                  {new Date(selectedReport.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Auto-flagged notice in modal */}
              {isAutoFlagged(selectedReport) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  <div>
                    <span className="text-sm font-medium text-red-800">
                      Auto-flagged: {selectedReport.reportCount} reports
                    </span>
                    <p className="text-xs text-red-600">
                      This content has received multiple reports and may require urgent attention.
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.description && (
                <div>
                  <span className="font-medium text-sm">Reporter's description:</span>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded border">
                    {selectedReport.description}
                  </p>
                </div>
              )}

              {selectedReport.content && (
                <div>
                  <span className="font-medium text-sm">Reported content:</span>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-500 mb-2">
                      By{' '}
                      {selectedReport.content.author.displayName ||
                        selectedReport.content.author.username}
                    </div>
                    <p className="text-sm">{selectedReport.content.content}</p>
                  </div>
                </div>
              )}

              {/* Reporter Reputation (Admin Only) */}
              {selectedReport.reporter.reputation && (
                <div>
                  <span className="font-medium text-sm">Reporter Trust Level (Admin View):</span>
                  <div className="mt-2 flex items-center gap-3">
                    {getTrustLevelBadge(
                      selectedReport.reporter.reputation.trustLevel,
                      selectedReport.reporter.reputation.reputationScore
                    )}
                    <div className="text-xs text-gray-600">
                      {selectedReport.reporter.reputation.helpfulFlags} helpful reports |{' '}
                      {selectedReport.reporter.reputation.falseReports} false reports
                    </div>
                  </div>
                </div>
              )}

              {/* Content Author/Reported User Reputation (Admin Only) */}
              {(selectedReport.content?.author.reputation ||
                selectedReport.reportedUser?.reputation) && (
                <div className="border-t pt-4">
                  <span className="font-medium text-sm text-red-600">
                    Reported User History (Admin View):
                  </span>
                  {(() => {
                    const userRep =
                      selectedReport.content?.author.reputation ||
                      selectedReport.reportedUser?.reputation;
                    const user =
                      selectedReport.content?.author || selectedReport.reportedUser;

                    if (!userRep || !user) return null;

                    return (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-3">
                          {getTrustLevelBadge(userRep.trustLevel, userRep.reputationScore)}
                          {selectedReport.reportedUser?.isSuspended && (
                            <Badge className="bg-red-100 text-red-800">
                              <Ban className="h-3 w-3 mr-1" />
                              Suspended
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-red-50 p-3 rounded">
                          <div>{userRep.totalReports} total reports</div>
                          <div>{userRep.validReports} confirmed violations</div>
                          <div>{userRep.warnings} warnings issued</div>
                          <div>{userRep.suspensions} past suspensions</div>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSuspendUser(user.id, user.username)
                            }
                            disabled={selectedReport.reportedUser?.isSuspended}
                            className="flex-1"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            {selectedReport.reportedUser?.isSuspended
                              ? 'Already Suspended'
                              : 'Suspend User'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteAccount(user.id, user.username)}
                            className="flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review notes (optional)
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedReport(null);
                  setReviewNotes('');
                }}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleResolveReport(selectedReport.id, 'dismissed')}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Processing...' : 'Dismiss'}
              </Button>
              <Button
                onClick={() => handleResolveReport(selectedReport.id, 'resolved')}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Processing...' : 'Take Action'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
