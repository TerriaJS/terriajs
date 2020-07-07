"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var raiseErrorToUser = require("./raiseErrorToUser");

var raiseErrorOnRejectedPromise = function(terria, promise) {
  if (!defined(terria)) {
    // eslint-disable-next-line i18next/no-literal-string
    throw new DeveloperError("terria is required.");
  }

  if (defined(promise)) {
    if (defined(promise.catch)) {
      return promise.catch(function(e) {
        raiseErrorToUser(terria, e);
      });
    } else if (defined(promise.otherwise)) {
      return promise.otherwise(function(e) {
        raiseErrorToUser(terria, e);
      });
    }
  }
};

module.exports = raiseErrorOnRejectedPromise;
