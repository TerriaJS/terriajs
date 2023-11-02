"use strict";

var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var getTimestamp = require("terriajs-cesium/Source/Core/getTimestamp").default;

var pollToPromise = function (f, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  var pollInterval = defaultValue(options.pollInterval, 1);
  var timeout = defaultValue(options.timeout, 5000);

  return new Promise((resolve, reject) => {
    var startTimestamp = getTimestamp();
    var endTimestamp = startTimestamp + timeout;

    function poller() {
      if (f()) {
        resolve();
      } else {
        if (getTimestamp() > endTimestamp) {
          reject();
        } else {
          setTimeout(poller, pollInterval);
        }
      }
    }

    poller();
  });
};

module.exports = pollToPromise;
