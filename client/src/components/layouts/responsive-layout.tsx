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
          <aside className="hidden lg:block w-64 border-r border-border/40 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto py-6 px-3">
            <SidebarNavigation currentPath={location} />
          </aside>
        )}

        {/* Main Content Area - adapts to available space */}
        <main 
          className={`flex-1 ${isMobile ? 'px-2 py-2 pb-24' : 'px-4 py-6'} 
            ${!isMobile && !isTablet ? 'max-w-5xl mx-auto' : 'w-full'}
          `}
        >
          <div className="flex-1 h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Bar - only shows on mobile */}
      {isMobile && <MobileNavigation currentPath={location} />}
    </div>
  );
}