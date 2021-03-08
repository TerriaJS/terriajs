'use strict';

var createKarmaBaseConfig = require('./createKarmaBaseConfig');

module.exports = function(config) {
    var options = Object.assign({}, createKarmaBaseConfig(config), {
        detectBrowsers: {
            enabled: true,
            usePhantomJS: false
        }
    });

    options.frameworks.push('detectBrowsers');

    // Dependency removed:
    // "karma-coverage-istanbul-reporter": "^2.0.5",

    // options.reporters.push('coverage-istanbul');
    // options.coverageIstanbulReporter = {
    //   reports: ["html", "text-summary", "lcovonly"]
    // };

    config.set(options);
};
