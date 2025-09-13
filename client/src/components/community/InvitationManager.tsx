import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Mail, 
  X, 
  Calendar, 
  Clock,
  UserPlus,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CommunityInvitation } from "@shared/schema";

interface InvitationManagerProps {
  communityId: string;
  communityName: string;
}

export function InvitationManager({ communityId, communityName }: InvitationManagerProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch pending invitations
  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery<CommunityInvitation[]>({
    queryKey: [`/api/communities/${communityId}/invitations`],
    enabled: !!communityId,
  });

  // Cancel invitation mutation
  const cancelMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      setDeletingId(invitationId);
      const res = await apiRequest(
        "DELETE",
        `/api/invitations/${invitationId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/invitations`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel invitation",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'accepted':
        return 'secondary';
      case 'declined':
        return 'destructive';
      case 'expired':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isExpired = (expiresAt: string | Date) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <Card data-testid="card-invitation-manager">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Manage invitations to join "{communityName}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading invitations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="card-invitation-manager">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            Manage invitations to join "{communityName}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">Failed to load invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingInvitations = invitations?.filter(inv => inv.status === 'pending') || [];
  const allInvitations = invitations || [];

  return (
    <Card data-testid="card-invitation-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Manage invitations to join "{communityName}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingInvitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No pending invitations</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use the "Invite Member" option to send invitations to new members.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvitations.map((invitation) => {
                    const expired = isExpired(invitation.expiresAt);
                    return (
                      <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {invitation.inviteeEmail}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={expired ? 'destructive' : getStatusBadgeVariant(invitation.status)}>
                            {expired ? 'Expired' : invitation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invitation.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(invitation.expiresAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={cancelMutation.isPending && deletingId === invitation.id}
                                data-testid={`button-cancel-${invitation.id}`}
                              >
                                {cancelMutation.isPending && deletingId === invitation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent data-testid={`dialog-cancel-${invitation.id}`}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel the invitation for {invitation.inviteeEmail}? 
                                  This action cannot be undone and they will not be able to use the existing invitation link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel data-testid="button-cancel-dialog-cancel">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelMutation.mutate(invitation.id)}
                                  data-testid="button-cancel-dialog-confirm"
                                >
                                  Cancel Invitation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {allInvitations.length > pendingInvitations.length && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {allInvitations.length - pendingInvitations.length} invitation{allInvitations.length - pendingInvitations.length !== 1 ? 's' : ''} completed (accepted/declined/expired)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}