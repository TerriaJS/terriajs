"use strict";

function arrayContains(array, value) {
  for (var i = 0; i < array.length; ++i) {
    if (array[i] === value) {
      return true;
    }
  }

  return false;
}
module.exports = arrayContains;
