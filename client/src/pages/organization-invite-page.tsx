import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Users,
  Search,
  UserPlus,
  ArrowLeft,
  Shield,
  User,
  Crown
} from "lucide-react";

interface Organization {
  id: number;
  name: string;
  description?: string;
}

interface SearchUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface Member {
  membership: {
    id: number;
    role: string;
  };
  user: {
    id: number;
    username: string;
  };
}

export default function OrganizationInvitePage() {
  const { id } = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ [key: number]: string }>({});

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: [`/api/organizations/${id}`],
    enabled: !!id,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: [`/api/organizations/${id}/members`],
    enabled: !!id,
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await apiRequest(`/api/organizations/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member invited successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/organizations/${id}/members`] });
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite member",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username or email to search",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
    const response = await apiRequest(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
    const results = Array.isArray(response) ? response : [];
    setSearchResults(results);

    if (results.length === 0) {
        toast({
          title: "No results",
          description: "No users found matching your search",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to search users",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = (userId: number) => {
    const role = selectedRole[userId] || "member";
    inviteMemberMutation.mutate({ userId, role });
  };

  const isAlreadyMember = (userId: number) => {
    return members.some(m => m.user.id === userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4" />;
      case "pastor":
      case "leader":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/organizations/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Invite Members</h1>
        <p className="text-gray-600 mt-2">
          Add new members to {organization.name}
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Users
          </CardTitle>
          <CardDescription>
            Search by username or email to find users to invite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4 mr-2" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Search Results
            </CardTitle>
            <CardDescription>
              Found {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {searchResults.map((user) => {
                const alreadyMember = isAlreadyMember(user.id);
                const userRole = selectedRole[user.id] || "member";

                return (
                  <div key={user.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback>
                            {user.displayName?.charAt(0) || user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                          {user.email && (
                            <p className="text-sm text-gray-400">{user.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {alreadyMember ? (
                          <Badge variant="secondary">Already a member</Badge>
                        ) : (
                          <>
                            <Select
                              value={userRole}
                              onValueChange={(value) =>
                                setSelectedRole(prev => ({ ...prev, [user.id]: value }))
                              }
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Member
                                  </div>
                                </SelectItem>
                                <SelectItem value="leader">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Leader
                                  </div>
                                </SelectItem>
                                <SelectItem value="pastor">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Pastor
                                  </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Crown className="w-4 h-4" />
                                    Admin
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              onClick={() => handleInvite(user.id)}
                              disabled={inviteMemberMutation.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Invite
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!searching && searchResults.length === 0 && searchQuery && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try searching with a different username or email
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!searchQuery && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Search for users to invite</p>
              <p className="text-sm text-gray-400 mt-1">
                Enter a username or email address in the search box above
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
