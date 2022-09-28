"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;
const i18next = require("i18next").default;

var ConsoleAnalytics = function () {
  // either set enableConsoleAnalytics here to true,
  // or pass true in `configParameters.enableConsoleAnalytics` for verbose app analytics
  this.enableConsoleAnalytics = false;
};

ConsoleAnalytics.prototype.start = function (configParameters) {
  if (
    configParameters.googleAnalyticsKey ||
    configParameters.googleAnalyticsOptions
  ) {
    console.log(i18next.t("core.consoleAnalytics.logStartedWithGAParameters"));
  }
  if (defined(configParameters.enableConsoleAnalytics)) {
    console.log(i18next.t("core.consoleAnalytics.started"));
    this.enableConsoleAnalytics = configParameters.enableConsoleAnalytics;
  } else if (
    !defined(configParameters.enableConsoleAnalytics) ||
    !configParameters.enableConsoleAnalytics
  ) {
    console.log(
      i18next.t("core.consoleAnalytics.startedNoenableConsoleAnalytics")
    );
  }
};

ConsoleAnalytics.prototype.logEvent = function (
  category,
  action,
  label,
  value
) {
  if (this.enableConsoleAnalytics) {
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
