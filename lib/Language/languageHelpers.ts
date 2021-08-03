import { i18n } from "i18next";

export const TRANSLATE_KEY_PREFIX = "translate#";

/**
 * Takes a given string and translates it if it's a translation key that exists,
 * otherwise returns the string.
 *
 * This function doesn't use the global i18next instance because this function is predominately
 * used in the UIMode and using React components should use withTranslation HOC or useTranslation
 * hook to ensure that they update when the aop language changes.
 *
 * @param keyOrString Either a prefixed translation key or a string
 * @param i18n An i18next instance
 */
export function useTranslationIfExists(keyOrString: string, i18n: i18n) {
  if (keyOrString.indexOf(TRANSLATE_KEY_PREFIX) === 0) {
    const translationKey = keyOrString.substr(TRANSLATE_KEY_PREFIX.length);
    return i18n.exists(translationKey)
      ? i18n.t(translationKey)
      : translationKey;
  } else {
    return keyOrString;
  }
}
