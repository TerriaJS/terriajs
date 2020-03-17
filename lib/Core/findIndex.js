"use strict";
import defined from "terriajs-cesium/Source/Core/defined";
import i18next from "i18next";

// polyFill from ecma6 js
var findIndex = function(array, predicate) {
  if (!defined(array)) {
    throw new TypeError(i18next.t("core.findIndex.nullUndefined"));
  }
  if (!Array.isArray(array)) {
    throw new TypeError(i18next.t("core.findIndex.array"));
  }
  if (typeof predicate !== "function") {
    throw new TypeError(i18next.t("core.findIndex.function"));
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
