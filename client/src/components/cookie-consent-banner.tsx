import { useEffect, useState } from "react";
import { useCookieConsent } from "../contexts/cookie-consent-context";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

export default function CookieConsentBanner() {
  const { consent, showBanner, acceptAll, rejectAll, updateConsent, setShowBanner } = useCookieConsent();
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  useEffect(() => {
    if (consent) {
      setAllowAnalytics(consent.analytics);
    }
  }, [consent]);

  if (!showBanner) return null;

  const handleSave = () => {
    updateConsent({
      necessary: true,
      analytics: allowAnalytics,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
      <div className="max-w-5xl mx-auto rounded-lg border bg-card shadow-lg">
        <div className="grid gap-4 p-4 sm:grid-cols-[1fr,auto] sm:items-center sm:gap-6 sm:p-6">
          <div className="space-y-2">
            <p className="text-lg font-semibold">We value your privacy</p>
            <p className="text-sm text-muted-foreground">
              We use cookies to keep The Connection running smoothly and to understand how the site is used. You can
              choose whether to allow analytics cookies.
            </p>
            <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-2">
              <Switch id="analytics-consent" checked={allowAnalytics} onCheckedChange={setAllowAnalytics} />
              <div className="space-y-0.5">
                <Label htmlFor="analytics-consent" className="text-sm font-medium">
                  Analytics cookies
                </Label>
                <p className="text-xs text-muted-foreground">
                  Helps us improve the app by collecting anonymous usage information.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:w-64">
            <Button variant="outline" onClick={() => { rejectAll(); setAllowAnalytics(false); }}>
              Reject optional
            </Button>
            <Button variant="secondary" onClick={handleSave}>
              Save preference
            </Button>
            <Button onClick={acceptAll}>Accept all</Button>
            <button className="text-xs text-muted-foreground underline" onClick={() => setShowBanner(false)}>
              Hide for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
