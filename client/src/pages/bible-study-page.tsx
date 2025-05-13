import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layouts/main-layout";
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

interface BibleReadingPlan {
  id: number;
  title: string;
  description: string;
  duration: number;
  readings: any;
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

interface VerseMemorization {
  id: number;
  userId: number;
  verse: string;
  reference: string;
  startDate: Date | null;
  masteredDate: Date | null;
  reviewDates: Date[];
  reminderFrequency: number | null;
}

const BibleStudyPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("reading-plans");

  // Fetch public reading plans
  const { data: publicReadingPlans = [], isLoading: plansLoading } = useQuery<BibleReadingPlan[]>({
    queryKey: ["/api/bible/reading-plans/public"],
    enabled: activeTab === "reading-plans",
  });

  // Fetch user's reading progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery<BibleReadingProgress[]>({
    queryKey: ["/api/bible/reading-progress", user?.id],
    enabled: !!user && activeTab === "reading-plans",
  });

  // Fetch user's study notes
  const { data: studyNotes = [], isLoading: notesLoading } = useQuery<BibleStudyNote[]>({
    queryKey: ["/api/bible/study-notes", user?.id],
    enabled: !!user && activeTab === "study-notes",
  });

  // Fetch user's verse memorization
  const { data: memorizationVerses = [], isLoading: versesLoading } = useQuery<VerseMemorization[]>({
    queryKey: ["/api/bible/memorization", user?.id],
    enabled: !!user && activeTab === "memorization",
  });

  // Helper function to get progress for a plan
  const getProgressForPlan = (planId: number) => {
    return userProgress.find(progress => progress.planId === planId);
  };

  // Calculate progress percentage
  const calculateProgress = (progress: BibleReadingProgress | undefined, planDuration: number) => {
    if (!progress) return 0;
    return Math.round((progress.completedDays.length / planDuration) * 100);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            Bible Study Tools
          </h1>
          <p className="text-muted-foreground">
            Resources and tools to deepen your Bible study experience.
          </p>
        </header>

        <Tabs defaultValue="reading-plans" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="reading-plans" className="flex items-center">
              <Book className="mr-2 h-4 w-4" />
              <span>Reading Plans</span>
            </TabsTrigger>
            <TabsTrigger value="study-notes" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>Study Notes</span>
            </TabsTrigger>
            <TabsTrigger value="memorization" className="flex items-center">
              <Bookmark className="mr-2 h-4 w-4" />
              <span>Verse Memorization</span>
            </TabsTrigger>
          </TabsList>

          {/* Reading Plans Tab */}
          <TabsContent value="reading-plans" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Bible Reading Plans</h2>
              {user && (
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Reading Plan
                </Button>
              )}
            </div>

            {plansLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="bg-muted/30 h-32"></CardHeader>
                    <CardContent className="pt-6">
                      <div className="h-4 bg-muted rounded mb-3 w-3/4"></div>
                      <div className="h-3 bg-muted rounded mb-6 w-1/2"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {user && userProgress.length > 0 && (
                  <div className="mb-10">
                    <h3 className="text-xl font-medium mb-4">Your Active Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProgress.map(progress => {
                        const plan = publicReadingPlans.find(p => p.id === progress.planId);
                        if (!plan) return null;
                        const progressPercent = calculateProgress(progress, plan.duration);
                        
                        return (
                          <Card key={progress.id} className="overflow-hidden">
                            <CardHeader className="bg-primary/10 pb-3">
                              <CardTitle className="text-lg font-semibold">{plan.title}</CardTitle>
                              <CardDescription>
                                Day {progress.currentDay} of {plan.duration}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <div className="mb-3">
                                <Progress value={progressPercent} className="h-2" />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {progressPercent}% complete
                                </p>
                              </div>
                              <p className="text-sm mb-4 text-foreground/80">
                                {plan.description.substring(0, 120)}
                                {plan.description.length > 120 ? '...' : ''}
                              </p>
                              <Button className="w-full mt-2">
                                Continue Reading <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-medium mb-4">Public Reading Plans</h3>
                  {publicReadingPlans.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No reading plans available yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create the first Bible reading plan for the community!
                        </p>
                        {user && (
                          <Button className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Reading Plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {publicReadingPlans.map(plan => {
                        const progress = getProgressForPlan(plan.id);
                        const isJoined = !!progress;
                        const progressPercent = calculateProgress(progress, plan.duration);
                        
                        return (
                          <Card key={plan.id} className="overflow-hidden">
                            <CardHeader className="bg-secondary/10 pb-3">
                              <CardTitle className="text-lg font-semibold">{plan.title}</CardTitle>
                              <CardDescription>
                                {plan.duration} days • {formatDateForDisplay(plan.createdAt)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {isJoined && (
                                <div className="mb-3">
                                  <Progress value={progressPercent} className="h-2" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {progressPercent}% complete
                                  </p>
                                </div>
                              )}
                              <p className="text-sm mb-4 text-foreground/80">
                                {plan.description.substring(0, 120)}
                                {plan.description.length > 120 ? '...' : ''}
                              </p>
                              <Button 
                                variant={isJoined ? "outline" : "default"}
                                className={`w-full mt-2 ${isJoined ? '' : 'bg-primary hover:bg-primary/90'}`}
                              >
                                {isJoined ? (
                                  <>Continue Reading <ArrowRight className="ml-2 h-4 w-4" /></>
                                ) : (
                                  <>Join This Plan <Plus className="ml-2 h-4 w-4" /></>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Study Notes Tab */}
          <TabsContent value="study-notes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Bible Study Notes</h2>
              {user && (
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Note
                </Button>
              )}
            </div>

            {notesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded mb-2 w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {studyNotes.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No study notes yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first Bible study note to capture your reflections and insights.
                      </p>
                      {user && (
                        <Button className="bg-primary hover:bg-primary/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Note
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {studyNotes.map(note => (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-semibold">{note.title}</CardTitle>
                            <div className="text-xs text-muted-foreground">
                              {formatDateForDisplay(note.createdAt)}
                            </div>
                          </div>
                          {note.passage && (
                            <CardDescription className="text-primary font-medium">
                              {note.passage}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-foreground/80">
                            {note.content.substring(0, 300)}
                            {note.content.length > 300 ? '...' : ''}
                          </p>
                          <div className="flex justify-end mt-4">
                            <Button variant="outline" size="sm">
                              View Full Note
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Verse Memorization Tab */}
          <TabsContent value="memorization" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Verse Memorization</h2>
              {user && (
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Verse to Memorize
                </Button>
              )}
            </div>

            {versesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded mb-2 w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-8 bg-muted rounded mt-4 w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {memorizationVerses.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-8">
                      <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No verses to memorize yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first verse to begin your memorization journey.
                      </p>
                      {user && (
                        <Button className="bg-primary hover:bg-primary/90">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Verse to Memorize
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {memorizationVerses.map(verse => {
                      const isMastered = !!verse.masteredDate;
                      const daysSinceStart = verse.startDate 
                        ? Math.floor((new Date().getTime() - new Date(verse.startDate).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      
                      return (
                        <Card key={verse.id} className={`${isMastered ? 'border-primary/30 bg-primary/5' : ''}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold flex items-center">
                              <span>{verse.reference}</span>
                              {isMastered && (
                                <span className="ml-2 bg-primary/20 text-primary text-xs px-2 py-1 rounded-full flex items-center">
                                  <Check className="h-3 w-3 mr-1" /> Mastered
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-4 text-foreground/80">
                              "{verse.verse}"
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {daysSinceStart} days since start
                              </span>
                              <Button 
                                variant={isMastered ? "outline" : "default"}
                                size="sm"
                                className={isMastered ? "" : "bg-primary hover:bg-primary/90"}
                              >
                                {isMastered ? "Review" : "Practice Now"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default BibleStudyPage;