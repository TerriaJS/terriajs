'use strict';

var combine = require('terriajs-cesium/Source/Core/combine');
var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Combines a number of functions that return a boolean into a single function that executes all of them and returns
 * true only if all them do. Maintains an internal index of filter functions, so if the same function is combined
 * more than once, it is only executed one time. This index means that it is also safe to call combineFilters, then call
 * it again to combine the result with another filter - the index of the previous call and the current call will simply
 * be merged together so that only individual filter functions are executed.
 *
 * @param {Array} filters A number of functions to combine into one logical function.
 * @returns {Function} The resulting function.
 */
function combineFilters(filters) {
    var filterIndex, returnFn;

    filterIndex = filters
        .filter(function(filter) {
            return defined(filter);
        })
        .reduce(function(indexSoFar, thisFilter) {
            if (thisFilter._filterIndex) {
                // If a filter is an instance of this function just pull that filter's index into this one's.
                return combine(thisFilter._filterIndex, indexSoFar);
            } else {
                // Otherwise add it.
                indexSoFar[thisFilter.toString()] = thisFilter;
            }

            return indexSoFar;
        }, {});

    returnFn = function() {
        var outerArgs = arguments;

        return Object.keys(filterIndex).reduce(function(soFar, fnKey) {
            return soFar && filterIndex[fnKey].apply(this, outerArgs);
        }.bind(this), true);
    };
    returnFn._filterIndex = filterIndex;

    return returnFn;
}

module.exports = combineFilters;
