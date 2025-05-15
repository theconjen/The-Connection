import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@assets/TC Logo - Color.png";
import { 
  Search, 
  Menu, 
  X, 
  ChevronLeft 
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
}

export default function MobileHeader({ 
  currentPath, 
  backButton = false,
  title
}: MobileHeaderProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const { user } = useAuth();

  // Determine if we should show the title in the header
  const showTitle = title || (!searchVisible && !backButton);

  return (
    <header className="bg-card border-b border-border/50 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-80">
      <div className="px-3 py-2.5 flex items-center justify-between w-full">
        {/* Left Section */}
        <div className="flex items-center">
          {backButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => window.history.back()}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : searchVisible ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchVisible(false)}
              className="mr-2"
            >
              <X className="h-5 w-5" />
            </Button>
          ) : (
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="TC Logo" className="h-8 w-auto mr-2" />
            </Link>
          )}

          {/* Title or Search Bar */}
          {searchVisible ? (
            <div className="flex-1 ml-1">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full h-9 py-2 pl-3 pr-3 rounded-lg border-secondary/20"
                autoFocus
              />
            </div>
          ) : showTitle && (
            <div className="font-medium text-lg">
              {title || (
                <span className="text-foreground font-medium site-title">
                  The Connection
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {!searchVisible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchVisible(true)}
              className="text-muted-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {user ? (
            <UserMenu user={user} />
          ) : (
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                  <div className="py-4">
                    <SheetClose asChild>
                      <div className="absolute right-4 top-4">
                        <Button variant="ghost" size="icon">
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
                  className="bg-primary text-white text-sm font-medium h-9 px-4 rounded-full hover:shadow-sm hover:shadow-primary/25 transition-all"
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