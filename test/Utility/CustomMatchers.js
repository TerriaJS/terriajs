"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

function equals(util, customEqualityTesters, a, b) {
  return util.equals(a, b, customEqualityTesters);
}

module.exports = {
  toEqualEpsilon: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected, epsilon) {
        function equalityTester(a, b) {
          var to_run;
          if (defined(a)) {
            if (typeof a.equalsEpsilon === "function") {
              return a.equalsEpsilon(b, epsilon);
            } else if (a instanceof Object) {
              // Check if the current object has a static function named 'equalsEpsilon'
              to_run = Object.getPrototypeOf(a).constructor.equalsEpsilon;
              if (typeof to_run === "function") {
                return to_run(a, b, epsilon);
              }
            }
          }

          if (defined(b)) {
            if (typeof b.equalsEpsilon === "function") {
              return b.equalsEpsilon(a, epsilon);
            } else if (b instanceof Object) {
              // Check if the current object has a static function named 'equalsEpsilon'
              to_run = Object.getPrototypeOf(b).constructor.equalsEpsilon;
              if (typeof to_run === "function") {
                return to_run(b, a, epsilon);
              }
            }
          }

          if (typeof a === "number" || typeof b === "number") {
            return Math.abs(a - b) <= epsilon;
          }

          return undefined;
        }

        var result = equals(util, [equalityTester], actual, expected);

        return { pass: result };
      }
    };
  }
};
