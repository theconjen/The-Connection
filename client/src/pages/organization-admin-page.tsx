/**
 * Organization Admin Page - Steward Console
 * Web-only admin interface for organization management
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  OrgDashboard,
  OrgSettings,
  OrgMembers,
  OrgMembershipRequests,
  OrgActivityLog,
  OrgOrdinationPrograms,
  OrgLeaders,
  OrgSermons,
  OrgPlanSelector,
} from "@/components/organization";
import { ArrowLeft, LayoutDashboard, Settings, Users, UserPlus, Activity, FileText, User, Video, CreditCard } from "lucide-react";

export default function OrganizationAdminPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  const numericOrgId = parseInt(orgId || "0", 10);

  // Fetch org admin dashboard data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Organization not found or you don't have access");
        }
        throw new Error("Failed to fetch organization data");
      }
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch members
  const { data: members = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}/members`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch membership requests
  const { data: membershipRequests = [], isLoading: isRequestsLoading } = useQuery({
    queryKey: ["/api/leader-inbox/memberships"],
    queryFn: async () => {
      const response = await fetch("/api/leader-inbox/memberships", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      const allRequests = await response.json();
      // Filter to this org only
      return allRequests.filter((r: any) => r.organizationId === numericOrgId);
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch activity logs
  const { data: activityLogs = [], isLoading: isActivityLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId, "activity"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}/activity`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activity");
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch ordination programs
  const { data: ordinationPrograms = [], isLoading: isProgramsLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId, "ordination-programs"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}/ordination-programs`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch programs");
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch leaders
  const { data: leaders = [], isLoading: isLeadersLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId, "leaders"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}/leaders`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leaders");
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Fetch sermons
  const { data: sermons = [], isLoading: isSermonsLoading } = useQuery({
    queryKey: ["/api/org-admin", numericOrgId, "sermons"],
    queryFn: async () => {
      const response = await fetch(`/api/org-admin/${numericOrgId}/sermons`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sermons");
      return response.json();
    },
    enabled: !!numericOrgId && !!user,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/org-admin/${numericOrgId}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId] });
    },
  });

  // Delete organization mutation
  const deleteOrgMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/org-admin/${numericOrgId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete organization");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orgs/directory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/inbox-entitlements"] });
      navigate("/orgs");
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest("PATCH", `/api/org-admin/${numericOrgId}/members/${userId}`, { role });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/org-admin/${numericOrgId}/members/${userId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Approve membership mutation
  const approveMembershipMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/leader-inbox/memberships/${requestId}/approve`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leader-inbox/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Decline membership mutation
  const declineMembershipMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("POST", `/api/leader-inbox/memberships/${requestId}/decline`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to decline");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leader-inbox/memberships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Create ordination program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/org-admin/${numericOrgId}/ordination-programs`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create program");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "ordination-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Create leader mutation
  const createLeaderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/org-admin/${numericOrgId}/leaders`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add leader");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "leaders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Update leader mutation
  const updateLeaderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/org-admin/${numericOrgId}/leaders/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update leader");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "leaders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Delete leader mutation
  const deleteLeaderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/org-admin/${numericOrgId}/leaders/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove leader");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "leaders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Create sermon mutation
  const createSermonMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/org-admin/${numericOrgId}/sermons`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sermon");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "sermons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Get sermon upload URL mutation
  const getUploadUrlMutation = useMutation({
    mutationFn: async (sermonId: number) => {
      const response = await apiRequest("POST", `/api/org-admin/${numericOrgId}/sermons/${sermonId}/upload-url`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get upload URL");
      }
      return response.json();
    },
  });

  // Update sermon mutation
  const updateSermonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PATCH", `/api/org-admin/${numericOrgId}/sermons/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sermon");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "sermons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Delete sermon mutation
  const deleteSermonMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/org-admin/${numericOrgId}/sermons/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sermon");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "sermons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "activity"] });
    },
  });

  // Refresh sermon status
  const refreshSermonStatus = async (sermonId: number) => {
    try {
      await fetch(`/api/org-admin/${numericOrgId}/sermons/${sermonId}/status`, {
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/org-admin", numericOrgId, "sermons"] });
    } catch {
      // Ignore errors
    }
  };

  // Find current user's role in the org
  const currentUserRole = members.find((m: any) => m.userId === user?.id)?.role || "member";

  if (isDashboardLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This organization doesn't exist or you don't have admin access.
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const { organization, userRole, entitlements, stats } = dashboardData as {
    organization: any;
    userRole: string | null;
    entitlements?: {
      canManageOrdinations?: boolean;
      canUploadSermons?: boolean;
      sermonLimit?: number;
    };
    stats: { memberCount: number; pendingMembershipCount: number };
  };
  const hasOrdinationsFeature = !!entitlements?.canManageOrdinations;
  const isOwner = userRole === 'owner';

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/orgs/${organization.slug}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Organization
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests
            {stats.pendingMembershipCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {stats.pendingMembershipCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaders" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Leaders
          </TabsTrigger>
          <TabsTrigger value="sermons" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Sermons
          </TabsTrigger>
          <TabsTrigger value="ordinations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ordinations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan
            </TabsTrigger>
          )}
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <OrgDashboard
            orgName={organization.name}
            stats={stats}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="members">
          <OrgMembers
            members={members}
            currentUserId={user?.id || 0}
            currentUserRole={currentUserRole}
            isLoading={isMembersLoading}
            onUpdateRole={async (userId, role) => {
              await updateRoleMutation.mutateAsync({ userId, role });
            }}
            onRemoveMember={async (userId) => {
              await removeMemberMutation.mutateAsync(userId);
            }}
          />
        </TabsContent>

        <TabsContent value="requests">
          <OrgMembershipRequests
            requests={membershipRequests}
            isLoading={isRequestsLoading}
            onApprove={async (requestId) => {
              await approveMembershipMutation.mutateAsync(requestId);
            }}
            onDecline={async (requestId) => {
              await declineMembershipMutation.mutateAsync(requestId);
            }}
          />
        </TabsContent>

        <TabsContent value="leaders">
          <OrgLeaders
            leaders={leaders}
            isLoading={isLeadersLoading}
            onCreate={async (data) => {
              await createLeaderMutation.mutateAsync(data);
            }}
            onUpdate={async (id, data) => {
              await updateLeaderMutation.mutateAsync({ id, data });
            }}
            onDelete={async (id) => {
              await deleteLeaderMutation.mutateAsync(id);
            }}
          />
        </TabsContent>

        <TabsContent value="sermons">
          <OrgSermons
            orgId={numericOrgId}
            sermons={sermons}
            isLoading={isSermonsLoading}
            canUpload={entitlements?.canUploadSermons ?? true}
            uploadLimit={entitlements?.sermonLimit ?? 10}
            onCreate={async (data) => {
              return await createSermonMutation.mutateAsync(data);
            }}
            onGetUploadUrl={async (sermonId) => {
              return await getUploadUrlMutation.mutateAsync(sermonId);
            }}
            onUpdate={async (id, data) => {
              await updateSermonMutation.mutateAsync({ id, data });
            }}
            onDelete={async (id) => {
              await deleteSermonMutation.mutateAsync(id);
            }}
            onRefreshStatus={refreshSermonStatus}
          />
        </TabsContent>

        <TabsContent value="ordinations">
          <OrgOrdinationPrograms
            programs={ordinationPrograms}
            hasFeature={hasOrdinationsFeature}
            isLoading={isProgramsLoading}
            onCreate={async (data) => {
              await createProgramMutation.mutateAsync(data);
            }}
          />
        </TabsContent>

        <TabsContent value="settings">
          <OrgSettings
            organization={organization}
            isOwner={isOwner}
            onSave={async (data) => {
              await updateSettingsMutation.mutateAsync(data);
            }}
            onDelete={async () => {
              await deleteOrgMutation.mutateAsync();
            }}
          />
        </TabsContent>

        {isOwner && (
          <TabsContent value="plan">
            <OrgPlanSelector orgId={numericOrgId} />
          </TabsContent>
        )}

        <TabsContent value="activity">
          <OrgActivityLog
            logs={activityLogs}
            isLoading={isActivityLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
