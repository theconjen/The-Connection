import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Users, Plus, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconName: string;
  iconColor: string;
  memberCount: number | null;
  hasPrivateWall: boolean | null;
  hasPublicWall: boolean | null;
  createdAt: Date | null;
  createdBy: number | null;
}

export default function CommunitiesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    iconName: "users",
    iconColor: "#3b82f6",
    hasPrivateWall: true,
    hasPublicWall: true,
  });
  
  // Fetch communities
  const { data: communities, isLoading, error } = useQuery({
    queryKey: ['/api/communities'],
  });
  
  // Create community mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newCommunity) => {
      const res = await apiRequest(
        "POST",
        "/api/communities",
        {
          ...data,
          slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/communities'] });
      toast({
        title: "Community created",
        description: `"${data.name}" has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      navigate(`/community/${data.slug}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create community",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setNewCommunity({
      name: "",
      description: "",
      iconName: "users",
      iconColor: "#3b82f6",
      hasPrivateWall: true,
      hasPublicWall: true,
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCommunity(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setNewCommunity(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCommunity.name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for the community.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(newCommunity);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading communities...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Error Loading Communities</h2>
          <p className="text-muted-foreground mb-4">
            {(error as Error)?.message || "Failed to load communities."}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Communities</h1>
          <p className="text-muted-foreground mt-1">
            Join or create communities to connect with others
          </p>
        </div>
        
        {user && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
                <DialogDescription>
                  Create a new community for people to join and connect.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateCommunity}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Community Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newCommunity.name}
                      onChange={handleInputChange}
                      placeholder="Bible Study Group"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={newCommunity.description}
                      onChange={handleInputChange}
                      placeholder="A community for those interested in studying the Bible together"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hasPublicWall"
                        checked={newCommunity.hasPublicWall}
                        onCheckedChange={(checked) => handleSwitchChange('hasPublicWall', checked)}
                      />
                      <Label htmlFor="hasPublicWall">Public Wall</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="hasPrivateWall"
                        checked={newCommunity.hasPrivateWall}
                        onCheckedChange={(checked) => handleSwitchChange('hasPrivateWall', checked)}
                      />
                      <Label htmlFor="hasPrivateWall">Private Wall</Label>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Community"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {communities?.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Communities Yet</h2>
          <p className="text-muted-foreground mb-4">
            Be the first to create a community!
          </p>
          
          {user ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')}>
              Sign In to Create
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities?.map((community: Community) => (
            <Card 
              key={community.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/community/${community.slug}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{community.name}</span>
                  {community.hasPrivateWall && (
                    <Lock className="h-4 w-4 text-amber-500" />
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {community.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center text-muted-foreground text-sm">
                  <Users className="mr-1 h-4 w-4" />
                  <span>{community.memberCount || 0} members</span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant="secondary"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/community/${community.slug}`);
                  }}
                >
                  View Community
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}