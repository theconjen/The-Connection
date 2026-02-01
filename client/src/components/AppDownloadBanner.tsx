import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";

const BANNER_DISMISSED_KEY = "app-download-banner-dismissed";
const APP_STORE_URL = "https://apps.apple.com/us/app/the-connection-app/id6755203547";

export default function AppDownloadBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Don't show on mobile devices (they're likely already using the app or should see it naturally)
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Check if user previously dismissed
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show banner if not on mobile and (never dismissed OR dismissed more than 7 days ago)
    if (!isMobileDevice && (!dismissed || daysSinceDismissed > 7)) {
      // Delay showing for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    }, 300);
  };

  const handleDownload = () => {
    window.open(APP_STORE_URL, "_blank", "noopener,noreferrer");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg transition-all duration-300 ${
        isClosing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="bg-gradient-to-r from-[#5C6B5E] to-[#4A574C] rounded-2xl shadow-2xl p-5 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex items-center gap-4">
          {/* App icon */}
          <div className="flex-shrink-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="h-8 w-8 text-[#5C6B5E]" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1">Get The Connection App</h3>
            <p className="text-white/80 text-sm mb-3">
              Download our iOS app for the best experience
            </p>
            <Button
              onClick={handleDownload}
              className="bg-white text-[#5C6B5E] hover:bg-white/90 font-semibold px-6 py-2 h-auto rounded-full shadow-md"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on App Store
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
