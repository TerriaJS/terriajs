import RegionProvider from "./RegionProvider";
import isDefined from "../Core/isDefined";

/**
 * Apply an array of regular expression replacements to a string. Also caches the applied replacements in regionProvider._appliedReplacements.
 * @private
 * @param {RegionProvider} regionProvider The RegionProvider instance.
 * @param {String} s The string.
 * @param {String} replacementsProp Name of a property containing [ [ regex, replacement], ... ], where replacement is a string which can contain '$1' etc.
 */

export function applyReplacements(
  regionProvider: RegionProvider,
  s: string | number,
  replacementsProp:
    | "dataReplacements"
    | "serverReplacements"
    | "disambigDataReplacements"
): string | undefined {
  if (!isDefined(s)) {
    return undefined;
  }
  let r: string;
  if (typeof s === "number") {
    r = String(s);
  } else {
    r = s.toLowerCase().trim();
  }
  let replacements = regionProvider[replacementsProp];
  if (replacements === undefined || replacements.length === 0) {
    return r;
  }

  if (
    (regionProvider._appliedReplacements as any)[replacementsProp][r] !==
    undefined
  ) {
    return (regionProvider._appliedReplacements as any)[replacementsProp][r];
  }

  replacements.forEach(function(rep: any) {
    r = r.replace(rep[2], rep[1]);
  });
  (regionProvider._appliedReplacements as any)[replacementsProp][s] = r;
  return r;
}
