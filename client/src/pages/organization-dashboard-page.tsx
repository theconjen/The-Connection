import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useToast } from "../hooks/use-toast";
import { 
  Church, 
  Users, 
  Crown, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Plus,
  CreditCard,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe
} from "lucide-react";

interface Organization {
  id: number;
  name: string;
  description?: string;
  plan: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  denomination?: string;
  createdAt: string;
  updatedAt: string;
}

interface Member {
  membership: {
    id: number;
    role: string;
    joinedAt: string;
  };
  user: {
    id: number;
    username: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
}

export default function OrganizationDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: organization, isLoading } = useQuery({
    queryKey: [`/api/organizations/${id}`],
    enabled: !!id,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: [`/api/organizations/${id}/members`],
    enabled: !!id,
  });

  const upgradePlanMutation = useMutation({
    mutationFn: async (plan: string) => {
      // Stripe integration removed - upgrade functionality disabled
      throw new Error("Upgrade functionality is currently disabled");
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading organization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Organization Not Found</h1>
          <Button onClick={() => navigate("/")}>Return Home</Button>
        </div>
      </div>
    );
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "premium": return "bg-purple-100 text-purple-800 border-purple-300";
      case "standard": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const handleUpgrade = (plan: string) => {
    upgradePlanMutation.mutate(plan);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Church className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              {organization.description && (
                <p className="text-gray-600 mt-1">{organization.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getPlanBadgeColor(organization.plan)}>
                  {organization.plan.charAt(0).toUpperCase() + organization.plan.slice(1)} Plan
                </Badge>
                {organization.denomination && (
                  <Badge variant="outline">{organization.denomination}</Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate(`/organizations/${id}/settings`)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Administrators</p>
                <p className="text-2xl font-bold">
                  {members.filter(m => m.membership.role === 'admin').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">This Month's Events</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Active Discussions</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church className="w-5 h-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {organization.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {organization.website}
                    </a>
                  </div>
                )}
                {organization.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{organization.phone}</span>
                  </div>
                )}
                {(organization.address || organization.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>
                      {organization.address && `${organization.address}, `}
                      {organization.city && organization.state && 
                        `${organization.city}, ${organization.state}`}
                      {organization.zipCode && ` ${organization.zipCode}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-8">No recent activity to display</p>
              </CardContent>
            </Card>
          </div>

          {/* Plan Upgrade CTA */}
          {organization.plan === 'free' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Crown className="w-5 h-5" />
                  Unlock More Features
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Upgrade to access advanced church management tools, analytics, and priority support.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={() => handleUpgrade('standard')} className="bg-blue-600 hover:bg-blue-700">
                    Upgrade to Standard - $29/month
                  </Button>
                  <Button onClick={() => handleUpgrade('premium')} className="bg-purple-600 hover:bg-purple-700">
                    Upgrade to Premium - $59/month
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Organization Members</h3>
            <Button onClick={() => navigate(`/organizations/${id}/invite`)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {members.map((member) => (
                  <div key={member.user.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.avatarUrl} />
                        <AvatarFallback>
                          {member.user.displayName?.charAt(0) || member.user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.displayName || member.user.username}
                        </p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.membership.role === 'admin' ? 'default' : 'secondary'}>
                        {member.membership.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                        {member.membership.role.charAt(0).toUpperCase() + member.membership.role.slice(1)}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.membership.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold capitalize">{organization.plan} Plan</h4>
                  <p className="text-gray-600">
                    {organization.plan === 'free' && 'Free forever with basic features'}
                    {organization.plan === 'standard' && '$29/month - Enhanced features and support'}
                    {organization.plan === 'premium' && '$59/month - All features plus advanced analytics'}
                  </p>
                </div>
                {organization.plan === 'free' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpgrade('standard')} variant="outline">
                      Upgrade to Standard
                    </Button>
                    <Button onClick={() => handleUpgrade('premium')}>
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {organization.plan !== 'free' && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Billing information will be displayed here for paid plans.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization's basic information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(`/organizations/${id}/edit`)}>
                Edit Organization Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}