import React from "react";
import MainLayout from "./main-layout";
import MobileAppWrapper from "@/components/mobile-app-wrapper";
import { useMediaQuery } from "@/hooks/use-media-query";

type ResponsiveLayoutProps = {
  children: React.ReactNode;
};

/**
 * ResponsiveLayout dynamically chooses between mobile and desktop layouts
 * based on screen size, allowing for optimized experiences on each platform
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  // Check if the screen is mobile sized
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Use the appropriate layout based on screen size
  if (isMobile) {
    return <MobileAppWrapper>{children}</MobileAppWrapper>;
  }

  // Default to the main desktop layout
  return <MainLayout>{children}</MainLayout>;
}