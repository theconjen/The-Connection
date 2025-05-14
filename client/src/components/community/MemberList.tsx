import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, MoreVertical, UserPlus, ShieldAlert, Shield, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Member {
  id: number;
  userId: number;
  communityId: number;
  role: string;
  joinedAt: Date | null;
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
}

interface MemberListProps {
  communityId: number;
  isOwner: boolean;
  isModerator: boolean;
}

export function MemberList({ communityId, isOwner, isModerator }: MemberListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  const { data: members, isLoading, error } = useQuery({
    queryKey: [`/api/communities/${communityId}/members`],
    enabled: !!communityId,
  });
  
  const changeMemberRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: number; role: string }) => {
      const res = await apiRequest(
        "PUT", 
        `/api/communities/${communityId}/members/${memberId}/role`,
        { role }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/members`] });
      toast({
        title: "Role updated",
        description: "Member's role has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(
        "DELETE",
        `/api/communities/${communityId}/members/${userId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/communities/${communityId}/members`] });
      toast({
        title: "Member removed",
        description: "Member has been removed from the community",
      });
      setShowConfirmRemove(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleRoleChange = (member: Member, newRole: string) => {
    changeMemberRoleMutation.mutate({ memberId: member.id, role: newRole });
  };
  
  const handleRemoveMember = (member: Member) => {
    setSelectedMember(member);
    setShowConfirmRemove(true);
  };
  
  const confirmRemove = () => {
    if (selectedMember) {
      removeMemberMutation.mutate(selectedMember.userId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading members...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-destructive">
        Error loading members: {(error as Error).message}
      </div>
    );
  }
  
  if (!members?.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No members found
      </div>
    );
  }
  
  const sortedMembers = [...members].sort((a, b) => {
    // Sort by role: owner first, then moderators, then members
    const roleOrder = { owner: 0, moderator: 1, member: 2 };
    const roleA = roleOrder[a.role as keyof typeof roleOrder] || 3;
    const roleB = roleOrder[b.role as keyof typeof roleOrder] || 3;
    
    if (roleA !== roleB) {
      return roleA - roleB;
    }
    
    // If same role, sort by join date
    if (a.joinedAt && b.joinedAt) {
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    }
    
    return 0;
  });
  
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Members ({members.length})</h3>
      
      <ul className="space-y-2">
        {sortedMembers.map((member) => (
          <li key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user.avatarUrl || ''} />
                <AvatarFallback>
                  {member.user.displayName?.charAt(0) || member.user.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <div className="font-medium">
                  {member.user.displayName || member.user.username}
                  {member.user.id === user?.id && " (You)"}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  @{member.user.username}
                  <span className="mx-1">•</span>
                  <MemberRoleBadge role={member.role} />
                </div>
              </div>
            </div>
            
            {/* Actions menu for owner/moderator */}
            {(isOwner || (isModerator && member.role === 'member')) && member.user.id !== user?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isOwner && (
                    <>
                      {member.role !== 'moderator' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'moderator')}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Make Moderator</span>
                        </DropdownMenuItem>
                      )}
                      
                      {member.role === 'moderator' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'member')}>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Remove Moderator Role</span>
                        </DropdownMenuItem>
                      )}
                      
                      {member.role !== 'owner' && (
                        <DropdownMenuItem onClick={() => handleRoleChange(member, 'owner')}>
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          <span>Transfer Ownership</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleRemoveMember(member)}
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    <span>Remove from Community</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </li>
        ))}
      </ul>
      
      {/* Confirmation dialog for removing a member */}
      <Dialog open={showConfirmRemove} onOpenChange={setShowConfirmRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.user.displayName || selectedMember?.user.username} from this community?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmRemove(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MemberRoleBadgeProps {
  role: string;
}

function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  let badge;
  
  switch (role) {
    case 'owner':
      badge = (
        <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/90">
          <ShieldAlert className="h-3 w-3 mr-1" />
          Owner
        </Badge>
      );
      break;
    case 'moderator':
      badge = (
        <Badge variant="default" className="bg-primary hover:bg-primary/90">
          <Shield className="h-3 w-3 mr-1" />
          Moderator
        </Badge>
      );
      break;
    default:
      badge = (
        <Badge variant="outline">
          <UserPlus className="h-3 w-3 mr-1" />
          Member
        </Badge>
      );
  }
  
  return badge;
}