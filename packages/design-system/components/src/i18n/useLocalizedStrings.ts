import { createContext, useContext, useMemo } from "react";
import { useLocale } from "react-aria-components/I18nProvider";
import {
  EN_US,
  type LocalizedString,
  type LocalizedStringKey
} from "./strings";

// An app's strings, by locale or by language: "fr" serves fr-FR and fr-CA
// alike, "zh-Hant" every Traditional Chinese locale. Any string left out of
// a locale's falls back to its language's, then to English
type LocalizedStrings = Record<
  string,
  Partial<Record<LocalizedStringKey, LocalizedString>>
>;

const LocalizedStringsContext = createContext<LocalizedStrings>({});

// Translates the components' own strings. The locale comes from React Aria's
// I18nProvider, as it does for React Aria's own strings
const LocalizedStringsProvider = LocalizedStringsContext.Provider;

type LocalizedStringFormatter = {
  format: (
    key: LocalizedStringKey,
    values?: Record<string, string | number>
  ) => string;
};

// A locale's language, script and region, the likely ones filled in: zh-TW
// is written in Traditional Chinese, zh-CN in Simplified
const subtagsOf = (
  locale: string
): { language: string; script?: string; region?: string } => {
  try {
    const { language, script, region } = new Intl.Locale(locale).maximize();
    return { language, script, region };
  } catch {
    return { language: locale.split("-")[0] ?? locale };
  }
};

// The app's strings that can serve a locale, best first: its own, then its
// language's in the same region, the language's own, and other regions'.
// Only those in the locale's script: another script isn't one its reader
// reads
const stringsFor = (
  strings: LocalizedStrings,
  locale: string
): LocalizedStrings[string][] => {
  const wanted = subtagsOf(locale);
  const rank = (key: string): number => {
    if (key === locale) return 0;
    const { language, script, region } = subtagsOf(key);
    if (language !== wanted.language || script !== wanted.script) return -1;
    if (region === wanted.region) return 1;
    return key.includes("-") ? 3 : 2;
  };
  return Object.entries(strings)
    .map(([key, own]) => ({ rank: rank(key), own }))
    .filter(({ rank }) => rank >= 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ own }) => own);
};

// The components' strings in the current locale
const useLocalizedStrings = (): LocalizedStringFormatter => {
  const { locale } = useLocale();
  const strings = useContext(LocalizedStringsContext);

  return useMemo(() => {
    const candidates = stringsFor(strings, locale);
    return {
      format: (key, values = {}) => {
        const string =
          candidates.find((own) => own[key] !== undefined)?.[key] ?? EN_US[key];
        return typeof string === "function" ? string(values) : string;
      }
    };
  }, [locale, strings]);
};

export { LocalizedStringsProvider, useLocalizedStrings };
export type { LocalizedStrings };
