"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var runLater = function(functionToRunLater, milliseconds) {
  milliseconds = defaultValue(milliseconds, 0);

  var deferred = when.defer();
  setTimeout(function() {
    try {
      deferred.resolve(functionToRunLater());
    } catch (e) {
      deferred.reject(e);
    }
  }, milliseconds);
  return deferred.promise;
};

module.exports = runLater;
