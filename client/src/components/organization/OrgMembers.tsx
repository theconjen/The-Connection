/**
 * Organization Members - Member list with role management
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Shield, ShieldCheck, Crown, User, UserMinus } from "lucide-react";
import { getInitials } from "@/lib/utils";

type MemberRole = "owner" | "admin" | "moderator" | "member";

interface Member {
  id: number;
  userId: number;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: number;
    username: string;
    displayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
}

interface OrgMembersProps {
  members: Member[];
  currentUserId: number;
  currentUserRole: MemberRole;
  isLoading?: boolean;
  onUpdateRole: (userId: number, role: MemberRole) => Promise<void>;
  onRemoveMember: (userId: number) => Promise<void>;
}

const roleConfig: Record<MemberRole, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
  owner: { label: "Owner", icon: <Crown className="h-3 w-3" />, variant: "default" },
  admin: { label: "Admin", icon: <ShieldCheck className="h-3 w-3" />, variant: "default" },
  moderator: { label: "Moderator", icon: <Shield className="h-3 w-3" />, variant: "secondary" },
  member: { label: "Member", icon: <User className="h-3 w-3" />, variant: "outline" },
};

export function OrgMembers({
  members,
  currentUserId,
  currentUserRole,
  isLoading,
  onUpdateRole,
  onRemoveMember,
}: OrgMembersProps) {
  const { toast } = useToast();
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);

  const canManageRole = (targetRole: MemberRole) => {
    // Owners can manage everyone except themselves
    if (currentUserRole === "owner") return true;
    // Admins can manage moderators and members
    if (currentUserRole === "admin" && (targetRole === "moderator" || targetRole === "member")) return true;
    return false;
  };

  const canRemoveMember = (member: Member) => {
    if (member.userId === currentUserId) return false;
    if (member.role === "owner") return false;
    return canManageRole(member.role);
  };

  const handleRoleChange = async (userId: number, newRole: MemberRole) => {
    setIsUpdating(userId);
    try {
      await onUpdateRole(userId, newRole);
      toast({ title: "Role updated successfully" });
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsUpdating(removingMember.userId);
    try {
      await onRemoveMember(removingMember.userId);
      toast({ title: "Member removed successfully" });
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
      setRemovingMember(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Sort members: owner first, then admin, moderator, member
  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<MemberRole, number> = { owner: 0, admin: 1, moderator: 2, member: 3 };
    return order[a.role] - order[b.role];
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>Manage organization members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedMembers.map((member) => {
              const config = roleConfig[member.role];
              const displayName = member.user.displayName || member.user.username;
              const isCurrentUser = member.userId === currentUserId;
              const canManage = canManageRole(member.role) && !isCurrentUser;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.user.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{displayName}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{member.user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      {config.icon}
                      {config.label}
                    </Badge>

                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating === member.userId}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {currentUserRole === "owner" && member.role !== "admin" && (
                            <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "admin")}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          {member.role !== "moderator" && (
                            <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "moderator")}>
                              <Shield className="mr-2 h-4 w-4" />
                              Make Moderator
                            </DropdownMenuItem>
                          )}
                          {member.role !== "member" && (
                            <DropdownMenuItem onClick={() => handleRoleChange(member.userId, "member")}>
                              <User className="mr-2 h-4 w-4" />
                              Make Member
                            </DropdownMenuItem>
                          )}
                          {canRemoveMember(member) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setRemovingMember(member)}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}

            {members.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No members yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{removingMember?.user.displayName || removingMember?.user.username}</strong>{" "}
              from this organization? They will lose access to all organization content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
