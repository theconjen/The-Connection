import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Menu, ArrowLeft, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SidebarNavigation from "@/components/sidebar-navigation";
import { cn } from "@/lib/utils";

/**
 * Mobile-optimized header component with:
 * - Collapsible search bar
 * - Context-aware back button
 * - Simplified navigation
 */
export default function MobileHeader() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Get the current page title based on route
  const getPageTitle = () => {
    const pathSegments = location.split('/').filter(Boolean);
    
    // Default title is "Home"
    if (pathSegments.length === 0) return "Home";
    
    // Map routes to titles
    const routeTitles: Record<string, string> = {
      'microblogs': 'Feed',
      'discover': 'Discover',
      'livestreams': 'Livestreams',
      'events': 'Events',
      'apologetics': 'Apologetics',
      'prayer-requests': 'Prayer Requests',
      'bible-study': 'Bible Study',
      'profile': 'Profile',
      'community': 'Community',
      'groups': 'My Groups',
      'submit': 'Create Post'
    };
    
    return routeTitles[pathSegments[0]] || pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
  };
  
  // Determine if back button should be shown
  const shouldShowBackButton = () => {
    // Show back button on detail pages and non-root pages
    return location !== '/' && 
           location !== '/microblogs' && 
           location !== '/discover' &&
           location !== '/livestreams' &&
           location !== '/profile';
  };
  
  // Handle scroll events for header appearance
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header 
      className={cn(
        "md:hidden bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300",
        hasScrolled 
          ? "border-b border-secondary/20 shadow-sm" 
          : "border-b border-secondary/10"
      )}
    >
      <div className="px-4 py-3">
        {/* Search bar (when visible) */}
        {searchVisible ? (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0"
              onClick={() => setSearchVisible(false)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-10 pr-4 rounded-full border-secondary/20"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60 h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Left section: Back button or Logo */}
            <div className="flex items-center">
              {shouldShowBackButton() ? (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => window.history.back()}
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              ) : (
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <span className="text-white font-bold text-sm">TC</span>
                  </div>
                </Link>
              )}
              <h1 className="ml-3 text-lg font-semibold">{getPageTitle()}</h1>
            </div>
            
            {/* Right section: Actions */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchVisible(true)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
              
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                    asChild
                  >
                    <Link href="/notifications">
                      <div className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-secondary text-[10px] text-white flex items-center justify-center font-bold">
                          3
                        </span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Link href="/profile">
                    <Avatar className="h-8 w-8 border border-secondary/20">
                      <AvatarImage src={user.avatarUrl || ""} alt={user.username} />
                      <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </>
              ) : (
                <>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[300px]">
                      <div className="py-4">
                        <SidebarNavigation currentPath={location} />
                      </div>
                    </SheetContent>
                  </Sheet>
                  
                  <Link href="/auth">
                    <Button size="sm" className="bg-primary text-white rounded-full px-4">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}