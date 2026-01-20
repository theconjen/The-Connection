import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import logoImage from "@assets/tc-logo.png";
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
} from "./ui/sheet";
import SidebarNavigation from "./sidebar-navigation";
import UserMenu from "./user-menu";

interface MobileHeaderProps {
  currentPath?: string;
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
      setSearchVisible(false);
      setSearchQuery("");
    }
  };

  // Determine if we should show the title in the header
  const showTitle = title || (!searchVisible && !backButton);

  return (
    <header className="mobile-header-modern sticky top-0 z-50 shadow-lg safe-area-inset">
      <div className="px-4 py-4 flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center flex-1">
          {backButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="mr-3 touch-target active-scale text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : searchVisible ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setSearchVisible(false);
                setSearchQuery("");
              }}
              className="mr-3 touch-target active-scale text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
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
                className="w-full h-12 mobile-input-modern border-white/30 text-white placeholder:text-white/70 focus:border-white/60"
              />
            </form>
          ) : showTitle && (
            <div className="flex-1">
              {title ? (
                <h1 className="font-semibold text-xl text-white truncate mobile-text-modern">
                  {title}
                </h1>
              ) : (
                <span className="font-bold text-2xl text-white mobile-text-modern">
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
              className="text-white hover:bg-white/20 touch-target active-scale"
            >
              <Search className="h-6 w-6" />
            </Button>
          )}

          {/* Notifications (for authenticated users) */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 touch-target active-scale relative"
            >
              <Bell className="h-6 w-6" />
              {/* Notification badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
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
                    <SidebarNavigation currentPath={currentPath || '/'} />
                  </div>
                </SheetContent>
              </Sheet>
              
              <Link href="/auth">
                <Button 
                  className="bg-white text-primary font-semibold h-10 px-6 rounded-full hover:bg-white/90 transition-all touch-target mobile-button-modern shadow-lg"
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