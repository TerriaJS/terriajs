import { TOptions, i18n } from "i18next";
import { isJsonString } from "../Core/Json";

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
export function applyTranslationIfExists(
  keyOrString: string,
  i18n: i18n,
  options?: TOptions
): string {
  // keyOrString could be undefined in some cases even if we type it as string
  if (isJsonString(keyOrString as unknown)) {
    if (keyOrString.indexOf(TRANSLATE_KEY_PREFIX) === 0) {
      const translationKey = keyOrString.substring(TRANSLATE_KEY_PREFIX.length);
      return i18n.exists(translationKey)
        ? i18n.t(translationKey, options)
        : translationKey;
    } else {
      return keyOrString;
    }
  }
  // Return an empty string if keyOrString was undefined. All functions that call this require a string to be returned
  return "";
}
