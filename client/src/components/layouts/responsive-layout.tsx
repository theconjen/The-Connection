import React from "react";
import { useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-media-query";
import Header from "../header";
import MobileNavigation from "../mobile-navigation";
import SidebarNavigation from "../sidebar-navigation";

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header - adaptive for different screen sizes */}
      <Header />

      {/* Content Layout */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar - only visible on larger screens */}
        {!isMobile && !isTablet && (
          <aside className="hidden lg:block w-60 border-r  border/40 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto py-4 bg-background/95 backdrop-blur-sm">
            <SidebarNavigation currentPath={location} />
          </aside>
        )}

        {/* Main Content Area - adapts to available space */}
        <main 
          className={`flex-1 ${isMobile ? 'px-3 py-3 pb-24' : isTablet ? 'px-4 py-4' : 'px-6 py-5'} 
            ${!isMobile && !isTablet ? 'max-w-5xl mx-auto' : 'w-full'}
            transition-all
          `}
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

      {/* Mobile Navigation Bar - only shows on mobile */}
      {isMobile && <MobileNavigation currentPath={location} />}
    </div>
  );
}