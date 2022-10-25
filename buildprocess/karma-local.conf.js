"use strict";

var createKarmaBaseConfig = require("./createKarmaBaseConfig");

module.exports = function (config) {
  var options = Object.assign({}, createKarmaBaseConfig(config), {
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false
    }
  });

  options.frameworks.push("detectBrowsers");
  options.reporters.push("coverage-istanbul");
  options.coverageIstanbulReporter = {
    reports: ["html", "text-summary", "lcovonly"]
  };
  config.set(options);
};
