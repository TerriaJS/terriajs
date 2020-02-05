"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

var ConsoleAnalytics = function() {
  this.logToConsole = false;
};

ConsoleAnalytics.prototype.start = function(userParameters) {
  if (defined(userParameters.logToConsole)) {
    this.logToConsole = userParameters.logToConsole;
  }
};

ConsoleAnalytics.prototype.logEvent = function(category, action, label, value) {
  if (this.logToConsole) {
    var labelString = defined(label) ? " Label: " + label : "";
    var valueString = defined(value) ? " Value: " + value : "";
    console.log(
      "** Event ** Category: " +
        category +
        " Action: " +
        action +
        labelString +
        valueString
    );
  }
};

module.exports = ConsoleAnalytics;
