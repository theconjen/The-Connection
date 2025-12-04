import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../hooks/use-auth";
import { cn } from "../lib/utils";

const DISMISS_KEY = "tc-guest-banner-dismissed";

export function GuestAccessBanner({ className }: { className?: string }) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (user) {
      setIsVisible(false);
      return;
    }

    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";
    setIsVisible(!dismissed);
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-4 md:left-auto md:right-6 md:max-w-xl z-40",
        "bg-background/95 border border-border/70 shadow-2xl rounded-2xl backdrop-blur",
        "p-4 md:p-5 space-y-3 animate-fadeIn",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Explore more with a free account</p>
          <p className="text-sm text-muted-foreground">
            Browse the highlights now and sign in or create an account to unlock posts, chat, and personalized recommendations.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-auto text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss guest banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link href="/auth">Sign in</Link>
        </Button>
        <Button size="sm" className="btn-gradient" asChild>
          <Link href="/auth">Join for free</Link>
        </Button>
      </div>
    </div>
  );
}
