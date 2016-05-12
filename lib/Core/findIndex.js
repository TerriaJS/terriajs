'use strict';

// polyFill from ecma6 js
var findIndex = function(array, predicate) {
    if (array === null) {
      throw new TypeError('findIndex called on null or undefined');
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
