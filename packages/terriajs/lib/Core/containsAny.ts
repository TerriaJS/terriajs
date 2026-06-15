import defined from "terriajs-cesium/Source/Core/defined";

/**
 * Determins is a given string contains any of a number of possible strings.
 *
 * @param s The string to test.
 * @param possibleStrings The possible strings to test `s` for.
 * @return true if `s` contains any of the strings in `possibleStrings`; otherwise, false.
 */
const containsAny = function (s: string, possibleStrings: string[]) {
  if (!defined(s)) {
    return false;
  }

  for (let i = 0; i < possibleStrings.length; ++i) {
    if (s.indexOf(possibleStrings[i]) >= 0) {
      return true;
    }
  }
  return false;
};

export default containsAny;
