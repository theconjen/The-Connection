import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import { useMediaQuery } from '../hooks/use-media-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Home, MessageCircle, Users, Calendar, BookOpen, FileHeart, Sparkles, 
  Lightbulb, Tv, Bell, Menu, Search, ChevronRight, PlusCircle, Pin, CalendarDays, Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import type { Community, Event } from '@shared/mobile-web/types';

// Types for data
interface MicroblogPost {
  id: number;
  content: string;
  createdAt: Date | string;
  userId: number;
  likes: number;
  comments: number;
  user?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface Forum {
  id: number;
  title: string;
  description: string;
  postsCount: number;
}

// Menubar component
function Menubar() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const menuItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", path: "/" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Feed", path: "/microblogs" },
    { icon: <Users className="h-5 w-5" />, label: "Communities", path: "/communities" },
    { icon: <Calendar className="h-5 w-5" />, label: "Events", path: "/events" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Bible Study", path: "/bible-study" },
    { icon: <Sparkles className="h-5 w-5" />, label: "Prayer", path: "/prayer-requests" },
    { icon: <FileHeart className="h-5 w-5" />, label: "Forums", path: "/forums" },
    { icon: <Tv className="h-5 w-5" />, label: "Live", path: "/livestreams" },
    { icon: <Lightbulb className="h-5 w-5" />, label: "Apologetics", path: "/apologetics" },
  ];

  const primaryMenuItems = menuItems.slice(0, 5); // First 5 items for main display
  const secondaryMenuItems = menuItems.slice(5); // Rest for dropdown or mobile menu

  return (
    <div className="px-3 py-2 border-b sticky top-0 bg-background z-10 shadow-sm">
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          {/* Brand logo/name */}
          <Link href="/" className="font-bold text-xl mr-6 text-primary">
            TC
          </Link>
          
          {/* Desktop menu items */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-1">
              {primaryMenuItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Button>
              ))}
              
              {/* More dropdown for desktop */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                >
                  <Menu className="h-5 w-5" />
                  <span>More</span>
                </Button>
                
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-50 py-1 border">
                    {secondaryMenuItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 w-full justify-start px-4"
                        onClick={() => {
                          navigate(item.path);
                          setShowMobileMenu(false);
                        }}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mobile menu button */}
          {isMobile && (
            <div className="md:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Right side - profile or sign in */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>
          
          {user ? (
            <Link href="/profile">
              <Avatar className="cursor-pointer h-8 w-8">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button size="sm" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile menu dropdown */}
      {isMobile && showMobileMenu && (
        <div className="md:hidden mt-2 border-t pt-2">
          <div className="flex flex-wrap gap-1">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 flex-1 min-w-[110px]"
                onClick={() => {
                  navigate(item.path);
                  setShowMobileMenu(false);
                }}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Feed component to show microblog posts
function FeedSection() {
  const { data: posts = [], isLoading } = useQuery<MicroblogPost[]>({
    queryKey: ['/api/microblogs'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold">Latest Updates</h2>
        <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3 text-xs md:text-sm" asChild>
          <Link href="/microblogs">See All</Link>
        </Button>
      </div>
      
      {posts.slice(0, 5).map(post => (
        <Card key={post.id} className="relative overflow-hidden hover:shadow-sm transition-shadow">
          <CardContent className="pt-4 pb-3 px-3 md:px-4">
            <div className="flex gap-2 md:gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={post.user?.avatarUrl || undefined} />
                <AvatarFallback>{post.user?.displayName?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
                  <span className="font-semibold text-sm md:text-base">{post.user?.displayName || "User"}</span>
                  <span className="text-xs text-muted-foreground">@{post.user?.username}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {typeof post.createdAt === 'string' 
                      ? post.createdAt 
                      : format(new Date(post.createdAt), 'MMM d')}
                  </span>
                </div>
                
                <p className="mt-1 text-sm md:text-base line-clamp-4">{post.content}</p>
                
                <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-3">
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-7 px-2">
                    💬 {post.comments || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-7 px-2">
                    ❤️ {post.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-7 px-2">
                    🔄 Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-center mt-1">
        <Button variant="outline" size="sm" className="text-xs md:text-sm h-8" asChild>
          <Link href="/microblogs">View More Posts</Link>
        </Button>
      </div>
    </div>
  );
}

// Communities section
function CommunitiesSection() {
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['/api/communities'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold">Your Communities</h2>
        <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3 text-xs md:text-sm" asChild>
          <Link href="/communities">See All</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {communities.slice(0, 3).map(community => (
          <Card key={community.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="py-3 px-3 md:px-4">
              <CardTitle className="text-base md:text-lg">{community.name}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs md:text-sm">{community.description}</CardDescription>
            </CardHeader>
            <CardFooter className="py-2 px-3 md:px-4 flex justify-between border-t">
              <div className="text-xs md:text-sm text-muted-foreground flex items-center">
                <Users className="h-3.5 w-3.5 mr-1" />
                {community.memberCount || 0} members
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs md:text-sm px-2 md:px-3" asChild>
                <Link href={`/c/${community.slug}`}>Visit</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" size="sm" className="mt-1 text-xs md:text-sm h-8" asChild>
          <Link href="/communities">
            <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
            Explore More Communities
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Events section
function EventsSection() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events/public'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-5">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Get upcoming events only
  const upcomingEvents = events
    .filter(event => new Date(event.eventDate) >= new Date())
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold">Upcoming Events</h2>
        <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3 text-xs md:text-sm" asChild>
          <Link href="/events">See All</Link>
        </Button>
      </div>
      
      <div className="space-y-2">
        {upcomingEvents.slice(0, 3).map(event => (
          <Card key={event.id} className="overflow-hidden hover:shadow-sm transition-shadow">
            <CardHeader className="py-3 px-3 md:px-4">
              <CardTitle className="text-base md:text-lg">{event.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs md:text-sm">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(event.eventDate), 'EEE, MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 pt-0 px-3 md:px-4">
              <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex items-start gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                
                {event.location && (
                  <div className="flex items-start gap-1.5">
                    <Pin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                
                {event.isVirtual && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-xs">
                    Virtual
                  </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="py-2 px-3 md:px-4 border-t">
              <Button variant="outline" size="sm" className="w-full h-7 text-xs md:text-sm" asChild>
                <Link href={`/events/${event.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" size="sm" className="w-full mt-1 text-xs md:text-sm h-8" asChild>
          <Link href="/events">View All Events</Link>
        </Button>
      </div>
    </div>
  );
}

// Forums section
function ForumsSection() {
  const { data: forums = [], isLoading } = useQuery<Forum[]>({
    queryKey: ['/api/forums'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-5">
        <div className="animate-spin h-6 w-6 border-3 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold">Active Forums</h2>
        <Button variant="ghost" size="sm" className="h-8 px-2 md:px-3 text-xs md:text-sm" asChild>
          <Link href="/c">See All</Link>
        </Button>
      </div>
      
      <div className="space-y-2">
        {forums.slice(0, 3).map(forum => (
          <Card key={forum.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="py-3 px-3 md:px-4">
              <CardTitle className="text-base md:text-lg">{forum.title}</CardTitle>
              <CardDescription className="line-clamp-2 text-xs md:text-sm">{forum.description}</CardDescription>
            </CardHeader>
            <CardFooter className="py-2 px-3 md:px-4 flex justify-between border-t">
              <div className="text-xs md:text-sm text-muted-foreground flex items-center">
                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                {forum.postsCount || 0} posts
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs md:text-sm px-2 md:px-3" asChild>
                <Link href={`/c/${forum.id}`}>View</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        <Button variant="outline" size="sm" className="w-full mt-1 text-xs md:text-sm h-8" asChild>
          <Link href="/c">Browse All Forums</Link>
        </Button>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function IntegratedDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Define greetings based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-3 py-4 md:py-6">
        {/* Greeting Section */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">
            {getGreeting()}, {user ? (user.displayName || user.username) : 'Friend'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome to The Connection. Your Christian community platform.
          </p>
        </div>
        
        {/* Create Post / Search Section - Only for logged in users */}
        {user ? (
          <div className="mb-4 md:mb-6">
            <Card className="shadow-sm">
              <CardContent className="py-3 px-3 md:px-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={user?.avatarUrl || undefined} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <Input 
                    placeholder="Share what's on your mind..." 
                    className="flex-1 text-sm h-9"
                    onClick={() => navigate('/submit')}
                    readOnly
                  />
                  <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => navigate('/submit')}>Post</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mb-4 md:mb-6">
            <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 shadow-sm">
              <CardContent className="py-4 md:py-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                  <div className="text-center md:text-left mb-3 md:mb-0">
                    <h3 className="text-lg md:text-xl font-semibold mb-1">Join The Connection</h3>
                    <p className="text-sm text-muted-foreground">Sign up to post, connect with other believers, and access all features.</p>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <Button className="flex-1 md:flex-none" size="sm" asChild>
                      <Link href="/auth">Sign Up</Link>
                    </Button>
                    <Button className="flex-1 md:flex-none" size="sm" variant="outline" asChild>
                      <Link href="/auth">Log In</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Responsive layout for all screen sizes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Main Feed Column - Takes more space on larger screens */}
          <div className="md:col-span-1 lg:col-span-2">
            <FeedSection />
          </div>
          
          {/* Communities Column */}
          <div className="md:col-span-1 lg:col-span-1">
            <CommunitiesSection />
          </div>
          
          {/* Events/Forums Column */}
          <div className="md:col-span-2 lg:col-span-1">
            <Tabs defaultValue="events">
              <TabsList className="w-full">
                <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                <TabsTrigger value="forums" className="flex-1">Forums</TabsTrigger>
              </TabsList>
              <TabsContent value="events" className="mt-3">
                <EventsSection />
              </TabsContent>
              <TabsContent value="forums" className="mt-3">
                <ForumsSection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}