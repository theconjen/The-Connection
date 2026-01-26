import { Button } from "@/components/ui/button";
import { Smartphone, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface OpenInAppBannerProps {
  deepLinkPath: string;
  title?: string;
  description?: string;
}

// App store URLs
const APP_STORE_URL = "https://apps.apple.com/app/the-connection/id6738976084";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.theconnection.mobile";
const APP_SCHEME = "theconnection://";

/**
 * Detect if the user is on a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detect the platform
 */
function getPlatform(): 'ios' | 'android' | 'other' {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

/**
 * Get the appropriate store URL based on platform
 */
function getStoreUrl(): string {
  const platform = getPlatform();
  if (platform === 'ios') return APP_STORE_URL;
  if (platform === 'android') return PLAY_STORE_URL;
  return APP_STORE_URL; // Default to iOS
}

/**
 * Build deep link URL
 */
function buildDeepLink(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${APP_SCHEME}${cleanPath}`;
}

/**
 * Attempt to open the app via deep link, fallback to store
 */
function openInApp(path: string) {
  const deepLink = buildDeepLink(path);
  const storeUrl = getStoreUrl();

  // On mobile, try to open the app first
  if (isMobileDevice()) {
    // Create a hidden iframe to attempt the deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    // Set a timeout to redirect to store if app doesn't open
    setTimeout(() => {
      document.body.removeChild(iframe);
      // Check if we're still on the page (app didn't open)
      if (document.hasFocus()) {
        window.location.href = storeUrl;
      }
    }, 2500);
  } else {
    // On desktop, show store options
    window.open(storeUrl, '_blank');
  }
}

export function OpenInAppBanner({ deepLinkPath, title, description }: OpenInAppBannerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setPlatform(getPlatform());
  }, []);

  const handleOpenInApp = () => {
    openInApp(deepLinkPath);
  };

  const handleGetApp = () => {
    window.open(getStoreUrl(), '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-semibold text-foreground">
            {title || "Continue in The Connection App"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description || "Get the full experience with our mobile app"}
          </p>
        </div>
        <div className="flex gap-2">
          {isMobile && (
            <Button onClick={handleOpenInApp} className="gap-2">
              <Smartphone className="h-4 w-4" />
              Open in App
            </Button>
          )}
          <Button variant="outline" onClick={handleGetApp} className="gap-2">
            <Download className="h-4 w-4" />
            {isMobile ? "Get App" : `Get for ${platform === 'ios' ? 'iPhone' : 'Android'}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OpenInAppButton({ deepLinkPath, label = "Open in App" }: { deepLinkPath: string; label?: string }) {
  const handleClick = () => {
    openInApp(deepLinkPath);
  };

  return (
    <Button onClick={handleClick} className="gap-2">
      <Smartphone className="h-4 w-4" />
      {label}
    </Button>
  );
}

export { openInApp, getStoreUrl, buildDeepLink, isMobileDevice, getPlatform };
