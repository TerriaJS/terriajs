"use strict";

/**
 * Combines two data arrays, each with the format [[x1, y1], [x2, y2], ...]
 * maintaining the order of the x's.
 * The x and y can be anything with order (integers, floats, dates, etc)
 * @param  {Array} array Array of arrays, eg. [[[x1, y1], [x2, y2]], [[a1, b1], [a2, b2]]]
 * @return {Number[]|Date[]} Combined array.
 */
function combineData(arrays) {
  // This implementation works, but could be streamlined.
  var numArrays = arrays.length;
  if (numArrays === 1) {
    return arrays[0];
  }
  var expandedArrays = arrays.map(function (array, arrayIndex) {
    return array.map(function (a) {
      var element = nullArray(numArrays + 1);
      element[0] = a[0];
      element[arrayIndex + 1] = a[1];
      return element;
    });
  });
  var result = Array.prototype.concat.apply([], expandedArrays);
  result.sort(compareFunction);
  for (var i = result.length - 2; i >= 0; i--) {
    if (compareFunction(result[i], result[i + 1]) === 0) {
      // merge the two rows and delete the old one
      result[i] = mergeElements(result[i], result[i + 1]);
      result.splice(i + 1, 1);
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

function nullArray(len) {
  return Array.apply(null, new Array(len)).map(function () {
    return null;
  });
}

function mergeElements(e, f) {
  // eg. e = [1, null, null, 0] and f = [1, 15, null, null] should give [1, 15, null, 0]
  return e.map(function (a, i) {
    return a === null ? f[i] : a;
  });
}

module.exports = combineData;
