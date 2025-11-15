import i18next, { i18n } from "i18next";
import ICU from "i18next-icu";

export type I18nResources = Record<string, { translation: Record<string, any> }>;

export function createI18n(resources: I18nResources, lng: string, fallbackLng = "en"): i18n {
  const inst = i18next.createInstance();
  inst.use(new ICU()).init({
    resources,
    lng,
    fallbackLng,
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    keySeparator: false,
  });
  return inst;
}
