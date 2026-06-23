// import the original type declarations
import "i18next";
// import all namespaces (for the default language, only)
import Resources from "./resources";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: "translation";
    enableSelector: "optimize";
    returnObjects: false;
    allowObjectInHTMLChildren: true;
    // custom resources type
    resources: {
      translation: Resources["translation"];
      languageOverrides: Resources["translation"];
      "": Record<string, string>;
    };
    // other
  }
}
