import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { useMediaQuery } from "../hooks/use-media-query";
import MainLayout from "../components/layouts/main-layout";
import { PrayerRequest } from "@connection/shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import FloatingActionButton from "../components/floating-action-button";

// Helper function to format dates consistently
function formatDate(date: Date | null | undefined): string {
  if (!date) return "Unknown date";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, 
  CardFooter
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod/v4";
import { HeartHandshakeIcon, PlusIcon, BadgeCheckIcon, ClockIcon } from "lucide-react";

// We use the formatDate function defined at the top of the file
/* 
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
};
*/

// Form schema for creating prayer requests
const prayerRequestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(10, "Request must be at least 10 characters").max(1000, "Request must be less than 1000 characters"),
  privacyLevel: z.enum(["public", "friends-only", "group-only"]),
  groupId: z.number().optional().nullable(),
  isAnonymous: z.boolean().default(false),
});

type PrayerRequestFormInput = z.input<typeof prayerRequestSchema>;
type PrayerRequestFormValues = z.output<typeof prayerRequestSchema>;

export default function PrayerRequestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Query prayer requests
  const { data: prayerRequests, isLoading: isLoadingPrayers } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/prayer-requests'],
  });
  
  // Query my prayer requests
  const { data: myPrayerRequests, isLoading: isLoadingMyPrayers } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/users', user?.id, 'prayer-requests'],
    enabled: !!user, // Only run if user is logged in
  });
  
  // Query my prayed requests
  const { data: prayedIds, isLoading: isLoadingPrayed } = useQuery<number[]>({
    queryKey: ['/api/users', user?.id, 'prayed'],
    enabled: !!user, // Only run if user is logged in
  });
  
  // Create prayer request mutation
  const createPrayerMutation = useMutation({
    mutationFn: async (data: PrayerRequestFormValues) => {
      const res = await apiRequest("POST", "/api/prayer-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prayer request created",
        description: "Your prayer request has been shared with the community.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'prayer-requests'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating prayer request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Pray for request mutation
  const prayForRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/prayer-requests/${id}/pray`);
      return await res.json();
    },
    onSuccess: (_, id) => {
      toast({
        title: "Prayer recorded",
        description: "Thank you for praying for this request.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'prayed'] });
      queryClient.invalidateQueries({ queryKey: [`/api/prayer-requests/${id}/prayers`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error recording prayer",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mark as answered mutation
  const markAsAnsweredMutation = useMutation({
    mutationFn: async ({ id, description }: { id: number; description: string }) => {
      const res = await apiRequest("POST", `/api/prayer-requests/${id}/answer`, { description });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Prayer marked as answered",
        description: "Praise God! Your testimony has been shared.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'prayer-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error marking prayer as answered",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form for creating prayer requests
  const form = useForm<PrayerRequestFormInput, undefined, PrayerRequestFormValues>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: {
      title: "",
      content: "",
      privacyLevel: "public",
      groupId: null,
      isAnonymous: false,
    } satisfies PrayerRequestFormInput,
  });
  
  // Form for marking prayer as answered
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedPrayerForAnswer, setSelectedPrayerForAnswer] = useState<number | null>(null);
  const [answerDescription, setAnswerDescription] = useState("");
  
  const handleSubmit = (values: PrayerRequestFormValues) => {
    createPrayerMutation.mutate(values);
  };
  
  const handlePrayClick = (id: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to pray for this request.",
        variant: "destructive",
      });
      return;
    }
    prayForRequestMutation.mutate(id);
  };
  
  const handleMarkAsAnswered = () => {
    if (selectedPrayerForAnswer === null) return;
    
    markAsAnsweredMutation.mutate({
      id: selectedPrayerForAnswer,
      description: answerDescription
    });
    setAnswerDialogOpen(false);
    setSelectedPrayerForAnswer(null);
    setAnswerDescription("");
  };
  
  const openAnswerDialog = (id: number) => {
    setSelectedPrayerForAnswer(id);
    setAnswerDialogOpen(true);
  };
  
  // Helper to check if user has prayed for a request
  const hasPrayed = (requestId: number) => {
    return prayedIds?.includes(requestId) || false;
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Prayer Requests</h1>
            <p className="text-muted-foreground mt-1">Support each other through prayer</p>
          </div>
          {user && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Share Prayer Request
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Requests</TabsTrigger>
            {user && <TabsTrigger value="my">My Requests</TabsTrigger>}
            {user && <TabsTrigger value="prayed">I've Prayed For</TabsTrigger>}
            <TabsTrigger value="answered">Answered Prayers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {isLoadingPrayers ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : prayerRequests && prayerRequests.length > 0 ? (
                prayerRequests.map((prayer) => (
                  <PrayerRequestCard
                    key={prayer.id}
                    prayer={prayer}
                    hasPrayed={hasPrayed(prayer.id)}
                    onPrayClick={handlePrayClick}
                    onMarkAsAnswered={prayer.authorId === user?.id ? () => openAnswerDialog(prayer.id) : undefined}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">No prayer requests yet</h3>
                    <p className="text-muted-foreground mb-4">Be the first to share a prayer request with the community.</p>
                    {user ? (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Share Prayer Request
                      </Button>
                    ) : (
                      <p>Please sign in to share a prayer request.</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="my">
            <div className="space-y-4">
              {isLoadingMyPrayers ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : myPrayerRequests && myPrayerRequests.length > 0 ? (
                myPrayerRequests.map((prayer) => (
                  <PrayerRequestCard
                    key={prayer.id}
                    prayer={prayer}
                    hasPrayed={hasPrayed(prayer.id)}
                    onPrayClick={handlePrayClick}
                    onMarkAsAnswered={!prayer.isAnswered ? () => openAnswerDialog(prayer.id) : undefined}
                    showStats
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">You haven't shared any prayer requests</h3>
                    <p className="text-muted-foreground mb-4">Share your prayer needs with the community.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Share Prayer Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="prayed">
            <div className="space-y-4">
              {isLoadingPrayed || isLoadingPrayers ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : prayerRequests && prayedIds && prayedIds.length > 0 ? (
                prayerRequests
                  .filter(prayer => prayedIds.includes(prayer.id))
                  .map((prayer) => (
                    <PrayerRequestCard
                      key={prayer.id}
                      prayer={prayer}
                      hasPrayed={true}
                      onPrayClick={handlePrayClick}
                      onMarkAsAnswered={prayer.authorId === user?.id ? () => openAnswerDialog(prayer.id) : undefined}
                    />
                  ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">You haven't prayed for any requests yet</h3>
                    <p className="text-muted-foreground mb-4">Browse the prayer requests and support others through prayer.</p>
                    <Button onClick={() => setActiveTab("all")}>
                      View All Prayer Requests
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="answered">
            <div className="space-y-4">
              {isLoadingPrayers ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-20 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : prayerRequests && prayerRequests.filter(p => p.isAnswered).length > 0 ? (
                prayerRequests
                  .filter(prayer => prayer.isAnswered)
                  .map((prayer) => (
                    <PrayerRequestCard
                      key={prayer.id}
                      prayer={prayer}
                      hasPrayed={hasPrayed(prayer.id)}
                      onPrayClick={handlePrayClick}
                      showAnsweredDescription
                    />
                  ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">No answered prayers yet</h3>
                    <p className="text-muted-foreground mb-4">When prayers are answered, they'll appear here as testimonies.</p>
                    <Button onClick={() => setActiveTab("all")}>
                      View All Prayer Requests
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Create Prayer Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Share a Prayer Request</DialogTitle>
            <DialogDescription>
              Share your prayer needs with the community. Others will be able to pray for you.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Prayer request title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief title for your prayer request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prayer Request</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Share your prayer need here..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share details about your prayer need.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="privacyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Level</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="privacy-public" />
                          <Label htmlFor="privacy-public">Public - Visible to all community members</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="friends-only" id="privacy-friends" />
                          <Label htmlFor="privacy-friends">Friends Only - Visible only to your friends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="group-only" id="privacy-group" disabled={true} />
                          <Label htmlFor="privacy-group" className="text-muted-foreground">Group Only - Visible only within a specific group (Coming soon)</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-1"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Post Anonymously</FormLabel>
                      <FormDescription>
                        Your name won't be shown with this prayer request.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPrayerMutation.isPending}>
                  {createPrayerMutation.isPending ? "Submitting..." : "Share Prayer Request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Mark as Answered Dialog */}
      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Share How God Answered Your Prayer</DialogTitle>
            <DialogDescription>
              Share your testimony of how God answered this prayer. Your testimony will encourage the community.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="answer-description">How was your prayer answered?</Label>
              <Textarea
                id="answer-description"
                placeholder="Share how God answered your prayer..."
                className="min-h-[150px]"
                value={answerDescription}
                onChange={(e) => setAnswerDescription(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Your testimony will be shared with the community.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setAnswerDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsAnswered}
              disabled={markAsAnsweredMutation.isPending || !answerDescription.trim()}
            >
              {markAsAnsweredMutation.isPending ? "Submitting..." : "Share Testimony"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

interface PrayerRequestCardProps {
  prayer: PrayerRequest;
  hasPrayed: boolean;
  onPrayClick: (id: number) => void;
  onMarkAsAnswered?: () => void;
  showStats?: boolean;
  showAnsweredDescription?: boolean;
}

function PrayerRequestCard({
  prayer,
  hasPrayed,
  onPrayClick,
  onMarkAsAnswered,
  showStats = false,
  showAnsweredDescription = false,
}: PrayerRequestCardProps) {
  const { user } = useAuth();
  
  // Get prayer count data
  const { data: prayers } = useQuery<any[]>({
    queryKey: [`/api/prayer-requests/${prayer.id}/prayers`],
    enabled: showStats,
  });
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-semibold">{prayer.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{prayer.isAnonymous ? "Anonymous" : "User " + prayer.authorId}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(prayer.createdAt)}</span>
              {prayer.privacyLevel !== "public" && (
                <>
                  <span className="mx-2">•</span>
                  <span>{prayer.privacyLevel === "friends-only" ? "Friends Only" : "Group Only"}</span>
                </>
              )}
            </div>
          </div>
          
          {prayer.isAnswered && (
            <div className="flex items-center text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
              <BadgeCheckIcon className="h-4 w-4 mr-1" />
              <span>Answered</span>
            </div>
          )}
        </div>
        
        <p className="my-4">{prayer.content}</p>
        
        {prayer.isAnswered && showAnsweredDescription && prayer.answeredDescription && (
          <div className="mb-4 mt-6 bg-green-50 p-4 rounded-md border border-green-100">
            <h4 className="font-semibold text-green-800 mb-2">How God Answered:</h4>
            <p className="text-green-900">{prayer.answeredDescription}</p>
          </div>
        )}
        
        {showStats && prayers && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">{prayer.prayerCount || 0} people have prayed for this request</p>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4">
          <Button
            variant={hasPrayed ? "outline" : "default"}
            size="sm"
            onClick={() => onPrayClick(prayer.id)}
            disabled={hasPrayed}
            className="h-9 touch-target active-scale rounded-full"
          >
            <HeartHandshakeIcon className="h-4 w-4 mr-2" />
            {hasPrayed ? "Prayed" : "Pray for This"}
          </Button>
          
          {onMarkAsAnswered && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onMarkAsAnswered}
              className="h-9 touch-target active-scale rounded-full"
            >
              <BadgeCheckIcon className="h-4 w-4 mr-2" />
              Mark as Answered
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}