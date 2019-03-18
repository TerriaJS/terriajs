'use strict';
import defined from 'terriajs-cesium/Source/Core/defined';

// polyFill from ecma6 js
var findIndex = function(array, predicate) {
    if (!defined(array)) {
        throw new TypeError('findIndex called on null or undefined');
    }
    if (!Array.isArray(array)) {
        throw new TypeError("findIndex only works on array");
    }
    if (typeof predicate !== 'function') {
        throw new TypeError('findIndex predicate must be a function');
    }
    var list = Object(array);
    var length = list.length >>> 0;
    var thisArg = arguments[2];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
};

module.exports = findIndex;
