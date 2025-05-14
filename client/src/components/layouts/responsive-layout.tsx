import React from "react";
import { useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-media-query";
import Header from "../header";
import MobileNavigation from "../mobile-navigation";

type ResponsiveLayoutProps = {
  children: React.ReactNode;
};

/**
 * ResponsiveLayout component 
 * This component chooses between desktop and mobile layouts based on screen size.
 * For desktop, it wraps the content in MainLayout which includes sidebar navigation
 * For mobile, it renders just the children with mobile-specific components
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [location] = useLocation();

  // We'll use the same layout for both mobile and desktop, 
  // but with different components inside based on screen size
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header - we now only use one header component */}
      <Header />

      {/* Main Content */}
      <main className={`flex-1 container mx-auto px-4 ${isMobile ? 'py-2 pb-20' : 'py-6'}`}>
        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Navigation Bar - only show on mobile */}
      {isMobile && <MobileNavigation currentPath={location} />}
    </div>
  );
}