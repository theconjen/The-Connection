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
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Lock,
  Globe,
  UserPlus,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";

interface CommunityPreview {
  id: number;
  name: string;
  description: string;
  slug: string;
  memberCount: number;
  isPrivate: boolean;
  iconName: string;
  iconColor: string;
}

export default function CommunityInvitePage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const code = (params as any).code as string;
  const [joinStatus, setJoinStatus] = useState<"idle" | "joining" | "success" | "error">("idle");

  // Fetch public community preview (no auth needed)
  const {
    data: community,
    isLoading,
    error,
  } = useQuery<CommunityPreview>({
    queryKey: [`/api/public/community-invite/${code}`],
    enabled: !!code,
    retry: false,
  });

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      setJoinStatus("joining");
      const res = await apiRequest("POST", `/api/community-invite/${code}/join`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setJoinStatus("success");
      toast({
        title: "Welcome to the community!",
        description: `You have joined "${community?.name}"`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });

      setTimeout(() => {
        navigate(`/communities/${data.slug || community?.slug}`);
      }, 1500);
    },
    onError: (error: Error) => {
      setJoinStatus("error");

      // Check if already a member
      if (error.message.includes("already a member")) {
        toast({ title: "Already a Member", description: "You are already a member of this community." });
        setTimeout(() => navigate(`/communities/${community?.slug}`), 1500);
        return;
      }

      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    if (!user) {
      localStorage.setItem("redirectAfterAuth", window.location.pathname);
      navigate("/auth");
      return;
    }
    joinMutation.mutate();
  };

  // Loading
  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Invite</h2>
            <p className="text-muted-foreground">Checking invite link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Invalid code
  if (error || !community) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-invalid-invite">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link is invalid or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              The link may have expired or been deactivated by the community admin.
              Ask for a new link or browse public communities.
            </p>
            <Button onClick={() => navigate("/communities")} data-testid="button-browse-communities">
              Browse Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success
  if (joinStatus === "success") {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card data-testid="card-join-success">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Welcome to {community.name}!</CardTitle>
            <CardDescription>You have joined the community.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">Redirecting you now...</p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main preview + join UI
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Card data-testid="card-invite-preview">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            Join this community on The Connection
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Community Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {community.name}
            </h3>
            <p className="text-muted-foreground mb-3">{community.description}</p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{community.memberCount} member{community.memberCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                {community.isPrivate ? (
                  <>
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">Private</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-3 pt-2">
            {user ? (
              <Button
                onClick={handleJoin}
                disabled={joinMutation.isPending || joinStatus !== "idle"}
                size="lg"
                className="w-full"
                data-testid="button-join-community"
              >
                {joinStatus === "joining" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join Community
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleJoin}
                size="lg"
                className="w-full"
                data-testid="button-sign-in-to-join"
              >
                Sign In to Join
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate("/communities")}
              data-testid="button-browse-instead"
            >
              Browse Communities Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
