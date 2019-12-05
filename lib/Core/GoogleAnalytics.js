"use strict";

/*global require,ga*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
import i18next from "i18next";

var GoogleAnalytics = function() {
  this.key = undefined;
  this.options = undefined;
};

GoogleAnalytics.prototype.start = function(userParameters) {
  this.key = userParameters.googleAnalyticsKey;
  this.options = userParameters.googleAnalyticsOptions;
};

GoogleAnalytics.prototype.logEvent = function(category, action, label, value) {
  initializeGoogleAnalytics(this);
  ga("send", "event", category, action, label, value);
};

function initializeGoogleAnalytics(that) {
  if (defined(window.ga)) {
    return;
  }

  if (!defined(that.key)) {
    console.log(i18next.t("core.googleAnalytics.log"));
    window.ga = function() {};
    return;
  }

  (function(i, s, o, g, r, a, m) {
    i["GoogleAnalyticsObject"] = r;
    i[r] =
      i[r] ||
      function() {
        (i[r].q = i[r].q || []).push(arguments);
      };
    i[r].l = 1 * new Date();
    a = s.createElement(o);
    m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(
    window,
    document,
    "script",
    "https://www.google-analytics.com/analytics.js",
    "ga"
  );
  ga("create", that.key, defaultValue(that.options, "auto"));
  ga("send", "pageview");
}

module.exports = GoogleAnalytics;
