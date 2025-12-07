import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { initGA } from "../lib/analytics";
import CookieConsentBanner from "../components/cookie-consent-banner";

export type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
};

type CookieConsentContextValue = {
  consent: CookieConsent | null;
  showBanner: boolean;
  setShowBanner: (show: boolean) => void;
  updateConsent: (consent: CookieConsent) => void;
  acceptAll: () => void;
  rejectAll: () => void;
};

const STORAGE_KEY = "tc-cookie-consent";

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CookieConsent;
  } catch (error) {
    console.warn("Invalid cookie consent payload in storage", error);
    return null;
  }
}

function persistConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  document.cookie = `cookie_consent=${consent.analytics ? "analytics" : "essential"}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax`;
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const initialConsent = useMemo(() => readStoredConsent(), []);
  const [consent, setConsent] = useState<CookieConsent | null>(initialConsent);
  const [showBanner, setShowBanner] = useState(!initialConsent);
  const analyticsInitializedRef = useRef(false);

  useEffect(() => {
    if (consent?.analytics && !analyticsInitializedRef.current) {
      analyticsInitializedRef.current = true;
      initGA();
    }
  }, [consent]);

  const updateConsent = (nextConsent: CookieConsent) => {
    persistConsent(nextConsent);
    setConsent(nextConsent);
    setShowBanner(false);
  };

  const acceptAll = () => {
    updateConsent({ necessary: true, analytics: true, timestamp: new Date().toISOString() });
  };

  const rejectAll = () => {
    updateConsent({ necessary: true, analytics: false, timestamp: new Date().toISOString() });
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        showBanner,
        setShowBanner,
        updateConsent,
        acceptAll,
        rejectAll,
      }}
    >
      {children}
      <CookieConsentBanner />
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}
