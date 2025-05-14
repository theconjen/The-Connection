import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  PencilLine, 
  Users, 
  MessageSquareText, 
  LayoutList, 
  Settings, 
  MoreVertical,
  Loader2, 
  UserPlus, 
  UserMinus,
  Eye,
  ShieldAlert,
  Lock,
  Trash,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MemberList } from "@/components/community/MemberList";
import { ChatRoomList } from "@/components/community/ChatRoomList";

export default function CommunityPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const slug = params.slug as string;
  const [showJoinConfirm, setShowJoinConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Fetch community details
  const { 
    data: community, 
    isLoading: isLoadingCommunity, 
    error: communityError 
  } = useQuery({
    queryKey: [`/api/communities/${slug}`],
    enabled: !!slug,
  });
  
  // Check membership status
  const { 
    data: membership,
    isLoading: isLoadingMembership,
    error: membershipError
  } = useQuery({
    queryKey: [`/api/communities/${community?.id}/members`],
    enabled: !!community?.id && !!user,
    select: (data) => {
      if (!user) return null;
      return data.find((member: any) => member.userId === user.id);
    },
  });
  
  // Role checks
  const isOwner = membership?.role === 'owner';
  const isModerator = membership?.role === 'moderator';
  const isMember = !!membership;
  
  // Join community mutation
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/communities/${community.id}/members`,
        {}
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/members`] });
      toast({
        title: "Joined community",
        description: `You are now a member of ${community.name}`,
      });
      setShowJoinConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join community",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Leave community mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await apiRequest(
        "DELETE",
        `/api/communities/${community.id}/members/${user.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${community.id}/members`] });
      toast({
        title: "Left community",
        description: `You have left ${community.name}`,
      });
      setShowLeaveConfirm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave community",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete community mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "DELETE",
        `/api/communities/${community.id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Community deleted",
        description: `${community.name} has been permanently deleted`,
      });
      navigate('/communities');
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete community",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleJoinCommunity = () => {
    joinMutation.mutate();
  };
  
  const handleLeaveCommunity = () => {
    leaveMutation.mutate();
  };
  
  const handleDeleteCommunity = () => {
    deleteMutation.mutate();
  };
  
  // Loading state
  if (isLoadingCommunity || (user && isLoadingMembership)) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading community...</span>
      </div>
    );
  }
  
  // Error state
  if (communityError || membershipError) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Community</h2>
          <p className="text-muted-foreground mb-4">
            {(communityError as Error)?.message || (membershipError as Error)?.message || "Failed to load community details."}
          </p>
          <Button onClick={() => navigate('/communities')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }
  
  // Community not found
  if (!community) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Community Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The community you're looking for doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/communities')}>
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Community Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{community.name}</h1>
          <p className="text-muted-foreground mt-1">{community.description}</p>
          
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              <span>{community.memberCount || 0} members</span>
            </div>
            
            {community.hasPrivateWall && (
              <div className="flex items-center text-amber-500">
                <Lock className="mr-1 h-4 w-4" />
                <span>Private Wall</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            isMember ? (
              <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserMinus className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Leave Community</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to leave {community.name}? You'll lose access to private content and chat rooms.
                      {isOwner && (
                        <div className="mt-2 text-destructive">
                          <ShieldAlert className="inline h-4 w-4 mr-1" />
                          Warning: You are the owner of this community. If you leave, ownership must be transferred first.
                        </div>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant={isOwner ? "outline" : "destructive"}
                      onClick={handleLeaveCommunity}
                      disabled={isOwner || leaveMutation.isPending}
                    >
                      {leaveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Leaving...
                        </>
                      ) : (
                        "Leave Community"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={showJoinConfirm} onOpenChange={setShowJoinConfirm}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Join
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Community</DialogTitle>
                    <DialogDescription>
                      You're about to join {community.name}. Members can access private chat rooms and participate in discussions.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button 
                      onClick={handleJoinCommunity}
                      disabled={joinMutation.isPending}
                    >
                      {joinMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        "Join Community"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Sign In to Join
            </Button>
          )}
          
          {(isOwner || isModerator) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <PencilLine className="mr-2 h-4 w-4" />
                  <span>Edit Community</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Community Settings</span>
                </DropdownMenuItem>
                
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                      <DialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete Community</span>
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Community</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete {community.name}? This action is permanent and will delete all content, chat rooms, and member relationships.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
                          <AlertTriangle className="h-5 w-5 mb-2" />
                          <p className="text-sm">This is a permanent action and cannot be undone. All content will be permanently deleted.</p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteCommunity}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete Community"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquareText className="h-4 w-4 mr-2" />
            Chat Rooms
          </TabsTrigger>
          <TabsTrigger value="wall">
            <LayoutList className="h-4 w-4 mr-2" />
            Wall
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-6">
          <ChatRoomList 
            communityId={community.id} 
            isOwner={isOwner} 
            isModerator={isModerator} 
            isMember={isMember} 
          />
        </TabsContent>
        
        <TabsContent value="wall" className="mt-6">
          {(community.hasPrivateWall || community.hasPublicWall) ? (
            <div className="p-10 text-center">
              <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Wall Content Coming Soon</h2>
              <p className="text-muted-foreground mb-4">
                The community wall feature is currently being implemented.
              </p>
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md">
              <LayoutList className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h4 className="text-lg font-medium">No Wall Available</h4>
              <p className="text-muted-foreground">
                This community does not have a public or private wall enabled.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <MemberList 
            communityId={community.id} 
            isOwner={isOwner} 
            isModerator={isModerator} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}