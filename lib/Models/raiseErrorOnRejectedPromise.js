"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var raiseErrorOnRejectedPromise = function(terria, promise) {
  if (!defined(terria)) {
    throw new DeveloperError("terria is required.");
  }

  if (defined(promise)) {
    if (defined(promise.catch)) {
      return promise.catch(function(e) {
        terria.raiseErrorToUser(e);
      });
    } else if (defined(promise.otherwise)) {
      return promise.otherwise(function(e) {
        terria.raiseErrorToUser(e);
      });
    }
  }
};

module.exports = raiseErrorOnRejectedPromise;
