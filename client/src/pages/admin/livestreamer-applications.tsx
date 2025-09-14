import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '../../components/ui/button';
import AdminLayout from '../../components/layouts/admin-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Loader2, Check, X, ArrowLeft } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';

type LivestreamerApplication = {
  id: number;
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  experience: string;
  content: string;
  equipment: string;
  schedule: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes: string | null;
  reviewerId: number | null;
  createdAt: string;
  updatedAt: string | null;
};

export default function AdminLivestreamerApplications() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/admin/applications/livestreamer'],
    retry: false,
    enabled: isAuthenticated,
  });

  // Approve application mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/applications/livestreamer/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications/livestreamer'] });
      toast({
        title: 'Application approved',
        description: 'The livestreamer application has been approved successfully.',
      });
      setIsReviewOpen(false);
      setReviewNotes('');
      setSelectedAppId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to approve the application. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to approve application:', error);
    },
  });

  // Reject application mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/applications/livestreamer/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reviewNotes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/applications/livestreamer'] });
      toast({
        title: 'Application rejected',
        description: 'The livestreamer application has been rejected.',
      });
      setIsReviewOpen(false);
      setReviewNotes('');
      setSelectedAppId(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reject the application. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to reject application:', error);
    },
  });

  const [, setLocation] = useLocation();
  
  // AdminLayout already handles authentication and redirect checks

  const pendingApplications = applications?.filter(
    (app: LivestreamerApplication) => app.status === 'pending'
  ) || [];
  
  const processedApplications = applications?.filter(
    (app: LivestreamerApplication) => app.status !== 'pending'
  ) || [];

  const handleOpenReview = (appId: number) => {
    setSelectedAppId(appId);
    setIsReviewOpen(true);
  };

  const handleApprove = () => {
    if (selectedAppId) {
      approveMutation.mutate(selectedAppId);
    }
  };

  const handleReject = () => {
    if (selectedAppId) {
      rejectMutation.mutate(selectedAppId);
    }
  };

  const selectedApplication = applications?.find(
    (app: LivestreamerApplication) => app.id === selectedAppId
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center">
        <Button variant="ghost" className="mr-2" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Livestreamer Applications</h1>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingApplications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg text-gray-500">No pending applications</p>
              <p className="text-sm text-gray-400">
                When users apply to become livestreamers, their applications will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingApplications.map((application: LivestreamerApplication) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Avatar className="mr-2 h-8 w-8">
                        {application.user?.avatarUrl ? (
                          <AvatarImage src={application.user.avatarUrl} alt={application.user.username} />
                        ) : (
                          <AvatarFallback>{application.user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {application.user?.displayName || application.user?.username}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          @{application.user?.username}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="line-clamp-3 text-sm text-gray-600">{application.content}</p>
                    <div className="mt-3 text-xs text-gray-400">
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleOpenReview(application.id)}
                      className="w-full"
                      variant="outline"
                    >
                      Review Application
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="processed">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : processedApplications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg text-gray-500">No processed applications</p>
              <p className="text-sm text-gray-400">
                Applications that have been approved or rejected will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {processedApplications.map((application: LivestreamerApplication) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="mr-2 h-8 w-8">
                          {application.user?.avatarUrl ? (
                            <AvatarImage src={application.user.avatarUrl} alt={application.user.username} />
                          ) : (
                            <AvatarFallback>
                              {application.user?.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">
                            {application.user?.displayName || application.user?.username}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            @{application.user?.username}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={application.status === 'approved' ? 'success' : 'destructive'}
                        className="capitalize"
                      >
                        {application.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="line-clamp-3 text-sm text-gray-600">{application.content}</p>
                    {application.reviewNotes && (
                      <div className="mt-2 rounded bg-gray-50 p-2 text-sm">
                        <p className="font-semibold text-gray-600">Review Notes:</p>
                        <p className="text-gray-500">{application.reviewNotes}</p>
                      </div>
                    )}
                    <div className="mt-3 text-xs text-gray-400">
                      Processed {new Date(application.updatedAt || '').toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleOpenReview(application.id)}
                      className="w-full"
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Application Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle>Livestreamer Application Review</DialogTitle>
                <DialogDescription>
                  Review application from {selectedApplication.user?.displayName || selectedApplication.user?.username}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center mb-4">
                    <Avatar className="mr-2 h-10 w-10">
                      {selectedApplication.user?.avatarUrl ? (
                        <AvatarImage src={selectedApplication.user.avatarUrl} alt={selectedApplication.user.username} />
                      ) : (
                        <AvatarFallback>
                          {selectedApplication.user?.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedApplication.user?.displayName || selectedApplication.user?.username}
                      </h3>
                      <p className="text-sm text-gray-500">@{selectedApplication.user?.username}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-sm">{selectedApplication.user?.email}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Applied On</h3>
                    <p className="text-sm">
                      {new Date(selectedApplication.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedApplication.status !== 'pending' && (
                    <div className="mb-4">
                      <h3 className="font-semibold">Status</h3>
                      <Badge
                        variant={selectedApplication.status === 'approved' ? 'success' : 'destructive'}
                        className="mt-1 capitalize"
                      >
                        {selectedApplication.status}
                      </Badge>
                    </div>
                  )}

                  {selectedApplication.reviewNotes && (
                    <div className="mb-4">
                      <h3 className="font-semibold">Review Notes</h3>
                      <p className="text-sm">{selectedApplication.reviewNotes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold">Stream Content</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.content}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Experience</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.experience}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Equipment</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.equipment}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-semibold">Schedule</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedApplication.schedule}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {selectedApplication.status === 'pending' && (
                <>
                  <div className="mb-4">
                    <label htmlFor="reviewNotes" className="mb-2 block font-medium">
                      Review Notes (will be sent to applicant)
                    </label>
                    <Textarea
                      id="reviewNotes"
                      placeholder="Add your feedback, comments, or instructions for the applicant..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Reject Application
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Approve Application
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}