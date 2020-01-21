import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationEN from "../Language/en/translation.json";

const options = {
  // the translations
  resources: {
    en: {
      translation: translationEN
    }
  },
  fallbackLng: "en",
  interpolation: {
    escapeValue: false // not needed for react as it escapes by default and not needed in node
  }
};

let i18nExport;

if (process.browser) {
  i18nExport = i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
      ...options,
      debug: true,
      react: {
        useSuspense: false
      }
    });
} else {
  i18nExport = i18n.init(options);
  // Should react-i18next also be initialised?
}

export default i18nExport;
