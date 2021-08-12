"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
const i18next = require("i18next").default;

var ConsoleAnalytics = function() {
  // either set logToConsole here to true,
  // or pass true in `userParameters.logToConsole` for verbose app analytics
  this.logToConsole = false;
};

ConsoleAnalytics.prototype.start = function(userParameters) {
  if (
    userParameters.googleAnalyticsKey ||
    userParameters.googleAnalyticsOptions
  ) {
    console.log(i18next.t("core.consoleAnalytics.logStartedWithGAParameters"));
  }
  if (defined(userParameters.logToConsole)) {
    console.log(i18next.t("core.consoleAnalytics.started"));
    this.logToConsole = userParameters.logToConsole;
  } else if (
    !defined(userParameters.logToConsole) ||
    !userParameters.logToConsole
  ) {
    console.log(i18next.t("core.consoleAnalytics.startedNoLogToConsole"));
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
