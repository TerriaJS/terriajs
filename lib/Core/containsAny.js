"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Determins is a given string contains any of a number of possible strings.
 *
 * @param {String} s The string to test.
 * @param {String[]} possibleStrings The possible strings to test `s` for.
 * @return {Boolean} true if `s` contains any of the strings in `possibleStrings`; otherwise, false.
 */
var containsAny = function(s, possibleStrings) {
  if (!defined(s)) {
    return false;
  }

  for (var i = 0; i < possibleStrings.length; ++i) {
    if (s.indexOf(possibleStrings[i]) >= 0) {
      return true;
    }
  }
  return false;
};

module.exports = containsAny;
