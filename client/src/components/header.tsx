import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, AuthContextType } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logoImage from "@assets/tc-logo.png";
import { 
  Search, 
  PenSquare,
  BellIcon,
  MessageCircle,
  MessageSquare,
  BookOpen, 
  Home,
  X,
  Menu,
  Users,
  CalendarDays
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "./ui/sheet";
import UserMenu from "./user-menu";
import SidebarNavigation from "./sidebar-navigation";
import GlobalSearch from "./GlobalSearch";
import { useMediaQuery } from "../hooks/use-media-query";

export default function Header() {
  const [location] = useLocation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth() as AuthContextType;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // We no longer use top navigation items for desktop
  // Navigation is handled through the homepage grid and mobile nav

  // Add scroll listener to apply shadow and background changes
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchVisible) {
        setSearchVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchVisible]);

  // Focus search input when opened
  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchVisible]);

  return (
    <header 
      className={`sticky top-0 z-40 backdrop-blur-sm transition-all duration-200
        ${scrolled 
          ? 'bg-background/90 shadow-md' 
          : 'bg-background/70 border-b  border/10'
        }`}
    >
      <div className="container mx-auto">
        <div className="px-3 py-3 md:py-4 flex items-center justify-between">
          {/* Logo Section - Optimized for all screen sizes */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="The Connection Logo" className="h-8 w-auto" />
              <span className={`ml-2 font-medium text-foreground site-title ${isMobile ? 'hidden' : 'text-xl'}`}>
                The Connection
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop & Tablet */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <Button
              variant="ghost"
              onClick={() => setSearchVisible(true)}
              className="w-full h-10 justify-start bg-background/60 border border-border/60 hover:bg-background/80 text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>Search posts, communities, people...</span>
            </Button>
          </div>

          {/* Navigation, Notifications, and Profile Section */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile Search Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchVisible(true)}
                className="text-muted-foreground hover:text-foreground active-scale touch-target"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {/* Desktop navigation has been removed in favor of homepage grid navigation */}

            {user ? (
              <>
                {/* Direct Messages Button - Always visible (FIRST) */}
                <Link href="/dms">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-background/60 relative active-scale touch-target"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {/* Unread messages indicator */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                  </Button>
                </Link>

                {/* Notifications Button - SECOND */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-background/60 relative active-scale touch-target"
                >
                  <BellIcon className="h-5 w-5" />
                  {/* Notification indicator dot - show when there are unread notifications */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* Hamburger Menu Button - Available on all screen sizes */}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-foreground hover:bg-background/60"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] sm:w-[350px] border-l border-border/60 p-0">
                    <div className="h-full overflow-hidden flex flex-col">
                      <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="text-xl font-medium text-foreground">The Connection</SheetTitle>
                        <SheetDescription className="text-muted-foreground">Navigate to any section of the app</SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto py-4 px-6">
                        <SidebarNavigation currentPath={location} />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Create Button - Desktop & Tablet only */}
                <Link href="/submit-post">
                  <Button 
                    className="hidden md:flex btn-gradient font-medium"
                    size="sm"
                  >
                    <PenSquare className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </Link>
                
                {/* User Menu - Optimized for both desktop and mobile */}
                <UserMenu user={user} />
              </>
            ) : (
              <>
                {/* Direct Messages Button - Always visible even for guests (FIRST) */}
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-background/60"
                    title="Sign in to access messages"
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Notifications Button - For guests (SECOND) */}
                <Link href="/auth">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-background/60"
                    title="Sign in to access notifications"
                  >
                    <BellIcon className="h-5 w-5" />
                  </Button>
                </Link>

                {/* Hamburger Menu Button - Available on all screen sizes */}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-foreground hover:bg-background/60"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] sm:w-[350px] border-l border-border/60 p-0">
                    <div className="h-full overflow-hidden flex flex-col">
                      <SheetHeader className="p-6 pb-2">
                        <SheetTitle className="text-xl font-medium text-foreground">The Connection</SheetTitle>
                        <SheetDescription className="text-muted-foreground">Navigate to any section of the app</SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto py-4 px-6">
                        <SidebarNavigation currentPath={location} />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Create Button - Desktop & Tablet only */}
                <Link href="/auth">
                  <Button 
                    className="hidden md:flex text-muted-foreground hover:text-foreground"
                    variant="ghost"
                    size="sm"
                  >
                    <PenSquare className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </Link>

                {/* Sign In button */}
                <Link href="/auth">
                  <Button 
                    className="btn-gradient font-medium"
                    size="sm"
                  >
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Global Search Modal */}
      <GlobalSearch 
        isVisible={searchVisible} 
        onClose={() => setSearchVisible(false)} 
      />
    </header>
  );
}