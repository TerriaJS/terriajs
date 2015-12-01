'use strict';

/**
 * Combines two data arrays, each with the format [[x1, y1], [x2, y2], ...]
 * maintaining the order of the x's.
 * The x and y can be anything with order (integers, floats, dates, etc)
 * @param  {Number[]|Date[]} array1 First array.
 * @param  {Number[]|Date[]} array2 Second array.
 * @return {Number[]|Date[]} Combined array.
 */
function combineData(array1, array2) {
    var data1 = array1.map(function(a) { return [a[0], a[1], null]});
    var data2 = array2.map(function(a) { return [a[0], null, a[1]]});
    var result = data1.concat(data2);
    result.sort(compareFunction);
    for (var i = result.length - 2; i >= 0; i--) {
        if (compareFunction(result[i], result[i + 1]) === 0) {
            if (result[i][1] === null) {
                result[i][1] = result[i + 1][1];
                result.splice(i + 1, 1);
            } else if (result[i][2] === null) {
                result[i][2] = result[i + 1][2];
                result.splice(i + 1, 1);
            }
        }
    }
    return result;
}

function compareFunction(a, b) {
    return a[0] - b[0];
    // should be the same as:
    // if (a[0] < b[0]) {
    //     return -1;
    // }
    // if (a[0] > b[0]) {
    //     return 1;
    // }
    // return 0;
}

module.exports = combineData;
