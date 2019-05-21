"use strict";

/**
 * Replace all underscores in the string with spaces. If the argument is not a string, return it unchanged.
 * @param  {} string The string to replace. If the argument is not a string, does nothing.
 * @return {} The argument with all underscores replaced with spaces. If the argument is not a string, returns the argument unchanged.
 */
function replaceUnderscores(string) {
  if (typeof string === "string" || string instanceof String) {
    return string.replace(/_/g, " ");
  }
  return string;
}

module.exports = replaceUnderscores;
