import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
              <svg width="30" height="30" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3C14.5817 3 11.2466 4.05271 8.44366 6.02972C5.64074 8.00673 3.52196 10.7992 2.36333 14.0492C1.2047 17.2993 1.06294 20.827 1.96045 24.1599C2.85796 27.4928 4.75998 30.4439 7.3934 32.5936C10.0268 34.7432 13.2595 36 16.5 36C19.7405 36 22.9732 34.7432 25.6066 32.5936C28.24 30.4439 30.142 27.4928 31.0395 24.1599C31.9371 20.827 31.7953 17.2993 30.6367 14.0492C29.478 10.7992 27.3593 8.00673 24.5563 6.02972C21.7534 4.05271 18.4183 3 15 3H18Z" fill="#B366FF"/>
                <path d="M18 3C21.4183 3 24.7534 4.05271 27.5563 6.02972C30.3593 8.00673 32.478 10.7992 33.6367 14.0492C34.7953 17.2993 34.9371 20.827 34.0395 24.1599C33.142 27.4928 31.24 30.4439 28.6066 32.5936C25.9732 34.7432 22.7405 36 19.5 36C16.2595 36 13.0268 34.7432 10.3934 32.5936C7.75998 30.4439 5.85796 27.4928 4.96045 24.1599C4.06294 20.827 4.2047 17.2993 5.36333 14.0492C6.52196 10.7992 8.64074 8.00673 11.4437 6.02972C14.2466 4.05271 17.5817 3 21 3H18Z" fill="#D685FF"/>
                <circle cx="18" cy="18" r="10" fill="white"/>
                <path d="M18 12C17.4696 12 16.9609 11.7893 16.5858 11.4142C16.2107 11.0391 16 10.5304 16 10C16 9.46957 16.2107 8.96086 16.5858 8.58579C16.9609 8.21071 17.4696 8 18 8C18.5304 8 19.0391 8.21071 19.4142 8.58579C19.7893 8.96086 20 9.46957 20 10C20 10.5304 19.7893 11.0391 19.4142 11.4142C19.0391 11.7893 18.5304 12 18 12ZM18 28C17.4696 28 16.9609 27.7893 16.5858 27.4142C16.2107 27.0391 16 26.5304 16 26C16 25.4696 16.2107 24.9609 16.5858 24.5858C16.9609 24.2107 17.4696 24 18 24C18.5304 24 19.0391 24.2107 19.4142 24.5858C19.7893 24.9609 20 25.4696 20 26C20 26.5304 19.7893 27.0391 19.4142 27.4142C19.0391 27.7893 18.5304 28 18 28ZM10 20C9.46957 20 8.96086 19.7893 8.58579 19.4142C8.21071 19.0391 8 18.5304 8 18C8 17.4696 8.21071 16.9609 8.58579 16.5858C8.96086 16.2107 9.46957 16 10 16C10.5304 16 11.0391 16.2107 11.4142 16.5858C11.7893 16.9609 12 17.4696 12 18C12 18.5304 11.7893 19.0391 11.4142 19.4142C11.0391 19.7893 10.5304 20 10 20ZM26 20C25.4696 20 24.9609 19.7893 24.5858 19.4142C24.2107 19.0391 24 18.5304 24 18C24 17.4696 24.2107 16.9609 24.5858 16.5858C24.9609 16.2107 25.4696 16 26 16C26.5304 16 27.0391 16.2107 27.4142 16.5858C27.7893 16.9609 28 17.4696 28 18C28 18.5304 27.7893 19.0391 27.4142 19.4142C27.0391 19.7893 26.5304 20 26 20Z" fill="#B366FF"/>
              </svg>
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