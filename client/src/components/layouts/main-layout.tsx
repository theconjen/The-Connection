import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import SidebarNavigation from "@/components/sidebar-navigation";
import MobileNavigation from "@/components/mobile-navigation";
import UserMenu from "@/components/user-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Heart, BookOpen, PenTool, Menu, Video, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-secondary/20 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-float">
                <path d="M18 3C14.5817 3 11.2466 4.05271 8.44366 6.02972C5.64074 8.00673 3.52196 10.7992 2.36333 14.0492C1.2047 17.2993 1.06294 20.827 1.96045 24.1599C2.85796 27.4928 4.75998 30.4439 7.3934 32.5936C10.0268 34.7432 13.2595 36 16.5 36C19.7405 36 22.9732 34.7432 25.6066 32.5936C28.24 30.4439 30.142 27.4928 31.0395 24.1599C31.9371 20.827 31.7953 17.2993 30.6367 14.0492C29.478 10.7992 27.3593 8.00673 24.5563 6.02972C21.7534 4.05271 18.4183 3 15 3H18Z" fill="#B366FF"/>
                <path d="M18 3C21.4183 3 24.7534 4.05271 27.5563 6.02972C30.3593 8.00673 32.478 10.7992 33.6367 14.0492C34.7953 17.2993 34.9371 20.827 34.0395 24.1599C33.142 27.4928 31.24 30.4439 28.6066 32.5936C25.9732 34.7432 22.7405 36 19.5 36C16.2595 36 13.0268 34.7432 10.3934 32.5936C7.75998 30.4439 5.85796 27.4928 4.96045 24.1599C4.06294 20.827 4.2047 17.2993 5.36333 14.0492C6.52196 10.7992 8.64074 8.00673 11.4437 6.02972C14.2466 4.05271 17.5817 3 21 3H18Z" fill="#D685FF"/>
                <circle cx="18" cy="18" r="10" fill="white"/>
                <path d="M18 12C17.4696 12 16.9609 11.7893 16.5858 11.4142C16.2107 11.0391 16 10.5304 16 10C16 9.46957 16.2107 8.96086 16.5858 8.58579C16.9609 8.21071 17.4696 8 18 8C18.5304 8 19.0391 8.21071 19.4142 8.58579C19.7893 8.96086 20 9.46957 20 10C20 10.5304 19.7893 11.0391 19.4142 11.4142C19.0391 11.7893 18.5304 12 18 12ZM18 28C17.4696 28 16.9609 27.7893 16.5858 27.4142C16.2107 27.0391 16 26.5304 16 26C16 25.4696 16.2107 24.9609 16.5858 24.5858C16.9609 24.2107 17.4696 24 18 24C18.5304 24 19.0391 24.2107 19.4142 24.5858C19.7893 24.9609 20 25.4696 20 26C20 26.5304 19.7893 27.0391 19.4142 27.4142C19.0391 27.7893 18.5304 28 18 28ZM10 20C9.46957 20 8.96086 19.7893 8.58579 19.4142C8.21071 19.0391 8 18.5304 8 18C8 17.4696 8.21071 16.9609 8.58579 16.5858C8.96086 16.2107 9.46957 16 10 16C10.5304 16 11.0391 16.2107 11.4142 16.5858C11.7893 16.9609 12 17.4696 12 18C12 18.5304 11.7893 19.0391 11.4142 19.4142C11.0391 19.7893 10.5304 20 10 20ZM26 20C25.4696 20 24.9609 19.7893 24.5858 19.4142C24.2107 19.0391 24 18.5304 24 18C24 17.4696 24.2107 16.9609 24.5858 16.5858C24.9609 16.2107 25.4696 16 26 16C26.5304 16 27.0391 16.2107 27.4142 16.5858C27.7893 16.9609 28 17.4696 28 18C28 18.5304 27.7893 19.0391 27.4142 19.4142C27.0391 19.7893 26.5304 20 26 20Z" fill="#B366FF"/>
              </svg>
              
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
                The Connection
              </span>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search communities, topics, or posts..."
                className="w-full py-2 pl-10 pr-4 rounded-full border-secondary/20 focus-visible:ring-primary/40 transition-all"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60 h-4 w-4" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 md:space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-primary"
              onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Link href="/discover">
              <Button variant="ghost" className="hidden md:inline-flex text-foreground hover:text-primary hover:bg-primary/10">
                <Heart className="mr-2 h-4 w-4" />
                Communities
              </Button>
            </Link>
            
            <Link href="/livestreams">
              <Button variant="ghost" className="hidden md:inline-flex text-foreground hover:text-primary hover:bg-primary/10">
                <Video className="mr-2 h-4 w-4" />
                <span className="relative">
                  Livestreams
                  <span className="absolute -top-2 -right-8 text-xs bg-secondary text-white px-1.5 py-0.5 rounded-full font-medium">
                    New
                  </span>
                </span>
              </Button>
            </Link>
            
            <Link href="/events">
              <Button variant="ghost" className="hidden md:inline-flex text-foreground hover:text-primary hover:bg-primary/10">
                <Calendar className="mr-2 h-4 w-4" />
                <span className="relative">
                  Events
                  <span className="absolute -top-2 -right-6 text-xs bg-secondary text-white px-1.5 py-0.5 rounded-full font-medium">
                    New
                  </span>
                </span>
              </Button>
            </Link>
            
            <Link href="/apologetics">
              <Button variant="ghost" className="hidden md:inline-flex text-foreground hover:text-primary hover:bg-primary/10">
                <BookOpen className="mr-2 h-4 w-4" />
                Apologetics
              </Button>
            </Link>

            <Link href="/submit">
              <Button variant="ghost" className="hidden md:inline-flex text-foreground hover:text-primary hover:bg-primary/10">
                <PenTool className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
            
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
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
                  <Button className="bg-primary text-white font-medium px-6 rounded-full hover:shadow-lg hover:shadow-primary/25 transition-all">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
        
        {/* Search Bar (Mobile) */}
        {mobileSearchVisible && (
          <div className="md:hidden border-t border-secondary/20 p-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-10 pr-4 rounded-full border-secondary/20"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/60 h-4 w-4" />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:flex md:space-x-6">
        {/* Left Sidebar (Desktop only) */}
        <aside className="hidden md:block w-64 space-y-6 sticky top-24 self-start">
          <SidebarNavigation currentPath={location} />
        </aside>

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Bar */}
      <MobileNavigation currentPath={location} />

      {/* New Post Button (Mobile) */}
      {user && (
        <div className="fixed md:hidden right-4 bottom-20 z-50">
          <Link href="/submit">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full h-14 w-14 flex items-center justify-center shadow-lg shadow-primary/25 p-0">
              <PenTool className="h-6 w-6" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
