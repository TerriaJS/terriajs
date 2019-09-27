"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var getTimestamp = require("terriajs-cesium/Source/Core/getTimestamp").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var pollToPromise = function(f, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  var pollInterval = defaultValue(options.pollInterval, 1);
  var timeout = defaultValue(options.timeout, 5000);

  var deferred = when.defer();

  var startTimestamp = getTimestamp();
  var endTimestamp = startTimestamp + timeout;

  function poller() {
    if (f()) {
      deferred.resolve();
    } else {
      if (getTimestamp() > endTimestamp) {
        deferred.reject();
      } else {
        setTimeout(poller, pollInterval);
      }
    }
  }

  poller();

  return deferred.promise;
};

module.exports = pollToPromise;
