"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Combines a number of functions that return a boolean into a single function that executes all of them and returns
 * true only if all them do. Maintains an set of filter functions, so if the same function is combined
 * more than once, it is only executed one time. This means that it is also safe to call combineFilter on its own result
 * to combine the result with another filter - the set of filters from the previous result will simply
 * be merged into that of the new result so that only individual filter functions are executed.
 *
 * @param {Array} filters A number of functions to combine into one logical function.
 * @returns {Function} The resulting function.
 */
function combineFilters(filters) {
  var allFilters, returnFn;

  allFilters = filters
    .filter(function(filter) {
      return defined(filter);
    })
    .reduce(function(filtersSoFar, thisFilter) {
      if (thisFilter._filterIndex) {
        // If a filter is an instance of this function just pull that filter's index into this one's.
        thisFilter._filterIndex.forEach(
          addToListUnique.bind(undefined, filtersSoFar)
        );
      } else {
        // Otherwise add it.
        addToListUnique(filtersSoFar, thisFilter);
      }

      return filtersSoFar;
    }, []);

  returnFn = function() {
    var outerArgs = arguments;

    return !allFilters.some(function(filter) {
      return !filter.apply(this, outerArgs);
    }, this);
  };
  returnFn._filterIndex = allFilters;

  return returnFn;
}

function addToListUnique(list, filter) {
  if (list.indexOf(filter) === -1) {
    list.push(filter);
  }
}

module.exports = combineFilters;
