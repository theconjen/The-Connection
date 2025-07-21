import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@assets/TC Logo - Color.png";
import { 
  Search, 
  Menu, 
  X, 
  ChevronLeft,
  Bell,
  Settings
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import SidebarNavigation from "@/components/sidebar-navigation";
import UserMenu from "@/components/user-menu";

interface MobileHeaderProps {
  currentPath: string;
  backButton?: boolean;
  title?: string;
  rightActions?: React.ReactNode;
  searchEnabled?: boolean;
}

export default function MobileHeader({ 
  currentPath, 
  backButton = false,
  title,
  rightActions,
  searchEnabled = true
}: MobileHeaderProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Auto-focus search input when visible
  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchVisible]);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search navigation logic here
      console.log("Searching for:", searchQuery);
      setSearchVisible(false);
      setSearchQuery("");
    }
  };

  // Determine if we should show the title in the header
  const showTitle = title || (!searchVisible && !backButton);

  return (
    <header className="bg-background/95 border-b border-border/50 sticky top-0 z-50 shadow-sm backdrop-blur-md mobile-sticky safe-area-inset">
      <div className="px-4 py-3 flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center flex-1">
          {backButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="mr-3 touch-target active-scale"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : searchVisible ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setSearchVisible(false);
                setSearchQuery("");
              }}
              className="mr-3 touch-target active-scale"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/" className="flex items-center mr-3">
              <img src={logoImage} alt="TC Logo" className="h-8 w-auto" />
            </Link>
          )}

          {/* Title or Search Bar */}
          {searchVisible ? (
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search posts, communities, people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 mobile-input border-primary/20 focus:border-primary/40"
              />
            </form>
          ) : showTitle && (
            <div className="flex-1">
              {title ? (
                <h1 className="font-semibold text-lg text-foreground truncate mobile-text">
                  {title}
                </h1>
              ) : (
                <span className="font-semibold text-lg text-gradient site-title">
                  The Connection
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 ml-2">
          {/* Custom right actions */}
          {rightActions}
          
          {/* Search button */}
          {searchEnabled && !searchVisible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchVisible(true)}
              className="text-muted-foreground touch-target active-scale"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications (for authenticated users) */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground touch-target active-scale relative"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
            </Button>
          )}

          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target active-scale">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[350px] mobile-spacing">
                  <div className="py-4">
                    <SheetClose asChild>
                      <div className="absolute right-4 top-4">
                        <Button variant="ghost" size="icon" className="touch-target">
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </SheetClose>
                    <SidebarNavigation currentPath={currentPath} />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link href="/auth">
                <Button 
                  className="btn-gradient text-sm font-medium h-10 px-4 rounded-full hover:shadow-md hover:shadow-primary/25 transition-all touch-target mobile-button"
                  size="sm"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}