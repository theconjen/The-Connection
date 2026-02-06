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
} from "@/components/organization";
import { ArrowLeft, LayoutDashboard, Settings, Users, UserPlus, Activity, FileText } from "lucide-react";

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

  const { organization, entitlements, stats } = dashboardData as {
    organization: any;
    entitlements?: { canManageOrdinations?: boolean };
    stats: { memberCount: number; pendingMembershipCount: number };
  };
  const hasOrdinationsFeature = !!entitlements?.canManageOrdinations;

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
          <TabsTrigger value="ordinations" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ordinations
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
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
            onSave={async (data) => {
              await updateSettingsMutation.mutateAsync(data);
            }}
          />
        </TabsContent>

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
