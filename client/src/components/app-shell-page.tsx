/**
 * App Shell Page Component
 *
 * Used for routes that exist in the mobile app but don't have full web implementations.
 * Shows a friendly message with an "Open in App" button for deep linking.
 */

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Smartphone, ArrowLeft, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface AppShellPageProps {
  title: string;
  description: string;
  /** Deep link path (e.g., "prayers/123") - will be prefixed with theconnection:// */
  deepLinkPath?: string;
  /** Icon to display (optional) */
  icon?: React.ReactNode;
  /** Show back button */
  showBack?: boolean;
  /** Additional content to display */
  children?: React.ReactNode;
  /** App store links */
  showStoreLinks?: boolean;
}

export default function AppShellPage({
  title,
  description,
  deepLinkPath,
  icon,
  showBack = true,
  children,
  showStoreLinks = true,
}: AppShellPageProps) {
  const [, navigate] = useLocation();

  const handleOpenInApp = () => {
    if (deepLinkPath) {
      // Try to open the app via deep link
      window.location.href = `theconnection://${deepLinkPath}`;

      // Fallback: after a delay, if we're still here, the app isn't installed
      // The user will see the store links
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            {icon || <Smartphone className="h-8 w-8 text-primary" />}
          </div>

          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {children}

          {deepLinkPath && (
            <Button
              onClick={handleOpenInApp}
              className="w-full"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in The Connection App
            </Button>
          )}

          {showStoreLinks && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Don't have the app yet?
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href="https://apps.apple.com/app/the-connection"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    App Store
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href="https://play.google.com/store/apps/details?id=app.theconnection"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Play
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
            >
              Continue to Web Version
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
