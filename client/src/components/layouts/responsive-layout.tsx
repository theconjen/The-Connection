import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMediaQuery } from "../../hooks/use-media-query";
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header - adaptive for different screen sizes */}
      <Header />

      {/* Content Layout */}
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar - only visible on larger screens */}
        {!isMobile && !isTablet && (
          <aside className="hidden lg:block w-60 border-r  border/40 h-[calc(100vh-64px)] sticky top-16 overflow-y-auto py-4 bg-background/95 backdrop-blur-sm">
            <SidebarNavigation currentPath={location} />
          </aside>
        )}

        {/* Main Content Area - adapts to available space */}
        <main 
          className={`flex-1 ${
            isMobile 
              ? `px-3 py-3 ${isKeyboardVisible ? 'pb-4' : 'pb-24'}` 
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
      {isMobile && (
        <MobileNavigation 
          currentPath={location} 
          isVisible={!isKeyboardVisible}
        />
      )}
    </div>
  );
}