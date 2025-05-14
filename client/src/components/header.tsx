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
    <header className="bg-white border-b border-secondary/10 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img src={logoImage} alt="The Connection Logo" className="h-8 w-auto" />
              <span className="ml-2 font-semibold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                The Connection
              </span>
            </Link>
          </div>

          {/* Search Bar - Expanded in the middle */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6">
            {searchVisible ? (
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search posts, communities, Bible studies..."
                  className="w-full pr-10 pl-4 py-2 h-10 rounded-full"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
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
                className="text-neutral-600 mx-auto"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation, Notifications, and Profile Section */}
          <div className="flex items-center space-x-1 md:space-x-4">
            {/* Mobile Search Button */}
            <div className="md:hidden">
              {searchVisible ? (
                <div className="fixed inset-0 z-50 bg-background/80 flex items-start justify-center pt-16 px-4">
                  <div className="relative w-full max-w-md">
                    <Input
                      type="text"
                      placeholder="Search..."
                      className="w-full pr-10"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
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
                  className="text-neutral-600"
                >
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>
            
            {/* Desktop Navigation - Moved to the right */}
            {!isMobile && (
              <nav className="hidden md:flex items-center space-x-2">
                {navItems.map((item, index) => (
                  <Link 
                    key={index} 
                    href={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      location === item.path
                        ? "text-primary"
                        : "text-neutral-600 hover:bg-neutral-100"
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
                className="hidden md:flex bg-primary text-white font-medium rounded-full hover:shadow-md hover:shadow-primary/25 transition-all"
                size="sm"
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
            
            {/* Menu button shown on both mobile and desktop */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-neutral-600">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>The Connection</SheetTitle>
                  <SheetDescription>Navigate through different sections of the application</SheetDescription>
                </SheetHeader>
                <div className="py-4">
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
                  className="text-neutral-600"
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
                  className="bg-primary text-white font-medium rounded-full hover:shadow-md hover:shadow-primary/25 transition-all"
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