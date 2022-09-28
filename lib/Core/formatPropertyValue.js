"use strict";

var linkifyContent = require("./linkifyContent");

/**
 * Format the value for the description, used by the Feature Info Panel.
 * Strings have markdown applied to them. Anything else is returned as-is.
 *
 * @param {} value The value to format.
 * @param {Object} [options] Number formatting options, passed to Number.toLocaleString().
 */
function formatPropertyValue(value, options) {
  if (typeof value === "number") {
    // Note we default useGrouping to false (not true) and maximumFractionDigits to 20 (not 3).
    return value.toLocaleString(undefined, {
      useGrouping: false,
      maximumFractionDigits: 20,
      ...options
    });
  } else if (typeof value === "string") {
    // do not linkify if it contains html elements, which we detect by looking for <x...>
    // this could catch some non-html strings such as "a<3 && b>1", but not linkifying those is no big deal
    if (!/<[a-z][\s\S]*>/i.test(value)) {
      return linkifyContent(value);
    }
  }
  return value;
}

module.exports = formatPropertyValue;
