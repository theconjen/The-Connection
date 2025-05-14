import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, BookOpen, CheckCircle, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatDateForDisplay } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

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

interface MobileBibleReadingCardProps {
  plan: BibleReadingPlan;
  progress?: BibleReadingProgress;
  isAuthenticated: boolean;
}

export default function MobileBibleReadingCard({ 
  plan, 
  progress, 
  isAuthenticated 
}: MobileBibleReadingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const joinPlanMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('POST', '/api/bible-reading-progress', {
        planId: plan.id,
      });
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bible-reading-progress'] });
      toast({
        title: "Success",
        description: "You've joined this reading plan. Start reading today!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to join plan: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const markAsCompletedMutation = useMutation({
    mutationFn: async (day: number) => {
      const result = await apiRequest('POST', '/api/bible-reading-progress/mark-completed', {
        planId: plan.id,
        day,
      });
      return await result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bible-reading-progress'] });
      toast({
        title: "Well done!",
        description: "You've completed today's reading",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to mark as complete: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const currentDay = progress?.currentDay || 0;
  const completedDays = progress?.completedDays || [];
  const progressPercent = plan.duration > 0 ? Math.floor(completedDays.length / plan.duration * 100) : 0;
  const isJoined = !!progress;
  const isCurrent = progress && !progress.completedAt;
  
  // For today's reading
  const todayReading = plan.readings.find(r => r.day === currentDay);
  
  return (
    <>
      <Card 
        className="mb-4 touch-manipulation border rounded-xl" 
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold line-clamp-1">{plan.title}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                <span>{plan.duration} days</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                <BookOpen className="h-3.5 w-3.5 mr-1.5 inline" />
                <span>{plan.readings.length} readings</span>
              </div>
            </div>
            
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {isJoined && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span>Progress</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
              
              {isCurrent && todayReading && (
                <div className="mt-3 pt-3 border-t border-dashed border-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Today's reading:</span>
                    <span className="text-xs text-muted-foreground">Day {currentDay}</span>
                  </div>
                  <p className="text-xs mt-1 line-clamp-1">
                    {todayReading.passages.join(', ')}
                  </p>
                  
                  <div className="flex justify-end mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-full px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsCompletedMutation.mutate(currentDay);
                      }}
                      disabled={markAsCompletedMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as read
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[80vh] pt-6 rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-xl">{plan.title}</SheetTitle>
            <SheetDescription className="line-clamp-3">
              {plan.description}
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span>{plan.duration} days</span>
              </div>
              <div className="flex items-center text-sm mt-1">
                <BookOpen className="h-4 w-4 mr-1.5" />
                <span>{plan.readings.length} readings</span>
              </div>
            </div>
            
            {!isJoined && isAuthenticated && (
              <Button
                onClick={() => joinPlanMutation.mutate()}
                disabled={joinPlanMutation.isPending}
                size="sm"
                className="rounded-full"
              >
                Join Plan
              </Button>
            )}
          </div>
          
          {isJoined && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span>Your progress</span>
                <span>{completedDays.length} of {plan.duration} days</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              
              <div className="mt-6">
                <h4 className="text-base font-medium mb-3">Reading Schedule</h4>
                <div className="max-h-[40vh] overflow-y-auto pr-2">
                  {plan.readings.map((reading, index) => {
                    const isCompleted = completedDays.includes(reading.day);
                    const isToday = reading.day === currentDay;
                    
                    return (
                      <div 
                        key={index} 
                        className={`py-2 px-3 mb-2 rounded-lg border flex items-center gap-2
                          ${isCompleted ? 'bg-secondary/10 border-secondary/20' : 'border-border'}
                          ${isToday ? 'border-primary/50' : ''}
                        `}
                      >
                        <Checkbox 
                          checked={isCompleted}
                          onCheckedChange={() => {
                            if (!isCompleted && isAuthenticated) {
                              markAsCompletedMutation.mutate(reading.day);
                            }
                          }}
                          disabled={!isAuthenticated || markAsCompletedMutation.isPending}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-sm">
                              {reading.title || `Day ${reading.day}`}
                            </span>
                            {isToday && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {reading.passages.join(', ')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}