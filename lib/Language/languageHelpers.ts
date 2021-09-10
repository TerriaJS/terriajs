import i18next from "i18next";

/**
 * Takes a given string and translates it if it exists, otherwise return
 */
export function useTranslationIfExists(
  keyOrString: string = "",
  options?: { [key: string]: string }
) {
  if (keyOrString.indexOf("translate#") === 0) {
    const translationKey = keyOrString.substr("translate#".length);
    return i18next.exists(translationKey)
      ? i18next.t(translationKey, options)
      : translationKey;
  } else {
    return keyOrString;
  }
}
