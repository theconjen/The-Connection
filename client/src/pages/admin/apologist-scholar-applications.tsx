import React, { useState } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import AdminLayout from '../../components/layouts/admin-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Clock, 
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  GraduationCap,
  Info
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { toast } from '../../hooks/use-toast';

type ApologistScholarApplication = {
  id: number;
  userId: number;
  status: "pending" | "approved" | "rejected";
  fullName: string;
  academicCredentials: string;
  educationalBackground: string;
  theologicalPerspective: string;
  statementOfFaith: string;
  areasOfExpertise: string;
  publishedWorks: string | null;
  priorApologeticsExperience: string;
  writingSample: string;
  onlineSocialHandles: string | null;
  referenceName: string;
  referenceContact: string;
  referenceInstitution: string;
  motivation: string;
  weeklyTimeCommitment: string;
  agreedToGuidelines: boolean;
  reviewedBy: number | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  user?: {
    id: number;
    username: string;
    displayName: string | null;
    email: string;
  };
};

export default function ApologistScholarApplicationsAdminPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedApplication, setExpandedApplication] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<ApologistScholarApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  
  // Query applications
  const { data: applications = [], isLoading, refetch } = useQuery<ApologistScholarApplication[]>({
    queryKey: ['/api/admin/apologist-scholar-applications'],
    retry: false,
    enabled: !!(isAuthenticated && user?.isAdmin),
    queryFn: async () => {
      const res = await fetch('/api/admin/apologist-scholar-applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    }
  });

  // Handle authentication and admin check
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  // Filter applications based on search term and status
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.areasOfExpertise.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Toggle expanded application view
  const toggleExpandApplication = (id: number) => {
    if (expandedApplication === id) {
      setExpandedApplication(null);
    } else {
      setExpandedApplication(id);
    }
  };

  // Open review dialog
  const openReviewDialog = (application: ApologistScholarApplication) => {
    setCurrentApplication(application);
    setReviewNotes(application.reviewNotes || '');
    setReviewStatus(application.status === 'approved' ? 'approved' : 'rejected');
    setReviewDialogOpen(true);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!currentApplication) return;
    
    try {
      const response = await fetch(`/api/admin/apologist-scholar-applications/${currentApplication.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNotes,
          reviewedBy: user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      await refetch();
      setReviewDialogOpen(false);
      toast({
        title: "Review submitted",
        description: `Application has been ${reviewStatus}.`,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Apologist Scholar Applications</h1>
            <p className="text-gray-500">Review and manage applications</p>
          </div>
          
          <div className="mt-4 flex items-center space-x-2 md:mt-0">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name or email"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Status</SelectLabel>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Applications</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderApplicationsTable(filteredApplications)}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            {renderApplicationsTable(applications.filter(app => app.status === 'pending'))}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-4">
            {renderApplicationsTable(applications.filter(app => app.status === 'approved'))}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-4">
            {renderApplicationsTable(applications.filter(app => app.status === 'rejected'))}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Apologist Scholar Application</DialogTitle>
            <DialogDescription>
              Review and update the status of this application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Applicant</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Avatar>
                  <AvatarFallback>{currentApplication?.fullName.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentApplication?.fullName}</p>
                  <p className="text-sm text-gray-500">{currentApplication?.user?.email}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select value={reviewStatus} onValueChange={(value: 'approved' | 'rejected') => setReviewStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right" htmlFor="reviewNotes">Review Notes</Label>
              <Textarea
                id="reviewNotes"
                className="col-span-3"
                placeholder="Add notes about your decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );

  // Helper function to render applications table
  function renderApplicationsTable(apps: ApologistScholarApplication[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (apps.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
          <GraduationCap className="mb-2 h-10 w-10 text-gray-400" />
          <h3 className="text-lg font-medium">No applications found</h3>
          <p className="max-w-md text-sm text-gray-500">
            There are no apologist scholar applications matching your criteria.
          </p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-auto">Applicant</TableHead>
              <TableHead className="w-auto">Expertise Areas</TableHead>
              <TableHead className="w-auto">Date</TableHead>
              <TableHead className="w-auto">Status</TableHead>
              <TableHead className="w-auto text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((application) => (
              <React.Fragment key={application.id}>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{application.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{application.fullName}</div>
                        <div className="text-sm text-gray-500">{application.user?.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">{application.areasOfExpertise}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(application.submittedAt)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={application.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleExpandApplication(application.id)}
                      >
                        {expandedApplication === application.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(application)}
                      >
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {expandedApplication === application.id && (
                  <TableRow className="bg-gray-50">
                    <TableCell colSpan={5} className="p-4">
                      <div className="rounded-md border bg-white p-4">
                        <div className="mb-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <h3 className="font-semibold">Personal Information</h3>
                            <Separator className="my-2" />
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Full Name:</dt>
                                <dd>{application.fullName}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Email:</dt>
                                <dd>{application.user?.email}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Social Media:</dt>
                                <dd>{application.onlineSocialHandles || 'None provided'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Time Commitment:</dt>
                                <dd>{application.weeklyTimeCommitment}</dd>
                              </div>
                            </dl>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold">References</h3>
                            <Separator className="my-2" />
                            <dl className="space-y-2">
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Reference Name:</dt>
                                <dd>{application.referenceName}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Contact:</dt>
                                <dd>{application.referenceContact}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="font-medium text-gray-500">Institution:</dt>
                                <dd>{application.referenceInstitution}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="font-semibold">Academic Background & Expertise</h3>
                          <Separator className="my-2" />
                          <dl className="space-y-4">
                            <div>
                              <dt className="font-medium text-gray-500">Academic Credentials:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.academicCredentials}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Educational Background:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.educationalBackground}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Areas of Expertise:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.areasOfExpertise}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Published Works:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.publishedWorks || 'None provided'}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="font-semibold">Theological Perspective</h3>
                          <Separator className="my-2" />
                          <dl className="space-y-4">
                            <div>
                              <dt className="font-medium text-gray-500">Theological Perspective:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.theologicalPerspective}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Statement of Faith:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.statementOfFaith}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="font-semibold">Experience & Motivation</h3>
                          <Separator className="my-2" />
                          <dl className="space-y-4">
                            <div>
                              <dt className="font-medium text-gray-500">Prior Apologetics Experience:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.priorApologeticsExperience}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Writing Sample:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.writingSample}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500">Motivation:</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-sm">{application.motivation}</dd>
                            </div>
                          </dl>
                        </div>
                        
                        {(application.status !== 'pending' || application.reviewNotes) && (
                          <div>
                            <h3 className="font-semibold">Review Information</h3>
                            <Separator className="my-2" />
                            <dl className="space-y-2">
                              {application.reviewedAt && (
                                <div className="flex items-start justify-between">
                                  <dt className="font-medium text-gray-500">Reviewed On:</dt>
                                  <dd>{formatDate(application.reviewedAt)}</dd>
                                </div>
                              )}
                              {application.reviewNotes && (
                                <div>
                                  <dt className="font-medium text-gray-500">Review Notes:</dt>
                                  <dd className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-sm">
                                    {application.reviewNotes}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )}
                        
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openReviewDialog(application)}
                          >
                            {application.status === 'pending' ? 'Review' : 'Update Review'}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
}