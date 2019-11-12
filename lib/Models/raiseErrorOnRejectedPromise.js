"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined").default;
var DeveloperError = require("terriajs-cesium/Source/Core/DeveloperError")
  .default;

var raiseErrorToUser = require("./raiseErrorToUser");

var raiseErrorOnRejectedPromise = function(terria, promise) {
  if (!defined(terria)) {
    throw new DeveloperError("terria is required.");
  }

  if (defined(promise)) {
    return promise.otherwise(function(e) {
      raiseErrorToUser(terria, e);
    });
  }
};

module.exports = raiseErrorOnRejectedPromise;
