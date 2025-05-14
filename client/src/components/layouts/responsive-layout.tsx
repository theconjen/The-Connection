import React from "react";
import MainLayout from "./main-layout";
import MobileAppWrapper from "../mobile-app-wrapper";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

/**
 * ResponsiveLayout - A layout component that renders appropriate layout based on screen size
 * - Uses MainLayout for desktop/tablet views
 * - Uses MobileAppWrapper for mobile views
 */
export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  if (isMobile) {
    return <MobileAppWrapper>{children}</MobileAppWrapper>;
  }
  
  return <MainLayout>{children}</MainLayout>;
}