'use strict';

/**
 * Flattens an array of arrays, into an array, eg. [[0, 1], [2, 3], [4, 5]] => [0, 1, 2, 3, 4, 5].
 * Based on the example at
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
 * @private
 * @param  {Array[]} arrayOfArrays Array of arrays
 * @return {Array} Flattened array.
 */
function flatten(arrayOfArrays) {
    return arrayOfArrays.reduce(function(a, b) {
        return a.concat(b);
    }, []);
}

module.exports = flatten;
