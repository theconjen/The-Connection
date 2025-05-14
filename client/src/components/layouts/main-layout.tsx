import { useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-media-query";
import Header from "../header";
import MobileNavigation from "../mobile-navigation";

type MainLayoutProps = {
  children: React.ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
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
