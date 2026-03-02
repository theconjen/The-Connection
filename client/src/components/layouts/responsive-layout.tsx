import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMediaQuery } from "../../hooks/use-media-query";
import Header from "../header";
import MobileNavigation from "../mobile-navigation";
import SidebarNavigation from "../sidebar-navigation";
import { GuestAccessBanner } from "../guest-access-banner";
import AppDownloadBanner from "../AppDownloadBanner";
import Footer from "../footer";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ResponsiveLayoutProps = {
  children: React.ReactNode;
};

/**
 * ResponsiveLayout component 
 * This component optimizes layouts for desktop and mobile based on screen size.
 * For desktop, it provides a sidebar navigation alongside content
 * For mobile, it delivers a streamlined experience with bottom navigation
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
  const [location] = useLocation();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const detectNativeApp = () => {
    if (typeof window === "undefined") return false;

    const searchParams = new URLSearchParams(window.location.search);
    const queryFlag =
      searchParams.get("nativeApp") === "1" || searchParams.get("nativeApp") === "true";

    const globalFlag = Boolean((window as Record<string, unknown>).__NATIVE_APP__);

    let storageFlag = false;
    try {
      storageFlag = localStorage.getItem("nativeApp") === "true";
    } catch (error) {
      storageFlag = false;
    }

    const dataAttributeFlag =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-native-app") === "true";

    return queryFlag || globalFlag || storageFlag || dataAttributeFlag;
  };

  // Detect virtual keyboard on mobile
  useEffect(() => {
    if (!isMobile) return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        // Consider keyboard visible if viewport height decreased by more than 150px
        setIsKeyboardVisible(heightDifference > 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, [isMobile]);

  useEffect(() => {
    setIsNativeApp(detectNativeApp());
  }, [location]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header - adaptive for different screen sizes */}
      <Header />

      {/* Content Layout */}
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar - visible on tablet and larger screens, hidden on admin pages */}
        {!isMobile && !location.startsWith('/admin') && (
          <aside
            className={`hidden md:block ${sidebarCollapsed ? 'w-16' : 'w-64'} border-r border-border/50 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto bg-card/90 dark:bg-muted/50 backdrop-blur-sm shadow-sm transition-all duration-300 flex-shrink-0`}
          >
            <SidebarNavigation currentPath={location} collapsed={sidebarCollapsed} />
          </aside>
        )}

        {/* Sidebar Toggle Button - positioned outside sidebar */}
        {!isMobile && !location.startsWith('/admin') && (
          <button
            onClick={toggleSidebar}
            className={`hidden md:flex absolute ${sidebarCollapsed ? 'left-14' : 'left-[252px]'} top-24 w-7 h-7 bg-primary text-primary-foreground rounded-full items-center justify-center shadow-md hover:bg-primary/90 transition-all z-30`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Main Content Area - adapts to available space */}
        <main
          className={`flex-1 ${
            isMobile
              ? `px-3 py-3 ${isKeyboardVisible ? 'pb-4' : isNativeApp ? 'pb-10' : 'pb-24'}`
              : isTablet
                ? 'px-4 py-4'
                : 'px-6 py-5'
          } ${!isMobile && !isTablet ? 'max-w-5xl mx-auto' : 'w-full'}
            transition-all duration-300
          `}
          style={{
            minHeight: isMobile && isKeyboardVisible 
              ? `${window.visualViewport?.height || window.innerHeight}px` 
              : 'auto'
          }}
        >
          <div className="flex-1 h-full">
            {/* Animated page transitions */}
            <div className="animate-fadeIn">
              <div className={isMobile ? 'safe-area-inset-bottom' : ''}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Bar - hide when keyboard is visible */}
      {isMobile && !isNativeApp && (
        <MobileNavigation
          currentPath={location}
          isVisible={!isKeyboardVisible}
        />
      )}

      {/* Site-wide Footer - hidden on admin pages */}
      {!location.startsWith('/admin') && <Footer />}

      {/* Guest call-to-action banner to encourage sign in/up while still allowing browsing */}
      <GuestAccessBanner />

      {/* App download banner for desktop users */}
      <AppDownloadBanner />
    </div>
  );
}