"use strict";

var linkifyContent = require("./linkifyContent");
var formatNumberForLocale = require("./formatNumberForLocale");

/**
 * Either replace or format the 'value' for the description, used by the Feature Info Panel,
 * depending on the 'options.replaceText' flag.
 *
 * If the 'options.replaceText' flag is true and the 'value' (as string) is an element in the
 * matching array of 'options.from', the value is replaced by the corresponding element in the
 * replacement array of 'options.to'. Return as-is if the 'value' does not match any elements.
 *
 * If the 'options.replaceText' flag is not defined or false, strings have markdown applied
 * to them. Anything else is returned as-is.
 *
 * @param {} value The value to be replaced or formatted.
 * @param {Object} [options] Value replacement options, or number formatting options passed to
 * formatNumberForLocale. Replacement options have a flag 'optins.replaceText', a matching
 * array 'options.from' and a replacement array of 'options.to'.
 */
function formatPropertyValue(value, options) {
  if (options?.replaceText === true) {
    var from = options.from;
    var to = options.to;
    for (var i = 0, l = from.length; i < l; i++) {
      if (from[i]?.toString() === value?.toString()) {
        return to[i];
      }
    }
  } else if (typeof value === "number") {
    return formatNumberForLocale(value, options);
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
