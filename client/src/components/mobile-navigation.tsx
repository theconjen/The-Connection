import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  MessageSquare,
  PenSquare,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";

interface MobileNavigationProps {
  currentPath: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [activeTab, setActiveTab] = useState(currentPath);
  const [scrolled, setScrolled] = useState(false);

  // Update active tab on path change
  useEffect(() => {
    setActiveTab(currentPath);
  }, [currentPath]);

  // Detect scroll to show/hide shadow on nav
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full border-t bg-background z-40">
      <div className="flex justify-between items-center">
        {/* Home */}
        <Link href="/" className="flex-1">
          <div className={`flex flex-col items-center p-2 ${activeTab === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/' ? <Home className="h-5 w-5 fill-primary" /> : <Home className="h-5 w-5" />}
            <span className="text-xs mt-1">Home</span>
            {activeTab === '/' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary" />}
          </div>
        </Link>

        {/* Feed */}
        <Link href="/microblogs" className="flex-1">
          <div className={`flex flex-col items-center p-2 ${activeTab === '/microblogs' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/microblogs' ? <MessageCircle className="h-5 w-5 fill-primary" /> : <MessageCircle className="h-5 w-5" />}
            <span className="text-xs mt-1">Feed</span>
            {activeTab === '/microblogs' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary" />}
          </div>
        </Link>

        {/* Create */}
        <Link href="/submit-post" className="flex-1">
          <div className={`flex flex-col items-center p-2 ${activeTab === '/submit-post' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/submit-post' ? <PenSquare className="h-5 w-5 fill-primary" /> : <PenSquare className="h-5 w-5" />}
            <span className="text-xs mt-1">Create</span>
            {activeTab === '/submit-post' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary" />}
          </div>
        </Link>

        {/* Community */}
        <Link href="/communities" className="flex-1">
          <div className={`flex flex-col items-center p-2 ${activeTab === '/communities' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/communities' ? <Users className="h-5 w-5 fill-primary" /> : <Users className="h-5 w-5" />}
            <span className="text-xs mt-1">Community</span>
            {activeTab === '/communities' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary" />}
          </div>
        </Link>

        {/* Chat */}
        <Link href="/messages" className="flex-1">
          <div className={`flex flex-col items-center p-2 ${activeTab === '/messages' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/messages' ? <MessageSquare className="h-5 w-5 fill-primary" /> : <MessageSquare className="h-5 w-5" />}
            <span className="text-xs mt-1">Chat</span>
            {activeTab === '/messages' && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary" />}
          </div>
        </Link>
      </div>
    </div>
  );
}