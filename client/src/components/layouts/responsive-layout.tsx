import React from "react";
import { useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-media-query";
import MainLayout from "./main-layout";
import MobileHeader from "@/components/mobile-header";

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

  // For mobile view, we don't use the MainLayout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader currentPath={location} />
        <main className="flex-1 pt-2 pb-20">
          {children}
        </main>
      </div>
    );
  }

  // For desktop view, we wrap with MainLayout which includes sidebar navigation
  return <MainLayout>{children}</MainLayout>;
}