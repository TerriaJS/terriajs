"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

function arraysAreEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (!defined(left) || !defined(right) || left.length !== right.length) {
    return false;
  }

  for (var i = 0; i < left.length; ++i) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}

module.exports = arraysAreEqual;
