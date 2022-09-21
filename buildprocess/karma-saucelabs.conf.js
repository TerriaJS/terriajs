"use strict";

var createKarmaBaseConfig = require("./createKarmaBaseConfig");

module.exports = function (config) {
  var options = Object.assign({}, createKarmaBaseConfig(config), {
    customLaunchers: {
      sl_chrome: {
        base: "SauceLabs",
        browserName: "chrome",
        platform: "Windows 10"
      },
      sl_safari: {
        base: "SauceLabs",
        browserName: "safari",
        platform: "OS X 10.11"
      },
      sl_ie11: {
        base: "SauceLabs",
        browserName: "internet explorer",
        platform: "Windows 7",
        version: "11.0"
      },
      sl_firefox: {
        base: "SauceLabs",
        browserName: "firefox",
        platform: "Windows 10"
      },
      sl_firefox_esr: {
        base: "SauceLabs",
        browserName: "firefox",
        platform: "Windows 7",
        version: "60.0"
      }
    },

    // start these browsers
    // browsers: ['sl_chrome', /*'sl_safari',*/ 'sl_firefox', 'sl_firefox_esr', 'sl_ie11'],
    browsers: ["sl_chrome", "sl_firefox", "sl_firefox_esr"],

    sauceLabels: {
      testName: "TerriaJS Unit Tests",
      tunnelIdentifier: process.env.TRAVIS_BUILD_NUMBER
    }
  });

  options.reporters.push("saucelabs");

  config.set(options);
};
