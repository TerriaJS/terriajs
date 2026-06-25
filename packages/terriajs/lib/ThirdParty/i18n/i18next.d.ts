// import the original type declarations
import "i18next";
// import all namespaces (for the default language, only)
import type Resources from "../../../wwwroot/languages/en/translation.json";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: "translation";
    enableSelector: true;
    returnObjects: false;
    allowObjectInHTMLChildren: true;
    // custom resources type
    resources: {
      translation: typeof Resources;
      languageOverrides: typeof Resources;
      "": Record<string, string>;
    };
    // other
  }
}
