import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  MessageSquare,
  PenSquare,
  Users,
  FileHeart
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-full border-t bg-background/95 backdrop-blur-sm z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center">
        {/* Home */}
        <Link href="/" className="flex-1 touch-manipulation">
          <div className={`flex flex-col items-center p-2.5 ${activeTab === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/' ? <Home className="h-5 w-5 fill-primary" /> : <Home className="h-5 w-5" />}
            <span className="text-xs mt-1 font-medium">Home</span>
            {activeTab === '/' && <div className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />}
          </div>
        </Link>

        {/* Feed */}
        <Link href="/microblogs" className="flex-1 touch-manipulation">
          <div className={`flex flex-col items-center p-2.5 ${activeTab === '/microblogs' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/microblogs' ? <MessageCircle className="h-5 w-5 fill-primary" /> : <MessageCircle className="h-5 w-5" />}
            <span className="text-xs mt-1 font-medium">Feed</span>
            {activeTab === '/microblogs' && <div className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />}
          </div>
        </Link>

        {/* Create */}
        <Link href="/submit-post" className="flex-1 touch-manipulation">
          <div className={`flex flex-col items-center p-2.5 ${activeTab === '/submit-post' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`${activeTab === '/submit-post' ? 'bg-primary text-white' : 'bg-muted-foreground/10'} rounded-full p-1.5`}>
              <PenSquare className="h-4 w-4" />
            </div>
            <span className="text-xs mt-1 font-medium">Create</span>
          </div>
        </Link>

        {/* Community */}
        <Link href="/communities" className="flex-1 touch-manipulation">
          <div className={`flex flex-col items-center p-2.5 ${activeTab === '/communities' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/communities' ? <Users className="h-5 w-5 fill-primary" /> : <Users className="h-5 w-5" />}
            <span className="text-xs mt-1 font-medium">Groups</span>
            {activeTab === '/communities' && <div className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />}
          </div>
        </Link>

        {/* Forums */}
        <Link href="/forums" className="flex-1 touch-manipulation">
          <div className={`flex flex-col items-center p-2.5 ${activeTab === '/forums' ? 'text-primary' : 'text-muted-foreground'}`}>
            {activeTab === '/forums' ? <FileHeart className="h-5 w-5 fill-primary" /> : <FileHeart className="h-5 w-5" />}
            <span className="text-xs mt-1 font-medium">Forums</span>
            {activeTab === '/forums' && <div className="absolute top-0 w-6 h-0.5 rounded-full bg-primary" />}
          </div>
        </Link>
      </div>
    </div>
  );
}