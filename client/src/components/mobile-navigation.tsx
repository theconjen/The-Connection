import { Link } from "wouter";
import { 
  Home, 
  MessageCircle, 
  MessageSquare,
  PenSquare,
  Users,
  FileHeart,
  Compass,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface MobileNavigationProps {
  currentPath: string;
  isVisible?: boolean;
}

export default function MobileNavigation({ currentPath, isVisible = true }: MobileNavigationProps) {
  const [activeTab, setActiveTab] = useState(currentPath);
  const [scrolled, setScrolled] = useState(false);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const { user } = useAuth();

  // Update active tab on path change
  useEffect(() => {
    setActiveTab(currentPath);
  }, [currentPath]);

  // Check for vibration support
  useEffect(() => {
    setVibrationSupported('vibrate' in navigator);
  }, []);

  // Detect scroll to show/hide shadow on nav
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Haptic feedback for navigation
  const handleTabPress = (path: string) => {
    if (vibrationSupported && activeTab !== path) {
      navigator.vibrate(10); // Light haptic feedback
    }
  };

  const isActive = (path: string) => {
    if (path === '/' && (activeTab === '/' || activeTab === '/dashboard')) return true;
    return activeTab === path || activeTab.startsWith(path);
  };

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 w-full mobile-nav-modern z-50 safe-area-bottom transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex justify-around items-center px-2 py-2 relative">
        {/* Home */}
        <Link href="/" className="flex-1 touch-manipulation">
          <div 
            className={`flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-200 ${
              isActive('/') ? 'text-primary bg-primary/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/')}
          >
            <Home className={`h-6 w-6 ${isActive('/') ? 'fill-primary/20' : ''} transition-all`} />
            <span className="text-xs mt-1 font-medium mobile-text-modern">Home</span>
          </div>
        </Link>

        {/* Feed */}
        <Link href="/microblogs" className="flex-1 touch-manipulation">
          <div 
            className={`flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-200 ${
              isActive('/microblogs') ? 'text-primary bg-primary/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/microblogs')}
          >
            <MessageCircle className={`h-6 w-6 ${isActive('/microblogs') ? 'fill-primary/20' : ''} transition-all`} />
            <span className="text-xs mt-1 font-medium mobile-text-modern">Feed</span>
          </div>
        </Link>

        {/* Create - Modern Floating Action Button */}
        <Link href={user ? "/submit" : "/auth"} className="flex-1 touch-manipulation relative">
          <div className="flex flex-col items-center py-2">
            <div 
              className={`absolute -top-7 ${
                isActive('/submit') || isActive('/submit-post') 
                  ? 'bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/40' 
                  : 'bg-gradient-to-r from-primary to-accent shadow-xl shadow-primary/30'
              } text-white rounded-full p-4 transition-all duration-300 hover:scale-105 active:scale-95 mobile-button-modern border-4 border-white`}
              onClick={() => handleTabPress('/submit')}
            >
              <PenSquare className="h-6 w-6" />
            </div>
            <span className="text-xs mt-9 font-medium text-muted-foreground mobile-text-modern">Create</span>
          </div>
        </Link>

        {/* Communities */}
        <Link href="/communities" className="flex-1 touch-manipulation">
          <div 
            className={`flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-200 ${
              isActive('/communities') ? 'text-primary bg-primary/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/communities')}
          >
            <Users className={`h-6 w-6 ${isActive('/communities') ? 'fill-primary/20' : ''} transition-all`} />
            <span className="text-xs mt-1 font-medium mobile-text-modern">Groups</span>
          </div>
        </Link>

        {/* Messages - Show when authenticated */}
        {user ? (
          <Link href="/messages" className="flex-1 touch-manipulation">
            <div 
              className={`flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-200 ${
                isActive('/messages') || isActive('/dms') ? 'text-primary bg-primary/15 shadow-sm' : 'text-muted-foreground'
              } active-scale touch-target mobile-button`}
              onClick={() => handleTabPress('/messages')}
            >
              <MessageSquare className={`h-6 w-6 ${isActive('/messages') || isActive('/dms') ? 'fill-primary/20' : ''} transition-all`} />
              <span className="text-xs mt-1 font-medium mobile-text-modern">Messages</span>
            </div>
          </Link>
        ) : (
          <Link href="/forums" className="flex-1 touch-manipulation">
            <div 
              className={`flex flex-col items-center py-3 px-3 rounded-xl transition-all duration-200 ${
                isActive('/forums') ? 'text-primary bg-primary/15 shadow-sm' : 'text-muted-foreground'
              } active-scale touch-target mobile-button`}
              onClick={() => handleTabPress('/forums')}
            >
              <FileHeart className={`h-6 w-6 ${isActive('/forums') ? 'fill-primary/20' : ''} transition-all`} />
              <span className="text-xs mt-1 font-medium mobile-text-modern">Forums</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}