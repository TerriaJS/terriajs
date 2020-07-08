import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import translationEN from "../Language/en/translation.json";

export interface LanguageConfiguration {
  enabled: boolean;
  debug: boolean;
  languages: Object;
  fallbackLanguage: string;
  changeLanguageOnStartWhen: string[];
}
const defaultLanguageConfiguration = {
  enabled: false,
  debug: false,
  languages: {
    en: "english",
    sr: "serbian"
  },
  fallbackLanguage: "en",
  changeLanguageOnStartWhen: [
    "querystring",
    "localStorage",
    "navigator",
    "htmlTag"
  ]
};

class Internationalization {
  static initLanguage(languageConfiguration?: LanguageConfiguration): void {
    const languageConfig = Object.assign(
      defaultLanguageConfiguration,
      languageConfiguration
    );
    /**
     * initialization of the language with i18next
     *
     * @param {Object} languageConfiguration configuration read from config.json
     * @param {Boolean} languageConfiguration.enabled is GUI language switching enabled
     * @param {Object} languageConfiguration.languages the languages to be used, example `{en: "english"}
     * @param {String} languageConfiguration.fallbackLanguage the language to be used on startup
     * @param {Array} languageConfiguration.changeLanguageOnStartWhen
     */
    i18next
      .use(HttpApi)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        debug: languageConfig.debug,
        fallbackLng: languageConfig.fallbackLanguage,
        whitelist: Object.keys(languageConfig.languages),

        // to allow en-US when only en is on the whitelist - nonExplicitWhitelist must be set to true
        nonExplicitWhitelist: true,
        // to not look into a folder like /locals/en-US/... when en-US is detected, use load: "languageOnly" to avoid using Country-Code in path
        load: "languageOnly",
        // send not translated keys to endpoint
        saveMissing: false,
        // allow loading of internal trnaslation files and backend files
        partialBundledLanguages: true,

        /*
          This setting adds a posibility for users to override translations using their own translation json file stored in 
          `TerriaMap/wwwroot/Languages/{{lng}}/languageOverrides.json`
          It will first look in defaultNS for translation and then check the fallbackNS
        */
        ns: ["translation", "languageOverrides"],
        defaultNS: "languageOverrides",
        fallbackNS: "translation",

        resources: {
          en: {
            translation: translationEN
          }
        },

        backend: {
          loadPath: "/Language/{{lng}}/{{ns}}.json",
          crossDomain: false
        },

        detection: {
          // order and from where user language should be detected
          order: languageConfig.changeLanguageOnStartWhen,

          // keys or params to lookup language from
          lookupQuerystring: "lng",
          lookupCookie: "i18next",
          lookupLocalStorage: "i18nextLng",

          // cache user language on
          caches: ["localStorage"],
          excludeCacheFor: ["cimode"], // languages to not persist (cookie, localStorage)

          // optional expire and domain for set cookie
          // cookieMinutes: 10,
          // cookieDomain: "myDomain",

          // only detect languages that are in the whitelist
          checkWhitelist: true
        },
        interpolation: {
          escapeValue: false // not needed for react as it escapes by default and not needed in node
        }
      });
  }
}

export default Internationalization;
