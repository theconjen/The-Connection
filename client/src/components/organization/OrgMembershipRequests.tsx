/**
 * Organization Membership Requests - Approve/decline pending requests
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Loader2 } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface MembershipRequest {
  id: number;
  userId: number;
  status: string;
  requestedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
}

interface OrgMembershipRequestsProps {
  requests: MembershipRequest[];
  isLoading?: boolean;
  onApprove: (requestId: number) => Promise<void>;
  onDecline: (requestId: number) => Promise<void>;
}

export function OrgMembershipRequests({
  requests,
  isLoading,
  onApprove,
  onDecline,
}: OrgMembershipRequestsProps) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await onApprove(requestId);
      toast({ title: "Request approved", description: "The member has been added to your organization." });
    } catch (error) {
      toast({
        title: "Failed to approve request",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await onDecline(requestId);
      toast({ title: "Request declined" });
    } catch (error) {
      toast({
        title: "Failed to decline request",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Membership Requests</CardTitle>
            <CardDescription>Review and respond to membership requests</CardDescription>
          </div>
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">
              {pendingRequests.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const displayName = request.user.displayName || request.user.username;
            const isProcessing = processingId === request.id;

            return (
              <div
                key={request.id}
                className="flex items-center justify-between gap-4 p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={request.user.avatarUrl || undefined} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{displayName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{request.user.username}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecline(request.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" />
                        Decline
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {pendingRequests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending membership requests</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
