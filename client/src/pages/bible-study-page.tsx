import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Book, Search, Clock, Check, Plus, 
  BookOpen, FileText, Bookmark, Heart, 
  Calendar, ArrowRight, BarChart 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDateForDisplay } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import MobileBibleReadingCard from "@/components/mobile-bible-reading-card";

interface ReadingType {
  day: number;
  passages: string[];
  title?: string;
}

interface BibleReadingPlan {
  id: number;
  title: string;
  description: string;
  duration: number;
  readings: ReadingType[];
  creatorId: number | null;
  groupId: number | null;
  isPublic: boolean | null;
  createdAt: Date | null;
}

interface BibleReadingProgress {
  id: number;
  planId: number;
  userId: number;
  currentDay: number;
  completedDays: number[];
  startedAt: Date | null;
  completedAt: Date | null;
}

interface BibleStudyNote {
  id: number;
  userId: number;
  groupId: number | null;
  title: string;
  content: string;
  passage: string | null;
  isPublic: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

const BibleStudyPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reading-plans");
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Fetch public reading plans
  const { data: publicReadingPlansData, isLoading: plansLoading } = useQuery<BibleReadingPlan[]>({
    queryKey: ["/api/bible-reading-plans"],
    queryFn: () => fetch("/api/bible-reading-plans").then(res => res.json()),
    enabled: activeTab === "reading-plans",
  });
  
  // Ensure we have an array, even if the API returns something else
  const publicReadingPlans = Array.isArray(publicReadingPlansData) ? publicReadingPlansData.map(plan => ({
    ...plan,
    readings: typeof plan.readings === 'string' ? JSON.parse(plan.readings) : plan.readings
  })) : [];

  // Fetch user's reading progress
  const { data: userProgressData, isLoading: progressLoading } = useQuery<BibleReadingProgress[]>({
    queryKey: ["/api/bible-reading-progress", user?.id],
    queryFn: () => fetch("/api/bible-reading-progress").then(res => res.json()),
    enabled: !!user && activeTab === "reading-plans",
  });
  
  // Ensure we have an array, even if the API returns something else
  const userProgress = Array.isArray(userProgressData) ? userProgressData.map(progress => ({
    ...progress,
    completedDays: typeof progress.completedDays === 'string' ? 
      JSON.parse(progress.completedDays) : 
      (Array.isArray(progress.completedDays) ? progress.completedDays : [])
  })) : [];
  
  // Fetch user's notes
  const { data: userNotesData, isLoading: notesLoading } = useQuery<BibleStudyNote[]>({
    queryKey: ["/api/bible-study-notes"],
    queryFn: () => fetch("/api/bible-study-notes").then(res => res.json()),
    enabled: !!user && activeTab === "notes",
  });
  
  const userNotes = Array.isArray(userNotesData) ? userNotesData : [];
  
  const handleJoinPlan = async (planId: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join a reading plan",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/bible-reading-progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to join reading plan");
      }
      
      toast({
        title: "Success!",
        description: "You've joined the reading plan",
      });
      
      // Refetch the progress data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const handleMarkAsCompleted = async (planId: number, day: number) => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/bible-reading-progress/mark-completed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId, day }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark reading as completed");
      }
      
      toast({
        title: "Great job!",
        description: "Reading marked as completed",
      });
      
      // Refetch the progress data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const renderReadingPlansContent = () => {
    if (plansLoading) {
      return <div className="text-center py-8">Loading reading plans...</div>;
    }
    
    if (isMobile) {
      // Mobile view
      return (
        <div>
          <div className="mb-4 mt-1">
            <h2 className="text-xl font-semibold mb-1">Your Reading Plans</h2>
            {user ? (
              userProgress && userProgress.length > 0 ? (
                <div>
                  {userProgress.map(progress => {
                    const plan = publicReadingPlans.find(p => p.id === progress.planId);
                    if (!plan) return null;
                    
                    return (
                      <MobileBibleReadingCard
                        key={progress.planId}
                        plan={plan}
                        progress={progress}
                        isAuthenticated={!!user}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8 border rounded-lg mb-4">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>You haven't joined any reading plans yet.</p>
                  <p className="text-sm">Browse available plans below.</p>
                </div>
              )
            ) : (
              <div className="text-muted-foreground text-center py-8 border rounded-lg mb-4">
                <p>Sign in to track your Bible reading progress</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-3">Available Reading Plans</h2>
            <div>
              {publicReadingPlans.map(plan => {
                const progress = userProgress?.find(p => p.planId === plan.id);
                return (
                  <MobileBibleReadingCard
                    key={plan.id}
                    plan={plan}
                    progress={progress}
                    isAuthenticated={!!user}
                  />
                );
              })}
            </div>
          </div>
        </div>
      );
    }
    
    // Desktop view
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Reading Plans</h2>
          {user ? (
            userProgress && userProgress.length > 0 ? (
              <div className="space-y-6">
                {userProgress.map(progress => {
                  const plan = publicReadingPlans.find(p => p.id === progress.planId);
                  if (!plan) return null;
                  
                  const completedPercent = Math.floor((progress.completedDays.length / plan.duration) * 100);
                  const todaysReading = plan.readings.find(r => r.day === progress.currentDay);
                  
                  return (
                    <Card key={progress.planId}>
                      <CardHeader>
                        <CardTitle>{plan.title}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-muted-foreground">{completedPercent}%</span>
                          </div>
                          <Progress value={completedPercent} className="h-2" />
                        </div>
                        
                        {todaysReading && !progress.completedAt && (
                          <div className="mt-4 p-4 border rounded-lg bg-secondary/5">
                            <h4 className="font-medium flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Today's Reading (Day {progress.currentDay})
                            </h4>
                            <p className="my-2 text-sm">
                              {todaysReading.passages.join(', ')}
                            </p>
                            <Button 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleMarkAsCompleted(plan.id, progress.currentDay)}
                            >
                              <Check className="mr-2 h-4 w-4" /> Mark as Completed
                            </Button>
                          </div>
                        )}
                        
                        {progress.completedAt && (
                          <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                            <h4 className="font-medium flex items-center">
                              <Check className="h-4 w-4 mr-2" />
                              Plan Completed!
                            </h4>
                            <p className="text-sm mt-2">
                              Completed on {formatDateForDisplay(new Date(progress.completedAt))}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Reading Plans Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't joined any reading plans yet. Explore the available plans and start your Bible reading journey today.
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <h3 className="text-lg font-medium mb-2">Sign In to Track Progress</h3>
                <p className="text-muted-foreground">
                  Sign in to join reading plans and track your progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Reading Plans</h2>
          <div className="space-y-6">
            {publicReadingPlans.map(plan => {
              const isJoined = userProgress?.some(p => p.planId === plan.id);
              
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.title}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{plan.duration} days</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{plan.readings.length} readings</span>
                      </div>
                    </div>
                    
                    {user && !isJoined && (
                      <Button onClick={() => handleJoinPlan(plan.id)}>
                        Join Plan
                      </Button>
                    )}
                    
                    {isJoined && (
                      <div className="bg-secondary/10 text-secondary-foreground py-2 px-4 rounded-md text-sm">
                        You've already joined this plan
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  const renderNotesContent = () => {
    if (notesLoading) {
      return <div className="text-center py-8">Loading notes...</div>;
    }
    
    if (!user) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-medium mb-2">Sign In to Create Notes</h3>
            <p className="text-muted-foreground">
              Sign in to create and save your Bible study notes.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Study Notes</h2>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Button>
        </div>
        
        {userNotes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Notes Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any study notes yet. Start adding notes to deepen your understanding.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userNotes.map(note => (
              <Card key={note.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{note.title}</CardTitle>
                  {note.passage && (
                    <CardDescription>{note.passage}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3">{note.content}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{formatDateForDisplay(new Date(note.createdAt || new Date()))}</span>
                    {note.isPublic ? (
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" /> Public
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Bookmark className="h-3 w-3 mr-1" /> Private
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderVersesContent = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Verse Memorization</h2>
          {user && (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Verse
            </Button>
          )}
        </div>
        
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <BarChart className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Verse Memorization Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              This feature is under development. Soon you'll be able to add verses to memorize and track your progress.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="container py-6">
      <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold flex items-center`}>
          <Book className={`${isMobile ? 'mr-2 h-5 w-5' : 'mr-3 h-6 w-6'}`} /> Bible Study
        </h1>
        {!isMobile && (
          <p className="text-muted-foreground mt-1">
            Read, study and memorize Scripture with tools designed to deepen your understanding
          </p>
        )}
      </div>
      
      <Tabs defaultValue="reading-plans" onValueChange={setActiveTab}>
        <TabsList className={`mb-6 ${isMobile ? 'grid grid-cols-3 w-full' : ''}`}>
          <TabsTrigger value="reading-plans" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>Reading Plans</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger value="verses" className="flex items-center">
            <Bookmark className="h-4 w-4 mr-2" />
            <span>Memorize</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reading-plans">
          {renderReadingPlansContent()}
        </TabsContent>
        
        <TabsContent value="notes">
          {renderNotesContent()}
        </TabsContent>
        
        <TabsContent value="verses">
          {renderVersesContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BibleStudyPage;