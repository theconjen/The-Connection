import * as Localization from "expo-localization";
import { I18nextProvider, initReactI18next, type I18nextProviderProps } from "react-i18next";
import { createI18n } from "shared/i18n";
import en from "shared/i18n/resources/en.json";
import es from "shared/i18n/resources/es.json";
import { ReactNode, useMemo } from "react";
import { I18nManager } from "react-native";

const resources = { en: { translation: en }, es: { translation: es } };

export function I18nProvider({ children, override }: { children: ReactNode; override?: string }) {
  const locale = override ?? (Localization.getLocales?.()[0]?.languageTag ?? "en");
  const lng = locale.split("-")[0];
  const i18n = useMemo<I18nextProviderProps["i18n"]>(() => {
    const inst = createI18n(resources, lng);
    inst.use(initReactI18next);
    return inst as I18nextProviderProps["i18n"];
  }, [lng]);

  const isRTL = ["ar", "he", "fa", "ur"].includes(lng);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
