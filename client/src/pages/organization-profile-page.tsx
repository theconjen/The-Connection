/**
 * Organization Profile Page (Commons)
 * Public church/organization profile with capabilities-based UI
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Church,
  MapPin,
  Globe,
  Phone,
  Clock,
  Users,
  Heart,
  HeartOff,
  UserPlus,
  Calendar,
  Settings,
  ExternalLink,
} from "lucide-react";

interface OrgCapabilities {
  userRole: "visitor" | "attendee" | "member" | "moderator" | "admin" | "owner";
  canRequestMembership: boolean;
  canRequestMeeting: boolean;
  canViewPrivateWall: boolean;
  canViewPrivateCommunities: boolean;
  hasPendingMembershipRequest: boolean;
}

interface PublicOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  publicPhone?: string | null;
  publicAddress?: string | null;
  city?: string | null;
  state?: string | null;
  publicZipCode?: string | null;
  denomination?: string | null;
  mission?: string | null;
  serviceTimes?: string | null;
  socialMedia?: string | null;
  foundedDate?: string | null;
  congregationSize?: number | null;
}

interface OrgProfileResponse {
  organization: PublicOrganization;
  capabilities: OrgCapabilities;
  communities: any[];
  upcomingEvents: any[];
}

const roleLabels: Record<string, string> = {
  visitor: "Visitor",
  attendee: "Attendee",
  member: "Member",
  moderator: "Moderator",
  admin: "Admin",
  owner: "Owner",
};

export default function OrganizationProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<OrgProfileResponse>({
    queryKey: ["/api/orgs", slug],
    queryFn: async () => {
      const response = await fetch(`/api/orgs/${slug}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Organization not found");
        }
        throw new Error("Failed to fetch organization");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  // Check if user has affiliation with this org
  const { data: affiliations = [] } = useQuery({
    queryKey: ["/api/me/churches"],
    queryFn: async () => {
      const response = await fetch("/api/me/churches", {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const hasAffiliation = affiliations.some(
    (aff: any) => aff.organizationId === data?.organization?.id
  );
  const affiliationId = affiliations.find(
    (aff: any) => aff.organizationId === data?.organization?.id
  )?.id;

  // Add to my churches mutation
  const addAffiliationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/me/churches", {
        organizationId: data?.organization?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add church");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/churches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", slug] });
      toast({ title: "Added to your churches" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add church",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from my churches mutation
  const removeAffiliationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/me/churches/${affiliationId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove church");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/churches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", slug] });
      toast({ title: "Removed from your churches" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove church",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request membership mutation
  const requestMembershipMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/orgs/${slug}/request-membership`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request membership");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orgs", slug] });
      toast({
        title: "Membership requested",
        description: "Your request has been sent to the church leadership.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request membership",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-start gap-6 mb-8">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Church className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Church Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This church doesn't exist or may have been removed.
              </p>
              <Button onClick={() => navigate("/orgs")}>Browse Churches</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organization: org, capabilities } = data;
  const isAdmin = ["admin", "owner"].includes(capabilities.userRole);
  const isMember = ["member", "moderator", "admin", "owner"].includes(capabilities.userRole);

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={org.logoUrl || undefined} />
          <AvatarFallback>
            <Church className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
              {org.denomination && (
                <Badge variant="secondary" className="mt-2">
                  {org.denomination}
                </Badge>
              )}
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/org-admin/${org.id}`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage
              </Button>
            )}
          </div>

          {(org.city || org.state) && (
            <div className="flex items-center gap-1 text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <span>{[org.city, org.state].filter(Boolean).join(", ")}</span>
            </div>
          )}

          {org.description && (
            <p className="text-muted-foreground mt-3">{org.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Your Connection */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {roleLabels[capabilities.userRole] || "Visitor"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isMember
                        ? "You are a member of this church"
                        : hasAffiliation
                        ? "This church is in your list"
                        : "You are not connected to this church"}
                    </p>
                  </div>
                  <Badge variant={isMember ? "default" : "secondary"}>
                    {roleLabels[capabilities.userRole]}
                  </Badge>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {/* Add/Remove from My Churches */}
                  {!isMember && (
                    hasAffiliation ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAffiliationMutation.mutate()}
                        disabled={removeAffiliationMutation.isPending}
                      >
                        <HeartOff className="mr-2 h-4 w-4" />
                        Remove from My Churches
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addAffiliationMutation.mutate()}
                        disabled={addAffiliationMutation.isPending}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Add to My Churches
                      </Button>
                    )
                  )}

                  {/* Request Membership */}
                  {capabilities.canRequestMembership && (
                    <Button
                      size="sm"
                      onClick={() => requestMembershipMutation.mutate()}
                      disabled={requestMembershipMutation.isPending}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Request Membership
                    </Button>
                  )}

                  {/* Pending Request */}
                  {capabilities.hasPendingMembershipRequest && (
                    <Badge variant="outline">Membership Pending</Badge>
                  )}

                  {/* Request Meeting */}
                  {capabilities.canRequestMeeting && (
                    <Button variant="outline" size="sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      Request a Meeting
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mission */}
          {org.mission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {org.mission}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Service Times */}
          {org.serviceTimes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Service Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {org.serviceTimes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Communities */}
          {data.communities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communities</CardTitle>
                <CardDescription>
                  Groups and ministries at this church
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          {data.upcomingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{org.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}

              {org.publicPhone && (
                <a
                  href={`tel:${org.publicPhone}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{org.publicPhone}</span>
                </a>
              )}

              {org.publicAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{org.publicAddress}</p>
                    {(org.city || org.state || org.publicZipCode) && (
                      <p>
                        {[org.city, org.state].filter(Boolean).join(", ")}
                        {org.publicZipCode && ` ${org.publicZipCode}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!org.website && !org.publicPhone && !org.publicAddress && (
                <p className="text-sm text-muted-foreground">
                  No contact information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {org.congregationSize && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>~{org.congregationSize.toLocaleString()} members</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
