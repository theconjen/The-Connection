import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import MainLayout from "../components/layouts/main-layout";
import { Group, GroupMember } from "@connection/shared/schema";
import { useAuth } from "../hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Skeleton } from "../components/ui/skeleton";
import { insertGroupSchema, InsertGroup } from "@connection/shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "../hooks/use-toast";
import { User, Users, Home, Church, PlusIcon } from "lucide-react";
import CommunityGuidelines from "../components/community-guidelines";

// Extend the schema with validation
const createGroupSchema = insertGroupSchema.extend({
  name: z.string().min(3, "Group name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  iconName: z.string(),
  iconColor: z.string(),
  isPrivate: z.boolean().default(true),
});

type CreateGroupFormInput = z.input<typeof createGroupSchema>;
type CreateGroupFormValues = z.output<typeof createGroupSchema>;

export default function GroupsPage() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });
  
  const form = useForm<CreateGroupFormInput, undefined, CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      iconName: "users",
      iconColor: "green",
      isPrivate: true,
    } satisfies CreateGroupFormInput,
  });
  
  const onSubmit = async (data: CreateGroupFormValues) => {
    try {
      // Add createdBy from current user
      const groupData: InsertGroup = {
        ...data,
        createdBy: user!.id,
      };
      
      const response = await apiRequest("POST", "/api/groups", groupData);
      const newGroup = await response.json();
      
      // Invalidate the groups query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      
      toast({
        title: "Group Created",
        description: `Your group "${data.name}" has been created successfully!`,
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getGroupIcon = (iconName: string, iconColor: string) => {
    let icon;
    let colorClass = '';
    
    switch (iconColor) {
      case 'green':
        colorClass = 'bg-green-100 text-green-600';
        break;
      case 'blue':
        colorClass = 'bg-blue-100 text-blue-600';
        break;
      case 'purple':
        colorClass = 'bg-purple-100 text-purple-600';
        break;
      case 'amber':
        colorClass = 'bg-amber-100 text-amber-600';
        break;
      default:
        colorClass = 'bg-neutral-100 text-neutral-600';
    }
    
    switch (iconName) {
      case 'users':
        icon = <Users className="h-6 w-6" />;
        break;
      case 'home':
        icon = <Home className="h-6 w-6" />;
        break;
      case 'church':
        icon = <Church className="h-6 w-6" />;
        break;
      case 'user':
        icon = <User className="h-6 w-6" />;
        break;
      default:
        icon = <Users className="h-6 w-6" />;
    }
    
    return (
      <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center mr-4`}>
        {icon}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Private Groups</h1>
            <p className="text-neutral-600">Connect with believers in smaller, more focused communities</p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Group
          </Button>
        </div>
        
        <Tabs defaultValue="mygroups" className="mb-6">
          <TabsList>
            <TabsTrigger value="mygroups">My Groups</TabsTrigger>
            <TabsTrigger value="discover">Discover Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mygroups">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start">
                        <Skeleton className="w-12 h-12 rounded-full mr-4" />
                        <div className="flex-1">
                          <Skeleton className="h-6 w-40 mb-2" />
                          <Skeleton className="h-4 w-24 mb-4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full mt-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {groups && groups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Link key={group.id} href={`/groups/${group.id}`}>
                        <a>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                            <CardContent className="p-6">
                              <div className="flex items-start">
                                {getGroupIcon(group.iconName, group.iconColor)}
                                <div>
                                  <h3 className="font-semibold text-lg">{group.name}</h3>
                                  <p className="text-sm text-neutral-500 mb-2">
                                    {/* Mock member count since we don't have actual count */}
                                    {Math.floor(Math.random() * 10) + 2} members • {group.isPrivate ? 'Private' : 'Public'}
                                  </p>
                                  <p className="text-neutral-600 text-sm">{group.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </a>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center">
                    <CardContent>
                      <h3 className="text-xl font-semibold mb-3">You haven't joined any groups yet</h3>
                      <p className="text-neutral-600 mb-6">
                        Create your own group or discover existing ones to connect with other believers.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Create a Group
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="discover">
            <Card className="p-8 text-center mb-8">
              <CardContent>
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-neutral-600">
                  We're working on adding more groups for you to discover and join.
                  In the meantime, you can create your own group!
                </p>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-green-600">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Bible Study Group Ideas</CardTitle>
                      <CardDescription>Suggestions for starting your own group</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Book-by-book study through a particular book of the Bible</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Topical studies (prayer, faith, relationships, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Devotional sharing and accountability groups</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Family-focused scripture reading and discussion</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                    Start a Bible Study Group
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-blue-600">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Prayer Group Ideas</CardTitle>
                      <CardDescription>Connect with others through prayer</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Weekly prayer circles for mutual support</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Intercessory prayer groups for specific needs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Morning or evening prayer meeting groups</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-semibold mr-2">•</span>
                      <span>Emergency prayer chains for urgent requests</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                    Start a Prayer Group
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Group Guidelines Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Group Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 h-5 w-5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p className="text-neutral-700">Private groups are perfect for Bible studies, prayer groups, church committees, or family devotions.</p>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 h-5 w-5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p className="text-neutral-700">Group creators automatically become admins and can add new members.</p>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-3 h-5 w-5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p className="text-neutral-700">All community guidelines still apply within private groups.</p>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a New Group</DialogTitle>
            <DialogDescription>
              Fill out the details below to create your private group. You'll be able to add members after creation.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Thursday Night Bible Study" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of your group's purpose and focus" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="iconName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="users">Users</option>
                          <option value="home">Home</option>
                          <option value="church">Church</option>
                          <option value="user">Person</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="iconColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Color</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="green">Green</option>
                          <option value="blue">Blue</option>
                          <option value="purple">Purple</option>
                          <option value="amber">Amber</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Private Group</FormLabel>
                      <p className="text-sm text-neutral-500">
                        Only invited members can see and join this group
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Create Group</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        <Card>
          <CardHeader className="bg-primary-50 border-b border-primary-100">
            <CardTitle className="text-primary-800">About Private Groups</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm mb-4">
              Private groups on The Connection provide spaces for deeper fellowship, focused discussion, and spiritual growth with a select group of people.
            </p>
            
            <h3 className="font-medium mb-2">Use groups for:</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Bible studies with your church</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Family devotions and discussions</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Prayer circles and support</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mr-2 h-4 w-4">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>Ministry team coordination</span>
              </li>
            </ul>
            
            <p className="text-neutral-600 text-sm italic">
              "For where two or three gather in my name, there am I with them." - Matthew 18:20
            </p>
          </CardContent>
        </Card>
        
        <CommunityGuidelines />
      </aside>
    </MainLayout>
  );
}
