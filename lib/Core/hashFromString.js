"use strict";

// Returns a 32-bit integer hash of a string.  '' => 0.
function hashFromString(s) {
  return Math.abs(
    s.split("").reduce(function(prev, c) {
      var hash = (prev << 5) - prev + c.charCodeAt(0);
      return hash;
    }, 0)
  );
}

module.exports = hashFromString;
