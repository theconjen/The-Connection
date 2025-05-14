import { Link } from "wouter";
import { Home, Search, Video, Calendar, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SidebarNavigation from "./sidebar-navigation";

interface MobileNavigationProps {
  currentPath: string;
}

/**
 * Mobile-optimized bottom navigation bar
 * - Limited to 5 essential navigation items
 * - Uses a "More" menu for less frequently accessed features
 * - Active state highlighting
 */
export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  // Helper to determine if a route is active (exact or starts with the path)
  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary/20 shadow-lg h-16 z-50 md:hidden">
      <div className="grid grid-cols-5 h-full">
        {/* Home */}
        <Link href="/">
          <div className="flex flex-col items-center justify-center h-full cursor-pointer">
            <Home 
              className={`h-5 w-5 mb-1 ${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`} 
              fill={isActive('/') ? "currentColor" : "none"}
            />
            <span className={`text-[10px] ${isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Home
            </span>
          </div>
        </Link>
        
        {/* Discover */}
        <Link href="/discover">
          <div className="flex flex-col items-center justify-center h-full cursor-pointer">
            <Search 
              className={`h-5 w-5 mb-1 ${isActive('/discover') ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            <span className={`text-[10px] ${isActive('/discover') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Discover
            </span>
          </div>
        </Link>
        
        {/* Microblogs Feed */}
        <Link href="/microblogs">
          <div className="flex flex-col items-center justify-center h-full cursor-pointer">
            <div className={`h-12 w-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center -mt-4 border-4 border-white`}>
              <span className="text-white font-bold text-lg">+</span>
            </div>
          </div>
        </Link>
        
        {/* Livestreams */}
        <Link href="/livestreams">
          <div className="flex flex-col items-center justify-center h-full cursor-pointer">
            <Video 
              className={`h-5 w-5 mb-1 ${isActive('/livestreams') ? 'text-primary' : 'text-muted-foreground'}`} 
            />
            <span className={`text-[10px] ${isActive('/livestreams') ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Livestreams
            </span>
          </div>
        </Link>
        
        {/* More Menu */}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center justify-center h-full">
            <Menu 
              className="h-5 w-5 mb-1 text-muted-foreground" 
            />
            <span className="text-[10px] text-muted-foreground">
              More
            </span>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[300px]">
            <div className="py-4">
              <SidebarNavigation currentPath={currentPath} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}