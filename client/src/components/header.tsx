import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImage from "@assets/TC Logo-2.png";
import { 
  Search, 
  PenSquare,
  BellIcon,
  MessageCircle,
  BookOpen, 
  Home,
  X,
  Menu
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
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: "Home", path: "/" },
    { icon: <MessageCircle className="h-5 w-5" />, label: "Feed", path: "/microblogs" },
    { icon: <BookOpen className="h-5 w-5" />, label: "Bible Study", path: "/bible-study" },
  ];

  return (
    <header className="bg-card border-b border-border/50 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-80">
      <div className="container mx-auto">
        <div className="px-4 py-3 md:py-4 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="The Connection Logo" className="h-8 w-auto" />
              <span className="ml-2 font-medium text-xl text-foreground site-title">
                The Connection
              </span>
            </Link>
          </div>

          {/* Search Bar - Expanded in the middle */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            {searchVisible ? (
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search posts, communities, Bible studies..."
                  className="w-full pr-10 pl-4 py-2 h-10 bg-background/60 border-border/60 focus:border-primary/40 focus:ring-primary/20"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchVisible(true)}
                className="text-muted-foreground mx-auto hover:text-foreground hover:bg-background/60"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation, Notifications, and Profile Section */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Mobile Search Button */}
            <div className="md:hidden">
              {searchVisible ? (
                <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
                  <div className="relative w-full max-w-md">
                    <Input
                      type="text"
                      placeholder="Search..."
                      className="w-full pr-10 bg-card border-border/60"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 text-muted-foreground"
                      onClick={() => setSearchVisible(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
            
            {/* Desktop Navigation - Moved to the right */}
            {!isMobile && (
              <nav className="hidden md:flex items-center space-x-1">
                {navItems.map((item, index) => (
                  <Link 
                    key={index} 
                    href={item.path}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      location === item.path
                        ? "text-primary bg-primary/5 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Link>
                ))}
              </nav>
            )}

            {/* Create Button */}
            <Link href="/submit-post">
              <Button 
                className="hidden md:flex bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                size="sm"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
            
            {/* Menu button shown on both mobile and desktop */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-background/60">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px] border-l border-border/60">
                <SheetHeader>
                  <SheetTitle className="text-xl font-medium text-foreground site-title">The Connection</SheetTitle>
                  <SheetDescription className="text-muted-foreground">Navigate through different sections of the application</SheetDescription>
                </SheetHeader>
                <div className="py-6">
                  <SidebarNavigation currentPath={location} />
                </div>
              </SheetContent>
            </Sheet>

            {user ? (
              <>
                {/* Notifications Button (only show if logged in) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-background/60"
                >
                  <BellIcon className="h-5 w-5" />
                </Button>
                
                {/* User Menu */}
                <UserMenu user={user} />
              </>
            ) : (
              /* Sign In Button */
              <Link href="/auth">
                <Button 
                  className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
                  size="sm"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}