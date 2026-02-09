/**
 * Organization About Page (Commons)
 * Dedicated page for leadership bios and photos
 */

import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Church,
  MapPin,
  Users,
  ArrowLeft,
} from "lucide-react";

interface PublicOrganization {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  denomination?: string | null;
  mission?: string | null;
}

interface PublicLeader {
  id: number;
  name: string;
  title: string | null;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

interface OrgProfileResponse {
  organization: PublicOrganization;
  leaders: PublicLeader[];
}

export default function OrganizationAboutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const [selectedLeader, setSelectedLeader] = useState<PublicLeader | null>(null);

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

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-start gap-6 mb-8">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
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

  const { organization: org, leaders } = data;
  const sortedLeaders = [...leaders].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return (
    <div className="container max-w-4xl py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        onClick={() => navigate(`/orgs/${slug}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {org.name}
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={org.logoUrl || undefined} />
          <AvatarFallback>
            <Church className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
          {org.denomination && (
            <Badge variant="secondary" className="mt-2">
              {org.denomination}
            </Badge>
          )}
          {(org.city || org.state) && (
            <div className="flex items-center gap-1 text-muted-foreground mt-2">
              <MapPin className="h-4 w-4" />
              <span>{[org.city, org.state].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mission Statement */}
      {org.mission && (
        <Card className="mb-8">
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

      {/* Leadership Team */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leadership Team
          </CardTitle>
          <CardDescription>
            Meet our pastors and staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedLeaders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No leadership information available yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedLeaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex flex-col items-center p-6 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-center"
                  onClick={() => setSelectedLeader(leader)}
                >
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={leader.photoUrl || undefined} />
                    <AvatarFallback className="text-xl">
                      {getInitials(leader.name)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{leader.name}</p>
                  {leader.title && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {leader.title}
                    </p>
                  )}
                  {leader.bio && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                      {leader.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leader Detail Dialog */}
      <Dialog open={!!selectedLeader} onOpenChange={(open) => !open && setSelectedLeader(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedLeader && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={selectedLeader.photoUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(selectedLeader.name)}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle className="text-xl">{selectedLeader.name}</DialogTitle>
                  {selectedLeader.title && (
                    <DialogDescription className="text-base">
                      {selectedLeader.title}
                    </DialogDescription>
                  )}
                </div>
              </DialogHeader>
              {selectedLeader.bio && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedLeader.bio}
                  </p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
