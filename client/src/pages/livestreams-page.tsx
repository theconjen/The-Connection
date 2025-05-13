import { useState } from "react";
import MainLayout from "@/components/layouts/main-layout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Play, Users, Calendar, Clock, Heart, MessageSquare, Share2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Type for livestream data
type Livestream = {
  id: number;
  title: string;
  host: string;
  hostUsername: string;
  hostAvatar?: string;
  thumbnail: string;
  status: "live" | "upcoming" | "ended";
  viewerCount: number;
  scheduledFor?: string;
  duration?: string;
  description: string;
  tags: string[];
};

export default function LivestreamsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock data for livestreams (in a real app, this would come from an API)
  const livestreams: Livestream[] = [
    {
      id: 1,
      title: "Daily Prayer & Devotional",
      host: "Sarah Johnson",
      hostUsername: "sarah_j",
      thumbnail: "https://images.unsplash.com/photo-1507692049790-de58290a4334?q=80&w=1470&auto=format&fit=crop",
      status: "live",
      viewerCount: 245,
      description: "Join us for daily prayer, scripture reading, and devotional time. Open to everyone!",
      tags: ["prayer", "devotional", "daily"]
    },
    {
      id: 2,
      title: "Bible Study: Book of Romans",
      host: "Pastor Mike",
      hostUsername: "pastor_mike",
      thumbnail: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1470&auto=format&fit=crop",
      status: "upcoming",
      scheduledFor: "May 14, 2025 7:00 PM",
      viewerCount: 0,
      duration: "1 hour",
      description: "A deep dive into the Book of Romans. We'll be exploring chapters 5-8 this week.",
      tags: ["bible-study", "romans", "theology"]
    },
    {
      id: 3,
      title: "Worship & Music Session",
      host: "Faith Worship Team",
      hostUsername: "faith_worship",
      thumbnail: "https://images.unsplash.com/photo-1516669383553-5546c15af553?q=80&w=1470&auto=format&fit=crop",
      status: "live",
      viewerCount: 189,
      description: "Join our worship team for a session of praise and worship music. Feel free to participate!",
      tags: ["worship", "music", "praise"]
    },
    {
      id: 4,
      title: "Q&A: Faith & College Life",
      host: "Emma & Team",
      hostUsername: "emma_faith",
      thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop",
      status: "upcoming",
      scheduledFor: "May 15, 2025 5:30 PM",
      viewerCount: 0,
      duration: "1.5 hours",
      description: "Got questions about balancing your faith and college life? Join our panel of students for a candid discussion.",
      tags: ["college", "qa", "youth"]
    },
    {
      id: 5,
      title: "Christian Creativity Workshop",
      host: "Jessica Art",
      hostUsername: "jessica_art",
      thumbnail: "https://images.unsplash.com/photo-1560421683-6856ea585c78?q=80&w=1374&auto=format&fit=crop",
      status: "ended",
      viewerCount: 132,
      description: "A workshop on expressing your faith through various art forms. Watch the replay!",
      tags: ["creativity", "art", "expression"]
    },
    {
      id: 6,
      title: "Women's Prayer Circle",
      host: "Grace Community",
      hostUsername: "grace_comm",
      thumbnail: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1032&auto=format&fit=crop",
      status: "upcoming",
      scheduledFor: "May 16, 2025 6:00 PM",
      viewerCount: 0,
      duration: "45 minutes",
      description: "A safe space for women to gather in prayer and support one another in faith.",
      tags: ["women", "prayer", "community"]
    }
  ];

  // Function to filter livestreams based on search term and tab
  const filterLivestreams = (streams: Livestream[], term: string, status?: "live" | "upcoming" | "ended") => {
    return streams.filter(stream => 
      (stream.title.toLowerCase().includes(term.toLowerCase()) || 
       stream.host.toLowerCase().includes(term.toLowerCase()) ||
       stream.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))) && 
      (!status || stream.status === status)
    );
  };

  // Get filtered lists for each tab
  const liveLivestreams = filterLivestreams(livestreams, searchTerm, "live");
  const upcomingLivestreams = filterLivestreams(livestreams, searchTerm, "upcoming");
  const pastLivestreams = filterLivestreams(livestreams, searchTerm, "ended");
  const allLivestreams = filterLivestreams(livestreams, searchTerm);

  const handleJoinStream = (stream: Livestream) => {
    if (stream.status === "live") {
      toast({
        title: "Joining Livestream",
        description: `You're joining "${stream.title}" hosted by ${stream.host}`,
      });
    } else if (stream.status === "upcoming") {
      toast({
        title: "Reminder Set",
        description: `We'll remind you before "${stream.title}" starts`,
      });
    } else {
      toast({
        title: "Watching Replay",
        description: `Now playing "${stream.title}"`,
      });
    }
  };

  // Function to render status badge
  const renderStatusBadge = (status: "live" | "upcoming" | "ended") => {
    if (status === "live") {
      return <Badge className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-1 px-2">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span> LIVE
      </Badge>;
    } else if (status === "upcoming") {
      return <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground flex items-center gap-1">
        <Calendar className="h-3 w-3 mr-1" /> Upcoming
      </Badge>;
    } else {
      return <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
        Replay Available
      </Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-6">
        {/* Hero Banner */}
        <Card className="overflow-hidden border-secondary/20">
          <div className="relative h-56 md:h-64">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-secondary/60 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=1374&auto=format&fit=crop" 
              alt="Livestreams" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-6">
              <div className="max-w-2xl">
                <Badge className="bg-white/20 text-white backdrop-blur-sm">
                  New Feature
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-3">
                  Live Streams & Events
                </h1>
                <p className="text-white/90 text-lg mb-6 max-w-xl">
                  Connect with the community through live prayer sessions, 
                  Bible studies, and more. Join a stream or host your own!
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-white text-primary hover:bg-white/90 font-medium">
                    <Play className="mr-2 h-4 w-4" />
                    Browse Livestreams
                  </Button>
                  {user && (
                    <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                      Start Your Own Stream
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search livestreams, hosts, or topics..."
            className="pl-10 border-secondary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Livestream Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 bg-muted/50 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              All
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
              Live Now
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-background data-[state=active]:text-primary">
              Past Streams
            </TabsTrigger>
          </TabsList>
          
          {/* All Livestreams */}
          <TabsContent value="all" className="space-y-6">
            {allLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allLivestreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id}
                    stream={stream}
                    onJoin={() => handleJoinStream(stream)}
                    renderStatusBadge={renderStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-secondary/40">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No livestreams found</h3>
                  <p className="text-muted-foreground max-w-md">
                    We couldn't find any livestreams matching your search criteria.
                    Try adjusting your search term or check back later.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Live Now */}
          <TabsContent value="live" className="space-y-6">
            {liveLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveLivestreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id}
                    stream={stream}
                    onJoin={() => handleJoinStream(stream)}
                    renderStatusBadge={renderStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-secondary/40">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No live streams right now</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no livestreams happening at the moment.
                    Check the upcoming tab to see what's scheduled or browse past streams.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Upcoming */}
          <TabsContent value="upcoming" className="space-y-6">
            {upcomingLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingLivestreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id}
                    stream={stream}
                    onJoin={() => handleJoinStream(stream)}
                    renderStatusBadge={renderStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-secondary/40">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No upcoming streams</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no scheduled livestreams coming up.
                    Check back later for new announcements.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Past */}
          <TabsContent value="past" className="space-y-6">
            {pastLivestreams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastLivestreams.map((stream) => (
                  <LivestreamCard 
                    key={stream.id}
                    stream={stream}
                    onJoin={() => handleJoinStream(stream)}
                    renderStatusBadge={renderStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-secondary/40">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No past streams</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no past livestreams available to watch.
                    Check the upcoming tab to see what's scheduled.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
        {user && (
          <Card className="border-secondary/20 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Become a Livestreamer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Share your knowledge, host Bible studies, or lead prayer sessions as an approved livestreamer.
              </p>
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => window.location.href = "/livestreamer-application"}
              >
                Apply Now
              </Button>
            </CardContent>
          </Card>
        )}
        
        <Card className="border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Featured Hosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1374&auto=format&fit=crop" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">Sarah Johnson</h4>
                <p className="text-xs text-muted-foreground">Daily devotionals & prayer</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto rounded-full">
                Follow
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-primary/20 text-primary">PM</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">Pastor Mike</h4>
                <p className="text-xs text-muted-foreground">Bible studies & sermons</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto rounded-full">
                Follow
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?q=80&w=1374&auto=format&fit=crop" />
                <AvatarFallback>FW</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">Faith Worship</h4>
                <p className="text-xs text-muted-foreground">Music & worship</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto rounded-full">
                Follow
              </Button>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" className="w-full text-primary">
              View All Hosts
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #prayer
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #biblestudy
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #worship
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #youth
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #women
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #college
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #faith
              </Badge>
              <Badge variant="secondary" className="bg-secondary/20 hover:bg-secondary/30">
                #community
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {user && (
          <Card className="border-secondary/20 bg-gradient-to-b from-primary/5 to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Start Your Own Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Share your faith journey with others. It's easy to start a livestream and connect with the community.
              </p>
              <Button className="w-full">
                Create Livestream
              </Button>
            </CardContent>
          </Card>
        )}
      </aside>
    </MainLayout>
  );
}

// Livestream Card Component
interface LivestreamCardProps {
  stream: Livestream;
  onJoin: () => void;
  renderStatusBadge: (status: "live" | "upcoming" | "ended") => React.ReactNode;
}

function LivestreamCard({ stream, onJoin, renderStatusBadge }: LivestreamCardProps) {
  return (
    <Card className="overflow-hidden card-hover border-secondary/20">
      <div className="relative">
        <img 
          src={stream.thumbnail} 
          alt={stream.title} 
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 right-2">
          {renderStatusBadge(stream.status)}
        </div>
        
        {stream.status === "live" && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {stream.viewerCount} watching
          </div>
        )}
        
        {stream.status === "upcoming" && stream.scheduledFor && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {stream.scheduledFor}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              {stream.hostAvatar ? (
                <AvatarImage src={stream.hostAvatar} alt={stream.host} />
              ) : (
                <AvatarFallback>{stream.host.substring(0, 2)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h4 className="text-sm font-medium">{stream.host}</h4>
              <p className="text-xs text-muted-foreground">@{stream.hostUsername}</p>
            </div>
          </div>
          
          {stream.duration && (
            <Badge variant="outline" className="text-xs font-normal">
              <Clock className="h-3 w-3 mr-1" />
              {stream.duration}
            </Badge>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mt-3 mb-1">{stream.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {stream.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {stream.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-secondary/20 hover:bg-secondary/30">
              #{tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button 
          variant={stream.status === "live" ? "default" : stream.status === "upcoming" ? "outline" : "secondary"}
          onClick={onJoin}
          className={stream.status === "live" ? "gap-1" : ""}
        >
          {stream.status === "live" ? (
            <>
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Join Now
            </>
          ) : stream.status === "upcoming" ? (
            "Set Reminder"
          ) : (
            "Watch Replay"
          )}
        </Button>
        
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Heart className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}