'use strict';

/**
 * Return only the unique values of an array.
 * @param  {Array} values An array of anything.
 * @return {Array} The same array with only the first occurence of each value included.
 */
function getUniqueValues(values) {
    var uniqueValues = [];
    for (var i = 0; i < values.length; i++) {
        if (uniqueValues.indexOf(values[i]) === -1) {
            uniqueValues.push(values[i]);
        }
    }
    return uniqueValues;
}

module.exports = getUniqueValues;
