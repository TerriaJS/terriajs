"use strict";

var createKarmaBaseConfig = require("./createKarmaBaseConfig");

module.exports = function (config) {
  config.set(
    Object.assign({}, createKarmaBaseConfig(config), {
      customLaunchers: {
        bs_chrome: {
          base: "BrowserStack",
          browser: "chrome",
          os: "Windows",
          os_version: "7"
        },
        bs_safari: {
          base: "BrowserStack",
          browser: "safari",
          os: "OS X",
          os_version: "El Capitan"
        },
        bs_ie9: {
          base: "BrowserStack",
          browser: "ie",
          browser_version: "9.0",
          os: "Windows",
          os_version: "7"
        },
        bs_ie10: {
          base: "BrowserStack",
          browser: "ie",
          browser_version: "10.0",
          os: "Windows",
          os_version: "7"
        },
        bs_ie11: {
          base: "BrowserStack",
          browser: "ie",
          browser_version: "11.0",
          os: "Windows",
          os_version: "7"
        },
        bs_firefox: {
          base: "BrowserStack",
          browser: "firefox",
          os: "Windows",
          os_version: "7"
        },
        bs_firefox_esr: {
          base: "BrowserStack",
          browser: "firefox",
          browser_version: "38.0",
          os: "Windows",
          os_version: "7"
        }
      },

      // start these browsers
      browsers: [
        "bs_chrome",
        "bs_safari",
        "bs_firefox",
        "bs_firefox_esr",
        "bs_ie9",
        "bs_ie10",
        "bs_ie11"
      ],

      browserStack: {
        startTunnel: true
      }
    })
  );
};
