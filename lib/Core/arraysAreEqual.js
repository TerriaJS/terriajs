"use strict";

import { defined } from "cesium";

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

export default arraysAreEqual;
