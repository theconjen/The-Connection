import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, AuthContextType } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@assets/TC Logo - Color.png";
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
} from "@/components/ui/sheet";
import UserMenu from "@/components/user-menu";
import SidebarNavigation from "@/components/sidebar-navigation";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Header() {
  const [location] = useLocation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth() as AuthContextType;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Top navigation items for desktop
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", path: "/" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Feed", path: "/microblogs" },
    { icon: <Users className="h-5 w-5" />, label: "Communities", path: "/communities" },
    { icon: <CalendarDays className="h-5 w-5" />, label: "Events", path: "/events" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Bible Study", path: "/bible-study" },
  ];

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
          : 'bg-background/70 border-b border-border/10'
        }`}
    >
      <div className="container mx-auto">
        <div className="px-3 py-3 md:py-4 flex items-center justify-between">
          {/* Logo Section - Optimized for all screen sizes */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="The Connection Logo" className="h-8 w-auto" />
              <span className={`ml-2 font-medium text-xl text-foreground site-title ${isMobile ? 'text-lg' : ''}`}>
                The Connection
              </span>
            </Link>
          </div>

          {/* Search Bar - Tablet & Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search posts, communities, Bible studies..."
                className={`w-full h-10 bg-background/60 border-border/60 pl-10
                  focus:border-primary/40 focus:ring-primary/20 transition-all
                  ${searchVisible ? 'opacity-100' : 'opacity-70 hover:opacity-90 focus:opacity-100'}`}
                onFocus={() => setSearchVisible(true)}
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              {searchVisible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation, Notifications, and Profile Section */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile Search Button */}
            <div className="md:hidden">
              {searchVisible ? (
                <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-start justify-start pt-16 px-4">
                  <div className="relative w-full max-w-md mx-auto">
                    <Input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-10 pr-10 py-2 bg-card border-border/60"
                    />
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      onClick={() => setSearchVisible(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Quick search categories on mobile */}
                  <div className="mt-4 w-full px-4">
                    <div className="text-sm font-medium mb-2">Search Categories</div>
                    <div className="flex flex-wrap gap-2">
                      {['Posts', 'People', 'Communities', 'Bible Studies', 'Events'].map((cat) => (
                        <Button key={cat} variant="outline" size="sm" className="text-xs">
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchVisible(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Desktop/Tablet Navigation - Dynamic based on space */}
            {!isMobile && (
              <nav className="hidden md:flex items-center">
                <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                  {/* Show all items on larger screens, fewer on tablets */}
                  {navItems.slice(0, isTablet ? 3 : navItems.length).map((item, index) => (
                    <Link 
                      key={index} 
                      href={item.path}
                      className={`flex items-center whitespace-nowrap px-3 py-2 rounded-md transition-colors ${
                        location === item.path
                          ? "text-primary bg-primary/5 font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      }`}
                    >
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>
            )}

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
            
            {/* Menu button - only on mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden text-muted-foreground hover:text-foreground hover:bg-background/60"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[350px] border-l border-border/60">
                <SheetHeader>
                  <SheetTitle className="text-xl font-medium text-foreground site-title">The Connection</SheetTitle>
                  <SheetDescription className="text-muted-foreground">Explore all sections of the application</SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <SidebarNavigation currentPath={location} />
                </div>
              </SheetContent>
            </Sheet>

            {user ? (
              <>
                {/* Direct Messages Button - Always visible */}
                <Link href="/messages">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-background/60 relative"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {/* Unread messages indicator */}
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                  </Button>
                </Link>

                {/* Notifications Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-background/60 relative"
                >
                  <BellIcon className="h-5 w-5" />
                  {/* Notification indicator dot - show when there are unread notifications */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
                
                {/* User Menu - Optimized for both desktop and mobile */}
                <UserMenu user={user} />
              </>
            ) : (
              <>
                {/* Direct Messages Button - Always visible even for guests */}
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
    </header>
  );
}