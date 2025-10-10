import { I18nextProvider, initReactI18next } from "react-i18next";
import { createI18n } from "shared/i18n";
import en from "shared/i18n/resources/en.json";
import es from "shared/i18n/resources/es.json";
import { ReactNode, useMemo } from "react";

const resources = { en: { translation: en }, es: { translation: es } };

export function I18nProvider({ children, override }: { children: ReactNode; override?: string }) {
  const browserLang = typeof navigator !== "undefined" ? navigator.language : "en";
  const lng = (override ?? browserLang).split("-")[0];
  const i18n = useMemo(() => {
    const inst = createI18n(resources, lng);
    return inst.use(initReactI18next);
  }, [lng]);

  if (typeof document !== "undefined") {
    const isRTL = ["ar", "he", "fa", "ur"].includes(lng);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lng);
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
