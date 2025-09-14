import React from "react";
import { useLocation } from "wouter";
import { cn } from "../lib/utils";
import MobileNavigation from "./mobile-navigation";
import MobileHeader from "./mobile-header";

interface MobileAppWrapperProps {
  children: React.ReactNode;
}

/**
 * MobileAppWrapper provides a container specifically designed for mobile viewing
 * It handles safe areas, provides smoother scrolling, and proper viewport handling
 */
export default function MobileAppWrapper({ children }: MobileAppWrapperProps) {
  const [location] = useLocation();

  // Determine if the page is a full-screen page (like auth)
  const isFullScreenPage = location === "/auth";
  
  // Determine if the page should have padding (most content pages)
  const shouldHavePadding = 
    !isFullScreenPage && 
    location !== "/livestreams" && 
    !location.startsWith("/events/") &&
    !location.startsWith("/posts/");

  return (
    <div className="md:hidden min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Mobile Header - only if not fullscreen */}
      {!isFullScreenPage && <MobileHeader />}
      
      {/* App Content - with proper bottom padding for navigation */}
      <div 
        className={cn(
          "flex-1 flex flex-col max-w-[100vw] overflow-x-hidden",
          shouldHavePadding ? "px-4" : "",
          !isFullScreenPage ? "pb-20" : "" // Add padding for the navigation bar
        )}
      >
        {children}
      </div>
      
      {/* Mobile Navigation Bar - only if not fullscreen */}
      {!isFullScreenPage && <MobileNavigation currentPath={location} />}
    </div>
  );
}