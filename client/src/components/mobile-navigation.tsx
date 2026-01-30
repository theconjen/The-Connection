import { Link } from "wouter";
import {
  Home,
  Users,
  Plus,
  Calendar,
  BookOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";

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
    if (path === '/' && activeTab === '/') return true;
    return activeTab === path || (path !== '/' && activeTab.startsWith(path));
  };

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 w-full mobile-nav-modern z-50 safe-area-bottom transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : 'translate-y-full'
    }`}>
      <div className="flex justify-around items-center px-1 py-0.5 relative">
        {/* Home */}
        <Link href="/" className="flex-1 touch-manipulation">
          <div
            className={`flex flex-col items-center py-1 px-1 rounded-lg transition-all duration-200 ${
              isActive('/') ? 'text-[#5C6B5E] bg-[#5C6B5E]/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/')}
          >
            <Home className={`h-4 w-4 transition-all`} />
            <span className="text-xs mt-0.5 font-medium mobile-text-modern">Home</span>
          </div>
        </Link>

        {/* Community */}
        <Link href="/communities" className="flex-1 touch-manipulation">
          <div
            className={`flex flex-col items-center py-1 px-1 rounded-lg transition-all duration-200 ${
              isActive('/communities') ? 'text-[#7C6B78] bg-[#7C6B78]/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/communities')}
          >
            <Users className={`h-4 w-4 transition-all`} />
            <span className="text-xs mt-0.5 font-medium mobile-text-modern">Community</span>
          </div>
        </Link>

        {/* Create - Center Floating Action Button */}
        <Link href={user ? "/advice" : "/auth"} className="flex-1 touch-manipulation relative">
          <div className="flex flex-col items-center py-1">
            <div
              className="absolute -top-4 bg-gradient-to-r from-[#5C6B5E] to-[#B56A55] text-white rounded-full p-2 transition-all duration-300 hover:scale-105 active:scale-95 mobile-button-modern border-2 border-white shadow-lg shadow-[#5C6B5E]/30"
              onClick={() => handleTabPress('/advice')}
            >
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs mt-6 font-medium text-muted-foreground mobile-text-modern">Create</span>
          </div>
        </Link>

        {/* Events */}
        <Link href="/events" className="flex-1 touch-manipulation">
          <div
            className={`flex flex-col items-center py-1 px-1 rounded-lg transition-all duration-200 ${
              isActive('/events') ? 'text-[#B56A55] bg-[#B56A55]/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/events')}
          >
            <Calendar className={`h-4 w-4 transition-all`} />
            <span className="text-xs mt-0.5 font-medium mobile-text-modern">Events</span>
          </div>
        </Link>

        {/* Apologetics */}
        <Link href="/apologetics" className="flex-1 touch-manipulation">
          <div
            className={`flex flex-col items-center py-1 px-1 rounded-lg transition-all duration-200 ${
              isActive('/apologetics') ? 'text-[#7C8F78] bg-[#7C8F78]/15 shadow-sm' : 'text-muted-foreground'
            } active-scale touch-target mobile-button`}
            onClick={() => handleTabPress('/apologetics')}
          >
            <BookOpen className={`h-4 w-4 transition-all`} />
            <span className="text-xs mt-0.5 font-medium mobile-text-modern">Apologetics</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
