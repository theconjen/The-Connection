import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Users,
  Clock,
  Lock,
  AlertTriangle,
  UserPlus
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import type { CommunityInvitation, Community } from "@connection/shared/schema";

export default function AcceptInvitationPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const token = (params as any).token as string;
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [acceptanceStatus, setAcceptanceStatus] = useState<'idle' | 'accepting' | 'success' | 'error'>('idle');

  // Fetch invitation details
  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useQuery<CommunityInvitation & { community: Community }>({
    queryKey: [`/api/invitations/${token}`],
    enabled: !!token,
    retry: false, // Don't retry invalid tokens
  });

  // Accept invitation mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        setShowAuthDialog(true);
        throw new Error('Authentication required');
      }
      
      setAcceptanceStatus('accepting');
      const res = await apiRequest(
        "POST",
        `/api/invitations/${token}/accept`,
        {}
      );
      return await res.json();
    },
    onSuccess: (data) => {
      setAcceptanceStatus('success');
      toast({
        title: "Welcome to the community!",
        description: `You have successfully joined "${invitation?.community.name}"`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${invitation?.community.slug}`] });
      
      // Navigate to community page after a short delay
      setTimeout(() => {
        navigate(`/communities/${invitation?.community.slug}`);
      }, 2000);
    },
    onError: (error: Error) => {
      setAcceptanceStatus('error');
      
      // Parse backend error for better user feedback
      let title = "Failed to accept invitation";
      let description = error.message;
      
      if (error.message.includes("already a member")) {
        title = "Already a Member";
        description = "You are already a member of this community.";
      } else if (error.message.includes("expired")) {
        title = "Invitation Expired";
        description = "This invitation has expired. Please request a new one.";
      } else if (error.message.includes("not for your email")) {
        title = "Wrong Email Address";
        description = "This invitation was sent to a different email address.";
      } else if (error.message.includes("no longer valid")) {
        title = "Invalid Invitation";
        description = "This invitation is no longer valid or has been cancelled.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvitation = () => {
    if (!user) {
      setShowAuthDialog(true);
      return;
    }
    acceptMutation.mutate();
  };

  const handleAuthRedirect = () => {
    // Store the current URL to redirect back after auth
    localStorage.setItem('redirectAfterAuth', window.location.pathname);
    navigate('/auth');
  };

  // Check if invitation is expired
  const isExpired = invitation ? new Date(invitation.expiresAt) < new Date() : false;

  // Check if invitation is for current user's email
  const isForCurrentUser = user && invitation && user.email === invitation.inviteeEmail;

  // Loading state
  if (isLoadingInvitation) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Validating Invitation</h2>
            <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - invalid token
  if (invitationError || !invitation) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-invalid-invitation">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has been used already.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              The invitation link may have expired, been cancelled, or already used. 
              Please contact the community administrator for a new invitation.
            </p>
            <Button onClick={() => navigate('/communities')} data-testid="button-browse-communities">
              Browse Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (isExpired) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-expired-invitation">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation to join "{invitation.community.name}" has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                This invitation expired on {new Date(invitation.expiresAt).toLocaleDateString()}.
                Please request a new invitation from the community administrator.
              </p>
            </div>
            <Button onClick={() => navigate('/communities')} data-testid="button-browse-communities">
              Browse Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (invitation.status === 'accepted') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-already-accepted">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Invitation Already Accepted</CardTitle>
            <CardDescription>
              This invitation to join "{invitation.community.name}" has already been accepted.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You are already a member of this community or this invitation has been used.
            </p>
            <Button onClick={() => navigate(`/communities/${invitation.community.slug}`)} data-testid="button-visit-community">
              Visit Community
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (acceptanceStatus === 'success') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-success">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Welcome to {invitation.community.name}!</CardTitle>
            <CardDescription>
              You have successfully joined the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the community page...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main invitation display
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card data-testid="card-invitation">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>You're Invited to Join a Community</CardTitle>
          <CardDescription>
            You've been invited to join a private community on The Connection
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Community Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {invitation.community.name}
            </h3>
            <p className="text-muted-foreground mb-3">
              {invitation.community.description}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{invitation.community.memberCount || 0} members</span>
              </div>
              
              {invitation.community.isPrivate && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Lock className="h-4 w-4" />
                  <span>Private Community</span>
                </div>
              )}
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Invited email: <strong>{invitation.inviteeEmail}</strong></span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Authentication warning for non-matching emails */}
          {user && !isForCurrentUser && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Email Mismatch</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This invitation was sent to {invitation.inviteeEmail}, but you're signed in as {user.email}. 
                    You may need to sign in with the correct account or contact the community administrator.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            {user ? (
              <Button
                onClick={handleAcceptInvitation}
                disabled={acceptMutation.isPending || acceptanceStatus !== 'idle'}
                size="lg"
                className="w-full"
                data-testid="button-accept-invitation"
              >
                {acceptanceStatus === 'accepting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining Community...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAuthRedirect}
                size="lg"
                className="w-full"
                data-testid="button-sign-in"
              >
                Sign In to Accept Invitation
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => navigate('/communities')}
              data-testid="button-decline"
            >
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auth Required Dialog */}
      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent data-testid="dialog-auth-required">
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be signed in to accept this invitation. Would you like to sign in now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleAuthRedirect} data-testid="button-dialog-sign-in">
            Sign In
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}