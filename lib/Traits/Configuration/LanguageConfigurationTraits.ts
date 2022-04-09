import { ReactOptions } from "i18next";
import anyTrait, { AnyTrait } from "../Decorators/anyTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import ModelTraits from "../ModelTraits";

export class LanguageConfigurationTraits extends ModelTraits {
  @primitiveTrait({
    type: "boolean",
    name: "Enabled",
    description:
      "Controls whether a button to switch the portal's language is provided."
  })
  enabled: boolean = false;

  @primitiveTrait({
    type: "boolean",
    name: "Debug",
    description:
      "Controls whether debug information regarding translations is logged to the console."
  })
  debug: boolean = false;

  @anyTrait({
    name: "React options",
    description: "React i18next special options."
  })
  react: ReactOptions = {
    useSuspense: false
  };

  @anyTrait({
    name: "Languages",
    description:
      "Language abbreviations. Please mind that matching locale files must exist."
  })
  languages: Record<string, string> = {
    en: "english"
  };

  @primitiveTrait({
    type: "string",
    name: "Fallback language",
    description:
      "Fallback language used if contents are not available in the currently selected language."
  })
  fallbackLanguage: string = "en";

  @primitiveTrait({
    type: "boolean",
    name: "Change language on start when",
    description:
      "Order of user language detection. See [i18next browser language detection documentation](https://github.com/i18next/i18next-browser-languageDetector) for details."
  })
  changeLanguageOnStartWhen: string[] = [
    "querystring",
    "localStorage",
    "navigator",
    "htmlTag"
  ];
}
